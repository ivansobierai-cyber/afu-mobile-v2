/**
 * Etapa 8 — resolve escopo offline a partir da sessão ativa.
 */
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  buildOfflineScope,
  getOrCreateDeviceId,
  type OfflineTenantScope,
} from "@/lib/offline/tenant-scope";

export function useOfflineTenantScope(): {
  scope: OfflineTenantScope | null;
  deviceId: string | null;
  ready: boolean;
} {
  const { data: session } = trpc.auth.session.useQuery(undefined, { staleTime: 60_000 });
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getOrCreateDeviceId().then((id) => {
      if (!cancelled) setDeviceId(id);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const userId = session?.user?.id ?? null;
  const organizationId = session?.activeOrganizationId ?? null;
  const scope =
    deviceId != null ? buildOfflineScope(userId, organizationId, deviceId) : null;

  return {
    scope,
    deviceId,
    ready: deviceId != null && !!session,
  };
}
