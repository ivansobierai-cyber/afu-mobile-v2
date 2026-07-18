/**
 * Etapa 10 — usuário removido não consegue drenar fila offline do tenant.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, string>();

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async (key: string) => store.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn(async (key: string) => {
      store.delete(key);
    }),
    getAllKeys: vi.fn(async () => [...store.keys()]),
    multiRemove: vi.fn(async (keys: string[]) => {
      for (const k of keys) store.delete(k);
    }),
  },
}));

import {
  clearCoreQueue,
  enqueueCoreMutation,
  pendingCoreMutationsCount,
  processCoreQueue,
} from "@/lib/offline/core-mutation-queue";
import { listSyncConflicts } from "@/lib/offline/sync-conflicts";
import type { OfflineTenantScope } from "@/lib/offline/tenant-scope";

const scope: OfflineTenantScope = {
  userId: 99,
  organizationId: 77,
  deviceId: "dev_etapa10",
};

describe("Etapa 10 — sync com membership perdido", () => {
  beforeEach(async () => {
    store.clear();
    await clearCoreQueue(scope);
  });

  it("FORBIDDEN na sync remove item e registra conflito (não reenvia para outra conta)", async () => {
    await enqueueCoreMutation(scope, {
      entity: "propriedade",
      action: "update",
      payload: { id: 1, data: { nome: "X" } },
    });
    expect(await pendingCoreMutationsCount(scope)).toBe(1);

    const result = await processCoreQueue(scope, async () => {
      throw Object.assign(new Error("Recurso não encontrado"), {
        data: { code: "FORBIDDEN" },
      });
    });

    expect(result.conflicts).toBe(1);
    expect(await pendingCoreMutationsCount(scope)).toBe(0);
    const conflicts = await listSyncConflicts(scope);
    expect(conflicts[0]?.reason).toBe("permission_denied");
  });
});
