/**
 * Etapa 7 — namespacing de cache React Query / tRPC por organização ativa.
 *
 * O servidor ignora `cacheScope` (usa membership da sessão).
 * O cliente inclui o id no input para que duas orgs não compartilhem a mesma query key.
 */
import { z } from "zod";

export const tenantCacheScopeSchema = z.object({
  cacheScope: z.number().int().positive().optional(),
});

export type TenantCacheScopeInput = z.infer<typeof tenantCacheScopeSchema>;

/** Input mínimo para listagens tenant-scoped no cliente */
export function tenantCacheInput(
  activeOrganizationId: number | null | undefined,
): TenantCacheScopeInput {
  return {
    cacheScope: activeOrganizationId && activeOrganizationId > 0 ? activeOrganizationId : undefined,
  };
}

/**
 * Merge cacheScope em inputs de propriedade (métricas/overview).
 * Garante chave RQ distinta por org mesmo com o mesmo propriedadeId.
 */
export function withTenantCacheScope<T extends Record<string, unknown>>(
  input: T,
  activeOrganizationId: number | null | undefined,
): T & TenantCacheScopeInput {
  return {
    ...input,
    ...tenantCacheInput(activeOrganizationId),
  };
}

/** Predicate para invalidar queries cujo input tem cacheScope === orgId */
export function matchesTenantCacheScope(
  queryKey: readonly unknown[],
  organizationId: number,
): boolean {
  // tRPC RQ keys: [ [path], { input, type } ]
  for (const part of queryKey) {
    if (part && typeof part === "object" && "input" in (part as object)) {
      const input = (part as { input?: { cacheScope?: number } }).input;
      if (input?.cacheScope === organizationId) return true;
    }
    if (
      part &&
      typeof part === "object" &&
      "cacheScope" in (part as object) &&
      (part as { cacheScope?: number }).cacheScope === organizationId
    ) {
      return true;
    }
  }
  return false;
}
