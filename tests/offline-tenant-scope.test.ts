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
  buildOfflineScope,
  coreQueueStorageKey,
  tenantStoragePrefix,
} from "@/lib/offline/tenant-scope";
import { localDbClearScope, localDbGet, localDbSet } from "@/lib/offline/tenant-local-db";
import { cleanupOfflineScope } from "@/lib/offline/session-cleanup";
import { enqueueCoreMutation, pendingCoreMutationsCount } from "@/lib/offline/core-mutation-queue";
import { classifySyncFailure } from "@/lib/offline/sync-conflicts";

describe("offline tenant scope helpers (Etapa 8)", () => {
  beforeEach(() => {
    store.clear();
  });

  it("buildOfflineScope exige userId e organizationId positivos", () => {
    expect(buildOfflineScope(1, 2, "dev")).toEqual({
      userId: 1,
      organizationId: 2,
      deviceId: "dev",
    });
    expect(buildOfflineScope(null, 2, "dev")).toBeNull();
    expect(buildOfflineScope(1, 0, "dev")).toBeNull();
  });

  it("chaves de storage diferem entre orgs no mesmo aparelho", () => {
    const a = { userId: 1, organizationId: 10, deviceId: "d1" };
    const b = { userId: 1, organizationId: 11, deviceId: "d1" };
    expect(tenantStoragePrefix(a)).not.toBe(tenantStoragePrefix(b));
    expect(coreQueueStorageKey(a)).not.toBe(coreQueueStorageKey(b));
  });

  it("banco local isola valores por escopo", async () => {
    const a = { userId: 1, organizationId: 10, deviceId: "d1" };
    const b = { userId: 2, organizationId: 20, deviceId: "d1" };
    await localDbSet(a, "cart", "items", [{ id: 1 }]);
    await localDbSet(b, "cart", "items", [{ id: 2 }]);
    expect(await localDbGet(a, "cart", "items")).toEqual([{ id: 1 }]);
    expect(await localDbGet(b, "cart", "items")).toEqual([{ id: 2 }]);
  });

  it("logout limpa fila e db do escopo; org_switch não apaga fila namespaced", async () => {
    const scope = { userId: 1, organizationId: 10, deviceId: "d1" };
    await enqueueCoreMutation(scope, {
      entity: "evento",
      action: "create",
      payload: { titulo: "X" },
    });
    await localDbSet(scope, "prefs", "dashboard-cards", [{ id: "eventos" }]);

    await cleanupOfflineScope(scope, "org_switch");
    expect(await pendingCoreMutationsCount(scope)).toBe(1);

    await cleanupOfflineScope(scope, "logout");
    expect(await pendingCoreMutationsCount(scope)).toBe(0);
    expect(await localDbGet(scope, "prefs", "dashboard-cards")).toBeNull();
  });

  it("classifySyncFailure marca perda de permissão como permanente", () => {
    const r = classifySyncFailure({
      message: "FORBIDDEN",
      data: { code: "FORBIDDEN" },
    });
    expect(r.permanent).toBe(true);
    expect(r.reason).toBe("permission_denied");
  });
});
