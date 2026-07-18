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
  loadCoreQueue,
  pendingCoreMutationsCount,
  processCoreQueue,
} from "@/lib/offline/core-mutation-queue";
import type { OfflineTenantScope } from "@/lib/offline/tenant-scope";
import { listSyncConflicts } from "@/lib/offline/sync-conflicts";
import { coreQueueStorageKey } from "@/lib/offline/tenant-scope";

const scopeA: OfflineTenantScope = {
  userId: 1,
  organizationId: 10,
  deviceId: "dev_a",
};

const scopeB: OfflineTenantScope = {
  userId: 2,
  organizationId: 20,
  deviceId: "dev_a",
};

describe("core mutation queue (Etapa 8 tenant scope)", () => {
  beforeEach(async () => {
    store.clear();
    await clearCoreQueue(scopeA);
    await clearCoreQueue(scopeB);
  });

  it("enfileira mutações namespaced por user+org+device", async () => {
    await enqueueCoreMutation(scopeA, {
      entity: "propriedade",
      action: "create",
      payload: { nome: "Fazenda Norte" },
    });
    await enqueueCoreMutation(scopeA, {
      entity: "cultivo",
      action: "update",
      payload: { id: 1, data: { nomeCultura: "Soja" } },
    });

    expect(await pendingCoreMutationsCount(scopeA)).toBe(2);
    expect(await pendingCoreMutationsCount(scopeB)).toBe(0);
    const queue = await loadCoreQueue(scopeA);
    expect(queue[0].organizationId).toBe(10);
    expect(queue[0].userId).toBe(1);
    expect(queue[0].clientMutationId).toBeTruthy();
  });

  it("nunca entrega fila de um cliente a outro escopo", async () => {
    await enqueueCoreMutation(scopeA, {
      entity: "evento",
      action: "create",
      payload: { titulo: "Plantio A" },
    });
    await enqueueCoreMutation(scopeB, {
      entity: "evento",
      action: "create",
      payload: { titulo: "Plantio B" },
    });

    const a = await loadCoreQueue(scopeA);
    const b = await loadCoreQueue(scopeB);
    expect(a).toHaveLength(1);
    expect(b).toHaveLength(1);
    expect(a[0].payload.titulo).toBe("Plantio A");
    expect(b[0].payload.titulo).toBe("Plantio B");
    expect(coreQueueStorageKey(scopeA)).not.toBe(coreQueueStorageKey(scopeB));
  });

  it("processa fila com sucesso e esvazia", async () => {
    await enqueueCoreMutation(scopeA, {
      entity: "evento",
      action: "create",
      payload: { titulo: "Plantio" },
    });

    const result = await processCoreQueue(scopeA, async () => undefined);
    expect(result.success).toBe(1);
    expect(result.failed).toBe(0);
    expect(await pendingCoreMutationsCount(scopeA)).toBe(0);
  });

  it("mantém item na fila após falha de rede e incrementa tentativas", async () => {
    await enqueueCoreMutation(scopeA, {
      entity: "terreno",
      action: "delete",
      payload: { id: 9 },
    });

    const result = await processCoreQueue(scopeA, async () => {
      throw new Error("Network error");
    });

    expect(result.failed).toBe(1);
    const queue = await loadCoreQueue(scopeA);
    expect(queue).toHaveLength(1);
    expect(queue[0].tentativas).toBe(1);
    expect(queue[0].lastError).toContain("Network");
  });

  it("descarta item permanente (FORBIDDEN) e registra conflito", async () => {
    await enqueueCoreMutation(scopeA, {
      entity: "propriedade",
      action: "update",
      payload: { id: 1, data: { nome: "X" } },
    });

    const result = await processCoreQueue(scopeA, async () => {
      throw Object.assign(new Error("Sem permissão"), { data: { code: "FORBIDDEN" } });
    });

    expect(result.conflicts).toBe(1);
    expect(await pendingCoreMutationsCount(scopeA)).toBe(0);
    const conflicts = await listSyncConflicts(scopeA);
    expect(conflicts[0]?.reason).toBe("permission_denied");
  });

  it("descarta item após max retries e registra conflito", async () => {
    await enqueueCoreMutation(scopeA, {
      entity: "propriedade",
      action: "create",
      payload: { nome: "X" },
    });

    for (let i = 0; i < 5; i++) {
      await processCoreQueue(scopeA, async () => {
        throw new Error("fail");
      });
    }

    expect(await pendingCoreMutationsCount(scopeA)).toBe(0);
    const conflicts = await listSyncConflicts(scopeA);
    expect(conflicts.some((c) => c.reason === "max_retries")).toBe(true);
  });
});
