import { useState } from "react";
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
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

const TIPO_SOLO = [
  { value: "argiloso", label: "Argiloso" },
  { value: "arenoso", label: "Arenoso" },
  { value: "siltoso", label: "Siltoso" },
  { value: "franco", label: "Franco" },
  { value: "organico", label: "Orgânico" },
];

const DRENAGEM = [
  { value: "bom", label: "Boa" },
  { value: "medio", label: "Média" },
  { value: "ruim", label: "Ruim" },
];

const IRRIGACAO = [
  { value: "gotejamento", label: "Gotejamento" },
  { value: "aspersao", label: "Aspersão" },
  { value: "microaspersao", label: "Microaspersão" },
  { value: "sulcos", label: "Sulcos" },
  { value: "manual", label: "Manual" },
  { value: "nenhum", label: "Nenhum" },
];

type TerrenoRow = {
  id: number;
  propriedadeId: number;
  nome: string;
  area: string | null;
  tipoSolo: string | null;
  sistemaIrrigacao: string | null;
  observacoes: string | null;
};

function buildObservacoes(ph: string, drenagem: string, base: string): string | undefined {
  const parts: string[] = [];
  if (ph.trim()) parts.push(`pH médio: ${ph.trim()}`);
  const dLabel = DRENAGEM.find((d) => d.value === drenagem)?.label;
  if (drenagem && drenagem !== "bom") parts.push(`Drenagem: ${dLabel ?? drenagem}`);
  if (base.trim()) parts.push(base.trim());
  return parts.length > 0 ? parts.join(" | ") : undefined;
}

function parseObservacoes(obs?: string | null) {
  const raw = obs ?? "";
  const phMatch = raw.match(/pH médio:\s*([\d.]+)/i);
  const drenMatch = raw.match(/Drenagem:\s*(Boa|Média|Ruim|bom|medio|ruim)/i);
  let tipoDrenagem = "bom";
  if (drenMatch) {
    const map: Record<string, string> = { boa: "bom", média: "medio", media: "medio", ruim: "ruim" };
    tipoDrenagem = map[drenMatch[1].toLowerCase()] ?? drenMatch[1].toLowerCase();
  }
  const cleaned = raw
    .replace(/pH médio:\s*[\d.]+\s*\|?\s*/i, "")
    .replace(/Drenagem:\s*[^|]+\s*\|?\s*/i, "")
    .trim();
  return {
    phMedio: phMatch?.[1] ?? "",
    tipoDrenagem,
    observacoes: cleaned,
  };
}

function parsePhFromObs(obs?: string | null): string | undefined {
  const m = (obs ?? "").match(/pH médio:\s*([\d.]+)/i);
  return m?.[1];
}

function parseDrenagemFromObs(obs?: string | null): string | undefined {
  const m = (obs ?? "").match(/Drenagem:\s*(Boa|Média|Ruim)/i);
  if (!m) return undefined;
  const map: Record<string, string> = { boa: "bom", média: "medio", ruim: "ruim" };
  return map[m[1].toLowerCase()] ?? m[1].toLowerCase();
}

