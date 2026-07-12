import { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { ScreenHeader } from "@/components/screen-header";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { MODULE_COLORS } from "@/constants/module-colors";
import { trpc } from "@/lib/trpc";
import { MarketplaceVendedorPanel } from "@/components/marketplace-vendedor-panel";
import { MarketplaceCheckout } from "@/components/marketplace-checkout";
import { MarketplacePedidoDetail } from "@/components/marketplace-pedido-detail";
import { useMarketplaceCart } from "@/hooks/use-marketplace-cart";
import { PAGAMENTO_STATUS } from "@/shared/marketplace";
import type { CategoriaProduto } from "@/shared/types";

const CATEGORIA_LABELS: Record<CategoriaProduto, string> = {
  insumo: "Insumo",
  servico: "Serviço",
  equipamento: "Equipamento",
  semente: "Semente",
  fertilizante: "Fertilizante",
  defensivo: "Defensivo",
  outro: "Outro",
};

const CATEGORIA_ICONS: Record<CategoriaProduto, string> = {
  insumo: "leaf.fill",
  servico: "person.fill",
  equipamento: "wrench.fill",
  semente: "circle.fill",
  fertilizante: "flask.fill",
  defensivo: "shield.fill",
  outro: "square.fill",
};

const CATEGORIA_COLORS: Record<CategoriaProduto, string> = {
  insumo: "#38A169",
  servico: "#3B82F6",
  equipamento: "#6B7280",
  semente: "#D97706",
  fertilizante: "#92400E",
  defensivo: "#E53E3E",
  outro: "#8B5CF6",
};

const DB_TO_UI: Record<string, CategoriaProduto> = {
  sementes: "semente",
  fertilizantes: "fertilizante",
  defensivos: "defensivo",
  equipamentos: "equipamento",
  servicos: "servico",
  producao_propria: "insumo",
  outro: "outro",
};

const UI_TO_DB: Record<CategoriaProduto, string> = {
  semente: "sementes",
  fertilizante: "fertilizantes",
  defensivo: "defensivos",
  equipamento: "equipamentos",
  servico: "servicos",
  insumo: "producao_propria",
  outro: "outro",
};

const PEDIDO_STATUS: Record<string, { label: string; color: string }> = {
  aguardando: { label: "Aguardando", color: "#D97706" },
  confirmado: { label: "Confirmado", color: "#3B82F6" },
  em_preparo: { label: "Em preparo", color: "#8B5CF6" },
  enviado: { label: "Enviado", color: "#2563EB" },
  entregue: { label: "Entregue", color: "#16A34A" },
  cancelado: { label: "Cancelado", color: "#6B7280" },
};

type ProdutoView = {
  id: number;
  vendedorId: number;
  nome: string;
  descricao: string;
  categoria: CategoriaProduto;
  preco?: number;
  unidade?: string;
  disponivel: boolean;
};

function mapProduto(row: {
  id: number;
  vendedorId: number;
  nomeProduto: string;
  descricao?: string | null;
  categoria: string;
  preco?: string | null;
  unidade?: string | null;
  status?: string | null;
}): ProdutoView {
  return {
    id: row.id,
    vendedorId: row.vendedorId,
    nome: row.nomeProduto,
    descricao: row.descricao ?? "",
    categoria: DB_TO_UI[row.categoria] ?? "outro",
    preco: row.preco ? Number(row.preco) : undefined,
    unidade: row.unidade ?? undefined,
    disponivel: row.status === "disponivel",
  };
}

export default function MarketplaceScreen() {
  const colors = useColors();
  const router = useRouter();
  const utils = trpc.useUtils();
  const cart = useMarketplaceCart();

  const [aba, setAba] = useState<"produtos" | "carrinho" | "pedidos" | "vender">("produtos");
  const [filterCategoria, setFilterCategoria] = useState<string>("todos");
  const [busca, setBusca] = useState("");
  const [detailProduto, setDetailProduto] = useState<ProdutoView | null>(null);
  const [quantidade, setQuantidade] = useState("1");
  const [adding, setAdding] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [pedidoDetailId, setPedidoDetailId] = useState<number | null>(null);

  const dbCategoria =
    filterCategoria !== "todos" ? UI_TO_DB[filterCategoria as CategoriaProduto] : undefined;

  const { data: produtosDb = [], isLoading } = trpc.secondaryData.marketplace.list.useQuery({
    status: "disponivel",
    busca: busca.trim() || undefined,
    categoria: dbCategoria,
  });

  const { data: pedidos = [], isLoading: loadingPedidos } =
    trpc.secondaryData.marketplace.pedidos.list.useQuery(undefined, {
      enabled: aba === "pedidos" || pedidoDetailId != null,
    });

  const cancelarPedidoMutation = trpc.secondaryData.marketplace.pedidos.cancelar.useMutation({
    onSuccess: () => {
      utils.secondaryData.marketplace.pedidos.list.invalidate();
    },
  });

  const produtos = useMemo(() => produtosDb.map(mapProduto), [produtosDb]);

  const filtered = produtos.filter((p) => {
    const matchCategoria = filterCategoria === "todos" || p.categoria === filterCategoria;
    return matchCategoria && p.disponivel;
  });

  const handleAddToCart = async () => {
    if (!detailProduto) return;
    const qtd = parseFloat(quantidade);
    if (isNaN(qtd) || qtd <= 0) {
      Alert.alert("Atenção", "Informe uma quantidade válida.");
      return;
    }
    setAdding(true);
    try {
      await cart.addItem({
        produtoId: detailProduto.id,
        nome: detailProduto.nome,
        preco: detailProduto.preco ?? 0,
        unidade: detailProduto.unidade,
        vendedorId: detailProduto.vendedorId,
        quantidade: qtd,
      });
      Alert.alert("Adicionado!", `${detailProduto.nome} foi adicionado ao carrinho.`, [
        { text: "Continuar comprando", style: "cancel" },
        {
          text: "Ver carrinho",
          onPress: () => {
            setDetailProduto(null);
            setQuantidade("1");
            setAba("carrinho");
          },
        },
      ]);
    } finally {
      setAdding(false);
    }
  };

  const handleCheckoutSuccess = async () => {
    await cart.emptyCart();
    setCheckoutOpen(false);
    setAba("pedidos");
  };

  const handleCancelarPedido = (id: number, nome: string) => {
    Alert.alert("Cancelar pedido?", `"${nome}"`, [
      { text: "Não", style: "cancel" },
      {
        text: "Cancelar pedido",
        style: "destructive",
        onPress: async () => {
          try {
            await cancelarPedidoMutation.mutateAsync({ id });
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
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1,
      marginRight: 8,
    },
    abaBtn: { flex: 1, paddingVertical: 12, alignItems: "center", borderBottomWidth: 2 },
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
  });

  if (pedidoDetailId != null) {
    return (
      <MarketplacePedidoDetail
        pedidoId={pedidoDetailId}
        onBack={() => setPedidoDetailId(null)}
      />
    );
  }

  if (checkoutOpen) {
    return (
      <MarketplaceCheckout
        items={cart.items}
        total={cart.total}
        onBack={() => setCheckoutOpen(false)}
        onSuccess={handleCheckoutSuccess}
      />
    );
  }

  if (detailProduto) {
    const catColor = CATEGORIA_COLORS[detailProduto.categoria];
    return (
      <ScreenContainer>
        <ScreenHeader
          title={detailProduto.nome}
          subtitle={CATEGORIA_LABELS[detailProduto.categoria]}
          accentColor={catColor}
          onBack={() => setDetailProduto(null)}
        />
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {detailProduto.preco != null && (
            <View
              style={{
                backgroundColor: catColor + "15",
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 13, color: colors.muted }}>Valor</Text>
              <Text style={{ fontSize: 32, fontWeight: "800", color: catColor }}>
                R$ {detailProduto.preco.toFixed(2).replace(".", ",")}
              </Text>
              {detailProduto.unidade && (
                <Text style={{ fontSize: 13, color: colors.muted }}>por {detailProduto.unidade}</Text>
              )}
            </View>
          )}

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
              Descrição
            </Text>
            <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 22 }}>
              {detailProduto.descricao || "—"}
            </Text>
          </View>

          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 6 }}>
            Quantidade
          </Text>
          <TextInput
            style={styles.input}
            value={quantidade}
            onChangeText={setQuantidade}
            keyboardType="decimal-pad"
            placeholder="1"
            placeholderTextColor={colors.muted}
          />

          <TouchableOpacity
            style={{
              backgroundColor: adding ? colors.muted : catColor,
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: "center",
              marginTop: 8,
            }}
            onPress={handleAddToCart}
            disabled={adding}
          >
            {adding ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>
                Adicionar ao carrinho
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </ScreenContainer>
    );
  }

  const cartLabel =
    cart.count > 0 ? `Carrinho (${cart.count})` : "Carrinho";

  return (
    <ScreenContainer>
      <ScreenHeader
        title="Marketplace"
        subtitle="Insumos, serviços e equipamentos"
        accentColor={MODULE_COLORS.marketplace}
      />

      <View
        style={{
          flexDirection: "row",
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        {(["produtos", "carrinho", "pedidos", "vender"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.abaBtn, { borderBottomColor: aba === tab ? MODULE_COLORS.marketplace : "transparent" }]}
            onPress={() => setAba(tab)}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: aba === tab ? "#D97706" : colors.muted,
              }}
            >
              {tab === "produtos"
                ? "Comprar"
                : tab === "carrinho"
                  ? cartLabel
                  : tab === "pedidos"
                    ? `Pedidos${pedidos.length > 0 ? ` (${pedidos.length})` : ""}`
                    : "Vender"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {aba === "vender" ? (
        <MarketplaceVendedorPanel />
      ) : aba === "carrinho" ? (
        cart.items.length === 0 ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
            <IconSymbol name="cart.fill" size={48} color={colors.muted} />
            <Text style={{ fontSize: 16, color: colors.muted, marginTop: 12, fontWeight: "600" }}>
              Carrinho vazio
            </Text>
            <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4, textAlign: "center" }}>
              Adicione produtos do catálogo para finalizar a compra.
            </Text>
            <TouchableOpacity
              style={{
                marginTop: 20,
                backgroundColor: "#D97706",
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 10,
              }}
              onPress={() => setAba("produtos")}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>Explorar catálogo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <FlatList
              data={cart.items}
              keyExtractor={(item) => String(item.produtoId)}
              contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>
                    {item.nome}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
                    R$ {item.preco.toFixed(2).replace(".", ",")}
                    {item.unidade ? ` / ${item.unidade}` : ""}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: 12,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <TouchableOpacity
                        onPress={() => cart.updateQuantity(item.produtoId, item.quantidade - 1)}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: colors.border,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text style={{ fontSize: 18, color: colors.foreground }}>−</Text>
                      </TouchableOpacity>
                      <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>
                        {item.quantidade}
                      </Text>
                      <TouchableOpacity
                        onPress={() => cart.updateQuantity(item.produtoId, item.quantidade + 1)}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: colors.border,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text style={{ fontSize: 18, color: colors.foreground }}>+</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={() => cart.removeItem(item.produtoId)}>
                      <IconSymbol name="trash.fill" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
            <View
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: 16,
                backgroundColor: colors.surface,
                borderTopWidth: 1,
                borderTopColor: colors.border,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <Text style={{ fontSize: 15, color: colors.muted }}>Total</Text>
                <Text style={{ fontSize: 20, fontWeight: "800", color: "#D97706" }}>
                  R$ {cart.total.toFixed(2).replace(".", ",")}
                </Text>
              </View>
              <TouchableOpacity
                style={{
                  backgroundColor: "#D97706",
                  borderRadius: 12,
                  paddingVertical: 16,
                  alignItems: "center",
                }}
                onPress={() => setCheckoutOpen(true)}
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>
                  Ir para checkout
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )
      ) : aba === "pedidos" ? (
        loadingPedidos ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color="#D97706" />
          </View>
        ) : pedidos.length === 0 ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
            <IconSymbol name="cart.fill" size={48} color={colors.muted} />
            <Text style={{ fontSize: 16, color: colors.muted, marginTop: 12, fontWeight: "600" }}>
              Nenhum pedido ainda
            </Text>
            <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4, textAlign: "center" }}>
              Explore o catálogo e finalize uma compra pelo carrinho.
            </Text>
          </View>
        ) : (
          <FlatList
            data={pedidos}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => {
              const st = PEDIDO_STATUS[item.statusPedido ?? "aguardando"] ?? PEDIDO_STATUS.aguardando;
              const pagSt =
                PAGAMENTO_STATUS[item.statusPagamento ?? "pendente"] ?? PAGAMENTO_STATUS.pendente;
              return (
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => setPedidoDetailId(item.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>
                        {item.produtoNome}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                        #{item.id} · Qtd: {Number(item.quantidade)} ·{" "}
                        {new Date(item.dataPedido).toLocaleDateString("pt-BR")}
                      </Text>
                      {item.valorTotal && (
                        <Text
                          style={{ fontSize: 14, fontWeight: "700", color: "#D97706", marginTop: 6 }}
                        >
                          R$ {Number(item.valorTotal).toFixed(2).replace(".", ",")}
                        </Text>
                      )}
                      <View style={{ flexDirection: "row", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                        <View
                          style={{
                            backgroundColor: pagSt.color + "20",
                            borderRadius: 6,
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                          }}
                        >
                          <Text style={{ fontSize: 10, fontWeight: "700", color: pagSt.color }}>
                            {pagSt.label}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View
                      style={{
                        backgroundColor: st.color + "20",
                        borderRadius: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: "700", color: st.color }}>
                        {st.label}
                      </Text>
                    </View>
                  </View>
                  {item.statusPedido === "aguardando" && (
                    <TouchableOpacity
                      style={{
                        marginTop: 10,
                        alignItems: "center",
                        paddingVertical: 8,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: colors.error + "40",
                      }}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        handleCancelarPedido(item.id, item.produtoNome);
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: "600", color: colors.error }}>
                        Cancelar pedido
                      </Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        )
      ) : (
        <>
          <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 12,
                gap: 8,
              }}
            >
              <IconSymbol name="magnifyingglass" size={18} color={colors.muted} />
              <TextInput
                style={{ flex: 1, paddingVertical: 10, fontSize: 15, color: colors.foreground }}
                value={busca}
                onChangeText={setBusca}
                placeholder="Buscar produtos e serviços..."
                placeholderTextColor={colors.muted}
                returnKeyType="search"
              />
              {busca.length > 0 && (
                <TouchableOpacity onPress={() => setBusca("")}>
                  <IconSymbol name="xmark" size={16} color={colors.muted} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}
          >
            {["todos", ...Object.keys(CATEGORIA_LABELS)].map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      filterCategoria === cat
                        ? cat === "todos"
                          ? "#D97706"
                          : CATEGORIA_COLORS[cat as CategoriaProduto]
                        : colors.surface,
                    borderColor:
                      filterCategoria === cat
                        ? cat === "todos"
                          ? "#D97706"
                          : CATEGORIA_COLORS[cat as CategoriaProduto]
                        : colors.border,
                  },
                ]}
                onPress={() => setFilterCategoria(cat)}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: filterCategoria === cat ? "#FFF" : colors.foreground,
                  }}
                >
                  {cat === "todos" ? "Todos" : CATEGORIA_LABELS[cat as CategoriaProduto]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {isLoading ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator size="large" color="#D97706" />
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const catColor = CATEGORIA_COLORS[item.categoria];
                return (
                  <TouchableOpacity style={styles.card} onPress={() => setDetailProduto(item)}>
                    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                      <View
                        style={{ backgroundColor: catColor + "20", borderRadius: 12, padding: 10 }}
                      >
                        <IconSymbol
                          name={CATEGORIA_ICONS[item.categoria] as "leaf.fill"}
                          size={22}
                          color={catColor}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>
                          {item.nome}
                        </Text>
                        <Text
                          style={{ fontSize: 12, color: colors.muted, marginTop: 3 }}
                          numberOfLines={2}
                        >
                          {item.descricao}
                        </Text>
                        {item.preco != null && (
                          <Text
                            style={{ fontSize: 15, fontWeight: "800", color: catColor, marginTop: 8 }}
                          >
                            R$ {item.preco.toFixed(2).replace(".", ",")}
                            {item.unidade ? (
                              <Text style={{ fontSize: 11, fontWeight: "400", color: colors.muted }}>
                                {" "}
                                /{item.unidade}
                              </Text>
                            ) : null}
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={{ alignItems: "center", padding: 32 }}>
                  <IconSymbol name="magnifyingglass" size={40} color={colors.muted} />
                  <Text style={{ fontSize: 16, color: colors.muted, marginTop: 12 }}>
                    Nenhum produto encontrado.
                  </Text>
                  <Text
                    style={{ fontSize: 13, color: colors.muted, marginTop: 4, textAlign: "center" }}
                  >
                    Execute <Text style={{ fontWeight: "700" }}>npm run seed:marketplace</Text> para
                    popular o catálogo demo.
                  </Text>
                </View>
              }
            />
          )}
        </>
      )}
    </ScreenContainer>
  );
}
