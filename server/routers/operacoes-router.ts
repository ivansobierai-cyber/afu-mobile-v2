/**
 * FASE 2E/2G/2H — API de operações agrícolas + apontamento real.
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
import {
  addApontamentoEvidencia,
  createApontamento,
  getApontamentoById,
  getPlanejadoRealizadoResumo,
  listApontamentosByOperacao,
  updateApontamento,
} from "../db-operacoes-apontamentos";
import {
  TIPO_OPERACAO_AGRICOLA,
  OPERACAO_AGRICOLA_STATUS,
  APONTAMENTO_RESULTADO,
} from "../../lib/operacoes";

const tipoOperacaoSchema = z.enum(TIPO_OPERACAO_AGRICOLA);
const operacaoStatusSchema = z.enum(OPERACAO_AGRICOLA_STATUS);
const resultadoSchema = z.enum(APONTAMENTO_RESULTADO);

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

const insumoInput = z.object({
  estoqueItemId: z.number().int().positive().nullable().optional(),
  descricao: z.string().max(200).nullable().optional(),
  quantidade: z.number().positive(),
  unidade: z.string().min(1).max(30),
});

const evidenciaInput = z.object({
  nome: z.string().min(1).max(200),
  contentType: z.string().max(120).nullable().optional(),
  url: z.string().max(4000).nullable().optional(),
  privateFileId: z.number().int().positive().nullable().optional(),
});

const createApontamentoInput = z.object({
  operacaoId: z.number().int().positive(),
  inicioReal: z.string().min(1),
  fimReal: z.string().nullable().optional(),
  areaExecutada: z.number().min(0).nullable().optional(),
  areaUnidade: z.string().max(16).nullable().optional(),
  operadorUserId: z.number().int().positive().nullable().optional(),
  equipeTexto: z.string().max(200).nullable().optional(),
  maquinaOperacionalId: z.number().int().positive().nullable().optional(),
  implementoTexto: z.string().max(200).nullable().optional(),
  condicoesObservadas: z.string().max(4000).nullable().optional(),
  problemasPausas: z.string().max(4000).nullable().optional(),
  resultadoImediato: resultadoSchema.nullable().optional(),
  observacoes: z.string().max(4000).nullable().optional(),
  insumos: z.array(insumoInput).max(50).optional(),
  evidencias: z.array(evidenciaInput).max(20).optional(),
  clientMutationId: z.string().min(8).max(64).optional(),
});

const updateApontamentoInput = z.object({
  apontamentoId: z.number().int().positive(),
  expectedRevision: z.number().int().min(0),
  inicioReal: z.string().min(1).optional(),
  fimReal: z.string().nullable().optional(),
  areaExecutada: z.number().min(0).nullable().optional(),
  areaUnidade: z.string().max(16).nullable().optional(),
  operadorUserId: z.number().int().positive().nullable().optional(),
  equipeTexto: z.string().max(200).nullable().optional(),
  maquinaOperacionalId: z.number().int().positive().nullable().optional(),
  implementoTexto: z.string().max(200).nullable().optional(),
  condicoesObservadas: z.string().max(4000).nullable().optional(),
  problemasPausas: z.string().max(4000).nullable().optional(),
  resultadoImediato: resultadoSchema.nullable().optional(),
  observacoes: z.string().max(4000).nullable().optional(),
  insumos: z.array(insumoInput).max(50).optional(),
  clientMutationId: z.string().min(8).max(64).optional(),
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

  // ─── FASE 2H — apontamentos ─────────────────────────────────────────────

  listApontamentos: organizationProcedure
    .input(z.object({ operacaoId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      return listApontamentosByOperacao(tenant, input.operacaoId);
    }),

  getApontamento: organizationProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      return getApontamentoById(tenant, input.id);
    }),

  createApontamento: orgPermissionProcedure("operations.write")
    .input(createApontamentoInput)
    .mutation(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      return createApontamento(tenant, {
        ...input,
        inicioReal: new Date(input.inicioReal),
        fimReal: input.fimReal ? new Date(input.fimReal) : null,
      });
    }),

  updateApontamento: orgPermissionProcedure("operations.write")
    .input(updateApontamentoInput)
    .mutation(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      return updateApontamento(tenant, {
        ...input,
        inicioReal: input.inicioReal ? new Date(input.inicioReal) : undefined,
        fimReal:
          input.fimReal === undefined
            ? undefined
            : input.fimReal
              ? new Date(input.fimReal)
              : null,
      });
    }),

  addApontamentoEvidencia: orgPermissionProcedure("operations.write")
    .input(
      z.object({
        apontamentoId: z.number().int().positive(),
        nome: z.string().min(1).max(200),
        contentType: z.string().max(120).nullable().optional(),
        url: z.string().max(4000).nullable().optional(),
        privateFileId: z.number().int().positive().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      const id = await addApontamentoEvidencia(tenant, input);
      return { id };
    }),

  planejadoRealizado: organizationProcedure
    .input(z.object({ operacaoId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      return getPlanejadoRealizadoResumo(tenant, input.operacaoId);
    }),
});
