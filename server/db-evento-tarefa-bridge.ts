/**
 * WP-02 — ponte calendário ↔ tarefa operacional (legadoEventoId).
 * Não apaga eventos, tarefas ou histórico.
 */
import { and, eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import {
  calendarioCuidados,
  tarefasOperacionais,
  type CalendarioCuidado,
  type TarefaOperacional,
} from "../drizzle/schema";
import type { TenantContext } from "./tenant-access";
import {
  mapEventoStatusToTarefa,
  mapTarefaStatusToEvento,
  mapTipoAtividadeEventoToTipoTarefa,
} from "../lib/operacoes/evento-tarefa-status";

export async function findTarefaByLegadoEventoId(
  organizationId: number,
  eventoId: number,
): Promise<TarefaOperacional | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(tarefasOperacionais)
    .where(
      and(
        eq(tarefasOperacionais.organizationId, organizationId),
        eq(tarefasOperacionais.legadoEventoId, eventoId),
      ),
    )
    .limit(1);
  return rows[0];
}

type BridgeEventoFields = Pick<
  CalendarioCuidado,
  | "id"
  | "organizationId"
  | "propriedadeId"
  | "culturaId"
  | "terrenoId"
  | "safraId"
  | "responsavelUserId"
  | "tipoAtividade"
  | "titulo"
  | "descricao"
  | "dataProgramada"
  | "prioridade"
  | "status"
  | "usuarioId"
>;

function requirePropriedadeId(evento: BridgeEventoFields): number {
  if (evento.propriedadeId == null) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Evento sem propriedade não gera tarefa vinculada",
    });
  }
  return evento.propriedadeId;
}

/**
 * Cria ou atualiza a tarefa vinculada ao evento.
 * Idempotente via UNIQUE(legadoEventoId).
 */
export async function upsertTarefaFromEvento(
  tenant: TenantContext,
  evento: BridgeEventoFields,
): Promise<{ tarefaId: number; created: boolean } | null> {
  if (evento.organizationId != null && evento.organizationId !== tenant.organizationId) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Recurso não encontrado" });
  }
  if (evento.propriedadeId == null) {
    return null;
  }

  const propriedadeId = requirePropriedadeId(evento);
  const existing = await findTarefaByLegadoEventoId(tenant.organizationId, evento.id);
  const tipoOperacao = mapTipoAtividadeEventoToTipoTarefa(evento.tipoAtividade);
  const prioridade = (evento.prioridade ?? "normal") as TarefaOperacional["prioridade"];
  const mappedStatus = mapEventoStatusToTarefa(evento.status ?? "pendente");

  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

  if (existing) {
    // Metadados apenas. Status operacional muda só via tarefas.transition
    // (apontamentos, estoque, lock de aprovada) — nunca por write cru do calendário.
    const patch: Partial<TarefaOperacional> = {
      titulo: evento.titulo,
      instrucoes: evento.descricao ?? null,
      tipoOperacao,
      prioridade,
      dataPrevista: evento.dataProgramada,
      terrenoId: evento.terrenoId ?? null,
      culturaId: evento.culturaId ?? null,
      safraId: evento.safraId ?? null,
      responsavelUserId: evento.responsavelUserId ?? null,
      propriedadeId,
    };
    await db
      .update(tarefasOperacionais)
      .set(patch as any)
      .where(
        and(
          eq(tarefasOperacionais.id, existing.id),
          eq(tarefasOperacionais.organizationId, tenant.organizationId),
        ),
      );
    return { tarefaId: existing.id, created: false };
  }

  try {
    const result = await db.insert(tarefasOperacionais).values({
      usuarioId: evento.usuarioId ?? tenant.perfilId,
      organizationId: tenant.organizationId,
      propriedadeId,
      safraId: evento.safraId ?? null,
      terrenoId: evento.terrenoId ?? null,
      culturaId: evento.culturaId ?? null,
      responsavelUserId: evento.responsavelUserId ?? null,
      tipoOperacao,
      titulo: evento.titulo,
      instrucoes: evento.descricao ?? null,
      prioridade,
      status: mappedStatus,
      dataPrevista: evento.dataProgramada,
      origem: "calendario_legado",
      legadoEventoId: evento.id,
    } as any);
    return { tarefaId: result[0].insertId, created: true };
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "ER_DUP_ENTRY") {
      const raced = await findTarefaByLegadoEventoId(tenant.organizationId, evento.id);
      if (raced) return { tarefaId: raced.id, created: false };
    }
    throw e;
  }
}

