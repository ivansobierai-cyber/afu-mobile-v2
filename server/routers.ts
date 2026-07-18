import { z } from "zod";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { getDiagnosticos, createDiagnostico, getUsuarioAfuByUserId } from "./db";
import { sendPushToUsuario } from "./services/push-delivery";
import { authRouter } from "./routers/auth-router";
import { culturasPragasRouter } from "./routers/culturas-pragas-router";
import { materiaisParceirosRouter } from "./routers/materiais-parceiros-router";
import { coreDataRouter } from "./routers/core-data-router";
import { secondaryDataRouter } from "./routers/secondary-data-router";
import { weatherRouter } from "./routers/weather-router";
import { pushRouter } from "./routers/push-router";
import { bancoAgronomicoRouter } from "./routers/banco-agronomico-router";
import { pilotoRouter } from "./routers/piloto-router";
import { organizationsRouter } from "./routers/organizations-router";

const diagnosticoRouter = router({
  historico: protectedProcedure.query(async ({ ctx }) => {
    const perfil = await getUsuarioAfuByUserId(ctx.user.id);
    if (!perfil) return [];
    return getDiagnosticos(perfil.id);
  }),
  salvar: protectedProcedure
    .input(z.object({
      culturaNome: z.string(),
      sintomas: z.string().optional(),
      culturaId: z.number().int().positive().optional(),
      parteAnalisada: z.string(),
      problema: z.string(),
      tipo: z.string(),
      confianca: z.number(),
      severidade: z.string(),
      descricao: z.string(),
      recomendacoes: z.array(z.string()),
      agenteCausal: z.string().optional(),
      observacoesTecnicas: z.string().optional(),
      imagemUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const perfil = await getUsuarioAfuByUserId(ctx.user.id);
      if (!perfil) throw new Error("Perfil não encontrado");
      const created = await createDiagnostico({
        usuarioId: perfil.id,
        culturaId: input.culturaId,
        partePlanta: input.parteAnalisada,
        sintomasInformados: input.sintomas ?? null,
        resultado: JSON.stringify({
          culturaNome: input.culturaNome,
          sintomas: input.sintomas,
          problema: input.problema,
          tipo: input.tipo,
          confianca: input.confianca,
          severidade: input.severidade,
          descricao: input.descricao,
          recomendacoes: input.recomendacoes,
          agenteCausal: input.agenteCausal,
          observacoesTecnicas: input.observacoesTecnicas,
        }),
        pragaProvavel: input.tipo === "praga" ? input.problema : undefined,
        doencaProvavel: input.tipo === "doenca" ? input.problema : undefined,
        gravidade: input.severidade as any,
        confiancaIa: input.confianca,
        recomendacao: input.recomendacoes.join("; "),
        imagemUrl: input.imagemUrl,
      });

      if (input.severidade === "grave" || input.severidade === "critica") {
        void sendPushToUsuario(perfil.id, {
          title: "Alerta fitossanitário",
          body: `${input.problema} detectado em ${input.culturaNome}. Abra o diagnóstico para ver recomendações.`,
          data: { type: "diagnostico", diagnosticoId: String(created) },
          priority: "high",
        });
      }

      return created;
    }),
  analisar: publicProcedure
    .input(
      z.object({
        imageBase64: z.string(),
        culturaNome: z.string(),
        parteAnalisada: z.string(),
        sintomas: z.string().optional(),
        faseFenologica: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { imageBase64, culturaNome, parteAnalisada, sintomas, faseFenologica } = input;

      const contexto = [
        `Cultura: ${culturaNome}`,
        `Parte analisada: ${parteAnalisada}`,
        faseFenologica ? `Fase fenológica: ${faseFenologica}` : null,
        sintomas ? `Sintomas relatados pelo produtor: ${sintomas}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      const prompt = `Você é um agrônomo especialista em fitossanidade e diagnóstico vegetal. Analise a imagem fornecida com base no seguinte contexto:

${contexto}

Identifique se há algum problema fitossanitário (praga, doença, deficiência nutricional, estresse ambiental) ou se a planta está saudável.

IMPORTANTE: Esta análise é uma triagem preliminar. Sempre oriente a confirmação com técnico, agrônomo ou laboratório quando necessário.

Responda APENAS com um JSON válido no seguinte formato (sem markdown, sem código, apenas o JSON puro):
{
  "problema": "Nome do problema identificado ou 'Planta Saudável'",
  "tipo": "praga" ou "doenca" ou "deficiencia_nutricional" ou "estresse_ambiental" ou "saudavel" ou "outro",
  "confianca": número de 0 a 100,
  "severidade": "leve" ou "moderada" ou "grave" ou "critica",
  "descricao": "Descrição técnica detalhada do que foi identificado na imagem",
  "recomendacoes": ["recomendação 1", "recomendação 2", "recomendação 3"],
  "agenteCausal": "Nome científico do agente causal se aplicável (opcional)",
  "observacoesTecnicas": "Observações técnicas adicionais para o agrônomo ou técnico (opcional)"
}`;

      const response = await invokeLLM({
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                  detail: "high",
                },
              },
              {
                type: "text",
                text: prompt,
              },
            ],
          },
        ],
      });

      const rawContent = response.choices[0]?.message?.content;
      const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent ?? "");

      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON found");
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          problema: parsed.problema ?? "Análise inconclusiva",
          tipo: parsed.tipo ?? "outro",
          confianca: typeof parsed.confianca === "number" ? Math.min(100, Math.max(0, parsed.confianca)) : 70,
          severidade: parsed.severidade ?? "leve",
          descricao: parsed.descricao ?? "Não foi possível determinar com precisão.",
          recomendacoes: Array.isArray(parsed.recomendacoes) ? parsed.recomendacoes : [],
          agenteCausal: parsed.agenteCausal ?? undefined,
          observacoesTecnicas: parsed.observacoesTecnicas ?? undefined,
        };
      } catch {
        return {
          problema: "Análise inconclusiva",
          tipo: "outro" as const,
          confianca: 50,
          severidade: "leve" as const,
          descricao: "Não foi possível processar a análise da imagem. Tente novamente com uma foto mais nítida.",
          recomendacoes: [
            "Tire uma foto mais próxima e com boa iluminação",
            "Certifique-se de que a parte afetada esteja visível",
            "Consulte um agrônomo ou técnico para avaliação presencial",
          ],
          agenteCausal: undefined,
          observacoesTecnicas: undefined,
        };
      }
    }),
});

const analiseRouter = router({
  interpretar: publicProcedure
    .input(
      z.object({
        tipoAmostra: z.string(),
        propriedadeNome: z.string(),
        culturaNome: z.string().optional(),
        phSolo: z.number().optional(),
        phAgua: z.number().optional(),
        materiaOrganica: z.number().optional(),
        umidade: z.number().optional(),
        condutividadeEletrica: z.number().optional(),
        nitrogenio: z.number().optional(),
        fosforo: z.number().optional(),
        potassio: z.number().optional(),
        calcio: z.number().optional(),
        magnesio: z.number().optional(),
        enxofre: z.number().optional(),
        ferro: z.number().optional(),
        manganes: z.number().optional(),
        zinco: z.number().optional(),
        cobre: z.number().optional(),
        boro: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { tipoAmostra, propriedadeNome, culturaNome, ...valores } = input;

      const valoresTexto = Object.entries(valores)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => {
          const labels: Record<string, string> = {
            phSolo: "pH do Solo",
            phAgua: "pH da Água",
            materiaOrganica: "Matéria Orgânica (%)",
            umidade: "Umidade (%)",
            condutividadeEletrica: "Condutividade Elétrica (dS/m)",
            nitrogenio: "Nitrogênio N (mg/dm³)",
            fosforo: "Fósforo P (mg/dm³)",
            potassio: "Potássio K (cmolc/dm³)",
            calcio: "Cálcio Ca (cmolc/dm³)",
            magnesio: "Magnésio Mg (cmolc/dm³)",
            enxofre: "Enxofre S (mg/dm³)",
            ferro: "Ferro Fe (mg/dm³)",
            manganes: "Manganês Mn (mg/dm³)",
            zinco: "Zinco Zn (mg/dm³)",
            cobre: "Cobre Cu (mg/dm³)",
            boro: "Boro B (mg/dm³)",
          };
          return `${labels[k] ?? k}: ${v}`;
        })
        .join("\n");

      const prompt = `Você é um engenheiro agrônomo especialista em fertilidade do solo e nutrição vegetal. Analise os resultados da análise de ${tipoAmostra} da propriedade "${propriedadeNome}"${culturaNome ? ` para a cultura de ${culturaNome}` : ""}.

Resultados da análise:
${valoresTexto}

Forneça uma interpretação técnica completa e recomendações práticas de correção e adubação.

Responda APENAS com um JSON válido (sem markdown, sem código):
{
  "interpretacao": "Interpretação técnica geral dos resultados (2-3 parágrafos)",
  "recomendacoes": ["recomendação prática 1", "recomendação prática 2", "recomendação prática 3", "recomendação prática 4"],
  "alertas": ["alerta sobre parâmetro crítico 1 (se houver)"],
  "classificacaoGeral": "adequado" ou "deficiente" ou "excessivo" ou "critico"
}`;

      const response = await invokeLLM({
        messages: [{ role: "user", content: prompt }],
      });

      const rawContent = response.choices[0]?.message?.content;
      const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent ?? "");

      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON found");
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          interpretacao: parsed.interpretacao ?? "Análise não disponível.",
          recomendacoes: Array.isArray(parsed.recomendacoes) ? parsed.recomendacoes : [],
          alertas: Array.isArray(parsed.alertas) ? parsed.alertas : [],
          classificacaoGeral: parsed.classificacaoGeral ?? "adequado",
        };
      } catch {
        return {
          interpretacao: "Não foi possível processar a interpretação. Consulte um agrônomo.",
          recomendacoes: ["Consulte um engenheiro agrônomo para interpretação dos resultados"],
          alertas: [],
          classificacaoGeral: "adequado" as const,
        };
      }
    }),

  gerarPDF: publicProcedure
    .input(
      z.object({
        tipo: z.enum(["diagnostico", "analise_fitotecnica", "historico_propriedade", "recomendacao", "certificado"]),
        titulo: z.string(),
        propriedadeNome: z.string().optional(),
        culturaNome: z.string().optional(),
        conteudo: z.string(), // JSON stringified content
        responsavel: z.string().optional(),
        dataEmissao: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { tipo, titulo, propriedadeNome, culturaNome, conteudo, responsavel, dataEmissao } = input;

      // Parse content
      let dadosConteudo: Record<string, unknown> = {};
      try {
        dadosConteudo = JSON.parse(conteudo);
      } catch {
        dadosConteudo = { texto: conteudo };
      }

      // Build HTML for PDF
      const tipoLabels: Record<string, string> = {
        diagnostico: "Laudo de Diagnóstico Fitossanitário",
        analise_fitotecnica: "Laudo de Análise Fitotécnica",
        historico_propriedade: "Histórico da Propriedade",
        recomendacao: "Relatório de Recomendações Agrícolas",
        certificado: "Certificado de Qualidade",
      };

      const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; margin: 40px; color: #1a1a1a; }
  .header { border-bottom: 3px solid #2D6A4F; padding-bottom: 20px; margin-bottom: 30px; }
  .logo { font-size: 28px; font-weight: bold; color: #2D6A4F; }
  .subtitle { font-size: 14px; color: #666; margin-top: 4px; }
  .tipo-badge { background: #2D6A4F; color: white; padding: 6px 14px; border-radius: 20px; font-size: 12px; display: inline-block; margin-top: 10px; }
  h1 { font-size: 22px; color: #1a1a1a; margin-bottom: 6px; }
  h2 { font-size: 16px; color: #2D6A4F; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-top: 24px; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0; }
  .meta-item label { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
  .meta-item value { font-size: 14px; font-weight: 600; color: #1a1a1a; display: block; margin-top: 2px; }
  .section { margin-bottom: 24px; }
  .content-text { font-size: 14px; line-height: 1.7; color: #333; }
  .rec-list { list-style: none; padding: 0; }
  .rec-list li { padding: 10px 14px; background: #f0fdf4; border-left: 3px solid #2D6A4F; margin-bottom: 8px; font-size: 14px; border-radius: 0 6px 6px 0; }
  .alert-list li { background: #fff7ed; border-left-color: #D97706; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #888; text-align: center; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; }
  .badge-green { background: #dcfce7; color: #16a34a; }
  .badge-yellow { background: #fef9c3; color: #ca8a04; }
  .badge-red { background: #fee2e2; color: #dc2626; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th { background: #2D6A4F; color: white; padding: 10px 12px; text-align: left; font-size: 13px; }
  td { padding: 9px 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
  tr:nth-child(even) td { background: #f9fafb; }
</style>
</head>
<body>
  <div class="header">
    <div class="logo">🌿 AFU Agro</div>
    <div class="subtitle">Analisador Fitotécnico Universal — Sistema Fitotécnico Bio-Inteligente</div>
    <div class="tipo-badge">${tipoLabels[tipo] ?? tipo}</div>
  </div>

  <h1>${titulo}</h1>

  <div class="meta-grid">
    ${propriedadeNome ? `<div class="meta-item"><label>Propriedade</label><value>${propriedadeNome}</value></div>` : ""}
    ${culturaNome ? `<div class="meta-item"><label>Cultura</label><value>${culturaNome}</value></div>` : ""}
    <div class="meta-item"><label>Data de Emissão</label><value>${dataEmissao}</value></div>
    ${responsavel ? `<div class="meta-item"><label>Responsável Técnico</label><value>${responsavel}</value></div>` : ""}
  </div>

  ${dadosConteudo.interpretacao ? `
  <div class="section">
    <h2>Interpretação Técnica</h2>
    <p class="content-text">${dadosConteudo.interpretacao}</p>
  </div>` : ""}

  ${dadosConteudo.descricao ? `
  <div class="section">
    <h2>Descrição do Diagnóstico</h2>
    <p class="content-text">${dadosConteudo.descricao}</p>
  </div>` : ""}

  ${dadosConteudo.problema ? `
  <div class="section">
    <h2>Problema Identificado</h2>
    <p class="content-text"><strong>${dadosConteudo.problema}</strong></p>
    ${dadosConteudo.agenteCausal ? `<p class="content-text"><em>Agente causal: ${dadosConteudo.agenteCausal}</em></p>` : ""}
  </div>` : ""}

  ${Array.isArray(dadosConteudo.alertas) && (dadosConteudo.alertas as string[]).length > 0 ? `
  <div class="section">
    <h2>⚠️ Alertas</h2>
    <ul class="rec-list alert-list">
      ${(dadosConteudo.alertas as string[]).map((a: string) => `<li>${a}</li>`).join("")}
    </ul>
  </div>` : ""}

  ${Array.isArray(dadosConteudo.recomendacoes) && (dadosConteudo.recomendacoes as string[]).length > 0 ? `
  <div class="section">
    <h2>Recomendações</h2>
    <ul class="rec-list">
      ${(dadosConteudo.recomendacoes as string[]).map((r: string) => `<li>${r}</li>`).join("")}
    </ul>
  </div>` : ""}

  ${dadosConteudo.observacoesTecnicas ? `
  <div class="section">
    <h2>Observações Técnicas</h2>
    <p class="content-text">${dadosConteudo.observacoesTecnicas}</p>
  </div>` : ""}

  <div class="footer">
    <p>Este documento foi gerado automaticamente pelo sistema AFU Agro — Analisador Fitotécnico Universal.</p>
    <p>AFU MVP 1.0 — Planta Saudável | ${dataEmissao}</p>
    <p><em>Este laudo é uma análise preliminar e não substitui a avaliação presencial de um profissional habilitado.</em></p>
  </div>
</body>
</html>`;

      return { html, titulo, tipo };
    }),
});

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  organizations: organizationsRouter,
  diagnostico: diagnosticoRouter,
  analise: analiseRouter,
  culturasPragas: culturasPragasRouter,
  materiaisParceiros: materiaisParceirosRouter,
  coreData: coreDataRouter,
  secondaryData: secondaryDataRouter,
  weather: weatherRouter,
  push: pushRouter,
  bancoAgronomico: bancoAgronomicoRouter,
  piloto: pilotoRouter,
});

export type AppRouter = typeof appRouter;
