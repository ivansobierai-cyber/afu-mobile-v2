/**
 * FASE 2E — API mínima de operações agrícolas (sem UX).
 */
import { z } from "zod";
import { router, organizationProcedure, orgPermissionProcedure } from "../_core/trpc";
import {
  getCtxTenant,
  requireOrgPermission,
  requirePropertyInTenant,
  requireOperacaoInTenant,
} from "../tenant-access";
import {
  createOperacaoAgricola,
  listOperacoesByPropriedade,
  promoteFromEvento,
} from "../db-operacoes";
import {
  listOperacaoStatusHistorico,
  transitionOperacaoAgricolaStatus,
} from "../db-operacoes-transition";
import { TIPO_OPERACAO_AGRICOLA, OPERACAO_AGRICOLA_STATUS } from "../../lib/operacoes";

const tipoOperacaoSchema = z.enum(TIPO_OPERACAO_AGRICOLA);
const operacaoStatusSchema = z.enum(OPERACAO_AGRICOLA_STATUS);

const createInput = z.object({
  propriedadeId: z.number().int().positive(),
  safraId: z.number().int().positive().optional(),
  terrenoId: z.number().int().positive().optional(),
  culturaId: z.number().int().positive().optional(),
  tarefaId: z.number().int().positive().optional(),
  tipoOperacao: tipoOperacaoSchema,
  titulo: z.string().min(1).max(200),
  descricao: z.string().max(4000).optional(),
  dataPrevista: z.string(),
});

export const operacoesRouter = router({
  get: organizationProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      requireOrgPermission(tenant, "operations.read");
      return requireOperacaoInTenant(tenant, input.id);
    }),

  listByPropriedade: organizationProcedure
    .input(z.object({ propriedadeId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      requireOrgPermission(tenant, "operations.read");
      await requirePropertyInTenant(tenant, input.propriedadeId);
      return listOperacoesByPropriedade(tenant.organizationId, input.propriedadeId);
    }),

  create: orgPermissionProcedure("operations.write")
    .input(createInput)
    .mutation(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      const id = await createOperacaoAgricola(tenant, {
        ...input,
        dataPrevista: new Date(input.dataPrevista),
        origem: "manual",
      });
      return id;
    }),

  promoteFromEvento: orgPermissionProcedure("operations.write")
    .input(z.object({ eventoId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      return promoteFromEvento(tenant, input.eventoId);
    }),

  listStatusHistorico: organizationProcedure
    .input(z.object({ operacaoId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      requireOrgPermission(tenant, "operations.read");
      return listOperacaoStatusHistorico(tenant, input.operacaoId);
    }),

  transitionStatus: orgPermissionProcedure("operations.write")
    .input(
      z.object({
        operacaoId: z.number().int().positive(),
        toStatus: operacaoStatusSchema,
        motivo: z.string().max(2000).optional(),
        expectedStatus: operacaoStatusSchema.optional(),
        expectedRevision: z.number().int().min(0).optional(),
        clientMutationId: z.string().min(8).max(64).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      return transitionOperacaoAgricolaStatus(tenant, input);
    }),
});
