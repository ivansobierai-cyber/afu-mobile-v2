import { useCallback } from "react";
import { Alert } from "react-native";
import type { CoreAction, CoreEntity } from "@/lib/offline/core-mutation-queue";
import { useCoreOfflineSync } from "./use-core-offline-sync";

const OFFLINE_MESSAGE =
  "Salvo offline. As alterações serão sincronizadas quando a conexão voltar.";

export type CoreMutationResult =
  | { queued: true }
  | { queued: false; result?: unknown };

export function useRunCoreMutation() {
  const { queueMutation } = useCoreOfflineSync();

  const runMutation = useCallback(
    async (
      entity: CoreEntity,
      action: CoreAction,
      payload: Record<string, unknown>,
      options?: { silentOffline?: boolean },
    ): Promise<CoreMutationResult> => {
      const result = await queueMutation(entity, action, payload);
      if (result.queued && !options?.silentOffline) {
        Alert.alert("Sem conexão", OFFLINE_MESSAGE);
      }
      return result;
    },
    [queueMutation],
  );

  return { runMutation };
}
