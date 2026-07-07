import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { MarketplacePedidoTimeline } from "@/components/marketplace-pedido-timeline";
import { PAGAMENTO_LABELS, PAGAMENTO_STATUS } from "@/shared/marketplace";

type Props = {
  pedidoId: number;
  onBack: () => void;
};

export function MarketplacePedidoDetail({ pedidoId, onBack }: Props) {
  const colors = useColors();
  const utils = trpc.useUtils();
  const [paying, setPaying] = useState(false);
  const [pixCode, setPixCode] = useState<string | null>(null);

  const { data: pedido, isLoading, refetch } = trpc.secondaryData.marketplace.pedidos.get.useQuery({
    id: pedidoId,
  });

  const pagarPixMutation = trpc.secondaryData.marketplace.pedidos.pagarPix.useMutation({
    onSuccess: () => {
      utils.secondaryData.marketplace.pedidos.list.invalidate();
      refetch();
    },
  });

  const cancelarMutation = trpc.secondaryData.marketplace.pedidos.cancelar.useMutation({
    onSuccess: () => {
      utils.secondaryData.marketplace.pedidos.list.invalidate();
      refetch();
    },
  });

  const handlePagarPix = async () => {
    setPaying(true);
    try {
      const result = await pagarPixMutation.mutateAsync({ pedidoId });
      setPixCode(result.pixCode);
      Alert.alert("PIX confirmado!", "O vendedor foi notificado do pagamento.");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Não foi possível processar o PIX.";
      Alert.alert("Erro", message);
    } finally {
      setPaying(false);
    }
  };

  const handleCancelar = () => {
    if (!pedido) return;
    Alert.alert("Cancelar pedido?", pedido.produtoNome, [
      { text: "Não", style: "cancel" },
      {
        text: "Cancelar pedido",
        style: "destructive",
        onPress: async () => {
          try {
            await cancelarMutation.mutateAsync({ id: pedidoId });
          } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Não foi possível cancelar.";
            Alert.alert("Erro", message);
          }
        },
      },
    ]);
  };

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
  });

  if (isLoading || !pedido) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#D97706" />
        </View>
      </ScreenContainer>
    );
  }

  const pagSt =
    PAGAMENTO_STATUS[pedido.statusPagamento ?? "pendente"] ?? PAGAMENTO_STATUS.pendente;
  const showPixPay =
    pedido.metodoPagamento === "pix" &&
    pedido.statusPagamento === "pendente" &&
    pedido.statusPedido !== "cancelado";

  return (
    <ScreenContainer>
      <View
        style={{
          backgroundColor: "#D97706",
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 20,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <TouchableOpacity onPress={onBack}>
          <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#FFFFFF" }} numberOfLines={1}>
            Pedido #{pedido.id}
          </Text>
          <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 2 }}>
            {new Date(pedido.dataPedido).toLocaleString("pt-BR")}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.card}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>
            {pedido.produtoNome}
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 6 }}>
            Vendedor: {pedido.vendedorNome}
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
            Qtd: {Number(pedido.quantidade)}
          </Text>
          {pedido.valorTotal && (
            <Text style={{ fontSize: 20, fontWeight: "800", color: "#D97706", marginTop: 10 }}>
              R$ {Number(pedido.valorTotal).toFixed(2).replace(".", ",")}
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: colors.muted,
              marginBottom: 8,
              textTransform: "uppercase",
            }}
          >
            Pagamento
          </Text>
          {pedido.metodoPagamento && (
            <Text style={{ fontSize: 14, color: colors.foreground, marginBottom: 6 }}>
              {PAGAMENTO_LABELS[pedido.metodoPagamento]}
            </Text>
          )}
          <View
            style={{
              alignSelf: "flex-start",
              backgroundColor: pagSt.color + "20",
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "700", color: pagSt.color }}>
              {pagSt.label}
            </Text>
          </View>
        </View>

        {pedido.enderecoEntrega && (
          <View style={styles.card}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: colors.muted,
                marginBottom: 6,
                textTransform: "uppercase",
              }}
            >
              Entrega
            </Text>
            <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 20 }}>
              {pedido.enderecoEntrega}
            </Text>
          </View>
        )}

        {pedido.observacoesTexto ? (
          <View style={styles.card}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: colors.muted,
                marginBottom: 6,
                textTransform: "uppercase",
              }}
            >
              Observações
            </Text>
            <Text style={{ fontSize: 14, color: colors.foreground }}>{pedido.observacoesTexto}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: colors.muted,
              marginBottom: 12,
              textTransform: "uppercase",
            }}
          >
            Acompanhamento
          </Text>
          <MarketplacePedidoTimeline statusAtual={pedido.statusPedido ?? "aguardando"} />
        </View>

        {showPixPay && (
          <TouchableOpacity
            style={{
              backgroundColor: paying ? colors.muted : "#16A34A",
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: "center",
              marginBottom: 12,
            }}
            onPress={handlePagarPix}
            disabled={paying}
          >
            {paying ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>
                Pagar com PIX (demo)
              </Text>
            )}
          </TouchableOpacity>
        )}

        {pixCode && (
          <View style={[styles.card, { backgroundColor: "#16A34A10" }]}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#16A34A", marginBottom: 8 }}>
              Código PIX copia e cola (demo)
            </Text>
            <Text style={{ fontSize: 11, color: colors.foreground, fontFamily: "monospace" }}>
              {pixCode}
            </Text>
          </View>
        )}

        {pedido.statusPedido === "aguardando" && (
          <TouchableOpacity
            style={{
              alignItems: "center",
              paddingVertical: 12,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: colors.error + "40",
            }}
            onPress={handleCancelar}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.error }}>
              Cancelar pedido
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
