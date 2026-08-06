/**
 * FASE 2E — persistência e promoção explícita evento → operação agrícola.
 */
import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import {
  operacoesAgricolas,
  apontamentosOperacao,
  type InsertOperacaoAgricola,
  type OperacaoAgricolaRow,
} from "../drizzle/schema";
import {
  assertRelatedIdsInTenant,
  requireEventoInTenant,
  requireTarefaInTenant,
  type TenantContext,
} from "./tenant-access";
import { mapTipoAtividadeToOperacao } from "../lib/operacoes";

export type CreateOperacaoInput = {
  propriedadeId: number;
  safraId?: number;
  terrenoId?: number;
  culturaId?: number;
  tarefaId?: number;
  tipoOperacao: OperacaoAgricolaRow["tipoOperacao"];
  titulo: string;
  descricao?: string;
  dataPrevista: Date;
  origem?: OperacaoAgricolaRow["origem"];
};

async function resolveSafraForWrite(
  tenant: TenantContext,
  propriedadeId: number,
  safraId?: number,
): Promise<number | undefined> {
  if (safraId == null) return undefined;
  const { requireWritableSafraInProperty } = await import("./db-safras");
  await requireWritableSafraInProperty(tenant.organizationId, propriedadeId, safraId);
  return safraId;
}

async function validateTarefaLink(
  tenant: TenantContext,
  tarefaId: number,
  propriedadeId: number,
) {
  const tarefa = await requireTarefaInTenant(tenant, tarefaId);
  if (tarefa.propriedadeId !== propriedadeId) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Recurso não encontrado" });
  }
  return tarefa;
}

export async function getOperacaoById(id: number, organizationId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(operacoesAgricolas)
    .where(and(eq(operacoesAgricolas.id, id), eq(operacoesAgricolas.organizationId, organizationId)))
    .limit(1);
  return rows[0];
}

export async function findOperacaoByEventoOrigemId(
  organizationId: number,
  eventoOrigemId: number,
) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(operacoesAgricolas)
    .where(
      and(
        eq(operacoesAgricolas.organizationId, organizationId),
        eq(operacoesAgricolas.eventoOrigemId, eventoOrigemId),
      ),
    )
    .limit(1);
  return rows[0];
}

export async function listOperacoesByPropriedade(
  organizationId: number,
  propriedadeId: number,
) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(operacoesAgricolas)
    .where(
      and(
        eq(operacoesAgricolas.organizationId, organizationId),
        eq(operacoesAgricolas.propriedadeId, propriedadeId),
      ),
    )
    .orderBy(operacoesAgricolas.dataPrevista);
}

export async function createOperacaoAgricola(
  tenant: TenantContext,
  input: CreateOperacaoInput,
): Promise<number> {
  await assertRelatedIdsInTenant(tenant, {
    propriedadeId: input.propriedadeId,
    terrenoId: input.terrenoId,
    culturaId: input.culturaId,
    safraId: input.safraId,
  });
  const safraId = await resolveSafraForWrite(tenant, input.propriedadeId, input.safraId);
  if (input.tarefaId) {
    await validateTarefaLink(tenant, input.tarefaId, input.propriedadeId);
  }

  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

  const result = await db.insert(operacoesAgricolas).values({
    organizationId: tenant.organizationId,
    propriedadeId: input.propriedadeId,
    safraId: safraId ?? null,
    terrenoId: input.terrenoId ?? null,
    culturaId: input.culturaId ?? null,
    tarefaId: input.tarefaId ?? null,
    tipoOperacao: input.tipoOperacao,
    titulo: input.titulo,
    descricao: input.descricao ?? null,
    status: "planejada",
    dataPrevista: input.dataPrevista,
    createdByUserId: tenant.userId,
    origem: input.origem ?? "manual",
  } as InsertOperacaoAgricola);

  return result[0].insertId;
}

/**
 * Promoção explícita: evento de calendário → operação agrícola planejada.
 * Não altera o evento, não cria apontamento, não marca execução.
 */
export async function promoteFromEvento(
  tenant: TenantContext,
  eventoId: number,
): Promise<{ operacaoId: number; alreadyExisted: boolean }> {
  const evento = await requireEventoInTenant(tenant, eventoId);
  const existing = await findOperacaoByEventoOrigemId(tenant.organizationId, eventoId);
  if (existing) {
    return { operacaoId: existing.id, alreadyExisted: true };
  }

  if (!evento.propriedadeId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Evento sem propriedade vinculada não pode gerar operação",
    });
  }

  await assertRelatedIdsInTenant(tenant, {
    propriedadeId: evento.propriedadeId,
    terrenoId: evento.terrenoId ?? undefined,
    culturaId: evento.culturaId ?? undefined,
    safraId: evento.safraId ?? undefined,
  });
  if (evento.safraId) {
    await resolveSafraForWrite(tenant, evento.propriedadeId, evento.safraId);
  }

  const mapped = mapTipoAtividadeToOperacao(evento.tipoAtividade);
  const tipoOperacao = mapped.operacao;

  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

  try {
    const result = await db.insert(operacoesAgricolas).values({
      organizationId: tenant.organizationId,
      propriedadeId: evento.propriedadeId,
      safraId: evento.safraId ?? null,
      terrenoId: evento.terrenoId ?? null,
      culturaId: evento.culturaId ?? null,
      eventoOrigemId: evento.id,
      tipoOperacao,
      titulo: evento.titulo,
      descricao: evento.descricao ?? null,
      status: "planejada",
      dataPrevista: evento.dataProgramada,
      createdByUserId: tenant.userId,
      origem: "evento_calendario",
      tipoAtividadeLegado: mapped.legado || evento.tipoAtividade,
    } as InsertOperacaoAgricola);
    return { operacaoId: result[0].insertId, alreadyExisted: false };
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "ER_DUP_ENTRY") {
      const raced = await findOperacaoByEventoOrigemId(tenant.organizationId, eventoId);
      if (raced) return { operacaoId: raced.id, alreadyExisted: true };
    }
    throw e;
  }
}

export async function countApontamentosForTarefa(tarefaId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db
    .select()
    .from(apontamentosOperacao)
    .where(eq(apontamentosOperacao.tarefaId, tarefaId));
  return rows.length;
}
