/**
 * Namespace AsyncStorage do admin offline por usuário + organização.
 * Evita vazamento de módulos/conteúdos entre contas no mesmo aparelho.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

export type AdminStorageScope = {
  userId: number;
  organizationId: number;
};

/** Chaves legadas (pré-namespace) — descartar ao entrar em escopo válido. */
export const LEGACY_ADMIN_STORAGE_KEYS = [
  "admin_modulos",
  "admin_conteudos",
  "admin_registros",
  "admin_itens",
  "admin_sync_queue",
  "admin_last_sync",
  "admin_conteudo_sync_queue",
] as const;

export function isValidAdminScope(
  scope: AdminStorageScope | null | undefined,
): scope is AdminStorageScope {
  return Boolean(
    scope &&
      Number.isFinite(scope.userId) &&
      scope.userId > 0 &&
      Number.isFinite(scope.organizationId) &&
      scope.organizationId > 0,
  );
}

export function buildAdminScope(
  userId: number | null | undefined,
  organizationId: number | null | undefined,
): AdminStorageScope | null {
  if (!userId || userId <= 0 || !organizationId || organizationId <= 0) return null;
  return { userId, organizationId };
}

export function adminStoragePrefix(scope: AdminStorageScope): string {
  return `afu:admin:u${scope.userId}:o${scope.organizationId}`;
}

export function adminStorageKey(scope: AdminStorageScope, leaf: string): string {
  const safe = String(leaf).replace(/[^a-zA-Z0-9._:-]/g, "_");
  return `${adminStoragePrefix(scope)}:${safe}`;
}

export function adminKeys(scope: AdminStorageScope) {
  return {
    MODULOS: adminStorageKey(scope, "modulos"),
    CONTEUDOS: adminStorageKey(scope, "conteudos"),
    REGISTROS: adminStorageKey(scope, "registros"),
    ITENS: adminStorageKey(scope, "itens"),
    SYNC_QUEUE: adminStorageKey(scope, "sync_queue"),
    LAST_SYNC: adminStorageKey(scope, "last_sync"),
    CONTEUDO_SYNC_QUEUE: adminStorageKey(scope, "conteudo_sync_queue"),
  } as const;
}

export async function discardLegacyAdminStorage(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([...LEGACY_ADMIN_STORAGE_KEYS]);
  } catch {
    // ignore
  }
}

/** Remove todas as chaves admin de um escopo (logout / troca de org). */
export async function clearAdminScopeStorage(scope: AdminStorageScope): Promise<void> {
  const keys = adminKeys(scope);
  try {
    await AsyncStorage.multiRemove(Object.values(keys));
  } catch {
    // ignore
  }
}
