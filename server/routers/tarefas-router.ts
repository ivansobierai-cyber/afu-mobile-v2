/**
 * tarefas-router.ts — Etapa 3: tarefas operacionais + apontamentos
 * Etapa 4: escopo por organização ativa + propriedade no tenant.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, organizationProcedure, orgPermissionProcedure } from "../_core/trpc";
import {
  getTarefasByPropriedade,
  createTarefa,
  updateTarefa,
  createApontamento,
  getApontamentosByTarefa,
} from "../db";
import { findTarefaByClientMutationId } from "../db-propriedade-expansao";
import {
  getCtxTenant,
  requireOrgPermission,
  requirePropertyInTenant,
  requireTarefaInTenant,
  assertRelatedIdsInTenant,
} from "../tenant-access";
import {
  assertTransition,
  STATUS_ABERTOS,
  type TarefaStatus,
} from "../../lib/propriedades/tarefa-status";

const tipoOperacaoSchema = z.enum([
  "plantio",
  "irrigacao",
  "adubacao",
  "pulverizacao",
  "monitoramento",
  "colheita",
  "analise",
  "manutencao",
  "vistoria",
  "outro",
]);

const statusSchema = z.enum([
  "planejada",
  "liberada",
  "em_execucao",
  "pausada",
  "concluida",
  "aprovada",
  "cancelada",
  "bloqueada",
]);

const prioridadeSchema = z.enum(["baixa", "normal", "alta", "critica"]);

const tarefaInput = z.object({
  propriedadeId: z.number().int().positive(),
  terrenoId: z.number().int().positive().optional(),
  culturaId: z.number().int().positive().optional(),
  tipoOperacao: tipoOperacaoSchema,
  titulo: z.string().min(1).max(200),
  instrucoes: z.string().optional(),
  prioridade: prioridadeSchema.optional(),
  dataPrevista: z.string(),
  areaPlanejada: z.number().positive().optional(),
  clientMutationId: z.string().min(8).max(64).optional(),
});

export const tarefasRouter = router({
  listByPropriedade: organizationProcedure
    .input(
      z.object({
        propriedadeId: z.number().int().positive(),
        status: statusSchema.optional(),
        abertasOnly: z.boolean().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      requireOrgPermission(tenant, "operations.read");
      await requirePropertyInTenant(tenant, input.propriedadeId);
      let lista = await getTarefasByPropriedade(input.propriedadeId);
      if (input.status) lista = lista.filter((t) => t.status === input.status);
      if (input.abertasOnly) {
        lista = lista.filter((t) => STATUS_ABERTOS.includes(t.status as TarefaStatus));
      }
      return lista;
    }),

  resumoHoje: organizationProcedure
    .input(z.object({ propriedadeId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      requireOrgPermission(tenant, "operations.read");
      await requirePropertyInTenant(tenant, input.propriedadeId);
      const lista = await getTarefasByPropriedade(input.propriedadeId);
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);

      const abertas = lista.filter((t) => STATUS_ABERTOS.includes(t.status as TarefaStatus));
      const hoje = abertas.filter((t) => {
        const d = new Date(t.dataPrevista);
        return d >= start && d <= end;
      });
      const atrasadas = abertas.filter((t) => new Date(t.dataPrevista) < start);
      const emExecucao = lista.filter((t) => t.status === "em_execucao" || t.status === "pausada");
      const criticas = abertas.filter((t) => t.prioridade === "critica" || t.prioridade === "alta");

      return {
        hoje: hoje.length,
        atrasadas: atrasadas.length,
        emExecucao: emExecucao.length,
        abertas: abertas.length,
        criticas: criticas.length,
        itensHoje: hoje.slice(0, 8),
        itensAtrasados: atrasadas.slice(0, 8),
      };
    }),

  get: organizationProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      requireOrgPermission(tenant, "operations.read");
      const tarefa = await requireTarefaInTenant(tenant, input.id);
      const apontamentos = await getApontamentosByTarefa(tarefa.id);
      return { tarefa, apontamentos };
    }),

  create: orgPermissionProcedure("operations.write")
    .input(tarefaInput)
    .mutation(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      await assertRelatedIdsInTenant(tenant, {
        propriedadeId: input.propriedadeId,
        terrenoId: input.terrenoId,
        culturaId: input.culturaId,
      });
      if (input.clientMutationId) {
        const existing = await findTarefaByClientMutationId(input.clientMutationId);
        if (existing) {
          if (existing.organizationId !== tenant.organizationId) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Recurso não encontrado" });
          }
          return existing.id;
        }
      }
      return createTarefa({
        usuarioId: tenant.perfilId,
        organizationId: tenant.organizationId,
        propriedadeId: input.propriedadeId,
        terrenoId: input.terrenoId,
        culturaId: input.culturaId,
        tipoOperacao: input.tipoOperacao,
        titulo: input.titulo,
        instrucoes: input.instrucoes,
        prioridade: input.prioridade ?? "normal",
        status: "planejada",
        dataPrevista: new Date(input.dataPrevista),
        areaPlanejada: input.areaPlanejada?.toString(),
        origem: "manual",
        clientMutationId: input.clientMutationId,
      } as any);
    }),

  transition: orgPermissionProcedure("operations.write")
    .input(
      z.object({
        id: z.number().int().positive(),
        status: statusSchema,
        motivoCancelamento: z.string().optional(),
        notasApontamento: z.string().optional(),
        areaExecutada: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      const tarefa = await requireTarefaInTenant(tenant, input.id);
      const from = tarefa.status as TarefaStatus;
      const to = input.status as TarefaStatus;
      try {
        assertTransition(from, to);
      } catch (e: any) {
        throw new TRPCError({ code: "BAD_REQUEST", message: e.message });
      }
      if (to === "cancelada" && !input.motivoCancelamento?.trim()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Informe o motivo do cancelamento" });
      }

      if (to === "em_execucao" && from !== "pausada") {
        await createApontamento({
          tarefaId: tarefa.id,
          usuarioId: tenant.perfilId,
          inicioReal: new Date(),
          notas: input.notasApontamento,
          areaExecutada: input.areaExecutada?.toString(),
          resultado: "ok",
        } as any);
      }
      if (to === "concluida") {
        await createApontamento({
          tarefaId: tarefa.id,
          usuarioId: tenant.perfilId,
          inicioReal: new Date(),
          fimReal: new Date(),
          notas: input.notasApontamento ?? "Conclusão registrada",
          areaExecutada: input.areaExecutada?.toString(),
          resultado: "ok",
        } as any);
      }

      await updateTarefa(
        tarefa.id,
        {
          status: to,
          motivoCancelamento: to === "cancelada" ? input.motivoCancelamento : tarefa.motivoCancelamento,
        } as any,
        tenant.organizationId,
      );
      return { success: true, id: tarefa.id, status: to };
    }),

  apontamentos: organizationProcedure
    .input(z.object({ tarefaId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      requireOrgPermission(tenant, "operations.read");
      await requireTarefaInTenant(tenant, input.tarefaId);
      return getApontamentosByTarefa(input.tarefaId);
    }),
});
