/**
 * tarefas-router.ts — Etapa 3: tarefas operacionais + apontamentos
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import {
  getUsuarioAfuByUserId,
  getTarefasByPropriedade,
  getTarefaById,
  createTarefa,
  updateTarefa,
  createApontamento,
  getApontamentosByTarefa,
  propriedadeBelongsToProdutor,
  getDb,
} from "../db";
import { findTarefaByClientMutationId } from "../db-propriedade-expansao";
import { produtores } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
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

async function getProdutorId(usuarioAfuId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
  const rows = await db
    .select({ id: produtores.id })
    .from(produtores)
    .where(eq(produtores.usuarioId, usuarioAfuId))
    .limit(1);
  if (rows.length === 0) {
    const result = await db.insert(produtores).values({ usuarioId: usuarioAfuId });
    return (result as any)[0].insertId as number;
  }
  return rows[0].id;
}

async function assertOwnsPropriedade(userId: number, propriedadeId: number) {
  const perfil = await getUsuarioAfuByUserId(userId);
  if (!perfil) throw new TRPCError({ code: "UNAUTHORIZED", message: "Perfil AFU não encontrado" });
  const produtorId = await getProdutorId(perfil.id);
  const owned = await propriedadeBelongsToProdutor(propriedadeId, produtorId);
  if (!owned) throw new TRPCError({ code: "FORBIDDEN", message: "Propriedade não pertence ao usuário" });
  return perfil;
}

async function assertOwnsTarefa(userId: number, tarefaId: number) {
  const tarefa = await getTarefaById(tarefaId);
  if (!tarefa) throw new TRPCError({ code: "NOT_FOUND", message: "Tarefa não encontrada" });
  await assertOwnsPropriedade(userId, tarefa.propriedadeId);
  return tarefa;
}

const tarefaInput = z.object({
  propriedadeId: z.number().int().positive(),
  terrenoId: z.number().int().positive().optional(),
  culturaId: z.number().int().positive().optional(),
  tipoOperacao: tipoOperacaoSchema,
  titulo: z.string().min(1).max(200),
  instrucoes: z.string().optional(),
  prioridade: prioridadeSchema.optional(),
  dataPrevista: z.string(), // ISO
  areaPlanejada: z.number().positive().optional(),
  /** Etapa 9 — idempotência offline */
  clientMutationId: z.string().min(8).max(64).optional(),
});

export const tarefasRouter = router({
  listByPropriedade: protectedProcedure
    .input(
      z.object({
        propriedadeId: z.number().int().positive(),
        status: statusSchema.optional(),
        abertasOnly: z.boolean().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await assertOwnsPropriedade(ctx.user.id, input.propriedadeId);
      let lista = await getTarefasByPropriedade(input.propriedadeId);
      if (input.status) lista = lista.filter((t) => t.status === input.status);
      if (input.abertasOnly) {
        lista = lista.filter((t) => STATUS_ABERTOS.includes(t.status as TarefaStatus));
      }
      return lista;
    }),

  /** Resumo para “Hoje na fazenda” / Atenção necessária */
  resumoHoje: protectedProcedure
    .input(z.object({ propriedadeId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      await assertOwnsPropriedade(ctx.user.id, input.propriedadeId);
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

  get: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const tarefa = await assertOwnsTarefa(ctx.user.id, input.id);
      const apontamentos = await getApontamentosByTarefa(tarefa.id);
      return { tarefa, apontamentos };
    }),

  create: protectedProcedure
    .input(tarefaInput)
    .mutation(async ({ ctx, input }) => {
      const perfil = await assertOwnsPropriedade(ctx.user.id, input.propriedadeId);
      if (input.clientMutationId) {
        const existing = await findTarefaByClientMutationId(input.clientMutationId);
        if (existing) return existing.id;
      }
      return createTarefa({
        usuarioId: perfil.id,
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

  transition: protectedProcedure
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
      const perfil = await getUsuarioAfuByUserId(ctx.user.id);
      if (!perfil) throw new TRPCError({ code: "UNAUTHORIZED", message: "Perfil AFU não encontrado" });
      const tarefa = await assertOwnsTarefa(ctx.user.id, input.id);
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

      // Apontamento automático ao iniciar / concluir
      if (to === "em_execucao" && from !== "pausada") {
        await createApontamento({
          tarefaId: tarefa.id,
          usuarioId: perfil.id,
          inicioReal: new Date(),
          notas: input.notasApontamento,
          areaExecutada: input.areaExecutada?.toString(),
          resultado: "ok",
        } as any);
      }
      if (to === "concluida") {
        await createApontamento({
          tarefaId: tarefa.id,
          usuarioId: perfil.id,
          inicioReal: new Date(),
          fimReal: new Date(),
          notas: input.notasApontamento ?? "Conclusão registrada",
          areaExecutada: input.areaExecutada?.toString(),
          resultado: "ok",
        } as any);
      }

      await updateTarefa(tarefa.id, {
        status: to,
        motivoCancelamento: to === "cancelada" ? input.motivoCancelamento : tarefa.motivoCancelamento,
      } as any);
      return { success: true, id: tarefa.id, status: to };
    }),

  apontamentos: protectedProcedure
    .input(z.object({ tarefaId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      await assertOwnsTarefa(ctx.user.id, input.tarefaId);
      return getApontamentosByTarefa(input.tarefaId);
    }),
});
