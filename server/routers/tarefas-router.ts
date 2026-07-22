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
import {
  findConsumoEstoqueByTarefaItem,
  findTarefaByClientMutationId,
  listEstoque,
  registrarMovimentoEstoque,
} from "../db-propriedade-expansao";
import {
  getCtxTenant,
  requireOrgPermission,
  requirePropertyInTenant,
  requireTarefaInTenant,
  assertRelatedIdsInTenant,
  type TenantContext,
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
  safraId: z.number().int().positive().optional(),
  terrenoId: z.number().int().positive().optional(),
  culturaId: z.number().int().positive().optional(),
  responsavelUserId: z.number().int().positive().optional(),
  tipoOperacao: tipoOperacaoSchema,
  titulo: z.string().min(1).max(200),
  instrucoes: z.string().optional(),
  prioridade: prioridadeSchema.optional(),
  dataPrevista: z.string(),
  areaPlanejada: z.number().positive().optional(),
  clientMutationId: z.string().min(8).max(64).optional(),
});

const consumosInput = z
  .array(
    z.object({
      itemId: z.number().int().positive(),
      quantidade: z.number().positive(),
    }),
  )
  .max(20)
  .optional();

const tarefaBulkInput = tarefaInput.omit({ terrenoId: true }).extend({
  terrenoIds: z.array(z.number().int().positive()).min(1).max(50),
});

async function resolveSafraIdForCreate(
  tenant: TenantContext,
  input: { propriedadeId: number; safraId?: number },
) {
  if (input.safraId) {
    const { requireWritableSafraInProperty } = await import("../db-safras");
    await requireWritableSafraInProperty(
      tenant.organizationId,
      input.propriedadeId,
      input.safraId,
    );
    return input.safraId;
  }
  const { ensureDefaultSafra } = await import("../db-safras");
  return (
    await ensureDefaultSafra({
      organizationId: tenant.organizationId,
      propriedadeId: input.propriedadeId,
      createdByUserId: tenant.userId,
    })
  ).id;
}

async function createTarefaForTenant(
  tenant: TenantContext,
  input: z.infer<typeof tarefaInput>,
  options?: { terrenoId?: number; clientMutationId?: string },
) {
  const terrenoId = options?.terrenoId ?? input.terrenoId;
  await assertRelatedIdsInTenant(tenant, {
    propriedadeId: input.propriedadeId,
    terrenoId,
    culturaId: input.culturaId,
  });
  const safraId = await resolveSafraIdForCreate(tenant, input);
  const clientMutationId = options?.clientMutationId ?? input.clientMutationId;
  if (clientMutationId) {
    const existing = await findTarefaByClientMutationId(clientMutationId);
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
    safraId,
    terrenoId,
    culturaId: input.culturaId,
    responsavelUserId: input.responsavelUserId,
    tipoOperacao: input.tipoOperacao,
    titulo: input.titulo,
    instrucoes: input.instrucoes,
    prioridade: input.prioridade ?? "normal",
    status: "planejada",
    dataPrevista: new Date(input.dataPrevista),
    areaPlanejada: input.areaPlanejada?.toString(),
    origem: "manual",
    clientMutationId,
  } as any);
}

