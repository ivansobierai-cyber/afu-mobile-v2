import { useState } from "react";
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
  Modal,
} from "react-native";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";
import { PAGAMENTO_LABELS, PAGAMENTO_STATUS } from "@/shared/marketplace";

const CATEGORIAS_DB = [
  { value: "sementes", label: "Sementes" },
  { value: "fertilizantes", label: "Fertilizantes" },
  { value: "defensivos", label: "Defensivos" },
  { value: "equipamentos", label: "Equipamentos" },
  { value: "servicos", label: "Serviços" },
  { value: "producao_propria", label: "Produção própria" },
  { value: "outro", label: "Outro" },
] as const;

const PEDIDO_STATUS: Record<string, { label: string; color: string }> = {
  aguardando: { label: "Aguardando", color: "#D97706" },
  confirmado: { label: "Confirmado", color: "#3B82F6" },
  em_preparo: { label: "Em preparo", color: "#8B5CF6" },
  enviado: { label: "Enviado", color: "#2563EB" },
  entregue: { label: "Entregue", color: "#16A34A" },
  cancelado: { label: "Cancelado", color: "#6B7280" },
};

type VendorStatus = "confirmado" | "em_preparo" | "enviado" | "entregue" | "cancelado";

const VENDOR_ACTIONS: Record<string, { status: VendorStatus; label: string; color: string }[]> = {
  aguardando: [
    { status: "confirmado", label: "Confirmar", color: "#16A34A" },
    { status: "cancelado", label: "Recusar", color: "#E53E3E" },
  ],
  confirmado: [
    { status: "em_preparo", label: "Em preparo", color: "#8B5CF6" },
    { status: "cancelado", label: "Cancelar", color: "#E53E3E" },
  ],
  em_preparo: [{ status: "enviado", label: "Marcar enviado", color: "#2563EB" }],
  enviado: [{ status: "entregue", label: "Marcar entregue", color: "#16A34A" }],
};

type ProdutoForm = {
  nomeProduto: string;
  categoria: (typeof CATEGORIAS_DB)[number]["value"];
  descricao: string;
  preco: string;
  estoque: string;
  unidade: string;
  status: "disponivel" | "pausado" | "indisponivel";
};

const EMPTY_PRODUTO: ProdutoForm = {
  nomeProduto: "",
  categoria: "producao_propria",
  descricao: "",
  preco: "",
  estoque: "1",
  unidade: "un",
  status: "disponivel",
};

