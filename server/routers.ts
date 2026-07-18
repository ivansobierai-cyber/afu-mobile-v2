import { z } from "zod";
import { systemRouter } from "./_core/systemRouter";
import {
  publicProcedure,
  protectedProcedure,
  organizationProcedure,
  router,
} from "./_core/trpc";
import { getCtxTenant, requireOrgPermission, assertRelatedIdsInTenant } from "./tenant-access";
import { buildReportHtml, reportFingerprint } from "./report-html";
import { getReportCache, setReportCache } from "./report-cache";
import {
  putPrivateFile,
  writeAuditLog,
  createTemporaryDownloadUrl,
} from "./private-files";
import { ENV } from "./_core/env";
import { invokeLLM } from "./_core/llm";
import {
  getDiagnosticos,
  createDiagnostico,
  getUsuarioAfuByUserId,
  createRelatorio,
} from "./db";
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

  /**
   * Etapa 6 — geração de laudo no servidor, escopada à org ativa.
   * Persiste artefato privado quando Forge estiver configurado; audita geração.
   */
  gerarPDF: organizationProcedure
    .input(
      z.object({
        tipo: z.enum([
          "diagnostico",
          "analise_fitotecnica",
          "historico_propriedade",
          "recomendacao",
          "certificado",
        ]),
        titulo: z.string(),
        propriedadeNome: z.string().optional(),
        propriedadeId: z.number().int().positive().optional(),
        culturaNome: z.string().optional(),
        conteudo: z.string(),
        responsavel: z.string().optional(),
        dataEmissao: z.string(),
        persist: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      requireOrgPermission(tenant, "reports.export");
      if (input.propriedadeId) {
        await assertRelatedIdsInTenant(tenant, { propriedadeId: input.propriedadeId });
      }

      const fp = reportFingerprint(input);
      const cached = getReportCache(tenant.organizationId, fp);
      if (cached) {
        await writeAuditLog({
          organizationId: tenant.organizationId,
          actorUserId: ctx.user.id,
          action: "report.generate",
          resourceType: "report_cache",
          resourceId: fp,
          storageKey: cached.storageKey,
          meta: JSON.stringify({ cacheHit: true, tipo: input.tipo }),
        });
        return {
          html: cached.html,
          titulo: cached.titulo,
          tipo: cached.tipo,
          cacheHit: true as const,
          storageKey: cached.storageKey ?? null,
          arquivoUrl: cached.storageKey ? `/manus-storage/${cached.storageKey}` : null,
          relatorioId: null as number | null,
          downloadUrl: null as string | null,
          expiresAt: null as string | null,
        };
      }

      const html = buildReportHtml({
        ...input,
        organizationLabel: tenant.organization.nome,
      });

      let storageKey: string | undefined;
      let relatorioId: number | null = null;
      let downloadUrl: string | null = null;
      let expiresAt: string | null = null;

      const shouldPersist = input.persist !== false && Boolean(ENV.forgeApiUrl && ENV.forgeApiKey);
      if (shouldPersist) {
        try {
          const put = await putPrivateFile({
            organizationId: tenant.organizationId,
            category: "relatorio",
            filename: `${fp}.html`,
            data: html,
            contentType: "text/html; charset=utf-8",
            createdByUserId: ctx.user.id,
            propriedadeId: input.propriedadeId,
          });
          storageKey = put.key;

          const tipoMap = {
            diagnostico: "diagnostico",
            analise_fitotecnica: "analise_solo",
            historico_propriedade: "historico",
            recomendacao: "recomendacao",
            certificado: "certificado",
          } as const;

          relatorioId = await createRelatorio({
            usuarioId: tenant.perfilId,
            organizationId: tenant.organizationId,
            titulo: input.titulo,
            tipoRelatorio: tipoMap[input.tipo],
            conteudo: input.conteudo,
            arquivoPdfUrl: put.proxyUrl,
            status: "emitido",
          } as any);

          const tmp = await createTemporaryDownloadUrl({
            userId: ctx.user.id,
            userRole: ctx.user.role,
            storageKey: put.key,
            permission: "reports.read",
            auditAction: "report.download",
            resourceType: "relatorio",
            resourceId: String(relatorioId),
          });
          downloadUrl = tmp.url;
          expiresAt = tmp.expiresAt.toISOString();
        } catch (err) {
          console.warn("[analise.gerarPDF] persist skipped:", err);
        }
      }

      setReportCache(tenant.organizationId, fp, {
        html,
        titulo: input.titulo,
        tipo: input.tipo,
        storageKey,
      });

      await writeAuditLog({
        organizationId: tenant.organizationId,
        actorUserId: ctx.user.id,
        action: "report.generate",
        resourceType: "relatorio",
        resourceId: relatorioId != null ? String(relatorioId) : fp,
        storageKey: storageKey ?? null,
        meta: JSON.stringify({
          cacheHit: false,
          tipo: input.tipo,
          propriedadeId: input.propriedadeId ?? null,
        }),
      });

      return {
        html,
        titulo: input.titulo,
        tipo: input.tipo,
        cacheHit: false as const,
        storageKey: storageKey ?? null,
        arquivoUrl: storageKey ? `/manus-storage/${storageKey}` : null,
        relatorioId,
        downloadUrl,
        expiresAt,
      };
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
