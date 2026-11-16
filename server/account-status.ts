/**
 * Conta ativa / soft-deactivate (WP-06) + allowPendingErasure (WP-07 LGPD).
 *
 * Única implementação canônica de `assertAccountActive` — login (`db-auth`),
 * Bearer/session (`sdk.authenticateRequest`) e rotas LGPD usam este módulo.
 *
 * `allowPendingErasure: true` permite titular com exclusão LGPD agendada
 * autenticar-se para cancelar; sem a tabela `lgpd_deletion_requests`, o hook
 * é no-op e conta suspensa/inativa continua bloqueada.
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

export type AccountActiveResult = {
  status: "ativo" | "inativo" | "suspenso" | null;
  pendingErasure: boolean;
};

/** Hook no-op quando a tabela LGPD não existe neste ambiente. */
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

export async function getAccountStatus(userId: number): Promise<AccountActiveResult> {
  const db = await getDb();
  if (!db) {
    return { status: null, pendingErasure: false };
  }
  const [perfil] = await db
    .select({ status: usuariosAfu.status })
    .from(usuariosAfu)
    .where(eq(usuariosAfu.userId, userId))
    .limit(1);
  const status = (perfil?.status ?? null) as AccountActiveResult["status"];
  const pendingErasure = await hasActiveLgpdErasureRequest(userId);
  return { status, pendingErasure };
}

/**
 * Rejeita perfil `suspenso` / `inativo` com AccountInactiveError.
 * Sem perfil AFU → permite (legado / cron sync).
 */
export async function assertAccountActive(
  user: { id: number },
  opts?: { allowPendingErasure?: boolean },
): Promise<AccountActiveResult> {
  const result = await getAccountStatus(user.id);

  if (!result.status || result.status === "ativo") {
    return result;
  }

  if (result.status === "suspenso" || result.status === "inativo") {
    if (opts?.allowPendingErasure && result.pendingErasure) {
      return result;
    }
    throw new AccountInactiveError(
      result.status === "suspenso"
        ? result.pendingErasure
          ? "Conta suspensa por solicitação de exclusão LGPD. Cancele a exclusão para reativar o acesso completo."
          : "Conta suspensa. Contate o suporte AFU."
        : "Conta inativa. Contate o suporte AFU.",
    );
  }

  return result;
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
