/**
 * Safras persistentes — correção Etapa 2 (entidade + isolamento).
 */
import { and, eq, ne } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { safras, propriedades, type Safra, type InsertSafra } from "../drizzle/schema";
import { currentSafraLabel } from "../lib/propriedades/safra-label";
import { TENANT_NOT_FOUND } from "./tenant-access";

export async function listSafrasByPropriedade(
  organizationId: number,
  propriedadeId: number,
): Promise<Safra[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(safras)
    .where(
      and(
        eq(safras.organizationId, organizationId),
        eq(safras.propriedadeId, propriedadeId),
        ne(safras.status, "arquivada"),
      ),
    );
}

export async function getSafraInProperty(
  organizationId: number,
  propriedadeId: number,
  safraId: number,
): Promise<Safra | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(safras)
    .where(
      and(
        eq(safras.id, safraId),
        eq(safras.organizationId, organizationId),
        eq(safras.propriedadeId, propriedadeId),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function requireSafraInProperty(
  organizationId: number,
  propriedadeId: number,
  safraId: number,
): Promise<Safra> {
  const row = await getSafraInProperty(organizationId, propriedadeId, safraId);
  if (!row) {
    throw new TRPCError({ code: "NOT_FOUND", message: TENANT_NOT_FOUND });
  }
  return row;
}

/** Bloqueia escrita comum em safra encerrada/arquivada (Etapa 5). */
export async function requireWritableSafraInProperty(
  organizationId: number,
  propriedadeId: number,
  safraId: number,
): Promise<Safra> {
  const row = await requireSafraInProperty(organizationId, propriedadeId, safraId);
  if (row.status === "encerrada" || row.status === "arquivada") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Safra encerrada ou arquivada — somente leitura.",
    });
  }
  return row;
}

/** Garante propriedade no tenant antes de criar/listar safras */
async function assertPropertyOrg(organizationId: number, propriedadeId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const rows = await db
    .select({ id: propriedades.id, organizationId: propriedades.organizationId })
    .from(propriedades)
    .where(
      and(eq(propriedades.id, propriedadeId), eq(propriedades.organizationId, organizationId)),
    )
    .limit(1);
  if (!rows[0]) {
    throw new TRPCError({ code: "NOT_FOUND", message: TENANT_NOT_FOUND });
  }
}

export async function createSafra(input: {
  organizationId: number;
  propriedadeId: number;
  nome: string;
  status?: InsertSafra["status"];
  isDefault?: boolean;
  createdByUserId?: number;
  anoInicio?: number;
  anoFim?: number;
}): Promise<number> {
  await assertPropertyOrg(input.organizationId, input.propriedadeId);
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  if (input.isDefault) {
    await db
      .update(safras)
      .set({ isDefault: false })
      .where(
        and(
          eq(safras.organizationId, input.organizationId),
          eq(safras.propriedadeId, input.propriedadeId),
          eq(safras.isDefault, true),
        ),
      );
  }

  const result = await db.insert(safras).values({
    organizationId: input.organizationId,
    propriedadeId: input.propriedadeId,
    nome: input.nome,
    status: input.status ?? "ativa",
    isDefault: input.isDefault ?? false,
    createdByUserId: input.createdByUserId,
    anoInicio: input.anoInicio,
    anoFim: input.anoFim,
  });
  return result[0].insertId;
}

/**
 * Garante safra padrão da propriedade (rótulo atual). Idempotente.
 * Não escolhe silenciosamente entre nomes ambíguos — só cria se nenhuma default/ativa.
 */
export async function ensureDefaultSafra(opts: {
  organizationId: number;
  propriedadeId: number;
  createdByUserId?: number;
  nome?: string;
}): Promise<Safra> {
  await assertPropertyOrg(opts.organizationId, opts.propriedadeId);
  const existing = await listSafrasByPropriedade(opts.organizationId, opts.propriedadeId);
  const def = existing.find((s) => s.isDefault) ?? existing.find((s) => s.status === "ativa");
  if (def) return def;

  const nome = opts.nome ?? currentSafraLabel();
  const id = await createSafra({
    organizationId: opts.organizationId,
    propriedadeId: opts.propriedadeId,
    nome,
    status: "ativa",
    isDefault: true,
    createdByUserId: opts.createdByUserId,
  });
  const created = await getSafraInProperty(opts.organizationId, opts.propriedadeId, id);
  if (!created) throw new Error("Failed to create default safra");
  return created;
}

/** Encerra safra (modo histórico). Remove isDefault. */
export async function closeSafra(opts: {
  organizationId: number;
  propriedadeId: number;
  safraId: number;
}): Promise<Safra> {
  const row = await requireSafraInProperty(
    opts.organizationId,
    opts.propriedadeId,
    opts.safraId,
  );
  if (row.status === "encerrada" || row.status === "arquivada") {
    return row;
  }
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .update(safras)
    .set({
      status: "encerrada",
      isDefault: false,
      closedAt: new Date(),
    })
    .where(
      and(
        eq(safras.id, opts.safraId),
        eq(safras.organizationId, opts.organizationId),
        eq(safras.propriedadeId, opts.propriedadeId),
      ),
    );
  const updated = await requireSafraInProperty(
    opts.organizationId,
    opts.propriedadeId,
    opts.safraId,
  );
  return updated;
}

/**
 * Reabre safra encerrada → ativa.
 * Se makeDefault, torna-se a safra padrão da propriedade.
 */
export async function reopenSafra(opts: {
  organizationId: number;
  propriedadeId: number;
  safraId: number;
  makeDefault?: boolean;
}): Promise<Safra> {
  const row = await requireSafraInProperty(
    opts.organizationId,
    opts.propriedadeId,
    opts.safraId,
  );
  if (row.status === "arquivada") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Safra arquivada não pode ser reaberta por este fluxo.",
    });
  }
  if (row.status === "ativa" || row.status === "planejada") {
    return row;
  }
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  if (opts.makeDefault) {
    await db
      .update(safras)
      .set({ isDefault: false })
      .where(
        and(
          eq(safras.organizationId, opts.organizationId),
          eq(safras.propriedadeId, opts.propriedadeId),
          eq(safras.isDefault, true),
        ),
      );
  }

  await db
    .update(safras)
    .set({
      status: "ativa",
      closedAt: null,
      isDefault: opts.makeDefault ?? false,
    })
    .where(
      and(
        eq(safras.id, opts.safraId),
        eq(safras.organizationId, opts.organizationId),
        eq(safras.propriedadeId, opts.propriedadeId),
      ),
    );
  return requireSafraInProperty(opts.organizationId, opts.propriedadeId, opts.safraId);
}
