/**
 * FASE 2G — transição de status server-side + auditoria transacional.
 */
import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import {
  operacoesAgricolas,
  operacoesAgricolasStatusHistorico,
  type OperacaoAgricolaRow,
} from "../drizzle/schema";
import {
  assertOperacaoAgricolaTransition,
  operacaoTransitionRequiresMotivo,
  type OperacaoAgricolaStatus,
} from "../lib/operacoes/operacao-agricola-status";
import { requireOperacaoInTenant, requireOrgPermission, type TenantContext } from "./tenant-access";

export const INVALID_OPERATION_TRANSITION = "INVALID_OPERATION_TRANSITION";

export type TransitionOperacaoInput = {
  operacaoId: number;
  toStatus: OperacaoAgricolaStatus;
  motivo?: string;
  expectedStatus?: OperacaoAgricolaStatus;
  expectedRevision?: number;
  clientMutationId?: string;
};

export type TransitionOperacaoResult = {
  operacaoId: number;
  fromStatus: OperacaoAgricolaStatus;
  toStatus: OperacaoAgricolaStatus;
  statusRevision: number;
  idempotentReplay: boolean;
};

function buildIdempotentReplayResult(
  row: { fromStatus: string; toStatus: string },
  requestedTo: OperacaoAgricolaStatus,
  current: OperacaoAgricolaRow,
): TransitionOperacaoResult {
  const storedTo = row.toStatus as OperacaoAgricolaStatus;
  if (storedTo !== requestedTo) {
    throw new TRPCError({
      code: "CONFLICT",
      message: `clientMutationId já registrado para transição → ${storedTo}, não → ${requestedTo}`,
    });
  }
  return {
    operacaoId: current.id,
    fromStatus: row.fromStatus as OperacaoAgricolaStatus,
    toStatus: storedTo,
    statusRevision: current.statusRevision ?? 0,
    idempotentReplay: true,
  };
}

async function resolveWritableSafraForOperacao(
  tenant: TenantContext,
  op: OperacaoAgricolaRow,
): Promise<void> {
  const { resolveWritableSafraForOperacaoRow, SAFRA_READ_ONLY } = await import("./db-safras");
  try {
    await resolveWritableSafraForOperacaoRow(
      tenant.organizationId,
      op.propriedadeId,
      op.safraId,
    );
  } catch (e) {
    if (e instanceof TRPCError && e.message.includes(SAFRA_READ_ONLY)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `${SAFRA_READ_ONLY}: Safra encerrada — transição negada`,
      });
    }
    throw e;
  }
}

export async function listOperacaoStatusHistorico(
  tenant: TenantContext,
  operacaoId: number,
) {
  await requireOperacaoInTenant(tenant, operacaoId);
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(operacoesAgricolasStatusHistorico)
    .where(
      and(
        eq(operacoesAgricolasStatusHistorico.organizationId, tenant.organizationId),
        eq(operacoesAgricolasStatusHistorico.operacaoId, operacaoId),
      ),
    )
    .orderBy(operacoesAgricolasStatusHistorico.createdAt);
}

