import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import type { CartItem, MetodoPagamento } from "@/shared/marketplace";
import { PAGAMENTO_LABELS } from "@/shared/marketplace";

type Props = {
  items: CartItem[];
  total: number;
  onBack: () => void;
  onSuccess: () => void;
};

export function MarketplaceCheckout({ items, total, onBack, onSuccess }: Props) {
  const colors = useColors();
  const utils = trpc.useUtils();

  const [endereco, setEndereco] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [metodo, setMetodo] = useState<MetodoPagamento>("pix");
  const [submitting, setSubmitting] = useState(false);

  const checkoutMutation = trpc.secondaryData.marketplace.pedidos.checkout.useMutation({
    onSuccess: () => {
      utils.secondaryData.marketplace.pedidos.list.invalidate();
    },
  });

  const handleConfirmar = async () => {
    if (endereco.trim().length < 5) {
      Alert.alert("Atenção", "Informe o endereço de entrega completo.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await checkoutMutation.mutateAsync({
        items: items.map((i) => ({ produtoId: i.produtoId, quantidade: i.quantidade })),
        enderecoEntrega: endereco.trim(),
        metodoPagamento: metodo,
        observacoes: observacoes.trim() || undefined,
      });
      Alert.alert(
        "Pedido realizado!",
        metodo === "pix"
          ? `${result.pedidoIds.length} pedido(s) criado(s). Pague via PIX na aba Pedidos.`
          : `${result.pedidoIds.length} pedido(s) criado(s). Pagamento na entrega.`,
        [{ text: "Ver pedidos", onPress: onSuccess }],
      );
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Não foi possível finalizar o pedido.";
      Alert.alert("Erro", message);
    } finally {
      setSubmitting(false);
    }
  };

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 15,
      color: colors.foreground,
      marginBottom: 12,
    },
    metodoBtn: {
      flex: 1,
      padding: 14,
      borderRadius: 12,
      borderWidth: 2,
      alignItems: "center",
    },
  });

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
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#FFFFFF" }}>Checkout</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.muted, marginBottom: 8 }}>
          RESUMO ({items.length} {items.length === 1 ? "item" : "itens"})
        </Text>
        {items.map((item) => (
          <View key={item.produtoId} style={styles.card}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>
              {item.nome}
            </Text>
            <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
              {item.quantidade}x R$ {item.preco.toFixed(2).replace(".", ",")}
              {item.unidade ? ` / ${item.unidade}` : ""}
            </Text>
          </View>
        ))}

        <View style={[styles.card, { alignItems: "center" }]}>
          <Text style={{ fontSize: 13, color: colors.muted }}>Total estimado</Text>
          <Text style={{ fontSize: 28, fontWeight: "800", color: "#D97706", marginTop: 4 }}>
            R$ {total.toFixed(2).replace(".", ",")}
          </Text>
        </View>

        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 6 }}>
          Endereço de entrega *
        </Text>
        <TextInput
          style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]}
          value={endereco}
          onChangeText={setEndereco}
          placeholder="Rua, número, bairro, cidade..."
          placeholderTextColor={colors.muted}
          multiline
        />

        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 8 }}>
          Forma de pagamento
        </Text>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
          {(["pix", "na_entrega"] as const).map((m) => (
            <TouchableOpacity
              key={m}
              style={[
                styles.metodoBtn,
                {
                  borderColor: metodo === m ? "#D97706" : colors.border,
                  backgroundColor: metodo === m ? "#D9770615" : colors.surface,
                },
              ]}
              onPress={() => setMetodo(m)}
            >
              <IconSymbol
                name={m === "pix" ? "qrcode" : "banknote.fill"}
                size={22}
                color={metodo === m ? "#D97706" : colors.muted}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: metodo === m ? "#D97706" : colors.foreground,
                  marginTop: 6,
                  textAlign: "center",
                }}
              >
                {PAGAMENTO_LABELS[m]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 6 }}>
          Observações (opcional)
        </Text>
        <TextInput
          style={[styles.input, { minHeight: 60, textAlignVertical: "top" }]}
          value={observacoes}
          onChangeText={setObservacoes}
          placeholder="Horário preferido, referência..."
          placeholderTextColor={colors.muted}
          multiline
        />

        <TouchableOpacity
          style={{
            backgroundColor: submitting ? colors.muted : "#D97706",
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: "center",
            marginTop: 8,
          }}
          onPress={handleConfirmar}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>
              Confirmar pedido
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
