/**
 * Fila de mutações offline para dados core (propriedades, cultivos, terrenos).
 * Persiste em AsyncStorage e reprocessa ao reconectar.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const QUEUE_KEY = "afu_core_mutation_queue";
const MAX_RETRIES = 5;

export type CoreEntity = "propriedade" | "cultivo" | "terreno" | "evento" | "tarefa";
export type CoreAction = "create" | "update" | "delete";

export interface CoreMutationItem {
  id: string;
  entity: CoreEntity;
  action: CoreAction;
  payload: Record<string, unknown>;
  timestamp: number;
  tentativas: number;
  lastError?: string;
}

export type CoreMutationExecutor = (item: CoreMutationItem) => Promise<unknown>;

export async function loadCoreQueue(): Promise<CoreMutationItem[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as CoreMutationItem[]) : [];
  } catch {
    return [];
  }
}

async function saveCoreQueue(queue: CoreMutationItem[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function enqueueCoreMutation(
  item: Omit<CoreMutationItem, "id" | "timestamp" | "tentativas">
): Promise<CoreMutationItem> {
  const queue = await loadCoreQueue();
  const entry: CoreMutationItem = {
    ...item,
    id: `core_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    tentativas: 0,
  };
  queue.push(entry);
  await saveCoreQueue(queue);
  return entry;
}

export async function pendingCoreMutationsCount(): Promise<number> {
  const queue = await loadCoreQueue();
  return queue.length;
}

export async function processCoreQueue(
  executor: CoreMutationExecutor
): Promise<{ success: number; failed: number }> {
  const queue = await loadCoreQueue();
  if (queue.length === 0) return { success: 0, failed: 0 };

  const remaining: CoreMutationItem[] = [];
  let success = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      await executor(item);
      success += 1;
    } catch (error: any) {
      const tentativas = item.tentativas + 1;
      if (tentativas >= MAX_RETRIES) {
        failed += 1;
        continue;
      }
      remaining.push({
        ...item,
        tentativas,
        lastError: error?.message ?? "Erro desconhecido",
      });
      failed += 1;
    }
  }

  await saveCoreQueue(remaining);
  return { success, failed };
}

export async function clearCoreQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}
