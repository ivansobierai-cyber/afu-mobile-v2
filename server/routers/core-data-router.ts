/**
 * core-data-router.ts — Router tRPC para dados centrais do AFU
 * Cobre: Propriedades, Terrenos, Cultivos (culturas), Calendário de Cuidados
 * Etapa 4: organizationProcedure + validação de propriedade/relações no tenant.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq, desc } from "drizzle-orm";
import { router, organizationProcedure, orgPermissionProcedure } from "../_core/trpc";
import { tenantCacheScopeSchema } from "../../lib/trpc-cache-scope";
import { createTenantDb } from "../tenant-db";
import {
  createPropriedade,
  updatePropriedade,
  deletePropriedade,
  getTerrenosByPropriedade,
  createTerreno,
  updateTerreno,
  deleteTerreno,
  getCulturasByPropriedade,
  createCultura,
  updateCultura,
  deleteCultura,
  createEvento,
  updateEvento,
  getTarefasByPropriedade,
  getDb,
} from "../db";
import { tarefasRouter } from "./tarefas-router";
import { propriedadeExpansaoRouter } from "./propriedade-expansao-router";
import { sendPushToUsuario } from "../services/push-delivery";
import { culturas, calendarioCuidados } from "../../drizzle/schema";
import {
  getCtxTenant,
  requireOrgPermission,
  requirePropertyInTenant,
  requireTerrenoInTenant,
  requireCulturaInTenant,
  requireEventoInTenant,
  assertRelatedIdsInTenant,
  listPropriedadesInTenant,
  getProdutorIdForTenant,
} from "../tenant-access";

// ─── Schemas de input ─────────────────────────────────────────────────────────
const propriedadeInput = z.object({
  nome: z.string().min(1).max(150),
  cidade: z.string().max(100).optional(),
  estado: z.string().max(100).optional(),
  tamanhoArea: z.number().positive().optional(),
  unidadeArea: z.enum(["ha", "alqueire", "m2"]).optional(),
  tipoSolo: z.string().max(100).optional(),
  fonteAgua: z.string().max(100).optional(),
  sistemaIrrigacao: z.string().max(100).optional(),
  tipoProducao: z
    .enum(["graos", "hortifruti", "fruticultura", "cana", "cafe", "pecuaria", "misto", "outro"])
    .optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const terrenoInput = z.object({
  propriedadeId: z.number().int().positive(),
  nome: z.string().min(1).max(100),
  area: z.number().positive().optional(),
  tipoSolo: z.string().max(100).optional(),
  sistemaIrrigacao: z.string().max(100).optional(),
  observacoes: z.string().optional(),
});

/** Cultivos V2: talhão obrigatório no create; safra auto via ensureDefault se omitida. */
const cultivoInput = z.object({
  propriedadeId: z.number().int().positive(),
  safraId: z.number().int().positive().optional(),
  terrenoId: z.number().int().positive(),
  nomeCultura: z.string().min(1).max(100),
  variedade: z.string().max(100).optional(),
  dataPlantio: z.string().optional(),
  faseAtual: z.string().max(100).optional(),
  areaPlantada: z.number().positive().optional(),
  previsaoColheita: z.string().optional(),
  producaoEstimada: z.number().positive().optional(),
  unidadeProducao: z.string().max(30).optional(),
  status: z.enum(["planejado", "em_andamento", "colhido", "perdido"]).optional(),
  observacoes: z.string().optional(),
});

const cultivoUpdateInput = cultivoInput.partial().extend({
  /** Não permitir remover talhão (null); omitir = manter. */
  terrenoId: z.number().int().positive().optional(),
});

