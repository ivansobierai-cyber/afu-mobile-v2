import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { PEDIDO_STATUS_STEPS } from "@/shared/marketplace";

const STATUS_LABELS: Record<string, string> = {
  aguardando: "Aguardando",
  confirmado: "Confirmado",
  em_preparo: "Em preparo",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

type Props = {
  statusAtual: string;
};

export function MarketplacePedidoTimeline({ statusAtual }: Props) {
  const colors = useColors();

  if (statusAtual === "cancelado") {
    return (
      <View style={[styles.cancelled, { backgroundColor: colors.muted + "20" }]}>
        <Text style={{ color: colors.muted, fontWeight: "600" }}>Pedido cancelado</Text>
      </View>
    );
  }

  const currentIndex = PEDIDO_STATUS_STEPS.indexOf(
    statusAtual as (typeof PEDIDO_STATUS_STEPS)[number],
  );

  return (
    <View style={styles.container}>
      {PEDIDO_STATUS_STEPS.map((step, index) => {
        const done = index <= currentIndex;
        const active = index === currentIndex;
        return (
          <View key={step} style={styles.row}>
            <View style={styles.lineCol}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: done ? "#D97706" : colors.border,
                    borderColor: active ? "#D97706" : colors.border,
                  },
                ]}
              />
              {index < PEDIDO_STATUS_STEPS.length - 1 && (
                <View
                  style={[
                    styles.line,
                    { backgroundColor: index < currentIndex ? "#D97706" : colors.border },
                  ]}
                />
              )}
            </View>
            <Text
              style={{
                flex: 1,
                fontSize: 14,
                fontWeight: active ? "700" : "500",
                color: done ? colors.foreground : colors.muted,
                marginBottom: 16,
              }}
            >
              {STATUS_LABELS[step]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 4 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  lineCol: { alignItems: "center", width: 20 },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 24,
    marginTop: 2,
  },
  cancelled: {
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
});
