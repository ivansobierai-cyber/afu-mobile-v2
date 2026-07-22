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

/** Código de domínio estável para clientes/offline (Etapa 5). */
export const SAFRA_READ_ONLY = "SAFRA_READ_ONLY";

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
      message: `${SAFRA_READ_ONLY}: Safra encerrada ou arquivada — somente leitura.`,
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

/**
 * Guarda escrita a partir do safraId real da entidade (nunca confiar só no cliente).
 * Se safraId for null, tenta a safra padrão da propriedade.
 */
export async function requireWritableSafraId(
  organizationId: number,
  propriedadeId: number,
  safraId: number | null | undefined,
): Promise<Safra> {
  if (safraId != null && safraId > 0) {
    return requireWritableSafraInProperty(organizationId, propriedadeId, safraId);
  }
  const def = await ensureDefaultSafra({ organizationId, propriedadeId });
  return requireWritableSafraInProperty(organizationId, propriedadeId, def.id);
}

/**
 * Encerra safra em transação.
 * Se era padrão, exige `nextDefaultSafraId` (outra safra da propriedade) ou
 * `allowNoDefault` explícito — nunca cria safra silenciosamente.
 */
export async function closeSafra(opts: {
  organizationId: number;
  propriedadeId: number;
  safraId: number;
  nextDefaultSafraId?: number | null;
  allowNoDefault?: boolean;
}): Promise<{ closed: Safra; newDefault: Safra | null }> {
  const row = await requireSafraInProperty(
    opts.organizationId,
    opts.propriedadeId,
    opts.safraId,
  );
  if (row.status === "encerrada" || row.status === "arquivada") {
    const list = await listSafrasByPropriedade(opts.organizationId, opts.propriedadeId);
    return {
      closed: row,
      newDefault: list.find((s) => s.isDefault) ?? null,
    };
  }

  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  let nextDefault: Safra | null = null;
  if (row.isDefault) {
    if (opts.nextDefaultSafraId != null) {
      if (opts.nextDefaultSafraId === opts.safraId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Próxima safra corrente deve ser diferente da encerrada.",
        });
      }
      nextDefault = await requireSafraInProperty(
        opts.organizationId,
        opts.propriedadeId,
        opts.nextDefaultSafraId,
      );
      if (nextDefault.status === "arquivada" || nextDefault.status === "encerrada") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Próxima safra corrente precisa estar ativa ou planejada.",
        });
      }
    } else if (!opts.allowNoDefault) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "Informe nextDefaultSafraId (próxima safra corrente) ou allowNoDefault=true.",
      });
    }
  }

  await db.transaction(async (tx) => {
    await tx
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

    if (nextDefault) {
      await tx
        .update(safras)
        .set({ isDefault: false })
        .where(
          and(
            eq(safras.organizationId, opts.organizationId),
            eq(safras.propriedadeId, opts.propriedadeId),
            eq(safras.isDefault, true),
          ),
        );
      await tx
        .update(safras)
        .set({ isDefault: true, status: nextDefault.status === "planejada" ? "ativa" : nextDefault.status })
        .where(
          and(
            eq(safras.id, nextDefault.id),
            eq(safras.organizationId, opts.organizationId),
            eq(safras.propriedadeId, opts.propriedadeId),
          ),
        );
    }
  });

  const closed = await requireSafraInProperty(
    opts.organizationId,
    opts.propriedadeId,
    opts.safraId,
  );
  const list = await listSafrasByPropriedade(opts.organizationId, opts.propriedadeId);
  return {
    closed,
    newDefault: list.find((s) => s.isDefault) ?? null,
  };
}

/**
 * Reabre safra encerrada → ativa (transacional).
 * Se makeDefault, torna-se a única safra padrão da propriedade.
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

  await db.transaction(async (tx) => {
    if (opts.makeDefault) {
      await tx
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
    await tx
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
  });

  return requireSafraInProperty(opts.organizationId, opts.propriedadeId, opts.safraId);
}
