import { describe, expect, it } from "vitest";
import {
  matchesTenantCacheScope,
  tenantCacheInput,
  withTenantCacheScope,
} from "../lib/trpc-cache-scope";
import { safraLabelsMatch } from "../lib/propriedades/safra-label";

describe("tenant cache scope (Etapa 7)", () => {
  it("tenantCacheInput só inclui cacheScope quando há org ativa", () => {
    expect(tenantCacheInput(null)).toEqual({ cacheScope: undefined });
    expect(tenantCacheInput(undefined)).toEqual({ cacheScope: undefined });
    expect(tenantCacheInput(0)).toEqual({ cacheScope: undefined });
    expect(tenantCacheInput(12)).toEqual({ cacheScope: 12 });
  });

  it("withTenantCacheScope não sobrescreve propriedadeId e isola orgs", () => {
    const a = withTenantCacheScope({ propriedadeId: 15, nomeSafra: "Safra 2026/27" }, 1);
    const b = withTenantCacheScope({ propriedadeId: 15, nomeSafra: "Safra 2026/27" }, 2);
    expect(a.propriedadeId).toBe(15);
    expect(a.cacheScope).toBe(1);
    expect(b.cacheScope).toBe(2);
    expect(a).not.toEqual(b);
  });

  it("matchesTenantCacheScope reconhece chave tRPC com input.cacheScope", () => {
    const keyA = [["coreData", "dashboard", "stats"], { input: { cacheScope: 10 }, type: "query" }];
    const keyB = [["coreData", "dashboard", "stats"], { input: { cacheScope: 20 }, type: "query" }];
    expect(matchesTenantCacheScope(keyA, 10)).toBe(true);
    expect(matchesTenantCacheScope(keyA, 20)).toBe(false);
    expect(matchesTenantCacheScope(keyB, 20)).toBe(true);
    expect(matchesTenantCacheScope(keyB, 10)).toBe(false);
  });

  it("matchesTenantCacheScope aceita cacheScope no objeto de input direto", () => {
    expect(matchesTenantCacheScope([{ cacheScope: 7, propriedadeId: 1 }], 7)).toBe(true);
    expect(matchesTenantCacheScope([{ cacheScope: 7, propriedadeId: 1 }], 8)).toBe(false);
  });
});

describe("safraLabelsMatch (Etapa 7)", () => {
  it("iguala rótulos com e sem prefixo Safra", () => {
    expect(safraLabelsMatch("Safra 2026/27", "2026/27")).toBe(true);
    expect(safraLabelsMatch("safra 2026/27", "Safra 2026/27")).toBe(true);
    expect(safraLabelsMatch("Safra 2025/26", "Safra 2026/27")).toBe(false);
    expect(safraLabelsMatch(null, "Safra 2026/27")).toBe(false);
  });
});
