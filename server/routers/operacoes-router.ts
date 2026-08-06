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
import { TIPO_OPERACAO_AGRICOLA } from "../../lib/operacoes";

const tipoOperacaoSchema = z.enum(TIPO_OPERACAO_AGRICOLA);

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
});
