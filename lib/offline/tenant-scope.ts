/**
 * Etapa 8 — escopo offline: usuário + organização + dispositivo.
 * Todas as chaves locais e itens de fila devem carregar este namespace.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const DEVICE_ID_KEY = "afu:device_id:v1";
const LEGACY_QUEUE_KEY = "afu_core_mutation_queue";

export type OfflineTenantScope = {
  userId: number;
  organizationId: number;
  deviceId: string;
};

export function isValidOfflineScope(
  scope: OfflineTenantScope | null | undefined,
): scope is OfflineTenantScope {
  return Boolean(
    scope &&
      Number.isFinite(scope.userId) &&
      scope.userId > 0 &&
      Number.isFinite(scope.organizationId) &&
      scope.organizationId > 0 &&
      typeof scope.deviceId === "string" &&
      scope.deviceId.length > 0,
  );
}

export function buildOfflineScope(
  userId: number | null | undefined,
  organizationId: number | null | undefined,
  deviceId: string,
): OfflineTenantScope | null {
  if (!userId || userId <= 0 || !organizationId || organizationId <= 0 || !deviceId) {
    return null;
  }
  return { userId, organizationId, deviceId };
}

/** Prefixo lógico do "banco local" do tenant neste aparelho */
export function tenantStoragePrefix(scope: OfflineTenantScope): string {
  return `afu:u${scope.userId}:o${scope.organizationId}:d${scope.deviceId}`;
}

export function tenantStorageKey(scope: OfflineTenantScope, ...parts: string[]): string {
  const safe = parts.map((p) => String(p).replace(/[^a-zA-Z0-9._:-]/g, "_"));
  return `${tenantStoragePrefix(scope)}:${safe.join(":")}`;
}

export function coreQueueStorageKey(scope: OfflineTenantScope): string {
  return tenantStorageKey(scope, "queue", "core");
}

export function conflictsStorageKey(scope: OfflineTenantScope): string {
  return tenantStorageKey(scope, "sync", "conflicts");
}

export function localDbStorageKey(scope: OfflineTenantScope, namespace: string, key: string): string {
  return tenantStorageKey(scope, "db", namespace, key);
}

export function legacyCoreQueueKey(): string {
  return LEGACY_QUEUE_KEY;
}

async function readWebDeviceId(): Promise<string | null> {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(DEVICE_ID_KEY);
  } catch {
    return null;
  }
}

async function writeWebDeviceId(id: string): Promise<void> {
  if (Platform.OS !== "web" || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DEVICE_ID_KEY, id);
  } catch {
    // ignore
  }
}

/** ID estável por instalação (não é PII). */
export async function getOrCreateDeviceId(): Promise<string> {
  try {
    const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;
    const fromWeb = await readWebDeviceId();
    if (fromWeb) {
      await AsyncStorage.setItem(DEVICE_ID_KEY, fromWeb);
      return fromWeb;
    }
  } catch {
    // continua geração
  }

  const id = `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  try {
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  } catch {
    // ignore
  }
  await writeWebDeviceId(id);
  return id;
}

/** Descarta fila global legada (pré–Etapa 8) para não vazar entre contas. */
export async function discardLegacyGlobalQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LEGACY_QUEUE_KEY);
  } catch {
    // ignore
  }
}
