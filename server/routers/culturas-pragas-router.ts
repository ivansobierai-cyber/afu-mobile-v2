/**
 * culturas-pragas-router.ts — Culturas (tenant) e Pragas/Doenças (catálogo compartilhado)
 *
 * Etapa 4: list/get de culturas filtrados por organizationId.
 * Pragas/doenças são referência compartilhada (não dados de cliente).
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, adminProcedure, organizationProcedure } from "../_core/trpc";
import {
  listarCulturasAdmin,
  getCulturaById,
  adminCreateCultura,
  adminUpdateCultura,
  adminDeleteCultura,
  getEstatisticasCulturas,
  listarPragasAdmin,
  getPragaById,
  adminCreatePraga,
  adminUpdatePraga,
  adminDeletePraga,
  getEstatisticasPragas,
} from "../db-culturas-pragas";
import {
  getCtxTenant,
  requireOrgPermission,
  requireCulturaInTenant,
  assertRelatedIdsInTenant,
  TENANT_NOT_FOUND,
} from "../tenant-access";

const statusCulturaSchema = z.enum(["planejado", "em_andamento", "colhido", "perdido"]);
const tipoPragaSchema = z.enum(["praga", "doenca", "deficiencia"]);
const nivelRiscoSchema = z.enum(["baixo", "medio", "alto", "critico"]);

const culturaFiltrosSchema = z.object({
  busca: z.string().optional(),
  status: statusCulturaSchema.optional(),
  propriedadeId: z.number().int().optional(),
  limit: z.number().int().min(1).max(200).default(50),
  offset: z.number().int().min(0).default(0),
});

const culturaCreateSchema = z.object({
  propriedadeId: z.number().int().min(1),
  terrenoId: z.number().int().optional().nullable(),
  nomeCultura: z.string().min(1).max(100),
  variedade: z.string().max(100).optional().nullable(),
  dataPlantio: z.string().optional().nullable(),
  faseAtual: z.string().max(100).optional().nullable(),
  areaPlantada: z.string().optional().nullable(),
  previsaoColheita: z.string().optional().nullable(),
  producaoEstimada: z.string().optional().nullable(),
  unidadeProducao: z.string().max(30).optional().nullable(),
  status: statusCulturaSchema.default("em_andamento"),
  observacoes: z.string().optional().nullable(),
});

const culturaUpdateSchema = culturaCreateSchema.partial().extend({
  id: z.number().int().min(1),
});

const pragaFiltrosSchema = z.object({
  busca: z.string().optional(),
  tipo: tipoPragaSchema.optional(),
  nivelRisco: nivelRiscoSchema.optional(),
  culturaAfetada: z.string().optional(),
  limit: z.number().int().min(1).max(200).default(50),
  offset: z.number().int().min(0).default(0),
});

const pragaCreateSchema = z.object({
  nome: z.string().min(1).max(150),
  nomeCientifico: z.string().max(200).optional().nullable(),
  tipo: tipoPragaSchema,
  culturaAfetada: z.string().max(200).optional().nullable(),
  sintomas: z.string().optional().nullable(),
  causas: z.string().optional().nullable(),
  tratamento: z.string().optional().nullable(),
  prevencao: z.string().optional().nullable(),
  imagensReferencia: z.string().optional().nullable(),
  nivelRisco: nivelRiscoSchema.default("medio"),
});

const pragaUpdateSchema = pragaCreateSchema.partial().extend({
  id: z.number().int().min(1),
});

const culturasRouter = router({
  /** Escopo da organização ativa — não lista cultivos de outros tenants */
  list: organizationProcedure
    .input(culturaFiltrosSchema)
    .query(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      requireOrgPermission(tenant, "property.read");
      if (input.propriedadeId) {
        await assertRelatedIdsInTenant(tenant, { propriedadeId: input.propriedadeId });
      }
      return listarCulturasAdmin({
        ...input,
        organizationId: tenant.organizationId,
      });
    }),

  get: organizationProcedure
    .input(z.object({ id: z.number().int().min(1) }))
    .query(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      requireOrgPermission(tenant, "property.read");
      return requireCulturaInTenant(tenant, input.id);
    }),

  create: adminProcedure
    .input(culturaCreateSchema)
    .mutation(async ({ input }) => {
      return adminCreateCultura(input);
    }),

  update: adminProcedure
    .input(culturaUpdateSchema)
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const exists = await getCulturaById(id);
      if (!exists) throw new TRPCError({ code: "NOT_FOUND", message: TENANT_NOT_FOUND });
      return adminUpdateCultura(id, data);
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number().int().min(1) }))
    .mutation(async ({ input }) => {
      const exists = await getCulturaById(input.id);
      if (!exists) throw new TRPCError({ code: "NOT_FOUND", message: TENANT_NOT_FOUND });
      return adminDeleteCultura(input.id);
    }),

  stats: adminProcedure.query(async () => {
    return getEstatisticasCulturas();
  }),
});

const pragasRouter = router({
  // Catálogo compartilhado de referência (não é dado de cliente)
  list: protectedProcedure
    .input(pragaFiltrosSchema)
    .query(async ({ input }) => {
      return listarPragasAdmin(input);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number().int().min(1) }))
    .query(async ({ input }) => {
      const praga = await getPragaById(input.id);
      if (!praga) throw new TRPCError({ code: "NOT_FOUND", message: "Praga/Doença não encontrada" });
      return praga;
    }),

  create: adminProcedure
    .input(pragaCreateSchema)
    .mutation(async ({ input }) => {
      return adminCreatePraga(input);
    }),

  update: adminProcedure
    .input(pragaUpdateSchema)
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const exists = await getPragaById(id);
      if (!exists) throw new TRPCError({ code: "NOT_FOUND", message: "Praga/Doença não encontrada" });
      return adminUpdatePraga(id, data);
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number().int().min(1) }))
    .mutation(async ({ input }) => {
      const exists = await getPragaById(input.id);
      if (!exists) throw new TRPCError({ code: "NOT_FOUND", message: "Praga/Doença não encontrada" });
      return adminDeletePraga(input.id);
    }),

  stats: adminProcedure.query(async () => {
    return getEstatisticasPragas();
  }),
});

export const culturasPragasRouter = router({
  culturas: culturasRouter,
  pragas: pragasRouter,
});