export async function transitionOperacaoAgricolaStatus(
  tenant: TenantContext,
  input: TransitionOperacaoInput,
): Promise<TransitionOperacaoResult> {
  const op = await requireOperacaoInTenant(tenant, input.operacaoId);
  await resolveWritableSafraForOperacao(tenant, op);

  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

  if (input.clientMutationId) {
    const existing = await db
      .select()
      .from(operacoesAgricolasStatusHistorico)
      .where(
        and(
          eq(operacoesAgricolasStatusHistorico.operacaoId, input.operacaoId),
          eq(operacoesAgricolasStatusHistorico.clientMutationId, input.clientMutationId),
        ),
      )
      .limit(1);
    if (existing[0]) {
      const current = await requireOperacaoInTenant(tenant, input.operacaoId);
      return buildIdempotentReplayResult(existing[0], input.toStatus, current);
    }
  }

  const from = op.status as OperacaoAgricolaStatus;
  const to = input.toStatus;

  if (input.expectedStatus && input.expectedStatus !== from) {
    throw new TRPCError({
      code: "CONFLICT",
      message: `Conflito de status: esperado ${input.expectedStatus}, servidor ${from}`,
    });
  }
  if (input.expectedRevision != null && input.expectedRevision !== (op.statusRevision ?? 0)) {
    throw new TRPCError({
      code: "CONFLICT",
      message: `Conflito de revisão: esperado ${input.expectedRevision}, servidor ${op.statusRevision ?? 0}`,
    });
  }

  if (from === to) {
    return {
      operacaoId: op.id,
      fromStatus: from,
      toStatus: to,
      statusRevision: op.statusRevision ?? 0,
      idempotentReplay: true,
    };
  }

  const ctx = {
    statusBeforeBlocked: (op.statusBeforeBlocked ?? null) as OperacaoAgricolaStatus | null,
  };
  try {
    assertOperacaoAgricolaTransition(from, to, ctx);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : INVALID_OPERATION_TRANSITION;
    throw new TRPCError({ code: "BAD_REQUEST", message: msg });
  }

  if (operacaoTransitionRequiresMotivo(to) && !input.motivo?.trim()) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Informe o motivo desta transição",
    });
  }

  // FASE 2H — nova conclusão exige apontamento mínimo válido (sem backfill histórico).
  if (to === "concluida" && from !== "concluida") {
    const { operacaoHasMinimalValidApontamento } = await import("./db-operacoes-apontamentos");
    const ok = await operacaoHasMinimalValidApontamento(tenant.organizationId, op.id);
    if (!ok) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "APONTAMENTO_REQUIRED: registre execução real (início e autoria) antes de concluir",
      });
    }
  }

  const { operacaoTransitionRequiredPermission } = await import(
    "../lib/operacoes/operacao-agricola-status"
  );
  requireOrgPermission(tenant, operacaoTransitionRequiredPermission(to));

  const nextRevision = (op.statusRevision ?? 0) + 1;
  let nextBlockedFrom: OperacaoAgricolaStatus | null = ctx.statusBeforeBlocked ?? null;
  if (to === "bloqueada") {
    nextBlockedFrom = from;
  } else if (from === "bloqueada" && to !== "cancelada") {
    nextBlockedFrom = null;
  } else if (to === "cancelada") {
    nextBlockedFrom = null;
  }

  try {
    await db.transaction(async (tx) => {
      const locked = await tx
        .select()
        .from(operacoesAgricolas)
        .where(
          and(
            eq(operacoesAgricolas.id, op.id),
            eq(operacoesAgricolas.organizationId, tenant.organizationId),
            eq(operacoesAgricolas.status, from),
            eq(operacoesAgricolas.statusRevision, op.statusRevision ?? 0),
          ),
        )
        .limit(1);
      if (!locked[0]) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Operação alterada por outra sessão; atualize e tente novamente",
        });
      }

      await tx.insert(operacoesAgricolasStatusHistorico).values({
        organizationId: tenant.organizationId,
        propriedadeId: op.propriedadeId,
        operacaoId: op.id,
        fromStatus: from,
        toStatus: to,
        actorUserId: tenant.userId,
        motivo: input.motivo?.trim() || null,
        origem: "transition",
        clientMutationId: input.clientMutationId ?? null,
      });

      await tx
        .update(operacoesAgricolas)
        .set({
          status: to,
          statusRevision: nextRevision,
          statusBeforeBlocked: nextBlockedFrom,
        })
        .where(
          and(
            eq(operacoesAgricolas.id, op.id),
            eq(operacoesAgricolas.organizationId, tenant.organizationId),
          ),
        );
    });
  } catch (e: unknown) {
    if (e instanceof TRPCError) throw e;
    const err = e as { code?: string };
    if (err.code === "ER_DUP_ENTRY" && input.clientMutationId) {
      const replay = await db
        .select()
        .from(operacoesAgricolasStatusHistorico)
        .where(
          and(
            eq(operacoesAgricolasStatusHistorico.operacaoId, input.operacaoId),
            eq(operacoesAgricolasStatusHistorico.clientMutationId, input.clientMutationId),
          ),
        )
        .limit(1);
      if (replay[0]) {
        const current = await requireOperacaoInTenant(tenant, input.operacaoId);
        return buildIdempotentReplayResult(replay[0], input.toStatus, current);
      }
    }
    throw e;
  }

  return {
    operacaoId: op.id,
    fromStatus: from,
    toStatus: to,
    statusRevision: nextRevision,
    idempotentReplay: false,
  };
}
