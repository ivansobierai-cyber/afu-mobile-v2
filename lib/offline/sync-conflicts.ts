/**
 * Etapa 8 — registro local de conflitos / rejeições de sync.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  conflictsStorageKey,
  isValidOfflineScope,
  type OfflineTenantScope,
} from "./tenant-scope";

export type SyncConflictReason =
  | "permission_denied"
  | "unauthorized"
  | "not_found"
  | "geometry_version"
  | "operation_approved"
  | "invalid_transition"
  | "scope_mismatch"
  | "max_retries"
  | "other";

export type SyncConflictRecord = {
  id: string;
  clientMutationId: string;
  entity: string;
  action: string;
  resourceId?: string;
  reason: SyncConflictReason;
  message: string;
  payload?: Record<string, unknown>;
  createdAt: number;
  resolvedAt?: number;
};

async function loadAll(scope: OfflineTenantScope): Promise<SyncConflictRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(conflictsStorageKey(scope));
    return raw ? (JSON.parse(raw) as SyncConflictRecord[]) : [];
  } catch {
    return [];
  }
}

async function saveAll(scope: OfflineTenantScope, rows: SyncConflictRecord[]): Promise<void> {
  await AsyncStorage.setItem(conflictsStorageKey(scope), JSON.stringify(rows));
}

export async function listSyncConflicts(
  scope: OfflineTenantScope,
): Promise<SyncConflictRecord[]> {
  if (!isValidOfflineScope(scope)) return [];
  return loadAll(scope);
}

export async function recordSyncConflict(
  scope: OfflineTenantScope,
  input: Omit<SyncConflictRecord, "id" | "createdAt">,
): Promise<SyncConflictRecord> {
  if (!isValidOfflineScope(scope)) {
    throw new Error("Escopo offline inválido");
  }
  const rows = await loadAll(scope);
  const entry: SyncConflictRecord = {
    ...input,
    id: `cnf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  };
  rows.unshift(entry);
  // Mantém só os 100 mais recentes
  await saveAll(scope, rows.slice(0, 100));
  return entry;
}

export async function resolveSyncConflict(
  scope: OfflineTenantScope,
  conflictId: string,
): Promise<void> {
  if (!isValidOfflineScope(scope)) return;
  const rows = await loadAll(scope);
  const next = rows.map((r) =>
    r.id === conflictId ? { ...r, resolvedAt: Date.now() } : r,
  );
  await saveAll(scope, next);
}

export async function clearSyncConflicts(scope: OfflineTenantScope): Promise<void> {
  if (!isValidOfflineScope(scope)) return;
  await AsyncStorage.removeItem(conflictsStorageKey(scope));
}

/** Classifica erro tRPC/rede para decisão de retry vs conflito permanente. */
export function classifySyncFailure(error: unknown): {
  permanent: boolean;
  reason: SyncConflictReason;
  message: string;
} {
  const anyErr = error as {
    message?: string;
    data?: { code?: string };
    shape?: { data?: { code?: string } };
  };
  const code = anyErr?.data?.code ?? anyErr?.shape?.data?.code ?? "";
  const message = String(anyErr?.message ?? error ?? "Erro desconhecido");
  const upper = `${code} ${message}`.toUpperCase();

  if (upper.includes("FORBIDDEN") || upper.includes("PERMISSION")) {
    return { permanent: true, reason: "permission_denied", message };
  }
  if (upper.includes("UNAUTHORIZED")) {
    return { permanent: true, reason: "unauthorized", message };
  }
  if (upper.includes("NOT_FOUND") || upper.includes("RECURSO NÃO ENCONTRADO")) {
    return { permanent: true, reason: "not_found", message };
  }
  if (
    upper.includes("GEOMETRY_VERSION") ||
    (upper.includes("CONFLITO DE GEOMETRIA") || upper.includes("GEOMETRIA"))
  ) {
    return { permanent: true, reason: "geometry_version", message };
  }
  if (upper.includes("CONFLICT")) {
    if (upper.includes("APROVAD")) {
      return { permanent: true, reason: "operation_approved", message };
    }
    return { permanent: true, reason: "other", message };
  }
  if (upper.includes("APROVADA") || upper.includes("OPERATION_APPROVED")) {
    return { permanent: true, reason: "operation_approved", message };
  }
  if (upper.includes("TRANSIÇÃO INVÁLIDA") || upper.includes("INVALID_TRANSITION")) {
    return { permanent: true, reason: "invalid_transition", message };
  }
  return { permanent: false, reason: "other", message };
}
