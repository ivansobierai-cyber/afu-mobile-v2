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
  createTarefasInTransaction,
  updateTarefa,
  createApontamento,
  getApontamentosByTarefa,
} from "../db";
import {
  findTarefaByClientMutationId,
  reservarInsumosParaTarefa,
  validarDisponibilidadeReservasTarefa,
  consumirReservasDaTarefa,
  liberarReservasDaTarefa,
} from "../db-propriedade-expansao";
import {
  getCtxTenant,
  requireOrgPermission,
  requirePropertyInTenant,
  requireTarefaInTenant,
  requireTerrenoInTenant,
  requireCulturaInTenant,
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

const consumosInput = z
  .array(
    z.object({
      itemId: z.number().int().positive(),
      quantidade: z.number().positive(),
    }),
  )
  .max(20)
  .optional();

const reservasInput = consumosInput;

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
  /** Etapa 7 Passo 4 — insumos a reservar na criação */
  reservas: reservasInput,
});

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
    responsavelUserId: input.responsavelUserId,
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

async function applyReservasAfterCreate(
  tenant: TenantContext,
  tarefaId: number,
  propriedadeId: number,
  reservas: Array<{ itemId: number; quantidade: number }> | undefined,
) {
  if (!reservas?.length) return;
  try {
    await reservarInsumosParaTarefa({
      organizationId: tenant.organizationId,
      propriedadeId,
      tarefaId,
      createdByUserId: tenant.userId,
      usuarioId: tenant.perfilId,
      itens: reservas,
    });
  } catch (e: any) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: e?.message ?? "Falha ao reservar insumos",
    });
  }
}

