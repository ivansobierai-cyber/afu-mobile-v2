/**
 * WP-09 — Gateway REST fino Planta Saudável (AFU ↔ AGI Mobile).
 *
 * Expõe contratos esperados pelo cliente Kotlin (`PlantHealthyService`):
 *   POST /api/plant_healthy/analyze_image
 *   POST /api/plant_healthy/telemetry
 *   GET  /api/plant_healthy/alerts
 *
 * Mais endpoints de contexto AFU para o assistente:
 *   POST /api/agi/auth/login
 *   POST /api/agi/auth/refresh
 *   GET  /api/agi/context
 *   POST /api/agi/context/select
 *
 * Autenticação: Bearer JWT AFU (mesmo access token do tRPC).
 * IA / LLM: só no servidor — nunca exige chave no cliente AGI.
 */
import type { Express, Request, Response, NextFunction } from "express";
import { z } from "zod";
import type { User } from "../drizzle/schema";
import { sdk } from "./_core/sdk";
import { requireOrgPermission, assertRelatedIdsInTenant } from "./tenant-access";
import type { TenantContext } from "./tenant-access";

export type PlantHealthyAuth = {
  user: User;
  tenant: TenantContext;
};

const analyzeBodySchema = z.object({
  image_url: z.string().url().optional().nullable(),
  image_base64: z.string().min(1).max(8_000_000).optional().nullable(),
  crop_type: z.string().min(1).max(80),
  generation: z.string().min(1).max(40),
  field_notes: z.string().max(400).optional().nullable(),
  propriedade_id: z.number().int().positive().optional().nullable(),
  cultura_id: z.number().int().positive().optional().nullable(),
  persist: z.boolean().optional(),
});

const telemetryBodySchema = z.object({
  crop_type: z.string().min(1).max(80),
  generation: z.string().min(1).max(40),
  temperature_celsius: z.number().optional().nullable(),
  humidity_percent: z.number().optional().nullable(),
  soil_ph: z.number().optional().nullable(),
  nitrogen_ppm: z.number().optional().nullable(),
  phosphorus_ppm: z.number().optional().nullable(),
  potassium_ppm: z.number().optional().nullable(),
  normalized_fields: z.record(z.string(), z.string()).optional(),
  validation_warnings: z.array(z.string()).optional(),
  recorded_at: z.number().optional(),
  propriedade_id: z.number().int().positive().optional().nullable(),
});

const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshBodySchema = z.object({
  refreshToken: z.string().min(1),
});

const selectContextSchema = z.object({
  organizationId: z.number().int().positive(),
  propriedadeId: z.number().int().positive().optional().nullable(),
});

export function mapAnalyzeToAgiResponse(result: {
  problema?: string;
  confianca?: number;
  recomendacoes?: string[];
  severidade?: string;
  descricao?: string;
  observacoesTecnicas?: string;
  disclaimer?: string;
  model?: string;
  organizationId?: number;
  propriedadeId?: number | null;
}): Record<string, unknown> {
  const confiancaPct = typeof result.confianca === "number" ? result.confianca : 0;
  return {
    diagnosis: result.problema ?? "Análise inconclusiva",
    confidence: Math.min(1, Math.max(0, confiancaPct / 100)),
    recommendations: Array.isArray(result.recomendacoes) ? result.recomendacoes : [],
    genomic_risk: result.severidade
      ? `Severidade AFU: ${result.severidade}`
      : undefined,
    historical_comparison: result.observacoesTecnicas ?? result.descricao ?? undefined,
    afu: {
      severidade: result.severidade,
      descricao: result.descricao,
      disclaimer: result.disclaimer,
      model: result.model,
      organizationId: result.organizationId,
      propriedadeId: result.propriedadeId ?? null,
    },
  };
}

