/**
 * Compat shim — implementação canônica em `account-status.ts`.
 * Mantém a assinatura WP-07 (`userId: number`) usada por auth-router / tests.
 */
import {
  assertAccountActive as assertAccountActiveCanonical,
  getAccountStatus,
  type AccountActiveResult,
} from "./account-status";

export type AssertAccountActiveOptions = {
  allowPendingErasure?: boolean;
};

export type { AccountActiveResult };

export { getAccountStatus };

export async function assertAccountActive(
  userId: number,
  opts: AssertAccountActiveOptions = {},
): Promise<AccountActiveResult> {
  return assertAccountActiveCanonical({ id: userId }, opts);
}