const eventoInput = z.object({
  propriedadeId: z.number().int().positive().optional(),
  culturaId: z.number().int().positive().optional(),
  tipoAtividade: z.enum([
    "plantio", "irrigacao", "adubacao", "pulverizacao",
    "monitoramento", "colheita", "analise", "manutencao", "outro",
  ]),
  titulo: z.string().min(1).max(200),
  descricao: z.string().optional(),
  dataProgramada: z.string(),
  recorrencia: z.enum(["nenhuma", "diaria", "semanal", "quinzenal", "mensal"]).optional(),
  prioridade: z.enum(["baixa", "normal", "alta", "critica"]).optional(),
  status: z.enum(["pendente", "em_andamento", "concluido", "cancelado"]).optional(),
  lembreteAtivo: z.boolean().optional(),
});

// ─── Router de Propriedades ───────────────────────────────────────────────────
const propriedadesRouter = router({
  list: organizationProcedure
    .input(tenantCacheScopeSchema.optional())
    .query(async ({ ctx }) => {
      const tenant = getCtxTenant(ctx);
      requireOrgPermission(tenant, "property.read");
      return listPropriedadesInTenant(tenant);
    }),

  /** Propriedades soft-arquivadas (Etapa 7 — UI de restauração). */
  listArchived: orgPermissionProcedure("property.archive")
    .input(tenantCacheScopeSchema.optional())
    .query(async ({ ctx }) => {
      const tenant = getCtxTenant(ctx);
      const tdb = createTenantDb(tenant.organizationId);
      const all = await tdb.listPropriedades({ includeArchived: true });
      return all.filter((p) => (p as { archivedAt?: Date | null }).archivedAt != null);
    }),

  get: organizationProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      requireOrgPermission(tenant, "property.read");
      return requirePropertyInTenant(tenant, input.id);
    }),

  create: orgPermissionProcedure("property.write")
    .input(propriedadeInput)
    .mutation(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      const produtorId = await getProdutorIdForTenant(tenant);
      return createPropriedade({
        ...input,
        produtorId,
        organizationId: tenant.organizationId,
        tamanhoArea: input.tamanhoArea?.toString(),
        latitude: input.latitude?.toString(),
        longitude: input.longitude?.toString(),
      } as any);
    }),

  update: orgPermissionProcedure("property.write")
    .input(z.object({ id: z.number().int().positive(), data: propriedadeInput.partial() }))
    .mutation(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      await requirePropertyInTenant(tenant, input.id);
      return updatePropriedade(
        input.id,
        {
          ...input.data,
          tamanhoArea: input.data.tamanhoArea?.toString(),
          latitude: input.data.latitude?.toString(),
          longitude: input.data.longitude?.toString(),
        } as any,
        tenant.organizationId,
      );
    }),

  /** Soft-archive recuperável (preferível à exclusão). */
  archive: orgPermissionProcedure("property.archive")
    .input(
      z.object({
        id: z.number().int().positive(),
        motivo: z.string().min(3).max(255),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      await requirePropertyInTenant(tenant, input.id);
      const { createTenantDb } = await import("../tenant-db");
      const { writeAuditLog } = await import("../private-files");
      const tdb = createTenantDb(tenant.organizationId);
      await tdb.updatePropriedade(input.id, {
        archivedAt: new Date(),
        archivedByUserId: tenant.userId,
        archiveMotivo: input.motivo.trim(),
      } as any);
      await writeAuditLog({
        organizationId: tenant.organizationId,
        actorUserId: tenant.userId,
        action: "property.archive",
        resourceType: "propriedade",
        resourceId: String(input.id),
        meta: JSON.stringify({ motivo: input.motivo.trim() }),
      });
      return { success: true };
    }),

  restore: orgPermissionProcedure("property.archive")
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      const { createTenantDb } = await import("../tenant-db");
      const { writeAuditLog } = await import("../private-files");
      const tdb = createTenantDb(tenant.organizationId);
      const prop = await tdb.getPropriedade(input.id);
      if (!prop) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Recurso não encontrado" });
      }
      await tdb.updatePropriedade(input.id, {
        archivedAt: null,
        archivedByUserId: null,
        archiveMotivo: null,
      } as any);
      await writeAuditLog({
        organizationId: tenant.organizationId,
        actorUserId: tenant.userId,
        action: "property.restore",
        resourceType: "propriedade",
        resourceId: String(input.id),
      });
      return { success: true };
    }),

  /**
   * Exclusão definitiva — excepcional.
   * Requer property.delete (não property.write). Prefira archive.
   */
  delete: orgPermissionProcedure("property.delete")
    .input(
      z.object({
        id: z.number().int().positive(),
        confirmNome: z.string().min(1).max(150),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      const prop = await requirePropertyInTenant(tenant, input.id);
      if (prop.nome.trim() !== input.confirmNome.trim()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Digite o nome exato da propriedade para confirmar a exclusão.",
        });
      }
      const { writeAuditLog } = await import("../private-files");
      await writeAuditLog({
        organizationId: tenant.organizationId,
        actorUserId: tenant.userId,
        action: "property.delete",
        resourceType: "propriedade",
        resourceId: String(input.id),
        meta: JSON.stringify({ nome: prop.nome }),
      });
      await deletePropriedade(input.id, tenant.organizationId);
      return { success: true };
    }),

  /**
   * Exporta resumo da propriedade com auditoria (Etapa 7).
   * Preferível ao Share local sem rastros.
   */
  exportResumo: orgPermissionProcedure("reports.export")
    .input(
      z.object({
        id: z.number().int().positive(),
        safraId: z.number().int().positive().optional(),
        safraLabel: z.string().max(120).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      const prop = await requirePropertyInTenant(tenant, input.id);
      const terrenos = await getTerrenosByPropriedade(input.id);
      const { filterRowsBySafraId } = await import("../../lib/propriedades/safra-filter");
      let safraId = input.safraId;
      if (safraId) {
        const { requireSafraInProperty } = await import("../db-safras");
        await requireSafraInProperty(tenant.organizationId, input.id, safraId);
      }
      const cultivosAll = await getCulturasByPropriedade(input.id);
      const cultivos = filterRowsBySafraId(cultivosAll, safraId ?? null).matched;
      const tarefasAll = await getTarefasByPropriedade(input.id);
      const tarefas = filterRowsBySafraId(tarefasAll as any[], safraId ?? null).matched;
      const abertas = tarefas.filter((t: any) =>
        ["planejada", "liberada", "em_execucao", "pausada", "bloqueada"].includes(t.status),
      );

      const safraLine = input.safraLabel
        ? `Safra: ${input.safraLabel}${safraId != null ? ` (#${safraId})` : ""}`
        : safraId != null
          ? `Safra: #${safraId}`
          : "Safra: (não filtrada)";

      const text = [
        `Propriedade: ${prop.nome}`,
        safraLine,
        `Área: ${prop.tamanhoArea ?? "—"} ${prop.unidadeArea ?? "ha"}`,
        `Talhões: ${terrenos.length}`,
        `Cultivos: ${cultivos.length}`,
        `Tarefas abertas: ${abertas.length}`,
        `Exportado em: ${new Date().toISOString()}`,
      ].join("\n");

      const { writeAuditLog } = await import("../private-files");
      await writeAuditLog({
        organizationId: tenant.organizationId,
        actorUserId: tenant.userId,
        action: "property.export",
        resourceType: "propriedade",
        resourceId: String(input.id),
        meta: JSON.stringify({
          safraId: safraId ?? null,
          talhoes: terrenos.length,
          cultivos: cultivos.length,
          tarefasAbertas: abertas.length,
        }),
      });

      return {
        text,
        title: `Resumo — ${prop.nome}`,
        exportedAt: new Date().toISOString(),
      };
    }),

  stats: organizationProcedure
    .input(tenantCacheScopeSchema.optional())
    .query(async ({ ctx }) => {
      const tenant = getCtxTenant(ctx);
      requireOrgPermission(tenant, "property.read");
      const lista = await listPropriedadesInTenant(tenant);
      const porTipo: Record<string, number> = {};
      lista.forEach((p) => {
        const tipo = p.tipoProducao ?? "outro";
        porTipo[tipo] = (porTipo[tipo] ?? 0) + 1;
      });
      return {
        total: lista.length,
        porTipo,
        areaTotal: lista.reduce((s, p) => s + Number(p.tamanhoArea ?? 0), 0),
      };
    }),
});