export default function TerrenosScreen() {
  const colors = useColors();
  const router = useRouter();
  const utils = trpc.useUtils();
  const { propriedadeId: propriedadeIdParam } = useLocalSearchParams<{ propriedadeId: string }>();
  const propriedadeId = parseInt(propriedadeIdParam ?? "0", 10);

  const { data: propriedade, isLoading: loadingProp } = trpc.coreData.propriedades.get.useQuery(
    { id: propriedadeId },
    { enabled: propriedadeId > 0 },
  );

  const { data: terrenos = [], isLoading: loadingTerrenos, refetch } =
    trpc.coreData.terrenos.listByPropriedade.useQuery(
      { propriedadeId },
      { enabled: propriedadeId > 0 },
    );

  const createMutation = trpc.coreData.terrenos.create.useMutation({
    onSuccess: () => utils.coreData.terrenos.listByPropriedade.invalidate({ propriedadeId }),
  });
  const updateMutation = trpc.coreData.terrenos.update.useMutation({
    onSuccess: () => utils.coreData.terrenos.listByPropriedade.invalidate({ propriedadeId }),
  });
  const deleteMutation = trpc.coreData.terrenos.delete.useMutation({
    onSuccess: () => utils.coreData.terrenos.listByPropriedade.invalidate({ propriedadeId }),
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nome, setNome] = useState("");
  const [area, setArea] = useState("");
  const [tipoSolo, setTipoSolo] = useState("franco");
  const [phMedio, setPhMedio] = useState("");
  const [tipoDrenagem, setTipoDrenagem] = useState("bom");
  const [tipoIrrigacao, setTipoIrrigacao] = useState("nenhum");
  const [observacoes, setObservacoes] = useState("");
  const [saving, setSaving] = useState(false);

  const areaTotal = Number(propriedade?.tamanhoArea ?? 0);
  const areaUsada = (terrenos as TerrenoRow[]).reduce((sum, t) => sum + Number(t.area ?? 0), 0);

  const openNew = () => {
    setEditingId(null);
    setNome("");
    setArea("");
    setTipoSolo("franco");
    setPhMedio("");
    setTipoDrenagem("bom");
    setTipoIrrigacao("nenhum");
    setObservacoes("");
    setModalVisible(true);
  };

  const openEdit = (t: TerrenoRow) => {
    const parsed = parseObservacoes(t.observacoes);
    setEditingId(t.id);
    setNome(t.nome);
    setArea(t.area ? String(t.area) : "");
    setTipoSolo(t.tipoSolo ?? "franco");
    setPhMedio(parsed.phMedio);
    setTipoDrenagem(parsed.tipoDrenagem);
    setTipoIrrigacao(t.sistemaIrrigacao ?? "nenhum");
    setObservacoes(parsed.observacoes);
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
      Alert.alert("Atenção", `A área do terreno (${areaNum} ha) não pode ser maior que a área total da propriedade (${areaTotal} ha).`);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        propriedadeId,
        nome: nome.trim(),
        area: areaNum,
        tipoSolo: tipoSolo || undefined,
        sistemaIrrigacao: tipoIrrigacao !== "nenhum" ? tipoIrrigacao : undefined,
        observacoes: buildObservacoes(phMedio, tipoDrenagem, observacoes),
      };
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setModalVisible(false);
    } catch (e: any) {
      Alert.alert("Erro", e.message ?? "Não foi possível salvar o terreno.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (t: TerrenoRow) => {
    Alert.alert("Excluir terreno?", `"${t.nome}" será removido permanentemente.`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync({ id: t.id });
          } catch (e: any) {
            Alert.alert("Erro", e.message ?? "Não foi possível excluir.");
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
    label: { fontSize: 12, color: colors.muted, marginBottom: 4, fontWeight: "500" },
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

  const isLoading = loadingProp || loadingTerrenos;

  if (propriedadeId <= 0) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: colors.muted }}>Propriedade inválida.</Text>
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
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#FFFFFF" }}>Terrenos</Text>
            {propriedade && (
              <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>
                {propriedade.nome}
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, padding: 8 }}
          onPress={openNew}
        >
          <IconSymbol name="plus" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {propriedade && (
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
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.primary }}>
              {areaTotal > 0 ? `${areaTotal} ha` : "—"}
            </Text>
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
      )}

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : terrenos.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <IconSymbol name="map.fill" size={64} color={colors.border} />
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginTop: 16 }}>
            Nenhum terreno cadastrado
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14, marginTop: 20 }}
            onPress={openNew}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>+ Novo Terreno</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={terrenos as TerrenoRow[]}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
          renderItem={({ item }) => {
            const ph = parsePhFromObs(item.observacoes);
            const drenagem = parseDrenagemFromObs(item.observacoes);
            return (
              <View style={styles.card}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 17, fontWeight: "700", color: colors.foreground }}>{item.nome}</Text>
                    <View style={{ flexDirection: "row", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
                      <Text style={{ fontSize: 13, color: colors.muted }}>{item.area} ha</Text>
                      {item.tipoSolo && (
                        <Text style={{ fontSize: 13, color: colors.muted, textTransform: "capitalize" }}>{item.tipoSolo}</Text>
                      )}
                      {ph && <Text style={{ fontSize: 13, color: colors.muted }}>pH {ph}</Text>}
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
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                  {item.sistemaIrrigacao && (
                    <View style={{ backgroundColor: "#3B82F620", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ fontSize: 11, color: "#3B82F6", fontWeight: "600" }}>
                        {IRRIGACAO.find((i) => i.value === item.sistemaIrrigacao)?.label ?? item.sistemaIrrigacao}
                      </Text>
                    </View>
                  )}
                  {drenagem && (
                    <View style={{ backgroundColor: colors.success + "20", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ fontSize: 11, fontWeight: "600", color: colors.success }}>
                        Drenagem {DRENAGEM.find((d) => d.value === drenagem)?.label}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground }}>
              {editingId ? "Editar Terreno" : "Novo Terreno"}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <IconSymbol name="xmark" size={22} color={colors.muted} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Text style={styles.label}>Nome do Terreno / Talhão *</Text>
            <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Ex: Talhão A" placeholderTextColor={colors.muted} />
            <Text style={styles.label}>Área (hectares) *</Text>
            <TextInput style={styles.input} value={area} onChangeText={setArea} keyboardType="decimal-pad" placeholder="Ex: 25.5" placeholderTextColor={colors.muted} />
            <Text style={styles.label}>Tipo de Solo</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {TIPO_SOLO.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[styles.chip, { backgroundColor: tipoSolo === t.value ? colors.primary : colors.surface, borderColor: tipoSolo === t.value ? colors.primary : colors.border }]}
                  onPress={() => setTipoSolo(t.value)}
                >
                  <Text style={{ fontSize: 13, fontWeight: "600", color: tipoSolo === t.value ? "#FFF" : colors.foreground }}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.label}>pH Médio (opcional)</Text>
            <TextInput style={styles.input} value={phMedio} onChangeText={setPhMedio} keyboardType="decimal-pad" placeholder="Ex: 6.5" placeholderTextColor={colors.muted} />
            <Text style={styles.label}>Drenagem</Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              {DRENAGEM.map((d) => (
                <TouchableOpacity
                  key={d.value}
                  style={[styles.chip, { backgroundColor: tipoDrenagem === d.value ? colors.primary : colors.surface, borderColor: tipoDrenagem === d.value ? colors.primary : colors.border }]}
                  onPress={() => setTipoDrenagem(d.value)}
                >
                  <Text style={{ fontSize: 13, fontWeight: "600", color: tipoDrenagem === d.value ? "#FFF" : colors.foreground }}>{d.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Sistema de Irrigação</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
              {IRRIGACAO.map((i) => (
                <TouchableOpacity
                  key={i.value}
                  style={[styles.chip, { backgroundColor: tipoIrrigacao === i.value ? colors.tint : colors.surface, borderColor: tipoIrrigacao === i.value ? colors.tint : colors.border }]}
                  onPress={() => setTipoIrrigacao(i.value)}
                >
                  <Text style={{ fontSize: 13, fontWeight: "600", color: tipoIrrigacao === i.value ? "#FFF" : colors.foreground }}>{i.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Observações</Text>
            <TextInput style={[styles.input, { height: 80, textAlignVertical: "top" }]} value={observacoes} onChangeText={setObservacoes} multiline placeholderTextColor={colors.muted} />
            <TouchableOpacity style={{ backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 8, opacity: saving ? 0.6 : 1 }} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : (
                <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>
                  {editingId ? "Salvar Alterações" : "Cadastrar Terreno"}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
