/**
 * Etapa 8 — "banco local" lógico separado por usuário + organização + dispositivo.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  isValidOfflineScope,
  localDbStorageKey,
  tenantStoragePrefix,
  type OfflineTenantScope,
} from "./tenant-scope";
import { openJson, sealJson } from "./secure-blob";

export async function localDbGet<T>(
  scope: OfflineTenantScope,
  namespace: string,
  key: string,
): Promise<T | null> {
  if (!isValidOfflineScope(scope)) return null;
  const storageKey = localDbStorageKey(scope, namespace, key);
  try {
    const raw = await AsyncStorage.getItem(storageKey);
    return openJson<T>(raw);
  } catch {
    return null;
  }
}

export async function localDbSet(
  scope: OfflineTenantScope,
  namespace: string,
  key: string,
  value: unknown,
  options?: { sensitive?: boolean },
): Promise<void> {
  if (!isValidOfflineScope(scope)) {
    throw new Error("Escopo offline inválido");
  }
  const storageKey = localDbStorageKey(scope, namespace, key);
  const payload = options?.sensitive ? await sealJson(value) : JSON.stringify(value);
  await AsyncStorage.setItem(storageKey, payload);
}

export async function localDbRemove(
  scope: OfflineTenantScope,
  namespace: string,
  key: string,
): Promise<void> {
  if (!isValidOfflineScope(scope)) return;
  await AsyncStorage.removeItem(localDbStorageKey(scope, namespace, key));
}

/** Remove todas as chaves do prefixo do tenant neste dispositivo. */
export async function localDbClearScope(scope: OfflineTenantScope): Promise<number> {
  if (!isValidOfflineScope(scope)) return 0;
  const prefix = tenantStoragePrefix(scope);
  try {
    const keys = await AsyncStorage.getAllKeys();
    const mine = keys.filter((k) => k.startsWith(`${prefix}:`) || k === prefix);
    if (mine.length > 0) await AsyncStorage.multiRemove(mine);
    return mine.length;
  } catch {
    // getAllKeys pode falhar em alguns ambientes — limpa chaves conhecidas
    await AsyncStorage.multiRemove([
      localDbStorageKey(scope, "cart", "items"),
      localDbStorageKey(scope, "media", "drafts"),
      localDbStorageKey(scope, "prefs", "dashboard-cards"),
    ]).catch(() => undefined);
    return 0;
  }
}
