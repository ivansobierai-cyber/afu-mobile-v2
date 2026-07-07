import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, AppState, Platform } from 'react-native';

interface OfflineSyncIndicatorProps {
  isOnline?: boolean;
  isSyncing?: boolean;
  itemsPendentes?: number;
  onSyncPress?: () => void;
}

export function OfflineSyncIndicator({
  isOnline: isOnlineProp,
  isSyncing = false,
  itemsPendentes = 0,
  onSyncPress,
}: OfflineSyncIndicatorProps) {
  const [isOnlineLocal, setIsOnlineLocal] = useState(true);
  const isOnline = isOnlineProp ?? isOnlineLocal;

  useEffect(() => {
    if (isOnlineProp !== undefined || Platform.OS !== "web" || typeof window === "undefined") {
      return;
    }

    const checkOnline = () => setIsOnlineLocal(navigator.onLine);
    checkOnline();
    window.addEventListener("online", checkOnline);
    window.addEventListener("offline", checkOnline);
    return () => {
      window.removeEventListener("online", checkOnline);
      window.removeEventListener("offline", checkOnline);
    };
  }, [isOnlineProp]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", () => {});
    return () => subscription.remove();
  }, []);

  if (isOnline && !isSyncing && itemsPendentes === 0) {
    return null;
  }

  const getStatusColor = () => {
    if (!isOnline) return '#FF6B6B'; // Vermelho - offline
    if (isSyncing) return '#FFD93D'; // Amarelo - sincronizando
    if (itemsPendentes > 0) return '#FFA500'; // Laranja - pendente
    return '#6BCB77'; // Verde - sincronizado
  };

  const getStatusText = () => {
    if (!isOnline) return '🔴 Modo Offline';
    if (isSyncing) return '🟡 Sincronizando...';
    if (itemsPendentes > 0) return `🟠 ${itemsPendentes} pendente(s)`;
    return '🟢 Sincronizado';
  };

  return (
    <View className="bg-surface border-b border-border px-4 py-3">
      <View className="flex-row justify-between items-center">
        <Text className="text-sm font-semibold text-foreground">
          {getStatusText()}
        </Text>
        {!isOnline && itemsPendentes > 0 && (
          <TouchableOpacity
            onPress={onSyncPress}
            disabled={isSyncing}
            className={`px-3 py-1 rounded ${isSyncing ? 'opacity-50' : ''}`}
            style={{ backgroundColor: getStatusColor() }}
          >
            <Text className="text-white text-xs font-semibold">
              {isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      {!isOnline && (
        <Text className="text-xs text-muted mt-1">
          Você está offline. As alterações serão sincronizadas quando conectado.
        </Text>
      )}
    </View>
  );
}
