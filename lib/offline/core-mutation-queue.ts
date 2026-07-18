/**
 * Fila de mutações offline (propriedades, cultivos, terrenos, eventos, tarefas).
 * Etapa 8: isolada por usuário + organização + dispositivo; nunca processa
 * itens de outro escopo.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  classifySyncFailure,
  recordSyncConflict,
} from "./sync-conflicts";
import {
  coreQueueStorageKey,
  discardLegacyGlobalQueue,
  isValidOfflineScope,
  type OfflineTenantScope,
} from "./tenant-scope";
import { openJson, sealJson } from "./secure-blob";

const MAX_RETRIES = 5;

export type CoreEntity = "propriedade" | "cultivo" | "terreno" | "evento" | "tarefa";
export type CoreAction = "create" | "update" | "delete";

export interface CoreMutationItem {
  id: string;
  clientMutationId: string;
  userId: number;
  organizationId: number;
  deviceId: string;
  entity: CoreEntity;
  action: CoreAction;
  payload: Record<string, unknown>;
  timestamp: number;
  tentativas: number;
  lastError?: string;
}

export type CoreMutationExecutor = (item: CoreMutationItem) => Promise<unknown>;

function assertScope(scope: OfflineTenantScope): OfflineTenantScope {
  if (!isValidOfflineScope(scope)) {
    throw new Error("Escopo offline inválido — autentique-se com organização ativa");
  }
  return scope;
}

function itemBelongsToScope(item: CoreMutationItem, scope: OfflineTenantScope): boolean {
  return (
    item.userId === scope.userId &&
    item.organizationId === scope.organizationId &&
    item.deviceId === scope.deviceId
  );
}

export async function loadCoreQueue(scope: OfflineTenantScope): Promise<CoreMutationItem[]> {
  assertScope(scope);
  await discardLegacyGlobalQueue();
  try {
    const raw = await AsyncStorage.getItem(coreQueueStorageKey(scope));
    const parsed = await openJson<CoreMutationItem[]>(raw);
    if (!parsed) return [];
    // Defesa em profundidade: filtra itens de outro tenant
    return parsed.filter((item) => itemBelongsToScope(item, scope));
  } catch {
    return [];
  }
}

async function saveCoreQueue(
  scope: OfflineTenantScope,
  queue: CoreMutationItem[],
): Promise<void> {
  assertScope(scope);
  const sealed = await sealJson(queue);
  await AsyncStorage.setItem(coreQueueStorageKey(scope), sealed);
}

export async function enqueueCoreMutation(
  scope: OfflineTenantScope,
  item: Omit<
    CoreMutationItem,
    "id" | "timestamp" | "tentativas" | "userId" | "organizationId" | "deviceId" | "clientMutationId"
  > & { clientMutationId?: string },
): Promise<CoreMutationItem> {
  assertScope(scope);
  const queue = await loadCoreQueue(scope);
  const entry: CoreMutationItem = {
    ...item,
    id: `core_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    clientMutationId:
      item.clientMutationId ??
      `cm_${scope.userId}_${scope.organizationId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId: scope.userId,
    organizationId: scope.organizationId,
    deviceId: scope.deviceId,
    timestamp: Date.now(),
    tentativas: 0,
  };
  queue.push(entry);
  await saveCoreQueue(scope, queue);
  return entry;
}

export async function pendingCoreMutationsCount(scope: OfflineTenantScope): Promise<number> {
  if (!isValidOfflineScope(scope)) return 0;
  const queue = await loadCoreQueue(scope);
  return queue.length;
}

export async function processCoreQueue(
  scope: OfflineTenantScope,
  executor: CoreMutationExecutor,
): Promise<{ success: number; failed: number; conflicts: number }> {
  assertScope(scope);
  const queue = await loadCoreQueue(scope);
  if (queue.length === 0) return { success: 0, failed: 0, conflicts: 0 };

  const remaining: CoreMutationItem[] = [];
  let success = 0;
  let failed = 0;
  let conflicts = 0;

  for (const item of queue) {
    if (!itemBelongsToScope(item, scope)) {
      // Nunca enviar fila de outro cliente
      conflicts += 1;
      await recordSyncConflict(scope, {
        clientMutationId: item.clientMutationId ?? item.id,
        entity: item.entity,
        action: item.action,
        reason: "scope_mismatch",
        message: "Item de fila não pertence ao escopo ativo — descartado",
        payload: { entity: item.entity, action: item.action },
      });
      continue;
    }

    try {
      await executor(item);
      success += 1;
    } catch (error: unknown) {
      const classified = classifySyncFailure(error);
      if (classified.permanent) {
        conflicts += 1;
        await recordSyncConflict(scope, {
          clientMutationId: item.clientMutationId ?? item.id,
          entity: item.entity,
          action: item.action,
          resourceId: item.payload?.id != null ? String(item.payload.id) : undefined,
          reason: classified.reason,
          message: classified.message,
          payload: item.payload,
        });
        continue;
      }

      const tentativas = item.tentativas + 1;
      if (tentativas >= MAX_RETRIES) {
        conflicts += 1;
        failed += 1;
        await recordSyncConflict(scope, {
          clientMutationId: item.clientMutationId ?? item.id,
          entity: item.entity,
          action: item.action,
          resourceId: item.payload?.id != null ? String(item.payload.id) : undefined,
          reason: "max_retries",
          message: classified.message,
          payload: item.payload,
        });
        continue;
      }
      remaining.push({
        ...item,
        tentativas,
        lastError: classified.message,
      });
      failed += 1;
    }
  }

  await saveCoreQueue(scope, remaining);
  return { success, failed, conflicts };
}

export async function clearCoreQueue(scope: OfflineTenantScope): Promise<void> {
  if (!isValidOfflineScope(scope)) return;
  await AsyncStorage.removeItem(coreQueueStorageKey(scope));
}
