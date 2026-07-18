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
import { trpc } from "@/lib/trpc";

/**
 * Fila offline para mutações core (propriedades, cultivos, terrenos, eventos).
 * Tenta executar online; se falhar por rede, enfileira e sincroniza ao reconectar.
 */
export function useCoreOfflineSync() {
  const utils = trpc.useUtils();
  const [isOnline, setIsOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncingRef = useRef(false);

  const refreshPending = useCallback(async () => {
    setPending(await pendingCoreMutationsCount());
  }, []);

  const executeItem = useCallback(
    async (item: CoreMutationItem): Promise<unknown> => {
      const { entity, action, payload } = item;
      const id = payload.id as number | undefined;
      let result: unknown;

      if (entity === "propriedade") {
        if (action === "create") result = await utils.client.coreData.propriedades.create.mutate(payload as any);
        else if (action === "update" && id) result = await utils.client.coreData.propriedades.update.mutate({ id, data: payload.data as any });
        else if (action === "delete" && id) result = await utils.client.coreData.propriedades.delete.mutate({ id });
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
        if (action === "create") result = await utils.client.coreData.tarefas.create.mutate(payload as any);
        else if (action === "update" && id) {
          result = await utils.client.coreData.tarefas.transition.mutate({
            id,
            status: payload.status as any,
            motivoCancelamento: payload.motivoCancelamento as string | undefined,
            notasApontamento: payload.notasApontamento as string | undefined,
            areaExecutada: payload.areaExecutada as number | undefined,
          });
        }
      }

      await Promise.all([
        utils.coreData.propriedades.list.invalidate(),
        utils.coreData.cultivos.list.invalidate(),
        utils.coreData.calendario.list.invalidate(),
        utils.coreData.terrenos.listByPropriedade.invalidate(),
        utils.coreData.tarefas.listByPropriedade.invalidate(),
        utils.coreData.tarefas.resumoHoje.invalidate(),
      ]);

      return result;
    },
    [utils]
  );

  const syncNow = useCallback(async () => {
    if (syncingRef.current) return { success: 0, failed: 0 };
    syncingRef.current = true;
    setIsSyncing(true);
    try {
      const result = await processCoreQueue(executeItem);
      await refreshPending();
      return result;
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }
  }, [executeItem, refreshPending]);

  const queueMutation = useCallback(
    async (entity: CoreEntity, action: CoreAction, payload: Record<string, unknown>) => {
      if (isOnline) {
        try {
          const result = await executeItem({
            id: "live",
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

      await enqueueCoreMutation({ entity, action, payload });
      await refreshPending();
      return { queued: true as const };
    },
    [executeItem, isOnline, refreshPending]
  );

  useEffect(() => {
    refreshPending();
    loadCoreQueue().then((q) => setPending(q.length));

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
  }, [refreshPending, syncNow]);

  return {
    isOnline,
    pending,
    isSyncing,
    queueMutation,
    syncNow,
    refreshPending,
  };
}