export const tarefasRouter = router({
  listByPropriedade: organizationProcedure
    .input(
      z.object({
        propriedadeId: z.number().int().positive(),
        status: statusSchema.optional(),
        abertasOnly: z.boolean().optional(),
        safraId: z.number().int().positive().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      requireOrgPermission(tenant, "operations.read");
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
      let lista = await getTarefasByPropriedade(input.propriedadeId);
      lista = filterRowsBySafraId(lista, input.safraId ?? null).matched;
      if (input.status) lista = lista.filter((t) => t.status === input.status);
      if (input.abertasOnly) {
        lista = lista.filter((t) => STATUS_ABERTOS.includes(t.status as TarefaStatus));
      }
      return lista;
    }),

  resumoHoje: organizationProcedure
    .input(
      z.object({
        propriedadeId: z.number().int().positive(),
        safraId: z.number().int().positive().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      requireOrgPermission(tenant, "operations.read");
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
      const lista = filterRowsBySafraId(
        await getTarefasByPropriedade(input.propriedadeId),
        input.safraId ?? null,
      ).matched;
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
      return createTarefaForTenant(tenant, input);
    }),

  createBulk: orgPermissionProcedure("operations.write")
    .input(tarefaBulkInput)
    .mutation(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      const ids: number[] = [];
      const { terrenoIds, ...baseInput } = input;
      for (const terrenoId of terrenoIds) {
        const clientMutationId = input.clientMutationId
          ? `${input.clientMutationId.slice(0, 48)}_${terrenoId}`
          : undefined;
        ids.push(
          await createTarefaForTenant(
            tenant,
            { ...baseInput, terrenoId },
            { terrenoId, clientMutationId },
          ),
        );
      }
      return ids;
    }),

  transition: orgPermissionProcedure("operations.write")
    .input(
      z.object({
        id: z.number().int().positive(),
        status: statusSchema,
        motivoCancelamento: z.string().optional(),
        notasApontamento: z.string().optional(),
        areaExecutada: z.number().optional(),
        /** Etapa 8 — status conhecido no cliente no momento do enqueue offline */
        expectedStatus: statusSchema.optional(),
        clientMutationId: z.string().min(8).max(64).optional(),
        deviceId: z.string().max(80).optional(),
        consumos: consumosInput,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      const tarefa = await requireTarefaInTenant(tenant, input.id);
      const { requireWritableSafraId, SAFRA_READ_ONLY } = await import("../db-safras");
      try {
        await requireWritableSafraId(
          tenant.organizationId,
          tarefa.propriedadeId,
          (tarefa as { safraId?: number | null }).safraId,
        );
      } catch (e) {
        if (e instanceof TRPCError && e.message.includes(SAFRA_READ_ONLY)) {
          const { recordServerSyncConflict } = await import("../sync-conflicts");
          await recordServerSyncConflict({
            organizationId: tenant.organizationId,
            actorUserId: tenant.userId,
            deviceId: input.deviceId,
            clientMutationId: input.clientMutationId,
            entity: "tarefa",
            action: "transition",
            resourceType: "tarefa",
            resourceId: String(tarefa.id),
            reason: "safra_read_only",
            message: e.message,
            payload: JSON.stringify({
              status: input.status,
              safraId: (tarefa as { safraId?: number | null }).safraId,
            }),
          });
        }
        throw e;
      }
      const from = tarefa.status as TarefaStatus;
      const to = input.status as TarefaStatus;

      if (from === "aprovada" && to !== "aprovada") {
        const { recordServerSyncConflict } = await import("../sync-conflicts");
        await recordServerSyncConflict({
          organizationId: tenant.organizationId,
          actorUserId: tenant.userId,
          deviceId: input.deviceId,
          clientMutationId: input.clientMutationId,
          entity: "tarefa",
          action: "transition",
          resourceType: "tarefa",
          resourceId: String(tarefa.id),
          reason: "operation_approved",
          message: "Operação aprovada não pode ser sobrescrita silenciosamente",
          payload: JSON.stringify({ from, to }),
        });
        throw new TRPCError({
          code: "CONFLICT",
          message: "Operação aprovada não pode ser alterada (operation_approved)",
        });
      }

      if (input.expectedStatus && input.expectedStatus !== from) {
        const { recordServerSyncConflict } = await import("../sync-conflicts");
        await recordServerSyncConflict({
          organizationId: tenant.organizationId,
          actorUserId: tenant.userId,
          deviceId: input.deviceId,
          clientMutationId: input.clientMutationId,
          entity: "tarefa",
          action: "transition",
          resourceType: "tarefa",
          resourceId: String(tarefa.id),
          reason: "invalid_transition",
          message: `Status no servidor (${from}) difere do esperado offline (${input.expectedStatus})`,
          payload: JSON.stringify({ from, to, expectedStatus: input.expectedStatus }),
        });
        throw new TRPCError({
          code: "CONFLICT",
          message: `Conflito de status da tarefa: esperado ${input.expectedStatus}, servidor ${from}`,
        });
      }

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

        const consumos = input.consumos ?? [];
        if (consumos.length > 0) {
          const estoque = await listEstoque(tarefa.propriedadeId);
          for (const consumo of consumos) {
            const existing = await findConsumoEstoqueByTarefaItem(tarefa.id, consumo.itemId);
            if (existing) continue;

            const item = estoque.find((e) => e.id === consumo.itemId);
            if (
              !item ||
              item.propriedadeId !== tarefa.propriedadeId ||
              (item.organizationId != null && item.organizationId !== tenant.organizationId)
            ) {
              throw new TRPCError({ code: "NOT_FOUND", message: "Item de estoque não encontrado" });
            }
            const saldo = Number(item.saldo);
            if (!Number.isFinite(saldo) || saldo < consumo.quantidade) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: `Saldo insuficiente para ${item.nome}`,
              });
            }
            await registrarMovimentoEstoque({
              itemId: consumo.itemId,
              usuarioId: tenant.perfilId,
              tipo: "consumo",
              quantidade: consumo.quantidade.toString(),
              motivo: `Consumo automático da tarefa ${tarefa.id}`,
              tarefaId: tarefa.id,
            } as any);
          }
        }
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
