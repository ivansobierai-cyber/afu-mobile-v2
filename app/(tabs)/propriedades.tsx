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
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useRunCoreMutation } from "@/hooks/use-run-core-mutation";
import { getDeviceCoordinates } from "@/hooks/use-device-location";
import { hasValidCoordinates, parseCoordinate, parseCoordinateInput } from "@/lib/geo/coordinates";
import { trpc } from "@/lib/trpc";
import { useTenantQueryScope } from "@/hooks/use-tenant-query-scope";

const TIPOS_PRODUCAO = [
  { value: "graos", label: "Grãos" },
  { value: "hortifruti", label: "Hortifruti" },
  { value: "fruticultura", label: "Fruticultura" },
  { value: "cana", label: "Cana" },
  { value: "cafe", label: "Café" },
  { value: "pecuaria", label: "Pecuária" },
  { value: "misto", label: "Misto" },
  { value: "outro", label: "Outro" },
] as const;

const UNIDADES = ["ha", "alqueire", "m2"] as const;
type TipoProducao = typeof TIPOS_PRODUCAO[number]["value"];

interface FormState {
  nome: string;
  cidade: string;
  estado: string;
  tamanhoArea: string;
  unidadeArea: "ha" | "alqueire" | "m2";
  tipoSolo: string;
  fonteAgua: string;
  sistemaIrrigacao: string;
  tipoProducao: TipoProducao;
  latitude: string;
  longitude: string;
}

const EMPTY_FORM: FormState = {
  nome: "", cidade: "", estado: "", tamanhoArea: "",
  unidadeArea: "ha", tipoSolo: "", fonteAgua: "",
  sistemaIrrigacao: "", tipoProducao: "graos",
  latitude: "", longitude: "",
};

