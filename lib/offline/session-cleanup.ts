/**
 * Etapa 8 — troca de conta/organização e logout sem vazar dados locais.
 */
import { clearCoreQueue } from "./core-mutation-queue";
import { clearSyncConflicts } from "./sync-conflicts";
import { discardLegacyGlobalQueue } from "./tenant-scope";
import { localDbClearScope } from "./tenant-local-db";
import type { OfflineTenantScope } from "./tenant-scope";

export type OfflineCleanupMode = "logout" | "org_switch" | "account_switch";

/**
 * Limpa dados locais do escopo ativo.
 * - logout / account_switch: remove fila, conflitos e banco local do escopo
 * - org_switch: não apaga a fila da org anterior (fica namespaced); só limpa legado global
 *
 * A fila da org anterior permanece isolada e só sincroniza quando essa org voltar a ser ativa.
 */
export async function cleanupOfflineScope(
  scope: OfflineTenantScope | null | undefined,
  mode: OfflineCleanupMode,
): Promise<void> {
  await discardLegacyGlobalQueue();

  if (!scope) {
    try {
      const { clearCart } = await import("@/lib/marketplace-cart");
      await clearCart(null);
    } catch {
      // ignore
    }
    return;
  }

  if (mode === "org_switch") {
    // Mantém filas da org anterior sob outra chave; não envia nem exibe no novo escopo.
    return;
  }

  await Promise.all([
    clearCoreQueue(scope),
    clearSyncConflicts(scope),
    localDbClearScope(scope),
  ]);

  try {
    const { clearCart } = await import("@/lib/marketplace-cart");
    await clearCart(scope);
  } catch {
    // ignore
  }

  if (mode === "logout" || mode === "account_switch") {
    try {
      const { clearStoredPushToken } = await import("@/lib/push-notifications");
      await clearStoredPushToken();
    } catch {
      // ignore
    }
    try {
      const { clearAllAiContexts } = await import("@/lib/ai/ai-context-store");
      await clearAllAiContexts();
    } catch {
      // ignore
    }
  }
}