export function mapAlertasToAgi(
  alertas: Array<{
    id: string;
    titulo: string;
    motivo: string;
    gravidade: string;
    createdAt?: string;
  }>,
  cropType?: string | null,
  generation?: string | null,
): {
  status: string;
  message: string;
  alerts: Array<{
    id: string;
    severity: string;
    title: string;
    message: string;
    crop_type?: string;
    generation?: string;
    timestamp: number;
  }>;
} {
  return {
    status: "ok",
    message: `${alertas.length} alerta(s)`,
    alerts: alertas.map((a) => ({
      id: a.id,
      severity: a.gravidade,
      title: a.titulo,
      message: a.motivo,
      crop_type: cropType ?? undefined,
      generation: generation ?? undefined,
      timestamp: a.createdAt ? Date.parse(a.createdAt) || Date.now() : Date.now(),
    })),
  };
}

async function authenticateBearer(req: Request): Promise<User> {
  return sdk.authenticateRequest(req);
}

async function requirePlantHealthyAuth(req: Request): Promise<PlantHealthyAuth> {
  const user = await authenticateBearer(req);
  const { requireTenantContext } = await import("./tenant-access");
  const tenant = await requireTenantContext(user.id);
  return { user, tenant };
}

function sendError(res: Response, status: number, error: string, details?: unknown) {
  res.status(status).json({
    error,
    ...(details !== undefined ? { details } : {}),
  });
}

async function withAuth(
  req: Request,
  res: Response,
  handler: (auth: PlantHealthyAuth) => Promise<void>,
): Promise<void> {
  try {
    const auth = await requirePlantHealthyAuth(req);
    await handler(auth);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    const code = (e as { code?: string })?.code;
    if (code === "UNAUTHORIZED" || /invalid session|unauthorized/i.test(msg)) {
      sendError(res, 401, "Unauthorized");
      return;
    }
    if (code === "FORBIDDEN") {
      sendError(res, 403, msg);
      return;
    }
    if (code === "NOT_FOUND") {
      // Tenant isolation: recurso ausente no escopo (não vaza existência cross-tenant)
      sendError(res, 404, msg);
      return;
    }
    if (code === "BAD_REQUEST") {
      sendError(res, 400, msg);
      return;
    }
    console.error("[plant-healthy-gateway]", e);
    sendError(res, 500, msg || "Internal error");
  }
}