// ─── Router de Terrenos ───────────────────────────────────────────────────────
const terrenosRouter = router({
  listByPropriedade: organizationProcedure
    .input(z.object({ propriedadeId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      requireOrgPermission(tenant, "property.read");
      await requirePropertyInTenant(tenant, input.propriedadeId);
      return getTerrenosByPropriedade(input.propriedadeId);
    }),

  create: orgPermissionProcedure("property.write")
    .input(terrenoInput)
    .mutation(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      await requirePropertyInTenant(tenant, input.propriedadeId);
      return createTerreno({
        ...input,
        organizationId: tenant.organizationId,
        area: input.area?.toString(),
      } as any);
    }),

  update: orgPermissionProcedure("property.write")
    .input(z.object({ id: z.number().int().positive(), data: terrenoInput.partial() }))
    .mutation(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      const terreno = await requireTerrenoInTenant(tenant, input.id);
      if (input.data.propriedadeId != null && input.data.propriedadeId !== terreno.propriedadeId) {
        await requirePropertyInTenant(tenant, input.data.propriedadeId);
      }
      return updateTerreno(
        input.id,
        { ...input.data, area: input.data.area?.toString() } as any,
        tenant.organizationId,
      );
    }),

  delete: orgPermissionProcedure("property.write")
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      await requireTerrenoInTenant(tenant, input.id);
      await deleteTerreno(input.id, tenant.organizationId);
      return { success: true };
    }),
});

