import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";
import {
  CoreMutationItem,
  enqueueCoreMutation,
  loadCoreQueue,
  pendingCoreMutationsCount,
  processCoreQueue,
  type CoreAction,
  type CoreEntity,
} from "@/lib/offline/core-mutation-queue";
import { cleanupOfflineScope } from "@/lib/offline/session-cleanup";
import { trpc } from "@/lib/trpc";
import { tenantCacheInput } from "@/lib/trpc-cache-scope";
import { useOfflineTenantScope } from "@/hooks/use-offline-tenant-scope";

/**
 * Fila offline para mutações core (propriedades, cultivos, terrenos, eventos).
 * Etapa 8: escopo user+org+device; revalida permissões no servidor a cada sync.
 */
export function useCoreOfflineSync() {
  const utils = trpc.useUtils();
  const { scope } = useOfflineTenantScope();
  const scopeRef = useRef(scope);
  scopeRef.current = scope;

  const cacheScope = tenantCacheInput(scope?.organizationId);
  const [isOnline, setIsOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastConflicts, setLastConflicts] = useState(0);
  const syncingRef = useRef(false);
  const prevScopeKey = useRef<string | null>(null);

  const refreshPending = useCallback(async () => {
    const active = scopeRef.current;
    if (!active) {
      setPending(0);
      return;
    }
    setPending(await pendingCoreMutationsCount(active));
  }, []);

  const executeItem = useCallback(
    async (item: CoreMutationItem): Promise<unknown> => {
      const active = scopeRef.current;
      if (!active) {
        throw new Error("Sem escopo offline ativo — permissões não revalidadas");
      }
      if (
        item.userId !== active.userId ||
        item.organizationId !== active.organizationId ||
        item.deviceId !== active.deviceId
      ) {
        throw Object.assign(new Error("Item de fila de outro tenant"), {
          data: { code: "FORBIDDEN" },
        });
      }

      const { entity, action, payload } = item;
      const id = payload.id as number | undefined;
      let result: unknown;

      // Servidor revalida membership + org permissions em cada mutate (organizationProcedure).
      if (entity === "propriedade") {
        if (action === "create") result = await utils.client.coreData.propriedades.create.mutate(payload as any);
        else if (action === "update" && id) result = await utils.client.coreData.propriedades.update.mutate({ id, data: payload.data as any });
        else if (action === "delete" && id)
          result = await utils.client.coreData.propriedades.delete.mutate({
            id,
            confirmNome: String(payload.confirmNome ?? payload.nome ?? ""),
          });
      } else if (entity === "cultivo") {
        if (action === "create") result = await utils.client.coreData.cultivos.create.mutate(payload as any);
        else if (action === "update" && id) result = await utils.client.coreData.cultivos.update.mutate({ id, data: payload.data as any });
        else if (action === "delete" && id) result = await utils.client.coreData.cultivos.delete.mutate({ id });
      } else if (entity === "terreno") {
        if (action === "create") result = await utils.client.coreData.terrenos.create.mutate(payload as any);
        else if (action === "update" && id) result = await utils.client.coreData.terrenos.update.mutate({ id, data: payload.data as any });
        else if (action === "delete" && id) result = await utils.client.coreData.terrenos.delete.mutate({ id });
      } else if (entity === "evento") {
        if (action === "create") result = await utils.client.coreData.calendario.create.mutate(payload as any);
        else if (action === "update" && id) result = await utils.client.coreData.calendario.update.mutate({ id, data: payload.data as any });
        else if (action === "delete" && id) result = await utils.client.coreData.calendario.delete.mutate({ id });
      } else if (entity === "tarefa") {
        if (action === "create") {
          result = await utils.client.coreData.tarefas.create.mutate({
            ...(payload as any),
            clientMutationId: item.clientMutationId,
          });
        } else if (action === "update" && id) {
          result = await utils.client.coreData.tarefas.transition.mutate({
            id,
            status: payload.status as any,
            motivoCancelamento: payload.motivoCancelamento as string | undefined,
            notasApontamento: payload.notasApontamento as string | undefined,
            areaExecutada: payload.areaExecutada as number | undefined,
            expectedStatus: payload.expectedStatus as any,
            clientMutationId: item.clientMutationId,
            deviceId: item.deviceId,
            consumos: payload.consumos as any,
          });
        }
      }

      await Promise.all([
        utils.coreData.propriedades.list.invalidate(cacheScope),
        utils.coreData.cultivos.list.invalidate(cacheScope),
        utils.coreData.calendario.list.invalidate(cacheScope),
        utils.coreData.dashboard.stats.invalidate(cacheScope),
        utils.coreData.terrenos.listByPropriedade.invalidate(),
        utils.coreData.tarefas.listByPropriedade.invalidate(),
        utils.coreData.tarefas.resumoHoje.invalidate(),
      ]);

      return result;
    },
    [utils, cacheScope],
  );

  const syncNow = useCallback(async () => {
    const active = scopeRef.current;
    if (!active) return { success: 0, failed: 0, conflicts: 0 };
    if (syncingRef.current) return { success: 0, failed: 0, conflicts: 0 };
    syncingRef.current = true;
    setIsSyncing(true);
    try {
      const result = await processCoreQueue(active, executeItem);
      setLastConflicts(result.conflicts);
      await refreshPending();
      return result;
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }
  }, [executeItem, refreshPending]);

  const queueMutation = useCallback(
    async (entity: CoreEntity, action: CoreAction, payload: Record<string, unknown>) => {
      const active = scopeRef.current;
      if (!active) {
        throw new Error("Sem organização ativa — não é possível salvar offline");
      }

      if (isOnline) {
        try {
          const result = await executeItem({
            id: "live",
            clientMutationId: `live_${Date.now()}`,
            userId: active.userId,
            organizationId: active.organizationId,
            deviceId: active.deviceId,
            entity,
            action,
            payload,
            timestamp: Date.now(),
            tentativas: 0,
          });
          return { queued: false as const, result };
        } catch (error: any) {
          const msg = String(error?.message ?? error ?? "");
          const networkError =
            msg.includes("Network") ||
            msg.includes("fetch") ||
            msg.includes("Failed to fetch") ||
            msg.includes("network");
          if (!networkError) throw error;
        }
      }

      await enqueueCoreMutation(active, { entity, action, payload });
      await refreshPending();
      return { queued: true as const };
    },
    [executeItem, isOnline, refreshPending],
  );

  // Troca de org/conta: atualiza contagem; não processa fila da org anterior
  useEffect(() => {
    const key = scope ? `${scope.userId}:${scope.organizationId}:${scope.deviceId}` : null;
    const prev = prevScopeKey.current;
    prevScopeKey.current = key;
    if (prev && key && prev !== key) {
      const [prevUser] = prev.split(":");
      const mode =
        prevUser !== String(scope?.userId) ? "account_switch" : "org_switch";
      // org_switch mantém fila namespaced; account_switch limpa escopo anterior via caller
      if (mode === "org_switch") {
        void cleanupOfflineScope(null, "org_switch");
      }
    }
    void refreshPending();
    if (scope) {
      void loadCoreQueue(scope).then((q) => setPending(q.length));
    } else {
      setPending(0);
    }
  }, [scope, refreshPending]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      void syncNow();
    };
    const handleOffline = () => setIsOnline(false);

    if (Platform.OS === "web" && typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }

    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const online = state.isConnected === true && state.isInternetReachable !== false;
      if (online) {
        handleOnline();
      } else {
        handleOffline();
      }
    });

    void NetInfo.fetch().then((state: NetInfoState) => {
      const online = state.isConnected === true && state.isInternetReachable !== false;
      setIsOnline(online);
      if (online) void syncNow();
    });

    return () => unsubscribe();
  }, [syncNow]);

  return {
    isOnline,
    pending,
    isSyncing,
    lastConflicts,
    scope,
    queueMutation,
    syncNow,
    refreshPending,
  };
}
