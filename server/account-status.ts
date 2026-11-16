/**
 * WP-06 — bloqueio de conta soft-desativada (suspenso/inativo).
 * Separado de db-auth para reduzir conflito com PR #61; login/sdk só chamam o helper.
 *
 * allowPendingErasure: se existir solicitação LGPD ativa (PR #69 / tabela
 * lgpd_deletion_requests), permite login para o titular cancelar a exclusão.
 * Sem a tabela (este branch), o hook é no-op → conta suspensa/inativa continua bloqueada.
 */
import { eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { usuariosAfu } from "../drizzle/schema";

export class AccountInactiveError extends Error {
  readonly code = "FORBIDDEN" as const;
  constructor(message = "Conta desativada ou suspensa. Contate o suporte AFU.") {
    super(message);
    this.name = "AccountInactiveError";
  }
}

/** Hook no-op quando a tabela LGPD não existe neste branch/ambiente. */
export async function hasActiveLgpdErasureRequest(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  try {
    const result = await db.execute(
      sql`SELECT id FROM lgpd_deletion_requests
          WHERE userId = ${userId}
            AND status IN ('pending', 'scheduled')
          LIMIT 1`,
    );
    const rows = (result as unknown as [Array<{ id: number }>])[0];
    return Array.isArray(rows) && rows.length > 0;
  } catch {
    // Tabela ausente (pré WP-07) ou erro de schema → no-op
    return false;
  }
}

/**
 * Rejeita perfil `suspenso` / `inativo` com FORBIDDEN.
 * Sem perfil AFU → permite (legado / cron sync).
 */
export async function assertAccountActive(
  user: { id: number },
  opts?: { allowPendingErasure?: boolean },
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const perfilRows = await db
    .select({ status: usuariosAfu.status })
    .from(usuariosAfu)
    .where(eq(usuariosAfu.userId, user.id))
    .limit(1);
  const status = perfilRows[0]?.status;
  if (!status || status === "ativo") return;

  if (status === "suspenso" || status === "inativo") {
    if (opts?.allowPendingErasure && (await hasActiveLgpdErasureRequest(user.id))) {
      return;
    }
    throw new AccountInactiveError(
      status === "suspenso"
        ? "Conta suspensa. Contate o suporte AFU."
        : "Conta inativa. Contate o suporte AFU.",
    );
  }
}

/** Converte AccountInactiveError → TRPCError FORBIDDEN (para routers). */
export function toAccountInactiveTrpc(error: unknown): TRPCError | null {
  if (error instanceof AccountInactiveError) {
    return new TRPCError({ code: "FORBIDDEN", message: error.message });
  }
  if (
    error instanceof TRPCError &&
    error.code === "FORBIDDEN" &&
    /conta (suspensa|inativa|desativada)/i.test(error.message)
  ) {
    return error;
  }
  return null;
}