/** Após carregar o evento do DB, sincroniza a ponte (create/update de calendário). */
export async function syncTarefaBridgeForEventoId(
  tenant: TenantContext,
  eventoId: number,
): Promise<{ tarefaId: number; created: boolean } | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(calendarioCuidados)
    .where(
      and(
        eq(calendarioCuidados.id, eventoId),
        eq(calendarioCuidados.organizationId, tenant.organizationId),
      ),
    )
    .limit(1);
  const evento = rows[0];
  if (!evento) return null;
  return upsertTarefaFromEvento(tenant, evento);
}

/**
 * Espelha status da tarefa no evento vinculado (não apaga nem recria).
 * No-op se não houver legadoEventoId.
 */
export async function mirrorEventoStatusFromTarefa(
  tenant: TenantContext,
  tarefa: Pick<TarefaOperacional, "id" | "organizationId" | "legadoEventoId" | "status">,
): Promise<{ eventoId: number; status: string } | null> {
  if (tarefa.legadoEventoId == null) return null;
  if (tarefa.organizationId != null && tarefa.organizationId !== tenant.organizationId) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Recurso não encontrado" });
  }

  const nextStatus = mapTarefaStatusToEvento(tarefa.status);
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

  const result = await db
    .update(calendarioCuidados)
    .set({ status: nextStatus } as any)
    .where(
      and(
        eq(calendarioCuidados.id, tarefa.legadoEventoId),
        eq(calendarioCuidados.organizationId, tenant.organizationId),
      ),
    );

  if (Number((result as any)[0]?.affectedRows ?? 0) === 0) {
    return null;
  }
  return { eventoId: tarefa.legadoEventoId, status: nextStatus };
}

/**
 * Backfill: eventos com propriedade sem tarefa vinculada.
 * Usado pelo script 0040 (idempotente).
 */
export async function backfillTarefasFromEventosMissing(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const orphanEvents = await db.execute(sql`
    SELECT c.*
    FROM calendario_cuidados c
    LEFT JOIN tarefas_operacionais t ON t.legadoEventoId = c.id
    WHERE c.propriedadeId IS NOT NULL
      AND c.organizationId IS NOT NULL
      AND t.id IS NULL
  `);

  const rows = (orphanEvents as any)[0] as BridgeEventoFields[] | undefined;
  if (!rows?.length) return 0;

  let created = 0;
  for (const evento of rows) {
    if (evento.organizationId == null || evento.propriedadeId == null) continue;
    const tenant = {
      organizationId: evento.organizationId,
      userId: 0,
      perfilId: evento.usuarioId ?? 0,
    } as TenantContext;
    const result = await upsertTarefaFromEvento(tenant, evento);
    if (result?.created) created += 1;
  }
  return created;
}

/** Contagem de eventos com propriedade ainda sem tarefa (verify/diagnóstico). */
export async function countEventosSemTarefaVinculada(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.execute(sql`
    SELECT COUNT(*) AS n
    FROM calendario_cuidados c
    LEFT JOIN tarefas_operacionais t ON t.legadoEventoId = c.id
    WHERE c.propriedadeId IS NOT NULL
      AND c.organizationId IS NOT NULL
      AND t.id IS NULL
  `);
  const row = (result as any)[0]?.[0] as { n?: number | string } | undefined;
  return Number(row?.n ?? 0);
}
