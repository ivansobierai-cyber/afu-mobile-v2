import { View } from "react-native";
import { useSession } from "@/hooks/use-session";
import { useTokenRefresh } from "@/hooks/use-token-refresh";
import { useCoreOfflineSync } from "@/hooks/use-core-offline-sync";
import { OfflineSyncIndicator } from "@/components/offline-sync-indicator";

/**
 * Monta serviços de runtime do app: renovação de token e fila offline core.
 * Deve ficar dentro dos providers tRPC/Query e após AuthGuard.
 */
export function CoreOfflineSyncManager() {
  const { isAuthenticated, loading } = useSession();
  useTokenRefresh();
  const { isOnline, pending, isSyncing, syncNow } = useCoreOfflineSync();

  if (loading || !isAuthenticated) {
    return null;
  }

  if (isOnline && !isSyncing && pending === 0) {
    return null;
  }

  return (
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 100 }}>
      <OfflineSyncIndicator
        isOnline={isOnline}
        isSyncing={isSyncing}
        itemsPendentes={pending}
        onSyncPress={() => void syncNow()}
      />
    </View>
  );
}