export default function PropriedadesScreen() {
  const colors = useColors();
  const router = useRouter();
  const { runMutation } = useRunCoreMutation();

  const { cacheInput, activeOrganizationId } = useTenantQueryScope();
  const { data: propriedades = [], isLoading, refetch } = trpc.coreData.propriedades.list.useQuery(
    cacheInput,
    { enabled: !!activeOrganizationId },
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  const openNew = () => { setEditingId(null); setForm(EMPTY_FORM); setModalVisible(true); };

  const openEdit = (prop: typeof propriedades[0]) => {
    setEditingId(prop.id);
    setForm({
      nome: prop.nome ?? "",
      cidade: prop.cidade ?? "",
      estado: prop.estado ?? "",
      tamanhoArea: prop.tamanhoArea ? String(prop.tamanhoArea) : "",
      unidadeArea: (prop.unidadeArea as any) ?? "ha",
      tipoSolo: prop.tipoSolo ?? "",
      fonteAgua: prop.fonteAgua ?? "",
      sistemaIrrigacao: prop.sistemaIrrigacao ?? "",
      tipoProducao: (prop.tipoProducao as TipoProducao) ?? "graos",
      latitude: prop.latitude ? String(prop.latitude) : "",
      longitude: prop.longitude ? String(prop.longitude) : "",
    });
    setModalVisible(true);
  };

  const handleUseLocation = async () => {
    setLocating(true);
    try {
      const coords = await getDeviceCoordinates();
      if (!coords) return;
      setForm((f) => ({
        ...f,
        latitude: coords.latitude.toFixed(6),
        longitude: coords.longitude.toFixed(6),
      }));
    } catch (e: any) {
      Alert.alert("Erro", e.message ?? "Não foi possível obter a localização.");
    } finally {
      setLocating(false);
    }
  };

  const handleSave = async () => {
    if (!form.nome.trim()) { Alert.alert("Atenção", "O nome da propriedade é obrigatório."); return; }

    const latitude = parseCoordinateInput(form.latitude);
    const longitude = parseCoordinateInput(form.longitude);
    if ((form.latitude.trim() || form.longitude.trim()) && !hasValidCoordinates(latitude ?? null, longitude ?? null)) {
      Alert.alert("Atenção", "Informe coordenadas GPS válidas ou deixe os campos em branco.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        cidade: form.cidade.trim() || undefined,
        estado: form.estado.trim() || undefined,
        tamanhoArea: form.tamanhoArea ? parseFloat(form.tamanhoArea) : undefined,
        unidadeArea: form.unidadeArea,
        tipoSolo: form.tipoSolo.trim() || undefined,
        fonteAgua: form.fonteAgua.trim() || undefined,
        sistemaIrrigacao: form.sistemaIrrigacao.trim() || undefined,
        tipoProducao: form.tipoProducao,
        latitude,
        longitude,
      };
      if (editingId) {
        await runMutation("propriedade", "update", { id: editingId, data: payload });
      } else {
        await runMutation("propriedade", "create", payload);
      }
      setModalVisible(false);
    } catch (e: any) {
      Alert.alert("Erro", e.message ?? "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: number, nome: string) => {
    Alert.alert("Excluir Propriedade", `Deseja excluir "${nome}"?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: async () => {
        try { await runMutation("propriedade", "delete", { id }); }
        catch (e: any) { Alert.alert("Erro", e.message ?? "Não foi possível excluir."); }
      }},
    ]);
  };

  const styles = StyleSheet.create({
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, backgroundColor: colors.primary },
    title: { fontSize: 22, fontWeight: "700", color: "#fff" },
    addBtn: { backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, padding: 8 },
    card: { backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    cardTitle: { fontSize: 16, fontWeight: "700", color: colors.foreground, flex: 1 },
    badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: colors.primary + "22" },
    badgeText: { fontSize: 11, fontWeight: "600", color: colors.primary },
    cardMeta: { fontSize: 13, color: colors.muted, marginTop: 4 },
    cardActions: { flexDirection: "row", gap: 8, marginTop: 10 },
    actionBtn: { flex: 1, borderRadius: 8, paddingVertical: 7, alignItems: "center" },
    emptyBox: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 60, paddingHorizontal: 32 },
    emptyText: { fontSize: 16, color: colors.muted, marginTop: 12, fontWeight: "600" },
    emptySubText: { fontSize: 13, color: colors.muted, marginTop: 4, textAlign: "center", lineHeight: 20 },
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    sheet: { backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "92%", padding: 20 },
    sheetTitle: { fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 16 },
    label: { fontSize: 13, color: colors.muted, marginBottom: 4, marginTop: 10 },
    input: { backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10, color: colors.foreground, fontSize: 15 },
    row: { flexDirection: "row", gap: 8 },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
    chip: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1 },
    chipText: { fontSize: 12, fontWeight: "500" },
    saveBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 20 },
    saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
    cancelBtn: { borderRadius: 12, paddingVertical: 12, alignItems: "center", marginTop: 8 },
    cancelBtnText: { color: colors.muted, fontSize: 14 },
    locateBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: colors.primary + "18", borderRadius: 10, paddingVertical: 10, marginTop: 8, borderWidth: 1, borderColor: colors.primary + "40" },
    locateBtnText: { color: colors.primary, fontWeight: "600", fontSize: 14 },
  });

  const renderItem = ({ item }: { item: typeof propriedades[0] }) => {
    const tipoLabel = TIPOS_PRODUCAO.find((t) => t.value === item.tipoProducao)?.label ?? item.tipoProducao;
    return (
      <TouchableOpacity style={styles.card} onPress={() => router.push(`/propriedades/${item.id}` as any)}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.nome}</Text>
          <View style={styles.badge}><Text style={styles.badgeText}>{tipoLabel}</Text></View>
        </View>
        {(item.cidade || item.estado) && (
          <Text style={styles.cardMeta}>📍 {[item.cidade, item.estado].filter(Boolean).join(", ")}</Text>
        )}
        {hasValidCoordinates(parseCoordinate(item.latitude), parseCoordinate(item.longitude)) && (
          <Text style={styles.cardMeta}>🗺️ Localização GPS cadastrada</Text>
        )}
        {item.tamanhoArea && (
          <Text style={styles.cardMeta}>📐 {Number(item.tamanhoArea).toLocaleString("pt-BR")} {item.unidadeArea}</Text>
        )}
        <View style={styles.cardActions}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary + "18" }]} onPress={() => openEdit(item)}>
            <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 13 }}>✏️ Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.error + "18" }]} onPress={() => handleDelete(item.id, item.nome)}>
            <Text style={{ color: colors.error, fontWeight: "600", fontSize: 13 }}>🗑️ Excluir</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Propriedades</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity style={styles.addBtn} onPress={() => router.push("/propriedades/mapa" as any)}>
            <IconSymbol name="map.fill" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={openNew}>
            <IconSymbol name="plus" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.emptyBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.emptyText}>Carregando...</Text>
        </View>
      ) : propriedades.length === 0 ? (
        <View style={styles.emptyBox}>
          <IconSymbol name="house.fill" size={48} color={colors.muted} />
          <Text style={styles.emptyText}>Nenhuma propriedade cadastrada</Text>
          <Text style={styles.emptySubText}>Toque em "+" para adicionar sua primeira propriedade.</Text>
          <TouchableOpacity style={[styles.saveBtn, { marginTop: 20, paddingHorizontal: 24 }]} onPress={openNew}>
            <Text style={styles.saveBtnText}>+ Nova Propriedade</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={propriedades}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        />
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <ScrollView style={styles.sheet} keyboardShouldPersistTaps="handled">
            <Text style={styles.sheetTitle}>{editingId ? "Editar Propriedade" : "Nova Propriedade"}</Text>

            <Text style={styles.label}>Nome *</Text>
            <TextInput style={styles.input} value={form.nome} onChangeText={(v) => setForm((f) => ({ ...f, nome: v }))} placeholder="Ex: Fazenda São João" placeholderTextColor={colors.muted} />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Cidade</Text>
                <TextInput style={styles.input} value={form.cidade} onChangeText={(v) => setForm((f) => ({ ...f, cidade: v }))} placeholder="Cidade" placeholderTextColor={colors.muted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Estado</Text>
                <TextInput style={styles.input} value={form.estado} onChangeText={(v) => setForm((f) => ({ ...f, estado: v }))} placeholder="UF" placeholderTextColor={colors.muted} maxLength={2} autoCapitalize="characters" />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 2 }}>
                <Text style={styles.label}>Área Total</Text>
                <TextInput style={styles.input} value={form.tamanhoArea} onChangeText={(v) => setForm((f) => ({ ...f, tamanhoArea: v }))} placeholder="0.00" placeholderTextColor={colors.muted} keyboardType="decimal-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Unidade</Text>
                <View style={styles.chipRow}>
                  {UNIDADES.map((u) => (
                    <TouchableOpacity key={u} style={[styles.chip, { backgroundColor: form.unidadeArea === u ? colors.primary : colors.surface, borderColor: form.unidadeArea === u ? colors.primary : colors.border }]} onPress={() => setForm((f) => ({ ...f, unidadeArea: u }))}>
                      <Text style={[styles.chipText, { color: form.unidadeArea === u ? "#fff" : colors.foreground }]}>{u}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <Text style={styles.label}>Tipo de Produção</Text>
            <View style={styles.chipRow}>
              {TIPOS_PRODUCAO.map((t) => (
                <TouchableOpacity key={t.value} style={[styles.chip, { backgroundColor: form.tipoProducao === t.value ? colors.primary : colors.surface, borderColor: form.tipoProducao === t.value ? colors.primary : colors.border }]} onPress={() => setForm((f) => ({ ...f, tipoProducao: t.value }))}>
                  <Text style={[styles.chipText, { color: form.tipoProducao === t.value ? "#fff" : colors.foreground }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Tipo de Solo</Text>
            <TextInput style={styles.input} value={form.tipoSolo} onChangeText={(v) => setForm((f) => ({ ...f, tipoSolo: v }))} placeholder="Ex: Latossolo Vermelho" placeholderTextColor={colors.muted} />

            <Text style={styles.label}>Fonte de Água</Text>
            <TextInput style={styles.input} value={form.fonteAgua} onChangeText={(v) => setForm((f) => ({ ...f, fonteAgua: v }))} placeholder="Ex: Rio, Poço, Represa" placeholderTextColor={colors.muted} />

            <Text style={styles.label}>Sistema de Irrigação</Text>
            <TextInput style={styles.input} value={form.sistemaIrrigacao} onChangeText={(v) => setForm((f) => ({ ...f, sistemaIrrigacao: v }))} placeholder="Ex: Gotejamento, Aspersão" placeholderTextColor={colors.muted} />

            <Text style={styles.label}>Localização GPS</Text>
            <TouchableOpacity style={styles.locateBtn} onPress={handleUseLocation} disabled={locating}>
              {locating ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <>
                  <IconSymbol name="location.fill" size={16} color={colors.primary} />
                  <Text style={styles.locateBtnText}>Usar minha localização</Text>
                </>
              )}
            </TouchableOpacity>
            <View style={[styles.row, { marginTop: 8 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Latitude</Text>
                <TextInput style={styles.input} value={form.latitude} onChangeText={(v) => setForm((f) => ({ ...f, latitude: v }))} placeholder="-21.177500" placeholderTextColor={colors.muted} keyboardType="numbers-and-punctuation" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Longitude</Text>
                <TextInput style={styles.input} value={form.longitude} onChangeText={(v) => setForm((f) => ({ ...f, longitude: v }))} placeholder="-47.810300" placeholderTextColor={colors.muted} keyboardType="numbers-and-punctuation" />
              </View>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{editingId ? "Salvar Alterações" : "Cadastrar Propriedade"}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
