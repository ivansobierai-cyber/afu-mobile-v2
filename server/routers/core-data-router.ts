/**
 * core-data-router.ts — Router tRPC para dados centrais do AFU
 * Cobre: Propriedades, Terrenos, Cultivos (culturas), Calendário de Cuidados
 * Etapa 4: organizationProcedure + validação de propriedade/relações no tenant.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq, desc } from "drizzle-orm";
import { router, organizationProcedure, orgPermissionProcedure } from "../_core/trpc";
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

const cultivoInput = z.object({
  propriedadeId: z.number().int().positive(),
  terrenoId: z.number().int().positive().optional(),
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
  list: organizationProcedure.query(async ({ ctx }) => {
    const tenant = getCtxTenant(ctx);
    requireOrgPermission(tenant, "property.read");
    return listPropriedadesInTenant(tenant);
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

  delete: orgPermissionProcedure("property.write")
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      await requirePropertyInTenant(tenant, input.id);
      await deletePropriedade(input.id, tenant.organizationId);
      return { success: true };
    }),

  stats: organizationProcedure.query(async ({ ctx }) => {
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
  list: organizationProcedure.query(async ({ ctx }) => {
    const tenant = getCtxTenant(ctx);
    requireOrgPermission(tenant, "property.read");
    return listCulturasInTenant(tenant.organizationId);
  }),

  listByPropriedade: organizationProcedure
    .input(z.object({ propriedadeId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      requireOrgPermission(tenant, "property.read");
      await requirePropertyInTenant(tenant, input.propriedadeId);
      return getCulturasByPropriedade(input.propriedadeId);
    }),

  create: orgPermissionProcedure("property.write")
    .input(cultivoInput)
    .mutation(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      await assertRelatedIdsInTenant(tenant, {
        propriedadeId: input.propriedadeId,
        terrenoId: input.terrenoId,
      });
      return createCultura({
        ...input,
        organizationId: tenant.organizationId,
        areaPlantada: input.areaPlantada?.toString(),
        producaoEstimada: input.producaoEstimada?.toString(),
      } as any);
    }),

  update: orgPermissionProcedure("property.write")
    .input(z.object({ id: z.number().int().positive(), data: cultivoInput.partial() }))
    .mutation(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      const atual = await requireCulturaInTenant(tenant, input.id);
      await assertRelatedIdsInTenant(tenant, {
        propriedadeId: input.data.propriedadeId ?? atual.propriedadeId,
        terrenoId: input.data.terrenoId,
      });
      return updateCultura(
        input.id,
        {
          ...input.data,
          areaPlantada: input.data.areaPlantada?.toString(),
          producaoEstimada: input.data.producaoEstimada?.toString(),
        } as any,
        tenant.organizationId,
      );
    }),

  delete: orgPermissionProcedure("property.write")
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      await requireCulturaInTenant(tenant, input.id);
      await deleteCultura(input.id, tenant.organizationId);
      return { success: true };
    }),

  stats: organizationProcedure.query(async ({ ctx }) => {
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
      z.object({
        status: z.enum(["pendente", "em_andamento", "concluido", "cancelado"]).optional(),
        prioridade: z.enum(["baixa", "normal", "alta", "critica"]).optional(),
        culturaId: z.number().int().positive().optional(),
        propriedadeId: z.number().int().positive().optional(),
      }).optional(),
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

  stats: organizationProcedure.query(async ({ ctx }) => {
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

export const coreDataRouter = router({
  propriedades: propriedadesRouter,
  terrenos: terrenosRouter,
  cultivos: cultivosRouter,
  calendario: calendarioRouter,
  tarefas: tarefasRouter,
  /** Etapas 4–10: alertas, geometria, ocorrências, estoque, custos, métricas */
  expansao: propriedadeExpansaoRouter,
});
