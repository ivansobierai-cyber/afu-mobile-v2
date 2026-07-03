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
  },
}));

import {
  clearCoreQueue,
  enqueueCoreMutation,
  loadCoreQueue,
  pendingCoreMutationsCount,
  processCoreQueue,
} from "@/lib/offline/core-mutation-queue";

describe("core mutation queue", () => {
  beforeEach(async () => {
    store.clear();
    await clearCoreQueue();
  });

  it("enfileira mutações e conta pendentes", async () => {
    await enqueueCoreMutation({
      entity: "propriedade",
      action: "create",
      payload: { nome: "Fazenda Norte" },
    });
    await enqueueCoreMutation({
      entity: "cultivo",
      action: "update",
      payload: { id: 1, data: { nomeCultura: "Soja" } },
    });

    expect(await pendingCoreMutationsCount()).toBe(2);
    const queue = await loadCoreQueue();
    expect(queue[0].entity).toBe("propriedade");
    expect(queue[1].action).toBe("update");
  });

  it("processa fila com sucesso e esvazia", async () => {
    await enqueueCoreMutation({
      entity: "evento",
      action: "create",
      payload: { titulo: "Plantio" },
    });

    const result = await processCoreQueue(async () => undefined);
    expect(result.success).toBe(1);
    expect(result.failed).toBe(0);
    expect(await pendingCoreMutationsCount()).toBe(0);
  });

  it("mantém item na fila após falha e incrementa tentativas", async () => {
    await enqueueCoreMutation({
      entity: "terreno",
      action: "delete",
      payload: { id: 9 },
    });

    const result = await processCoreQueue(async () => {
      throw new Error("Network error");
    });

    expect(result.failed).toBe(1);
    const queue = await loadCoreQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].tentativas).toBe(1);
    expect(queue[0].lastError).toContain("Network");
  });

  it("descarta item após max retries", async () => {
    await enqueueCoreMutation({
      entity: "propriedade",
      action: "create",
      payload: { nome: "X" },
    });

    for (let i = 0; i < 5; i++) {
      await processCoreQueue(async () => {
        throw new Error("fail");
      });
    }

    expect(await pendingCoreMutationsCount()).toBe(0);
  });
});