export function registerPlantHealthyGateway(app: Express): void {
  app.post("/api/agi/auth/login", async (req, res) => {
    const parsed = loginBodySchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 400, "Invalid login payload", parsed.error.flatten());
      return;
    }
    try {
      const { loginWithEmail } = await import("./db-auth");
      const { createAccessToken, createRefreshToken, storeRefreshToken } = await import(
        "./token-service"
      );
      const { ensurePersonalOrganization } = await import("./db-organizations");

      const user = await loginWithEmail(parsed.data.email, parsed.data.password);
      if (!user.openId) {
        sendError(res, 500, "User openId is missing");
        return;
      }
      try {
        await ensurePersonalOrganization(user.id);
      } catch (e) {
        console.warn("[agi.auth.login] ensurePersonalOrganization failed:", e);
      }
      const accessToken = await createAccessToken(user.openId, user.name || "");
      const refreshToken = await createRefreshToken(user.openId);
      await storeRefreshToken(user.id, refreshToken);

      const { resolveSessionOrganization } = await import("./db-organizations");
      const orgSession = await resolveSessionOrganization(user.id);
      const activeOrg =
        orgSession.organizations.find((o) => o.id === orgSession.activeOrganizationId) ??
        orgSession.organizations[0] ??
        null;

      res.json({
        success: true,
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          openId: user.openId,
        },
        organization: activeOrg
          ? {
              id: activeOrg.id,
              nome: activeOrg.nome,
              role: activeOrg.role,
            }
          : null,
        organizations: orgSession.organizations.map((o) => ({
          id: o.id,
          nome: o.nome,
          role: o.role,
        })),
      });
    } catch {
      sendError(res, 401, "E-mail ou senha invalidos");
    }
  });

  app.post("/api/agi/auth/refresh", async (req, res) => {
    const parsed = refreshBodySchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 400, "Invalid refresh payload", parsed.error.flatten());
      return;
    }
    try {
      const { renewTokens } = await import("./token-service");
      const tokens = await renewTokens(parsed.data.refreshToken);
      if (!tokens) {
        sendError(res, 401, "Refresh token invalido");
        return;
      }
      res.json({
        success: true,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } catch {
      sendError(res, 401, "Refresh token invalido");
    }
  });

  app.get("/api/agi/context", async (req, res) => {
    await withAuth(req, res, async ({ user, tenant }) => {
      const { resolveSessionOrganization } = await import("./db-organizations");
      const { getDb } = await import("./db");
      const { propriedades, produtores } = await import("../drizzle/schema");
      const { eq, and, inArray } = await import("drizzle-orm");

      const orgSession = await resolveSessionOrganization(user.id);
      const db = await getDb();
      let props: Array<{
        id: number;
        nome: string;
        cidade: string | null;
        estado: string | null;
        tamanhoArea: string | number | null;
      }> = [];

      if (db) {
        const produtorRows = await db
          .select({ id: produtores.id })
          .from(produtores)
          .where(eq(produtores.organizationId, tenant.organizationId));
        const produtorIds = produtorRows.map((p) => p.id);
        if (produtorIds.length > 0) {
          props = await db
            .select({
              id: propriedades.id,
              nome: propriedades.nome,
              cidade: propriedades.cidade,
              estado: propriedades.estado,
              tamanhoArea: propriedades.tamanhoArea,
            })
            .from(propriedades)
            .where(
              and(
                eq(propriedades.organizationId, tenant.organizationId),
                inArray(propriedades.produtorId, produtorIds),
              ),
            );
        }
      }

      const requestedPropId = Number(req.query.propriedadeId);
      const selectedPropriedade =
        Number.isFinite(requestedPropId) && requestedPropId > 0
          ? props.find((p) => p.id === requestedPropId) ?? null
          : props[0] ?? null;

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        organization: {
          id: tenant.organizationId,
          nome: tenant.organization.nome,
          role: tenant.orgRole,
        },
        organizations: orgSession.organizations.map((o) => ({
          id: o.id,
          nome: o.nome,
          role: o.role,
        })),
        propriedades: props,
        selectedPropriedade,
        permissions: {
          diagnosticsWrite: true,
          propertyRead: true,
        },
      });
    });
  });

  app.post("/api/agi/context/select", async (req, res) => {
    await withAuth(req, res, async ({ user }) => {
      const parsed = selectContextSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, 400, "Invalid context payload", parsed.error.flatten());
        return;
      }
      const { getActiveMembership, setActiveOrganizationId } = await import(
        "./db-organizations"
      );
      const { getUsuarioAfuByUserId } = await import("./db");
      const m = await getActiveMembership(user.id, parsed.data.organizationId);
      if (!m) {
        sendError(res, 403, "Sem membership ativo nesta organização.");
        return;
      }
      const perfil = await getUsuarioAfuByUserId(user.id);
      if (!perfil) {
        sendError(res, 401, "Perfil AFU não encontrado");
        return;
      }

      // Validate property against the *target* org before switching active org.
      if (parsed.data.propriedadeId) {
        const { createTenantDb } = await import("./tenant-db");
        await createTenantDb(parsed.data.organizationId).requirePropriedade(
          parsed.data.propriedadeId,
        );
      }

      await setActiveOrganizationId(perfil.id, parsed.data.organizationId);

      res.json({
        success: true,
        activeOrganizationId: parsed.data.organizationId,
        propriedadeId: parsed.data.propriedadeId ?? null,
        role: m.membership.role,
      });
    });
  });

  app.post("/api/plant_healthy/analyze_image", async (req, res) => {
    await withAuth(req, res, async ({ tenant }) => {
      const parsed = analyzeBodySchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, 400, "Invalid analyze payload", parsed.error.flatten());
        return;
      }

      let imageBase64 = parsed.data.image_base64?.replace(/^data:image\/[a-zA-Z+]+;base64,/, "") ?? "";
      if (!imageBase64 && parsed.data.image_url) {
        try {
          const { fetchSafePublicImage } = await import("./safe-image-url");
          const { buffer } = await fetchSafePublicImage(parsed.data.image_url, {
            timeoutMs: 10_000,
            maxBytes: 1_875_000,
          });
          imageBase64 = buffer.toString("base64");
        } catch (e) {
          sendError(
            res,
            400,
            e instanceof Error ? e.message : "Falha ao baixar image_url",
          );
          return;
        }
      }
      if (!imageBase64) {
        sendError(res, 400, "Informe image_base64 ou image_url");
        return;
      }
      if (imageBase64.length > 2_500_000) {
        sendError(
          res,
          400,
          "image_base64 excede o limite do gateway (2.5M chars). Comprima a foto e tente novamente.",
        );
        return;
      }

      requireOrgPermission(tenant, "property.read");
      requireOrgPermission(tenant, "diagnostics.write");

      const propriedadeId = parsed.data.propriedade_id ?? undefined;
      const culturaId = parsed.data.cultura_id ?? undefined;
      if (propriedadeId || culturaId) {
        await assertRelatedIdsInTenant(tenant, { propriedadeId, culturaId });
      }

      const {
        buildDiagnosticoPrompt,
        assertAiPropertyScope,
        auditAiInvocation,
        getOrgAiPolicy,
        llmPrivacyOptions,
        DEFAULT_AI_MODEL,
        AI_OUTPUT_DISCLAIMER,
      } = await import("./ai-governance");
      const { invokeLLM } = await import("./_core/llm");
      const { createDiagnostico } = await import("./db");

      await assertAiPropertyScope(tenant, propriedadeId, culturaId);
      const orgPolicy = await getOrgAiPolicy(tenant.organizationId);
      const privacy = llmPrivacyOptions(orgPolicy);
      const { prompt, fieldSummary } = buildDiagnosticoPrompt({
        culturaNome: parsed.data.crop_type,
        parteAnalisada: "folha",
        sintomas: parsed.data.field_notes ?? undefined,
        faseFenologica: parsed.data.generation,
        organizationId: tenant.organizationId,
        propriedadeId,
      });

      const imageB64 = imageBase64;

      let result: {
        problema: string;
        tipo: string;
        confianca: number;
        severidade: string;
        descricao: string;
        recomendacoes: string[];
        agenteCausal?: string;
        observacoesTecnicas?: string;
        disclaimer: string;
        model: string;
        organizationId: number;
        propriedadeId: number | null;
      };

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
          propriedadeId,
          culturaId,
          imageIncluded: true,
          success: true,
        });

        const rawContent = response.choices[0]?.message?.content;
        const content =
          typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent ?? "");
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error("No JSON found");
          const parsedLlm = JSON.parse(jsonMatch[0]);
          result = {
            problema: parsedLlm.problema ?? "Análise inconclusiva",
            tipo: parsedLlm.tipo ?? "outro",
            confianca:
              typeof parsedLlm.confianca === "number"
                ? Math.min(100, Math.max(0, parsedLlm.confianca))
                : 70,
            severidade: parsedLlm.severidade ?? "leve",
            descricao: parsedLlm.descricao ?? "Não foi possível determinar com precisão.",
            recomendacoes: Array.isArray(parsedLlm.recomendacoes)
              ? parsedLlm.recomendacoes
              : [],
            agenteCausal: parsedLlm.agenteCausal ?? undefined,
            observacoesTecnicas: parsedLlm.observacoesTecnicas ?? undefined,
            disclaimer: AI_OUTPUT_DISCLAIMER,
            model,
            organizationId: tenant.organizationId,
            propriedadeId: propriedadeId ?? null,
          };
        } catch {
          result = {
            problema: "Análise inconclusiva",
            tipo: "outro",
            confianca: 50,
            severidade: "leve",
            descricao:
              "Não foi possível processar a análise da imagem. Tente novamente com uma foto mais nítida.",
            recomendacoes: [
              "Tire uma foto mais próxima e com boa iluminação",
              "Certifique-se de que a parte afetada esteja visível",
              "Consulte um agrônomo ou técnico para avaliação presencial",
            ],
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
          purpose: "diagnostico_fitossanitario",
          model: DEFAULT_AI_MODEL,
          fieldSummary,
          propriedadeId,
          culturaId,
          imageIncluded: true,
          success: false,
          errorMessage: message,
        });
        sendError(res, 502, message);
        return;
      }

      let diagnosticoId: number | null = null;
      if (parsed.data.persist !== false) {
        diagnosticoId = await createDiagnostico({
          usuarioId: tenant.perfilId,
          organizationId: tenant.organizationId,
          propriedadeId,
          culturaId,
          partePlanta: "folha",
          sintomasInformados: parsed.data.field_notes ?? null,
          resultado: JSON.stringify({
            culturaNome: parsed.data.crop_type,
            sintomas: parsed.data.field_notes,
            problema: result.problema,
            tipo: result.tipo,
            confianca: result.confianca,
            severidade: result.severidade,
            descricao: result.descricao,
            recomendacoes: result.recomendacoes,
            agenteCausal: result.agenteCausal,
            observacoesTecnicas: result.observacoesTecnicas,
            generation: parsed.data.generation,
            source: "agi_plant_healthy_gateway",
          }),
          pragaProvavel: result.tipo === "praga" ? result.problema : undefined,
          doencaProvavel: result.tipo === "doenca" ? result.problema : undefined,
          gravidade: result.severidade as any,
          confiancaIa: result.confianca,
          recomendacao: result.recomendacoes.join("; "),
        });
      }

      res.json({
        ...mapAnalyzeToAgiResponse(result),
        diagnostico_id: diagnosticoId,
      });
    });
  });

  app.post("/api/plant_healthy/telemetry", async (req, res) => {
    await withAuth(req, res, async ({ user, tenant }) => {
      const parsed = telemetryBodySchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, 400, "Invalid telemetry payload", parsed.error.flatten());
        return;
      }
      requireOrgPermission(tenant, "property.read");
      const propriedadeId = parsed.data.propriedade_id ?? undefined;
      if (propriedadeId) {
        await assertRelatedIdsInTenant(tenant, { propriedadeId });
      }

      const { writeAuditLog } = await import("./private-files");
      await writeAuditLog({
        organizationId: tenant.organizationId,
        actorUserId: user.id,
        action: "agi.plant_healthy.telemetry",
        resourceType: "telemetry",
        resourceId: propriedadeId ? String(propriedadeId) : null,
        meta: JSON.stringify({
          crop_type: parsed.data.crop_type,
          generation: parsed.data.generation,
          temperature_celsius: parsed.data.temperature_celsius,
          humidity_percent: parsed.data.humidity_percent,
          soil_ph: parsed.data.soil_ph,
          nitrogen_ppm: parsed.data.nitrogen_ppm,
          phosphorus_ppm: parsed.data.phosphorus_ppm,
          potassium_ppm: parsed.data.potassium_ppm,
          validation_warnings: parsed.data.validation_warnings ?? [],
          recorded_at: parsed.data.recorded_at ?? Date.now(),
        }),
      });

      const warnings = parsed.data.validation_warnings ?? [];
      const alerts =
        warnings.length > 0
          ? warnings.map((w, idx) => ({
              id: `telemetry-warn-${idx}`,
              severity: "atencao",
              title: "Validação de telemetria",
              message: w,
              crop_type: parsed.data.crop_type,
              generation: parsed.data.generation,
              timestamp: parsed.data.recorded_at ?? Date.now(),
            }))
          : [];

      res.json({
        status: "ok",
        message: "Telemetria registrada no tenant AFU",
        alerts,
      });
    });
  });

  app.get("/api/plant_healthy/alerts", async (req, res) => {
    await withAuth(req, res, async ({ tenant }) => {
      requireOrgPermission(tenant, "property.read");
      const cropType =
        typeof req.query.crop_type === "string" ? req.query.crop_type : undefined;
      const generation =
        typeof req.query.generation === "string" ? req.query.generation : undefined;
      const propriedadeIdRaw = req.query.propriedade_id ?? req.query.propriedadeId;
      const propriedadeId =
        typeof propriedadeIdRaw === "string" && Number(propriedadeIdRaw) > 0
          ? Number(propriedadeIdRaw)
          : undefined;

      if (propriedadeId) {
        const { requirePropertyInTenant } = await import("./tenant-access");
        await requirePropertyInTenant(tenant, propriedadeId);
        const { createTenantDb } = await import("./tenant-db");
        const { listLotesPorPropriedade, listReservasPorPropriedade } = await import(
          "./db-propriedade-expansao"
        );
        const { gerarAlertas } = await import("../lib/propriedades/alertas-engine");

        const tdb = createTenantDb(tenant.organizationId);
        const [tarefas, cultivos, estoque, orcamentos, ocorrencias, prop, lotes, reservas] =
          await Promise.all([
            tdb.listTarefasByPropriedade(propriedadeId),
            tdb.listCulturasByPropriedade(propriedadeId),
            tdb.listEstoque(propriedadeId),
            tdb.listOrcamentos(propriedadeId),
            tdb.listOcorrencias(propriedadeId),
            tdb.requirePropriedade(propriedadeId),
            listLotesPorPropriedade(propriedadeId, tenant.organizationId),
            listReservasPorPropriedade(propriedadeId, tenant.organizationId),
          ]);
        const estoqueNome = new Map(estoque.map((e) => [e.id, e.nome]));
        const alertas = gerarAlertas({
          tarefas,
          cultivos,
          estoque,
          lotes: lotes.map((l) => ({
            id: l.id,
            itemId: l.itemId,
            itemNome: estoqueNome.get(l.itemId),
            codigo: l.codigo,
            validade: l.validade,
            bloqueado: Boolean(l.bloqueado),
          })),
          reservas: reservas.map((r) => ({
            id: r.id,
            itemId: r.itemId,
            itemNome: estoqueNome.get(r.itemId),
            quantidade: r.quantidade,
            status: r.status,
            tarefaId: r.tarefaId,
          })),
          orcamentos,
          ocorrencias: ocorrencias.map((o) => ({
            id: o.id,
            titulo: o.titulo,
            status: o.status,
            severidade: o.severidade,
            createdAt: o.createdAt,
          })),
          temGeometriaPropriedade: Boolean(prop?.geometriaGeoJson),
        });
        res.json(mapAlertasToAgi(alertas, cropType, generation));
        return;
      }

      // Sem propriedade: alertas a partir de diagnósticos graves da org
      const { createTenantDb } = await import("./tenant-db");
      const diagnosticos = await createTenantDb(tenant.organizationId).listDiagnosticos();
      const alerts = diagnosticos
        .filter((d) => d.gravidade === "grave" || d.gravidade === "critica")
        .slice(0, 30)
        .map((d) => ({
          id: `diag-${d.id}`,
          severity: d.gravidade ?? "atencao",
          title: d.pragaProvavel || d.doencaProvavel || "Diagnóstico AFU",
          message: d.recomendacao || "Revisar laudo no AFU Agro",
          crop_type: cropType,
          generation,
          timestamp: d.dataDiagnostico
            ? new Date(d.dataDiagnostico).getTime()
            : Date.now(),
        }));

      res.json({
        status: "ok",
        message: `${alerts.length} alerta(s) de diagnóstico`,
        alerts,
      });
    });
  });

  // CORS preflight already handled globally; no-op middleware marker for tests
  app.use("/api/plant_healthy", (_req: Request, _res: Response, next: NextFunction) => next());
  app.use("/api/agi", (_req: Request, _res: Response, next: NextFunction) => next());
}