export const tarefasRouter = router({
  listByPropriedade: organizationProcedure
    .input(
      z.object({
        propriedadeId: z.number().int().positive(),
        status: statusSchema.optional(),
        abertasOnly: z.boolean().optional(),
        safraId: z.number().int().positive().optional(),
        culturaId: z.number().int().positive().optional(),
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
      if (input.culturaId) {
        await requireCulturaInTenant(tenant, input.culturaId, input.propriedadeId);
      }
      const { filterRowsBySafraId } = await import("../../lib/propriedades/safra-filter");
      let lista = await getTarefasByPropriedade(input.propriedadeId);
      lista = filterRowsBySafraId(lista, input.safraId ?? null).matched;
      if (input.culturaId) {
        lista = lista.filter((t) => t.culturaId === input.culturaId);
      }
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
      const id = await createTarefaForTenant(tenant, input);
      await applyReservasAfterCreate(tenant, id, input.propriedadeId, input.reservas);
      return id;
    }),

  createBulk: orgPermissionProcedure("operations.write")
    .input(tarefaBulkInput)
    .mutation(async ({ ctx, input }) => {
      const tenant = getCtxTenant(ctx);
      const { terrenoIds, ...baseInput } = input;

      // Pré-valida tudo antes de qualquer insert (evita criação parcial)
      await assertRelatedIdsInTenant(tenant, {
        propriedadeId: input.propriedadeId,
        culturaId: input.culturaId,
        responsavelUserId: input.responsavelUserId,
      });
      for (const terrenoId of terrenoIds) {
        await requireTerrenoInTenant(tenant, terrenoId, input.propriedadeId);
      }

      const safraId = await resolveSafraIdForCreate(tenant, input);
      const dataPrevista = new Date(input.dataPrevista);

      type Planned = {
        terrenoId: number;
        clientMutationId?: string;
        existingId?: number;
      };
      const planned: Planned[] = [];
      for (const terrenoId of terrenoIds) {
        const clientMutationId = input.clientMutationId
          ? `${input.clientMutationId.slice(0, 48)}_${terrenoId}`
          : undefined;
        if (clientMutationId) {
          const existing = await findTarefaByClientMutationId(clientMutationId);
          if (existing) {
            if (existing.organizationId !== tenant.organizationId) {
              throw new TRPCError({ code: "NOT_FOUND", message: "Recurso não encontrado" });
            }
            planned.push({ terrenoId, clientMutationId, existingId: existing.id });
            continue;
          }
        }
        planned.push({ terrenoId, clientMutationId });
      }

      if (planned.every((p) => p.existingId != null)) {
        return planned.map((p) => p.existingId!);
      }

      const toInsert = planned.filter((p) => p.existingId == null);
      const newIds = await createTarefasInTransaction(
        toInsert.map((p) => ({
          usuarioId: tenant.perfilId,
          organizationId: tenant.organizationId,
          propriedadeId: baseInput.propriedadeId,
          safraId,
          terrenoId: p.terrenoId,
          culturaId: baseInput.culturaId,
          responsavelUserId: baseInput.responsavelUserId,
          tipoOperacao: baseInput.tipoOperacao,
          titulo: baseInput.titulo,
          instrucoes: baseInput.instrucoes,
          prioridade: baseInput.prioridade ?? "normal",
          status: "planejada" as const,
          dataPrevista,
          areaPlanejada: baseInput.areaPlanejada?.toString(),
          origem: "manual" as const,
          clientMutationId: p.clientMutationId,
        })),
      );

      let newIdx = 0;
      const ids = planned.map((p) =>
        p.existingId != null ? p.existingId : newIds[newIdx++]!,
      );
      for (let i = 0; i < planned.length; i++) {
        if (planned[i]!.existingId != null) continue;
        await applyReservasAfterCreate(
          tenant,
          ids[i]!,
          input.propriedadeId,
          input.reservas,
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
        try {
          await validarDisponibilidadeReservasTarefa(tarefa.id, tenant.organizationId);
        } catch (e: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: e?.message ?? "Insumos reservados indisponíveis",
          });
        }
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

        try {
          await consumirReservasDaTarefa({
            organizationId: tenant.organizationId,
            propriedadeId: tarefa.propriedadeId,
            tarefaId: tarefa.id,
            createdByUserId: tenant.userId,
            usuarioId: tenant.perfilId,
            consumosExtras: input.consumos,
          });
        } catch (e: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: e?.message ?? "Falha ao consumir estoque da operação",
          });
        }
      }
      if (to === "cancelada") {
        await liberarReservasDaTarefa({
          organizationId: tenant.organizationId,
          tarefaId: tarefa.id,
          statusFinal: "cancelada",
        });
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

  /** Etapa 8 Passo 4 — alocações de equipe na tarefa */
  alocacoes: router({
    list: organizationProcedure
      .input(z.object({ tarefaId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const tenant = getCtxTenant(ctx);
        requireOrgPermission(tenant, "operations.read");
        await requireTarefaInTenant(tenant, input.tarefaId);
        const { listAlocacoesPorTarefa } = await import("../db-equipe");
        return listAlocacoesPorTarefa(input.tarefaId, tenant.organizationId);
      }),

    upsert: orgPermissionProcedure("operations.write")
      .input(
        z.object({
          tarefaId: z.number().int().positive(),
          userId: z.number().int().positive(),
          papelEquipe: z.enum(["funcionario", "operador", "tecnico", "agronomo"]).optional(),
          horasPlanejadas: z.number().nonnegative().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const tenant = getCtxTenant(ctx);
        const tarefa = await requireTarefaInTenant(tenant, input.tarefaId);
        const { requireOrgMemberUserId } = await import("../tenant-access");
        await requireOrgMemberUserId(tenant, input.userId);
        const { upsertAlocacaoTarefa, mapOrgRoleToPapelEquipe, listEquipeOrganizacao } =
          await import("../db-equipe");
        let papel = input.papelEquipe;
        if (!papel) {
          const equipe = await listEquipeOrganizacao(tenant.organizationId);
          const membro = equipe.find((e) => e.userId === input.userId);
          papel = membro?.papelEquipe ?? mapOrgRoleToPapelEquipe("operador");
        }
        const id = await upsertAlocacaoTarefa({
          organizationId: tenant.organizationId,
          propriedadeId: tarefa.propriedadeId,
          tarefaId: input.tarefaId,
          userId: input.userId,
          papelEquipe: papel,
          horasPlanejadas:
            input.horasPlanejadas != null ? input.horasPlanejadas.toFixed(2) : undefined,
          createdByUserId: tenant.userId,
        });
        return id;
      }),

    remove: orgPermissionProcedure("operations.write")
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const tenant = getCtxTenant(ctx);
        const { removeAlocacaoTarefa } = await import("../db-equipe");
        await removeAlocacaoTarefa(input.id, tenant.organizationId);
        return { success: true };
      }),
  }),
});