// ─── Router de Cultivos ───────────────────────────────────────────────────────
async function listCulturasInTenant(organizationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(culturas)
    .where(eq(culturas.organizationId, organizationId))
    .orderBy(desc(culturas.createdAt));
}

const cultivosRouter = router({
  list: organizationProcedure
    .input(tenantCacheScopeSchema.optional())
    .query(async ({ ctx }) => {
      const tenant = getCtxTenant(ctx);
      requireOrgPermission(tenant, "property.read");
      return listCulturasInTenant(tenant.organizationId);
    }),

  listByPropriedade: organizationProcedure
    .input(
      z.object({
        propriedadeId: z.number().int().positive(),
        safraId: z.number().int().positive().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      requireOrgPermission(tenant, "property.read");
      await requirePropertyInTenant(tenant, input.propriedadeId);
      if (input.safraId) {
        const { requireSafraInProperty } = await import("../db-safras");
        await requireSafraInProperty(
          tenant.organizationId,
          input.propriedadeId,
          input.safraId,
        );
      }
      const { filterRowsBySafraId } = await import("../../lib/propriedades/safra-filter");
      const all = await getCulturasByPropriedade(input.propriedadeId);
      return filterRowsBySafraId(all, input.safraId ?? null).matched;
    }),

  create: orgPermissionProcedure("property.write")
    .input(cultivoInput)
    .mutation(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      await assertRelatedIdsInTenant(tenant, {
        propriedadeId: input.propriedadeId,
        terrenoId: input.terrenoId,
      });
      let safraId = input.safraId;
      if (safraId) {
        const { requireWritableSafraInProperty } = await import("../db-safras");
        await requireWritableSafraInProperty(
          tenant.organizationId,
          input.propriedadeId,
          safraId,
        );
      } else {
        const { ensureDefaultSafra } = await import("../db-safras");
        safraId = (
          await ensureDefaultSafra({
            organizationId: tenant.organizationId,
            propriedadeId: input.propriedadeId,
            createdByUserId: tenant.userId,
          })
        ).id;
      }
      const id = await createCultura({
        ...input,
        safraId,
        organizationId: tenant.organizationId,
        areaPlantada: input.areaPlantada?.toString(),
        producaoEstimada: input.producaoEstimada?.toString(),
      } as any);
      if (input.faseAtual) {
        const { recordFaseChangeIfNeeded } = await import("../db-cultivo-fase");
        await recordFaseChangeIfNeeded({
          organizationId: tenant.organizationId,
          propriedadeId: input.propriedadeId,
          culturaId: id,
          faseAnterior: null,
          faseNova: input.faseAtual,
          userId: tenant.userId,
          origem: "api",
        });
      }
      return id;
    }),

  update: orgPermissionProcedure("property.write")
    .input(z.object({ id: z.number().int().positive(), data: cultivoUpdateInput }))
    .mutation(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      const atual = await requireCulturaInTenant(tenant, input.id);
      await assertRelatedIdsInTenant(tenant, {
        propriedadeId: input.data.propriedadeId ?? atual.propriedadeId,
        terrenoId: input.data.terrenoId,
      });
      if (input.data.safraId != null) {
        const { requireWritableSafraInProperty } = await import("../db-safras");
        await requireWritableSafraInProperty(
          tenant.organizationId,
          input.data.propriedadeId ?? atual.propriedadeId,
          input.data.safraId,
        );
      }
      await updateCultura(
        input.id,
        {
          ...input.data,
          areaPlantada: input.data.areaPlantada?.toString(),
          producaoEstimada: input.data.producaoEstimada?.toString(),
        } as any,
        tenant.organizationId,
      );
      if (input.data.faseAtual != null) {
        const { recordFaseChangeIfNeeded } = await import("../db-cultivo-fase");
        await recordFaseChangeIfNeeded({
          organizationId: tenant.organizationId,
          propriedadeId: atual.propriedadeId,
          culturaId: input.id,
          faseAnterior: atual.faseAtual,
          faseNova: input.data.faseAtual,
          userId: tenant.userId,
          origem: "manual",
        });
      }
      return { success: true };
    }),

  /** Histórico fenológico (Cultivos V2 Etapa 1) */
  faseEventos: organizationProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      requireOrgPermission(tenant, "property.read");
      await requireCulturaInTenant(tenant, input.id);
      const { listCultivoFaseEventos } = await import("../db-cultivo-fase");
      return listCultivoFaseEventos(tenant.organizationId, input.id, {
        order: "asc",
      });
    }),

  /** Dashboard operacional (Cultivos V2 Etapa 3) */
  dashboard: organizationProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      requireOrgPermission(tenant, "property.read");
      const cultura = await requireCulturaInTenant(tenant, input.id);
      const { buildCultivoDashboard } = await import("../db-cultivo-dashboard");
      return buildCultivoDashboard(tenant.organizationId, cultura);
    }),

  /** Timeline unificada (Cultivos V2 Etapa 4) */
  timeline: organizationProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      requireOrgPermission(tenant, "property.read");
      const cultura = await requireCulturaInTenant(tenant, input.id);
      const { buildCultivoTimeline } = await import("../db-cultivo-timeline");
      return buildCultivoTimeline(tenant.organizationId, cultura);
    }),

  /** Monitoramento do cultivo (Cultivos V2 Etapa 5) */
  monitoramento: organizationProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      requireOrgPermission(tenant, "property.read");
      const cultura = await requireCulturaInTenant(tenant, input.id);
      const { listOcorrencias } = await import("../db-propriedade-expansao");
      const all = await listOcorrencias(cultura.propriedadeId);
      const ocorrencias = all.filter((o) => o.culturaId === cultura.id);
      return {
        culturaId: cultura.id,
        propriedadeId: cultura.propriedadeId,
        terrenoId: cultura.terrenoId,
        safraId: cultura.safraId,
        ocorrencias,
        abertas: ocorrencias.filter(
          (o) => o.status === "aberta" || o.status === "em_acompanhamento",
        ).length,
      };
    }),

  /** Diagnósticos do cultivo (Cultivos V2 Etapa 5) */
  diagnosticos: organizationProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      requireOrgPermission(tenant, "property.read");
      const cultura = await requireCulturaInTenant(tenant, input.id);
      const { getDb } = await import("../db");
      const { diagnosticosIa } = await import("../../drizzle/schema");
      const { and, desc, eq } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(diagnosticosIa)
        .where(
          and(
            eq(diagnosticosIa.organizationId, tenant.organizationId),
            eq(diagnosticosIa.culturaId, cultura.id),
          ),
        )
        .orderBy(desc(diagnosticosIa.dataDiagnostico));
    }),

  /** Mapa do cultivo (Cultivos V2 Etapa 6) */
  mapa: organizationProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      requireOrgPermission(tenant, "property.read");
      const cultura = await requireCulturaInTenant(tenant, input.id);
      const { buildCultivoMapa } = await import("../db-cultivo-mapa");
      return buildCultivoMapa(tenant.organizationId, cultura);
    }),

  /** Resumo IA heurístico (Cultivos V2 Etapa 7) */
  iaResumo: organizationProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      requireOrgPermission(tenant, "property.read");
      const cultura = await requireCulturaInTenant(tenant, input.id);
      const { buildCultivoIaResumo } = await import("../db-cultivo-ia");
      return buildCultivoIaResumo(tenant.organizationId, cultura);
    }),

  /** Indicadores financeiros do cultivo (Cultivos V2 Etapa 9) */
  indicadores: organizationProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      requireOrgPermission(tenant, "finance.read");
      const cultura = await requireCulturaInTenant(tenant, input.id);
      const { buildCultivoIndicadores } = await import("../db-cultivo-indicadores");
      return buildCultivoIndicadores({
        organizationId: tenant.organizationId,
        cultura,
      });
    }),

  delete: orgPermissionProcedure("property.write")
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      await requireCulturaInTenant(tenant, input.id);
      await deleteCultura(input.id, tenant.organizationId);
      return { success: true };
    }),

  stats: organizationProcedure
    .input(tenantCacheScopeSchema.optional())
    .query(async ({ ctx }) => {
      const tenant = getCtxTenant(ctx);
      requireOrgPermission(tenant, "property.read");
      const lista = await listCulturasInTenant(tenant.organizationId);
      return {
        total: lista.length,
        ativos: lista.filter((c) => c.status === "em_andamento").length,
        planejados: lista.filter((c) => c.status === "planejado").length,
        colhidos: lista.filter((c) => c.status === "colhido").length,
        perdidos: lista.filter((c) => c.status === "perdido").length,
      };
    }),
});

