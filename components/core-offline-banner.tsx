import { View, Text } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useCoreOfflineSync } from "@/hooks/use-core-offline-sync";

type Props = {
  /** Mensagem curta quando offline (ex.: "edições em cultivos"). */
  offlineHint: string;
};

/**
 * Faixa local alinhada ao banner global (`OfflineSyncIndicator`).
 * Usa o mesmo estado da fila core (provider compartilhado).
 */
export function CoreOfflineBanner({ offlineHint }: Props) {
  const colors = useColors();
  const { isOnline, pending } = useCoreOfflineSync();

  if (isOnline && pending === 0) return null;

  const label = !isOnline
    ? `Offline — ${offlineHint} entram na fila de sync.`
    : `Sync pendente: ${pending} alteração(ões) na fila.`;

  return (
    <View
      style={{
        backgroundColor: "#D9770622",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
      accessibilityRole="summary"
      accessibilityLabel={
        !isOnline
          ? "Modo offline. Alterações serão sincronizadas ao reconectar."
          : `${pending} alterações pendentes de sincronização`
      }
    >
      <Text style={{ fontSize: 12, color: colors.foreground }}>{label}</Text>
    </View>
  );
}
