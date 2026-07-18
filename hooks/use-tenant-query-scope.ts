/**
 * Etapa 7 — escopo de cache do tenant ativo + invalidação ao trocar organização.
 */
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { tenantCacheInput, withTenantCacheScope } from "@/lib/trpc-cache-scope";

export function useTenantQueryScope() {
  const { data: session } = trpc.auth.session.useQuery(undefined, { staleTime: 60_000 });
  const activeOrganizationId = session?.activeOrganizationId ?? null;
  const queryClient = useQueryClient();
  const prevOrg = useRef<number | null | undefined>(undefined);

  useEffect(() => {
    const prev = prevOrg.current;
    prevOrg.current = activeOrganizationId;
    // Primeira hidratação: não limpa
    if (prev === undefined) return;
    if (prev !== activeOrganizationId) {
      // Troca de org: limpa cache para não entregar dados do cliente anterior
      void queryClient.clear();
    }
  }, [activeOrganizationId, queryClient]);

  return {
    activeOrganizationId,
    organizations: session?.organizations ?? [],
    activeRole: session?.activeRole ?? null,
    cacheInput: tenantCacheInput(activeOrganizationId),
    withScope: <T extends Record<string, unknown>>(input: T) =>
      withTenantCacheScope(input, activeOrganizationId),
  };
}

/** Invalida listagens do dashboard no escopo da org (após mutações) */
export function invalidateDashboardTenantQueries(
  utils: ReturnType<typeof trpc.useUtils>,
  organizationId: number | null | undefined,
) {
  const scope = tenantCacheInput(organizationId);
  return Promise.all([
    utils.coreData.propriedades.list.invalidate(scope),
    utils.coreData.cultivos.list.invalidate(scope),
    utils.coreData.calendario.list.invalidate(scope),
    utils.coreData.dashboard.stats.invalidate(scope),
    utils.secondaryData.analises.list.invalidate(scope),
    utils.secondaryData.relatorios.list.invalidate(scope),
    utils.diagnostico.historico.invalidate(scope),
  ]);
}