// ─── Router de Calendário ─────────────────────────────────────────────────────
const calendarioRouter = router({
  list: organizationProcedure
    .input(
      z
        .object({
          status: z.enum(["pendente", "em_andamento", "concluido", "cancelado"]).optional(),
          prioridade: z.enum(["baixa", "normal", "alta", "critica"]).optional(),
          culturaId: z.number().int().positive().optional(),
          propriedadeId: z.number().int().positive().optional(),
          cacheScope: z.number().int().positive().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      requireOrgPermission(tenant, "operations.read");
      if (input?.propriedadeId) {
        await requirePropertyInTenant(tenant, input.propriedadeId);
      }
      if (input?.culturaId) {
        await requireCulturaInTenant(tenant, input.culturaId, input.propriedadeId);
      }
      const db = await getDb();
      if (!db) return [];
      const eventos = await db
        .select()
        .from(calendarioCuidados)
        .where(eq(calendarioCuidados.organizationId, tenant.organizationId))
        .orderBy(calendarioCuidados.dataProgramada);
      let filtrados = eventos;
      if (input?.status) filtrados = filtrados.filter((e) => e.status === input.status);
      if (input?.prioridade) filtrados = filtrados.filter((e) => e.prioridade === input.prioridade);
      if (input?.culturaId) filtrados = filtrados.filter((e) => e.culturaId === input.culturaId);
      if (input?.propriedadeId) {
        filtrados = filtrados.filter((e) => e.propriedadeId === input.propriedadeId);
      }
      return filtrados;
    }),

  create: orgPermissionProcedure("operations.write")
    .input(eventoInput)
    .mutation(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      await assertRelatedIdsInTenant(tenant, {
        propriedadeId: input.propriedadeId,
        culturaId: input.culturaId,
      });
      const eventId = await createEvento({
        ...input,
        usuarioId: tenant.perfilId,
        organizationId: tenant.organizationId,
        dataProgramada: new Date(input.dataProgramada),
      } as any);

      if (input.lembreteAtivo) {
        const dataLabel = new Date(input.dataProgramada).toLocaleDateString("pt-BR");
        void sendPushToUsuario(tenant.perfilId, {
          title: "Evento no calendário",
          body: `${input.titulo} — ${dataLabel}. Lembrete local também foi agendado.`,
          data: { type: "calendario", eventId: String(eventId) },
          priority: input.prioridade === "critica" || input.prioridade === "alta" ? "high" : "default",
        });
      }

      return eventId;
    }),

  update: orgPermissionProcedure("operations.write")
    .input(z.object({ id: z.number().int().positive(), data: eventoInput.partial() }))
    .mutation(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      await requireEventoInTenant(tenant, input.id);
      await assertRelatedIdsInTenant(tenant, {
        propriedadeId: input.data.propriedadeId,
        culturaId: input.data.culturaId,
      });
      return updateEvento(
        input.id,
        {
          ...input.data,
          dataProgramada: input.data.dataProgramada ? new Date(input.data.dataProgramada) : undefined,
        } as any,
        tenant.organizationId,
      );
    }),

  delete: orgPermissionProcedure("operations.write")
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      await requireEventoInTenant(tenant, input.id);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db
        .delete(calendarioCuidados)
        .where(
          and(
            eq(calendarioCuidados.id, input.id),
            eq(calendarioCuidados.organizationId, tenant.organizationId),
          ),
        );
      return { success: true };
    }),

  stats: organizationProcedure
    .input(tenantCacheScopeSchema.optional())
    .query(async ({ ctx }) => {
      const tenant = getCtxTenant(ctx);
      requireOrgPermission(tenant, "operations.read");
      const db = await getDb();
      if (!db) return { total: 0, pendentes: 0, criticos: 0 };
      const eventos = await db
        .select()
        .from(calendarioCuidados)
        .where(eq(calendarioCuidados.organizationId, tenant.organizationId));
      return {
        total: eventos.length,
        pendentes: eventos.filter((e) => e.status === "pendente").length,
        emAndamento: eventos.filter((e) => e.status === "em_andamento").length,
        concluidos: eventos.filter((e) => e.status === "concluido").length,
        criticos: eventos.filter((e) => e.prioridade === "critica" && e.status === "pendente").length,
      };
    }),
});

/** Etapa 7 — KPIs do dashboard sempre filtrados pela org ativa */
const dashboardRouter = router({
  stats: organizationProcedure
    .input(tenantCacheScopeSchema.optional())
    .query(async ({ ctx }) => {
      const tenant = getCtxTenant(ctx);
      requireOrgPermission(tenant, "property.read");
      return createTenantDb(tenant.organizationId).dashboardStats(tenant.perfilId);
    }),
});

export const coreDataRouter = router({
  propriedades: propriedadesRouter,
  terrenos: terrenosRouter,
  cultivos: cultivosRouter,
  calendario: calendarioRouter,
  tarefas: tarefasRouter,
  dashboard: dashboardRouter,
  /** Etapas 4–10: alertas, geometria, ocorrências, estoque, custos, métricas */
  expansao: propriedadeExpansaoRouter,
});
