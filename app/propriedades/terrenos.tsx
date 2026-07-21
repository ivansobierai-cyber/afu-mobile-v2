import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useRunCoreMutation } from "@/hooks/use-run-core-mutation";
import { buildPropertyReturnHref } from "@/lib/propriedades/registrar-flow";
import { trpc } from "@/lib/trpc";

const TIPO_SOLO = [
  { value: "argiloso", label: "Argiloso" },
  { value: "arenoso", label: "Arenoso" },
  { value: "siltoso", label: "Siltoso" },
  { value: "franco", label: "Franco" },
  { value: "organico", label: "Orgânico" },
];

const IRRIGACAO = [
  { value: "gotejamento", label: "Gotejamento" },
  { value: "aspersao", label: "Aspersão" },
  { value: "microaspersao", label: "Microaspersão" },
  { value: "sulcos", label: "Sulcos" },
  { value: "manual", label: "Manual" },
  { value: "nenhum", label: "Nenhum" },
];

export default function TerrenosScreen() {
  const colors = useColors();
  const router = useRouter();
  const { runMutation } = useRunCoreMutation();
  const utils = trpc.useUtils();
  const { propriedadeId, returnTab, safraId, openCreate } = useLocalSearchParams<{
    propriedadeId: string;
    returnTab?: string;
    safraId?: string;
    openCreate?: string;
  }>();
  const propId = parseInt(propriedadeId ?? "0", 10);
  const parsedSafraId = safraId ? parseInt(safraId, 10) : NaN;
  const activeSafraId =
    Number.isFinite(parsedSafraId) && parsedSafraId > 0 ? parsedSafraId : null;

  const goBackToProperty = () => {
    if (propId > 0) {
      const tab = returnTab && returnTab.length ? returnTab : "talhoes";
      router.replace(
        buildPropertyReturnHref({
          propriedadeId: propId,
          tab,
          safraId: activeSafraId,
        }) as any,
      );
      return;
    }
    router.back();
  };

  const { data: propriedade, isLoading: loadingProp } = trpc.coreData.propriedades.get.useQuery(
    { id: propId },
    { enabled: propId > 0 },
  );
  const { data: terrenos = [], isLoading: loadingTerrenos, refetch } = trpc.coreData.terrenos.listByPropriedade.useQuery(
    { propriedadeId: propId },
    { enabled: propId > 0 },
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nome, setNome] = useState("");
  const [area, setArea] = useState("");
  const [tipoSolo, setTipoSolo] = useState("franco");
  const [sistemaIrrigacao, setSistemaIrrigacao] = useState("nenhum");
  const [observacoes, setObservacoes] = useState("");
  const [saving, setSaving] = useState(false);

  const areaTotal = Number(propriedade?.tamanhoArea ?? 0);

  const openNew = () => {
    setEditingId(null);
    setNome("");
    setArea("");
    setTipoSolo("franco");
    setSistemaIrrigacao("nenhum");
    setObservacoes("");
    setModalVisible(true);
  };

  // Etapa 6: + Registrar → talhão abre o formulário com returnTab/safraId
  useEffect(() => {
    if (openCreate === "1" && propId > 0) {
      openNew();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só na entrada com openCreate
  }, [openCreate, propId]);

  const openEdit = (t: (typeof terrenos)[0]) => {
    setEditingId(t.id);
    setNome(t.nome);
    setArea(t.area ? String(t.area) : "");
    setTipoSolo(t.tipoSolo ?? "franco");
    setSistemaIrrigacao(t.sistemaIrrigacao ?? "nenhum");
    setObservacoes(t.observacoes ?? "");
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!nome.trim() || !area.trim()) {
      Alert.alert("Atenção", "Preencha o nome e a área do terreno.");
      return;
    }
    const areaNum = parseFloat(area);
    if (isNaN(areaNum) || areaNum <= 0) {
      Alert.alert("Atenção", "Informe uma área válida em hectares.");
      return;
    }
    if (areaTotal > 0 && areaNum > areaTotal) {
      Alert.alert(
        "Atenção",
        `A área do terreno (${areaNum} ha) não pode ser maior que a área total da propriedade (${areaTotal} ha).`,
      );
      return;
    }

    setSaving(true);
    try {
      const payload = {
        propriedadeId: propId,
        nome: nome.trim(),
        area: areaNum,
        tipoSolo: tipoSolo || undefined,
        sistemaIrrigacao: sistemaIrrigacao !== "nenhum" ? sistemaIrrigacao : undefined,
        observacoes: observacoes.trim() || undefined,
      };
      if (editingId) {
        await runMutation("terreno", "update", { id: editingId, data: payload });
      } else {
        await runMutation("terreno", "create", payload);
      }
      await utils.coreData.terrenos.listByPropriedade.invalidate({ propriedadeId: propId });
      await utils.coreData.expansao.overview.invalidate({
        propriedadeId: propId,
        safraId: activeSafraId ?? undefined,
      });
      setModalVisible(false);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Não foi possível salvar.";
      Alert.alert("Erro", message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (t: (typeof terrenos)[0]) => {
    Alert.alert("Excluir terreno?", `"${t.nome}" será removido permanentemente.`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            await runMutation("terreno", "delete", { id: t.id });
          } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Não foi possível excluir.";
            Alert.alert("Erro", message);
          }
        },
      },
    ]);
  };

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    label: {
      fontSize: 12,
      color: colors.muted,
      marginBottom: 4,
      fontWeight: "500",
    },
    input: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.foreground,
      marginBottom: 14,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1,
      marginRight: 8,
      marginBottom: 8,
    },
  });

  const areaUsada = terrenos.reduce((sum, t) => sum + (Number(t.area) || 0), 0);

  if (loadingProp || loadingTerrenos) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (!propriedade) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: colors.muted }}>Propriedade não encontrada.</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View
        style={{
          backgroundColor: colors.primary,
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 20,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity
            onPress={goBackToProperty}
            accessibilityRole="button"
            accessibilityLabel="Voltar para a propriedade"
          >
            <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#FFFFFF" }}>Terrenos</Text>
            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>{propriedade.nome}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, padding: 8 }}
          onPress={openNew}
        >
          <IconSymbol name="plus" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View
        style={{
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          paddingHorizontal: 20,
          paddingVertical: 12,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.primary }}>{areaTotal || "—"} ha</Text>
          <Text style={{ fontSize: 11, color: colors.muted }}>Área Total</Text>
        </View>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.success }}>{areaUsada.toFixed(1)} ha</Text>
          <Text style={{ fontSize: 11, color: colors.muted }}>Mapeada</Text>
        </View>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.warning }}>
            {areaTotal > 0 ? Math.max(0, areaTotal - areaUsada).toFixed(1) : "—"} ha
          </Text>
          <Text style={{ fontSize: 11, color: colors.muted }}>Disponível</Text>
        </View>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>{terrenos.length}</Text>
          <Text style={{ fontSize: 11, color: colors.muted }}>Talhões</Text>
        </View>
      </View>

      {terrenos.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <IconSymbol name="map.fill" size={64} color={colors.border} />
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginTop: 16 }}>
            Nenhum terreno cadastrado
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", marginTop: 8 }}>
            Divida sua propriedade em talhões para gerenciar melhor cada área.
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: colors.primary,
              borderRadius: 12,
              paddingHorizontal: 24,
              paddingVertical: 14,
              marginTop: 20,
            }}
            onPress={openNew}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>+ Novo Terreno</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={terrenos}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 17, fontWeight: "700", color: colors.foreground }}>{item.nome}</Text>
                  <View style={{ flexDirection: "row", gap: 16, marginTop: 8 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <IconSymbol name="scalemass.fill" size={13} color={colors.muted} />
                      <Text style={{ fontSize: 13, color: colors.muted }}>{Number(item.area)} ha</Text>
                    </View>
                    {item.tipoSolo && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <IconSymbol name="leaf.fill" size={13} color={colors.muted} />
                        <Text style={{ fontSize: 13, color: colors.muted, textTransform: "capitalize" }}>
                          {item.tipoSolo}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <TouchableOpacity onPress={() => openEdit(item)}>
                    <IconSymbol name="pencil" size={18} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item)}>
                    <IconSymbol name="trash.fill" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>

              {item.sistemaIrrigacao && (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                  <View style={{ backgroundColor: "#3B82F620", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ fontSize: 11, color: "#3B82F6", fontWeight: "600" }}>
                      {IRRIGACAO.find((i) => i.value === item.sistemaIrrigacao)?.label ?? item.sistemaIrrigacao}
                    </Text>
                  </View>
                </View>
              )}

              {item.observacoes && (
                <Text style={{ fontSize: 13, color: colors.muted, marginTop: 8 }} numberOfLines={2}>
                  {item.observacoes}
                </Text>
              )}
            </View>
          )}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 20,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground }}>
              {editingId ? "Editar Terreno" : "Novo Terreno"}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <IconSymbol name="xmark" size={22} color={colors.muted} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Text style={styles.label}>Nome do Terreno / Talhão *</Text>
            <TextInput
              style={styles.input}
              value={nome}
              onChangeText={setNome}
              placeholder="Ex: Talhão A, Área Norte, Várzea"
              placeholderTextColor={colors.muted}
              returnKeyType="next"
            />

            <Text style={styles.label}>Área (hectares) *</Text>
            <TextInput
              style={styles.input}
              value={area}
              onChangeText={setArea}
              placeholder="Ex: 25.5"
              placeholderTextColor={colors.muted}
              keyboardType="decimal-pad"
              returnKeyType="next"
            />

            <Text style={styles.label}>Tipo de Solo</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {TIPO_SOLO.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: tipoSolo === t.value ? colors.primary : colors.surface,
                      borderColor: tipoSolo === t.value ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setTipoSolo(t.value)}
                >
                  <Text style={{ fontSize: 13, fontWeight: "600", color: tipoSolo === t.value ? "#FFF" : colors.foreground }}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Sistema de Irrigação</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
              {IRRIGACAO.map((i) => (
                <TouchableOpacity
                  key={i.value}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: sistemaIrrigacao === i.value ? colors.tint : colors.surface,
                      borderColor: sistemaIrrigacao === i.value ? colors.tint : colors.border,
                    },
                  ]}
                  onPress={() => setSistemaIrrigacao(i.value)}
                >
                  <Text style={{ fontSize: 13, fontWeight: "600", color: sistemaIrrigacao === i.value ? "#FFF" : colors.foreground }}>
                    {i.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Observações</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: "top" }]}
              value={observacoes}
              onChangeText={setObservacoes}
              placeholder="Características do terreno, histórico de cultivos..."
              placeholderTextColor={colors.muted}
              multiline
              returnKeyType="done"
            />

            <TouchableOpacity
              style={{
                backgroundColor: saving ? colors.muted : colors.primary,
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: "center",
                marginTop: 8,
              }}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>
                {editingId ? "Salvar Alterações" : "Cadastrar Terreno"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
