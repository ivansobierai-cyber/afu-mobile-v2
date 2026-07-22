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
  adminKeys,
  adminStoragePrefix,
  buildAdminScope,
  clearAdminScopeStorage,
  discardLegacyAdminStorage,
  LEGACY_ADMIN_STORAGE_KEYS,
} from "@/lib/admin/admin-storage-scope";

describe("admin storage scope", () => {
  beforeEach(() => {
    store.clear();
  });

  it("buildAdminScope exige user e org positivos", () => {
    expect(buildAdminScope(1, 2)).toEqual({ userId: 1, organizationId: 2 });
    expect(buildAdminScope(null, 2)).toBeNull();
    expect(buildAdminScope(1, 0)).toBeNull();
  });

  it("chaves diferem entre usuários e organizações", () => {
    const a = { userId: 1, organizationId: 10 };
    const b = { userId: 1, organizationId: 11 };
    const c = { userId: 2, organizationId: 10 };
    expect(adminStoragePrefix(a)).not.toBe(adminStoragePrefix(b));
    expect(adminStoragePrefix(a)).not.toBe(adminStoragePrefix(c));
    expect(adminKeys(a).CONTEUDOS).not.toBe(adminKeys(b).CONTEUDOS);
    expect(adminKeys(a).MODULOS).toContain("afu:admin:u1:o10");
  });

  it("discardLegacyAdminStorage remove chaves globais antigas", async () => {
    for (const k of LEGACY_ADMIN_STORAGE_KEYS) {
      store.set(k, "[]");
    }
    store.set(adminKeys({ userId: 1, organizationId: 1 }).CONTEUDOS, '[{"id":1}]');
    await discardLegacyAdminStorage();
    for (const k of LEGACY_ADMIN_STORAGE_KEYS) {
      expect(store.has(k)).toBe(false);
    }
    expect(store.get(adminKeys({ userId: 1, organizationId: 1 }).CONTEUDOS)).toBe('[{"id":1}]');
  });

  it("clearAdminScopeStorage não apaga outro tenant", async () => {
    const a = { userId: 1, organizationId: 10 };
    const b = { userId: 1, organizationId: 11 };
    store.set(adminKeys(a).MODULOS, "A");
    store.set(adminKeys(b).MODULOS, "B");
    await clearAdminScopeStorage(a);
    expect(store.has(adminKeys(a).MODULOS)).toBe(false);
    expect(store.get(adminKeys(b).MODULOS)).toBe("B");
  });
});
