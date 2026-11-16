/**
 * WP-07 / WP-06 — checagem genérica de conta ativa.
 *
 * WP-06 deve chamar `assertAccountActive` em `loginWithEmail` e
 * `sdk.authenticateRequest`. Use `{ allowPendingErasure: true }` no login
 * (e em rotas LGPD de cancelamento) para permitir titular com exclusão
 * agendada autenticar-se só para cancelar a solicitação.
 *
 * Alternativa sem sessão completa: `auth.lgpd.cancelEraseWithCredentials`.
 */
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { usuariosAfu } from "../drizzle/schema";
import { getActiveDeletionRequest } from "./lgpd";

export type AssertAccountActiveOptions = {
  /**
   * Se true, conta `suspenso` com solicitação LGPD ativa (pending/scheduled)
   * é permitida (titular pode cancelar a exclusão).
   */
  allowPendingErasure?: boolean;
};

export type AccountActiveResult = {
  status: "ativo" | "inativo" | "suspenso" | null;
  pendingErasure: boolean;
};

export async function getAccountStatus(userId: number): Promise<AccountActiveResult> {
  const db = await getDb();
  if (!db) {
    return { status: null, pendingErasure: false };
  }
  const [perfil] = await db
    .select()
    .from(usuariosAfu)
    .where(eq(usuariosAfu.userId, userId))
    .limit(1);
  const status = (perfil?.status ?? null) as AccountActiveResult["status"];
  const erasure = await getActiveDeletionRequest(userId);
  return { status, pendingErasure: erasure != null };
}

/**
 * Lança FORBIDDEN se a conta não puder autenticar/usar o app.
 * Nome estável para coordenação com WP-06 — não renomear.
 */
export async function assertAccountActive(
  userId: number,
  opts: AssertAccountActiveOptions = {},
): Promise<AccountActiveResult> {
  const result = await getAccountStatus(userId);

  if (result.status == null || result.status === "ativo") {
    return result;
  }

  if (result.status === "inativo") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Conta inativa. Entre em contato com o suporte AFU.",
    });
  }

  // suspenso
  if (opts.allowPendingErasure && result.pendingErasure) {
    return result;
  }

  throw new TRPCError({
    code: "FORBIDDEN",
    message: result.pendingErasure
      ? "Conta suspensa por solicitação de exclusão LGPD. Cancele a exclusão para reativar o acesso completo."
      : "Conta suspensa. Entre em contato com o suporte AFU.",
  });
}
