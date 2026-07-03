import { useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, Modal, TextInput,
  ScrollView, StyleSheet, Alert, ActivityIndicator, RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

const TIPO_EVENTO = [
  { value: "plantio", label: "Plantio", color: "#38A169" },
  { value: "irrigacao", label: "Irrigação", color: "#3B82F6" },
  { value: "adubacao", label: "Adubação", color: "#D97706" },
  { value: "monitoramento", label: "Monitoramento", color: "#8B5CF6" },
  { value: "colheita", label: "Colheita", color: "#2D6A4F" },
  { value: "outro", label: "Outro", color: "#6B7C6E" },
];
const PRIORIDADES = [
  { value: "baixa", label: "Baixa", color: "#6B7C6E" },
  { value: "normal", label: "Normal", color: "#3B82F6" },
  { value: "alta", label: "Alta", color: "#D97706" },
  { value: "critica", label: "Crítica", color: "#E53E3E" },
];

interface FormState {
  titulo: string;
  tipoAtividade: string;
  prioridade: string;
  dataProgramada: string;
  descricao: string;
}
const EMPTY_FORM: FormState = { titulo: "", tipoAtividade: "plantio", prioridade: "normal", dataProgramada: "", descricao: "" };

export default function CalendarioScreen() {
  const colors = useColors();
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: eventos = [], isLoading, refetch } = trpc.coreData.calendario.list.useQuery();
  const createMutation = trpc.coreData.calendario.create.useMutation({
    onSuccess: () => utils.coreData.calendario.list.invalidate(),
  });
  const updateMutation = trpc.coreData.calendario.update.useMutation({
    onSuccess: () => utils.coreData.calendario.list.invalidate(),
  });
  const deleteMutation = trpc.coreData.calendario.delete.useMutation({
    onSuccess: () => utils.coreData.calendario.list.invalidate(),
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [filter, setFilter] = useState<"todos" | "pendente" | "concluido">("todos");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.titulo.trim() || !form.dataProgramada.trim()) {
      Alert.alert("Atenção", "Preencha o título e a data do evento.");
      return;
    }
    setSaving(true);
    try {
      await createMutation.mutateAsync({
        titulo: form.titulo.trim(),
        tipoAtividade: form.tipoAtividade as any,
        prioridade: form.prioridade as any,
        dataProgramada: form.dataProgramada,
        descricao: form.descricao.trim() || undefined,
        status: "pendente",
      });
      setModalVisible(false);
      setForm(EMPTY_FORM);
    } catch (e: any) {
      Alert.alert("Erro", e.message ?? "Não foi possível salvar o evento.");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "concluido" ? "pendente" : "concluido";
    try {
      await updateMutation.mutateAsync({ id, data: { status: newStatus as any } });
    } catch (e: any) {
      Alert.alert("Erro", e.message ?? "Não foi possível atualizar.");
    }
  };

  const handleDelete = (id: number, titulo: string) => {
    Alert.alert("Excluir evento?", `"${titulo}"`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: async () => {
        try { await deleteMutation.mutateAsync({ id }); }
        catch (e: any) { Alert.alert("Erro", e.message ?? "Não foi possível excluir."); }
      }},
    ]);
  };

  const filtered = eventos.filter((e) => {
    if (filter === "pendente") return e.status === "pendente" || e.status === "em_andamento";
    if (filter === "concluido") return e.status === "concluido" || e.status === "cancelado";
    return true;
  });

  const styles = StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "flex-start", gap: 12 },
    label: { fontSize: 12, color: colors.muted, marginBottom: 4, fontWeight: "500" },
    input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: colors.foreground, marginBottom: 12 },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
    chip: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    sheet: { backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "90%", padding: 20 },
    sheetTitle: { fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 16 },
    saveBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 16 },
    saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
    cancelBtn: { borderRadius: 12, paddingVertical: 12, alignItems: "center", marginTop: 8 },
    cancelBtnText: { color: colors.muted, fontSize: 14 },
  });

  const getTipoInfo = (tipo: string) => TIPO_EVENTO.find((t) => t.value === tipo) ?? TIPO_EVENTO[5];

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: colors.primary, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: "700", color: "#FFFFFF" }}>Calendário Agrícola</Text>
        </View>
        <TouchableOpacity style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, padding: 8 }} onPress={() => { setForm(EMPTY_FORM); setModalVisible(true); }}>
          <IconSymbol name="plus" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Filtro */}
      <View style={{ flexDirection: "row", backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        {(["todos", "pendente", "concluido"] as const).map((f) => (
          <TouchableOpacity key={f} style={{ flex: 1, paddingVertical: 12, alignItems: "center", borderBottomWidth: 2, borderBottomColor: filter === f ? colors.primary : "transparent" }} onPress={() => setFilter(f)}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: filter === f ? colors.primary : colors.muted }}>
              {f === "todos" ? "Todos" : f === "pendente" ? "Pendentes" : "Concluídos"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <IconSymbol name="calendar" size={48} color={colors.muted} />
          <Text style={{ fontSize: 16, color: colors.muted, marginTop: 12, fontWeight: "600" }}>Nenhum evento encontrado</Text>
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4, textAlign: "center" }}>Toque em "+" para adicionar um evento ao calendário.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
          renderItem={({ item }) => {
            const tipoInfo = getTipoInfo(item.tipoAtividade ?? "outro");
            const isConcluido = item.status === "concluido";
            return (
              <View style={styles.card}>
                <TouchableOpacity onPress={() => toggleStatus(item.id, item.status ?? "pendente")} style={{ paddingTop: 2 }}>
                  <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: isConcluido ? colors.success : colors.border, backgroundColor: isConcluido ? colors.success : "transparent", alignItems: "center", justifyContent: "center" }}>
                    {isConcluido && <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>✓</Text>}
                  </View>
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: isConcluido ? colors.muted : colors.foreground, textDecorationLine: isConcluido ? "line-through" : "none" }}>{item.titulo}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <View style={{ backgroundColor: tipoInfo.color + "20", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text style={{ fontSize: 11, fontWeight: "700", color: tipoInfo.color }}>{tipoInfo.label}</Text>
                    </View>
                    {item.dataProgramada && (
                      <Text style={{ fontSize: 12, color: colors.muted }}>
                        {new Date(item.dataProgramada).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                      </Text>
                    )}
                  </View>
                  {item.descricao && <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }} numberOfLines={2}>{item.descricao}</Text>}
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.id, item.titulo)}>
                  <IconSymbol name="trash.fill" size={16} color={colors.error} />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <ScrollView style={styles.sheet} keyboardShouldPersistTaps="handled">
            <Text style={styles.sheetTitle}>Novo Evento</Text>

            <Text style={styles.label}>Título *</Text>
            <TextInput style={styles.input} value={form.titulo} onChangeText={(v) => setForm((f) => ({ ...f, titulo: v }))} placeholder="Ex: Aplicação de fungicida" placeholderTextColor={colors.muted} />

            <Text style={styles.label}>Tipo</Text>
            <View style={styles.chipRow}>
              {TIPO_EVENTO.map((t) => (
                <TouchableOpacity key={t.value} style={[styles.chip, { backgroundColor: form.tipoAtividade === t.value ? t.color : colors.surface, borderColor: form.tipoAtividade === t.value ? t.color : colors.border }]} onPress={() => setForm((f) => ({ ...f, tipo: t.value }))}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: form.tipoAtividade === t.value ? "#fff" : colors.foreground }}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Prioridade</Text>
            <View style={styles.chipRow}>
              {PRIORIDADES.map((p) => (
                <TouchableOpacity key={p.value} style={[styles.chip, { backgroundColor: form.prioridade === p.value ? p.color : colors.surface, borderColor: form.prioridade === p.value ? p.color : colors.border }]} onPress={() => setForm((f) => ({ ...f, prioridade: p.value }))}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: form.prioridade === p.value ? "#fff" : colors.foreground }}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Data Programada * (AAAA-MM-DD)</Text>
            <TextInput style={styles.input} value={form.dataProgramada} onChangeText={(v) => setForm((f) => ({ ...f, dataProgramada: v }))} placeholder="Ex: 2026-07-15" placeholderTextColor={colors.muted} />

            <Text style={styles.label}>Descrição</Text>
            <TextInput style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]} value={form.descricao} onChangeText={(v) => setForm((f) => ({ ...f, descricao: v }))} placeholder="Detalhes do evento..." placeholderTextColor={colors.muted} multiline />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Salvar Evento</Text>}
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