export function MarketplaceVendedorPanel() {
  const colors = useColors();
  const utils = trpc.useUtils();

  const [subAba, setSubAba] = useState<"produtos" | "pedidos">("pedidos");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProdutoForm>(EMPTY_PRODUTO);
  const [saving, setSaving] = useState(false);

  const { data: meusProdutos = [], isLoading: loadingProdutos } =
    trpc.secondaryData.marketplace.meusProdutos.useQuery();

  const { data: pedidosVenda = [], isLoading: loadingPedidos } =
    trpc.secondaryData.marketplace.pedidos.vendas.list.useQuery();

  const createMutation = trpc.secondaryData.marketplace.create.useMutation({
    onSuccess: () => utils.secondaryData.marketplace.meusProdutos.invalidate(),
  });
  const updateMutation = trpc.secondaryData.marketplace.update.useMutation({
    onSuccess: () => utils.secondaryData.marketplace.meusProdutos.invalidate(),
  });
  const deleteMutation = trpc.secondaryData.marketplace.delete.useMutation({
    onSuccess: () => utils.secondaryData.marketplace.meusProdutos.invalidate(),
  });
  const statusMutation = trpc.secondaryData.marketplace.pedidos.vendas.atualizarStatus.useMutation({
    onSuccess: () => {
      utils.secondaryData.marketplace.pedidos.vendas.list.invalidate();
      utils.secondaryData.marketplace.pedidos.list.invalidate();
    },
  });

  const pedidosPendentes = pedidosVenda.filter(
    (p) => p.statusPedido === "aguardando" || p.statusPedido === "confirmado" || p.statusPedido === "em_preparo",
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_PRODUTO);
    setModalVisible(true);
  };

  const openEdit = (p: (typeof meusProdutos)[0]) => {
    setEditingId(p.id);
    setForm({
      nomeProduto: p.nomeProduto,
      categoria: p.categoria as ProdutoForm["categoria"],
      descricao: p.descricao ?? "",
      preco: p.preco ? String(p.preco) : "",
      estoque: p.estoque ? String(p.estoque) : "1",
      unidade: p.unidade ?? "un",
      status: (p.status ?? "disponivel") as ProdutoForm["status"],
    });
    setModalVisible(true);
  };

  const handleSaveProduto = async () => {
    if (!form.nomeProduto.trim()) {
      Alert.alert("Atenção", "Informe o nome do produto.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        nomeProduto: form.nomeProduto.trim(),
        categoria: form.categoria,
        descricao: form.descricao.trim() || undefined,
        preco: form.preco ? parseFloat(form.preco) : undefined,
        estoque: form.estoque ? parseFloat(form.estoque) : undefined,
        unidade: form.unidade.trim() || undefined,
        status: form.status,
      };
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setModalVisible(false);
      setForm(EMPTY_PRODUTO);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Não foi possível salvar o produto.";
      Alert.alert("Erro", message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: number, nome: string) => {
    Alert.alert("Excluir produto?", nome, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync({ id });
          } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Não foi possível excluir.";
            Alert.alert("Erro", message);
          }
        },
      },
    ]);
  };

  const handleStatusPedido = (id: number, status: VendorStatus, label: string) => {
    Alert.alert("Atualizar pedido?", label, [
      { text: "Não", style: "cancel" },
      {
        text: "Confirmar",
        onPress: async () => {
          try {
            await statusMutation.mutateAsync({ id, status });
          } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Não foi possível atualizar.";
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
    subTab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 10 },
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
    chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, marginRight: 6, marginBottom: 6 },
    actionBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  });

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: "row", padding: 12, gap: 8 }}>
        <TouchableOpacity
          style={[styles.subTab, { backgroundColor: subAba === "pedidos" ? "#D97706" : colors.surface }]}
          onPress={() => setSubAba("pedidos")}
        >
          <Text style={{ fontWeight: "700", color: subAba === "pedidos" ? "#FFF" : colors.muted }}>
            Pedidos{pedidosPendentes.length > 0 ? ` (${pedidosPendentes.length})` : ""}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.subTab, { backgroundColor: subAba === "produtos" ? "#D97706" : colors.surface }]}
          onPress={() => setSubAba("produtos")}
        >
          <Text style={{ fontWeight: "700", color: subAba === "produtos" ? "#FFF" : colors.muted }}>
            Meus produtos ({meusProdutos.length})
          </Text>
        </TouchableOpacity>
      </View>

      {subAba === "pedidos" ? (
        loadingPedidos ? (
          <ActivityIndicator size="large" color="#D97706" style={{ marginTop: 40 }} />
        ) : pedidosVenda.length === 0 ? (
          <View style={{ alignItems: "center", padding: 32 }}>
            <IconSymbol name="cart.fill" size={40} color={colors.muted} />
            <Text style={{ color: colors.muted, marginTop: 12 }}>Nenhum pedido recebido ainda.</Text>
          </View>
        ) : (
          <FlatList
            data={pedidosVenda}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ padding: 16, paddingTop: 0 }}
            renderItem={({ item }) => {
              const st = PEDIDO_STATUS[item.statusPedido ?? "aguardando"] ?? PEDIDO_STATUS.aguardando;
              const actions = VENDOR_ACTIONS[item.statusPedido ?? ""] ?? [];
              return (
                <View style={styles.card}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, flex: 1 }}>
                      {item.produtoNome}
                    </Text>
                    <View style={{ backgroundColor: st.color + "20", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                      <Text style={{ fontSize: 11, fontWeight: "700", color: st.color }}>{st.label}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 13, color: colors.muted, marginTop: 6 }}>
                    #{item.id} · {item.compradorNome} · Qtd {Number(item.quantidade)}
                  </Text>
                  {item.compradorTelefone && (
                    <Text style={{ fontSize: 12, color: colors.muted }}>Tel: {item.compradorTelefone}</Text>
                  )}
                  {item.enderecoEntrega && (
                    <Text style={{ fontSize: 12, color: colors.foreground, marginTop: 6 }} numberOfLines={2}>
                      Entrega: {item.enderecoEntrega}
                    </Text>
                  )}
                  {item.metodoPagamento && (
                    <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                      {PAGAMENTO_LABELS[item.metodoPagamento]}
                    </Text>
                  )}
                  {item.statusPagamento && (
                    <View style={{ alignSelf: "flex-start", marginTop: 6 }}>
                      {(() => {
                        const pag =
                          PAGAMENTO_STATUS[item.statusPagamento] ?? PAGAMENTO_STATUS.pendente;
                        return (
                          <View
                            style={{
                              backgroundColor: pag.color + "20",
                              borderRadius: 6,
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                            }}
                          >
                            <Text style={{ fontSize: 10, fontWeight: "700", color: pag.color }}>
                              {pag.label}
                            </Text>
                          </View>
                        );
                      })()}
                    </View>
                  )}
                  {item.observacoesTexto ? (
                    <Text style={{ fontSize: 12, color: colors.foreground, marginTop: 6 }} numberOfLines={2}>
                      Obs: {item.observacoesTexto}
                    </Text>
                  ) : null}
                  {item.valorTotal && (
                    <Text style={{ fontSize: 14, fontWeight: "700", color: "#D97706", marginTop: 6 }}>
                      R$ {Number(item.valorTotal).toFixed(2).replace(".", ",")}
                    </Text>
                  )}
                  {actions.length > 0 && (
                    <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                      {actions.map((a) => (
                        <TouchableOpacity
                          key={a.status}
                          style={[styles.actionBtn, { backgroundColor: a.color + "18", borderWidth: 1, borderColor: a.color + "40" }]}
                          onPress={() => handleStatusPedido(item.id, a.status, a.label)}
                          disabled={statusMutation.isPending}
                        >
                          <Text style={{ fontSize: 12, fontWeight: "700", color: a.color }}>{a.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              );
            }}
          />
        )
      ) : (
        <>
          <TouchableOpacity
            style={{ marginHorizontal: 16, marginBottom: 8, backgroundColor: "#D97706", borderRadius: 12, paddingVertical: 12, alignItems: "center" }}
            onPress={openCreate}
          >
            <Text style={{ color: "#FFF", fontWeight: "700" }}>+ Novo produto</Text>
          </TouchableOpacity>
          {loadingProdutos ? (
            <ActivityIndicator size="large" color="#D97706" style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={meusProdutos}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={{ padding: 16, paddingTop: 0 }}
              ListEmptyComponent={
                <Text style={{ textAlign: "center", color: colors.muted, padding: 24 }}>
                  Você ainda não cadastrou produtos.
                </Text>
              }
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>{item.nomeProduto}</Text>
                  <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                    {item.status} · {item.preco ? `R$ ${Number(item.preco).toFixed(2)}` : "Sem preço"}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                    <TouchableOpacity
                      style={[styles.actionBtn, { borderWidth: 1, borderColor: colors.border }]}
                      onPress={() => openEdit(item)}
                    >
                      <Text style={{ fontSize: 12, fontWeight: "600", color: colors.foreground }}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { borderWidth: 1, borderColor: colors.error + "40" }]}
                      onPress={() => handleDelete(item.id, item.nomeProduto)}
                    >
                      <Text style={{ fontSize: 12, fontWeight: "600", color: colors.error }}>Excluir</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </>
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <ScrollView
            style={{ backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "90%", padding: 20 }}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 16 }}>
              {editingId ? "Editar produto" : "Novo produto"}
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>Nome</Text>
            <TextInput style={styles.input} value={form.nomeProduto} onChangeText={(v) => setForm((f) => ({ ...f, nomeProduto: v }))} placeholderTextColor={colors.muted} />
            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>Categoria</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 12 }}>
              {CATEGORIAS_DB.map((c) => (
                <TouchableOpacity
                  key={c.value}
                  style={[styles.chip, {
                    backgroundColor: form.categoria === c.value ? "#D97706" : colors.surface,
                    borderColor: form.categoria === c.value ? "#D97706" : colors.border,
                  }]}
                  onPress={() => setForm((f) => ({ ...f, categoria: c.value }))}
                >
                  <Text style={{ fontSize: 11, fontWeight: "600", color: form.categoria === c.value ? "#FFF" : colors.foreground }}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>Preço (R$)</Text>
            <TextInput style={styles.input} value={form.preco} onChangeText={(v) => setForm((f) => ({ ...f, preco: v }))} keyboardType="decimal-pad" placeholderTextColor={colors.muted} />
            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>Estoque / Unidade</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput style={[styles.input, { flex: 1 }]} value={form.estoque} onChangeText={(v) => setForm((f) => ({ ...f, estoque: v }))} keyboardType="decimal-pad" placeholderTextColor={colors.muted} />
              <TextInput style={[styles.input, { flex: 1 }]} value={form.unidade} onChangeText={(v) => setForm((f) => ({ ...f, unidade: v }))} placeholder="un" placeholderTextColor={colors.muted} />
            </View>
            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>Descrição</Text>
            <TextInput style={[styles.input, { minHeight: 70, textAlignVertical: "top" }]} value={form.descricao} onChangeText={(v) => setForm((f) => ({ ...f, descricao: v }))} multiline placeholderTextColor={colors.muted} />
            <TouchableOpacity
              style={{ backgroundColor: saving ? colors.muted : "#D97706", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 8 }}
              onPress={handleSaveProduto}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: "#FFF", fontWeight: "700" }}>Salvar</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={{ paddingVertical: 14, alignItems: "center" }} onPress={() => setModalVisible(false)}>
              <Text style={{ color: colors.muted }}>Cancelar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
