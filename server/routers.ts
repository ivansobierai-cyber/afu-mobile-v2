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
import { createDiagnostico, createRelatorio } from "./db";
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
  /** Etapa 7 — histórico da organização ativa (não só do usuário) */
  historico: organizationProcedure
    .input(z.object({ cacheScope: z.number().int().positive().optional() }).optional())
    .query(async ({ ctx }) => {
      const tenant = getCtxTenant(ctx);
      const { createTenantDb } = await import("./tenant-db");
      return createTenantDb(tenant.organizationId).listDiagnosticos();
    }),
  salvar: organizationProcedure
    .input(z.object({
      culturaNome: z.string(),
      sintomas: z.string().optional(),
      culturaId: z.number().int().positive().optional(),
      propriedadeId: z.number().int().positive().optional(),
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
      const tenant = getCtxTenant(ctx);
      if (input.propriedadeId || input.culturaId) {
        await assertRelatedIdsInTenant(tenant, {
          propriedadeId: input.propriedadeId,
          culturaId: input.culturaId,
        });
      }
      const created = await createDiagnostico({
        usuarioId: tenant.perfilId,
        organizationId: tenant.organizationId,
        propriedadeId: input.propriedadeId,
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
        void sendPushToUsuario(tenant.perfilId, {
          title: "Alerta fitossanitário",
          body: `${input.problema} detectado em ${input.culturaNome}. Abra o diagnóstico para ver recomendações.`,
          data: { type: "diagnostico", diagnosticoId: String(created) },
          priority: "high",
        });
      }

      return created;
    }),
  /** Etapa 9 — IA escopada à org; contexto mínimo; auditada; sem treinamento */
  analisar: organizationProcedure
    .input(
      z.object({
        imageBase64: z.string().max(8_000_000),
        culturaNome: z.string().min(1).max(80),
        parteAnalisada: z.string().min(1).max(60),
        sintomas: z.string().max(400).optional(),
        faseFenologica: z.string().max(60).optional(),
        propriedadeId: z.number().int().positive().optional(),
        culturaId: z.number().int().positive().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      requireOrgPermission(tenant, "property.read");
      const {
        buildDiagnosticoPrompt,
        assertAiPropertyScope,
        auditAiInvocation,
        getOrgAiPolicy,
        llmPrivacyOptions,
        DEFAULT_AI_MODEL,
        AI_OUTPUT_DISCLAIMER,
      } = await import("./ai-governance");

      await assertAiPropertyScope(tenant, input.propriedadeId, input.culturaId);
      const orgPolicy = await getOrgAiPolicy(tenant.organizationId);
      const privacy = llmPrivacyOptions(orgPolicy);
      const { prompt, fieldSummary } = buildDiagnosticoPrompt({
        culturaNome: input.culturaNome,
        parteAnalisada: input.parteAnalisada,
        sintomas: input.sintomas,
        faseFenologica: input.faseFenologica,
        organizationId: tenant.organizationId,
        propriedadeId: input.propriedadeId,
      });

      // Limita tamanho da imagem enviada ao modelo (já em base64)
      const imageB64 = input.imageBase64.length > 2_500_000
        ? input.imageBase64.slice(0, 2_500_000)
        : input.imageBase64;

      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${imageB64}`,
                    detail: "high",
                  },
                },
                { type: "text", text: prompt },
              ],
            },
          ],
          store: privacy.store,
          metadata: privacy.metadata,
        });

        const model = response.model || DEFAULT_AI_MODEL;
        await auditAiInvocation({
          tenant,
          purpose: "diagnostico_fitossanitario",
          model,
          fieldSummary,
          propriedadeId: input.propriedadeId,
          culturaId: input.culturaId,
          imageIncluded: true,
          success: true,
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
            disclaimer: AI_OUTPUT_DISCLAIMER,
            model,
            organizationId: tenant.organizationId,
            propriedadeId: input.propriedadeId ?? null,
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
            disclaimer: AI_OUTPUT_DISCLAIMER,
            model,
            organizationId: tenant.organizationId,
            propriedadeId: input.propriedadeId ?? null,
          };
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Erro na IA";
        await auditAiInvocation({
          tenant,
          purpose: "diagnostico_fitossanitario",
          model: DEFAULT_AI_MODEL,
          fieldSummary,
          propriedadeId: input.propriedadeId,
          culturaId: input.culturaId,
          imageIncluded: true,
          success: false,
          errorMessage: message,
        });
        throw e;
      }
    }),
});

const analiseRouter = router({
  /** Etapa 9 — interpretação lab escopada; sem nome de propriedade no prompt */
  interpretar: organizationProcedure
    .input(
      z.object({
        tipoAmostra: z.string().min(1).max(40),
        /** Aceito no cliente por compat; NÃO é enviado ao modelo (PII) */
        propriedadeNome: z.string().max(150).optional(),
        propriedadeId: z.number().int().positive().optional(),
        culturaId: z.number().int().positive().optional(),
        culturaNome: z.string().max(80).optional(),
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
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      requireOrgPermission(tenant, "property.read");
      const {
        buildInterpretacaoPrompt,
        assertAiPropertyScope,
        auditAiInvocation,
        getOrgAiPolicy,
        llmPrivacyOptions,
        DEFAULT_AI_MODEL,
        AI_OUTPUT_DISCLAIMER,
      } = await import("./ai-governance");

      await assertAiPropertyScope(tenant, input.propriedadeId, input.culturaId);
      const orgPolicy = await getOrgAiPolicy(tenant.organizationId);
      const privacy = llmPrivacyOptions(orgPolicy);
      const {
        tipoAmostra,
        culturaNome,
        propriedadeId,
        propriedadeNome: _dropName,
        culturaId,
        ...valores
      } = input;
      void _dropName;

      const { prompt, fieldSummary } = buildInterpretacaoPrompt({
        tipoAmostra,
        culturaNome,
        organizationId: tenant.organizationId,
        propriedadeId,
        valores,
      });

      try {
        const response = await invokeLLM({
          messages: [{ role: "user", content: prompt }],
          store: privacy.store,
          metadata: privacy.metadata,
        });
        const model = response.model || DEFAULT_AI_MODEL;
        await auditAiInvocation({
          tenant,
          purpose: "interpretacao_laboratorio",
          model,
          fieldSummary,
          propriedadeId,
          culturaId,
          success: true,
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
            disclaimer: AI_OUTPUT_DISCLAIMER,
            model,
            organizationId: tenant.organizationId,
            propriedadeId: propriedadeId ?? null,
          };
        } catch {
          return {
            interpretacao: "Não foi possível processar a interpretação. Consulte um agrônomo.",
            recomendacoes: ["Consulte um engenheiro agrônomo para interpretação dos resultados"],
            alertas: [],
            classificacaoGeral: "adequado" as const,
            disclaimer: AI_OUTPUT_DISCLAIMER,
            model,
            organizationId: tenant.organizationId,
            propriedadeId: propriedadeId ?? null,
          };
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Erro na IA";
        await auditAiInvocation({
          tenant,
          purpose: "interpretacao_laboratorio",
          model: DEFAULT_AI_MODEL,
          fieldSummary,
          propriedadeId,
          culturaId,
          success: false,
          errorMessage: message,
        });
        throw e;
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
