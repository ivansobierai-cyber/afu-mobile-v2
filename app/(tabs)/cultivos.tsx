import React, { useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, Modal, TextInput,
  ScrollView, StyleSheet, Alert, ActivityIndicator, RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { AreaValidationAlert } from "@/components/area-validation-alert";
import { useAreaValidation } from "@/hooks/use-area-validation";
import { useRunCoreMutation } from "@/hooks/use-run-core-mutation";

const STATUS_COLORS: Record<string, string> = {
  em_andamento: "#38A169", planejado: "#D97706", colhido: "#6B7C6E", perdido: "#E53E3E",
};
const STATUS_LABELS: Record<string, string> = {
  em_andamento: "Em andamento", planejado: "Planejado", colhido: "Colhido", perdido: "Perdido",
};
const FASES = [
  "planejamento","plantio","germinacao","muda","crescimento_vegetativo",
  "floracao","frutificacao","maturacao","colheita",
];
const CULTURAS_COMUNS = [
  "Soja","Milho","Trigo","Arroz","Feijão","Algodão","Cana-de-açúcar",
  "Café","Mandioca","Sorgo","Girassol","Batata","Tomate","Alface",
];

interface FormState {
  propriedadeId: string;
  nomeCultura: string;
  variedade: string;
  dataPlantio: string;
  faseAtual: string;
  areaPlantada: string;
  previsaoColheita: string;
  status: "planejado" | "em_andamento" | "colhido" | "perdido";
  observacoes: string;
}

const EMPTY_FORM: FormState = {
  propriedadeId: "", nomeCultura: "", variedade: "", dataPlantio: "",
  faseAtual: "plantio", areaPlantada: "", previsaoColheita: "",
  status: "em_andamento", observacoes: "",
};

export default function CultivosScreen() {
  const colors = useColors();
  const router = useRouter();
  const { runMutation } = useRunCoreMutation();

  const { data: cultivos = [], isLoading, refetch } = trpc.coreData.cultivos.list.useQuery();
  const { data: propriedades = [] } = trpc.coreData.propriedades.list.useQuery();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showCulturasPicker, setShowCulturasPicker] = useState(false);
  const [isAreaValid, setIsAreaValid] = useState(true);
  const [selectedTerreno, setSelectedTerreno] = useState<any>(null);

  const { data: terrenos = [] } = trpc.coreData.terrenos.listByPropriedade.useQuery(
    { propriedadeId: parseInt(form.propriedadeId) || 0 },
    { enabled: !!form.propriedadeId }
  );

  // Ao editar, sincroniza o talhão quando a lista da propriedade carregar
  useEffect(() => {
    if (!editingId || !modalVisible || terrenos.length === 0) return;
    const cultivo = cultivos.find((c) => c.id === editingId);
    if (!cultivo?.terrenoId) return;
    const match = terrenos.find((t) => t.id === cultivo.terrenoId);
    if (match) setSelectedTerreno(match);
  }, [editingId, modalVisible, terrenos, cultivos]);

  const { data: cultivosTerreno = [] } = trpc.coreData.cultivos.list.useQuery();

  const areaPlantadaExistente = cultivosTerreno
    .filter((c) => c.terrenoId === selectedTerreno?.id && c.id !== editingId)
    .reduce((sum, c) => sum + (parseFloat(String(c.areaPlantada)) || 0), 0);

  const areaValidation = useAreaValidation({
    areaTerreno: selectedTerreno?.area || 0,
    areaPlantadaExistente,
    onValidationChange: (result) => {
      setIsAreaValid(result.isValid);
    },
  })

  const openNew = () => {
    setEditingId(null);
    setSelectedTerreno(null);
    setForm({ ...EMPTY_FORM, propriedadeId: propriedades[0]?.id ? String(propriedades[0].id) : "" });
    setModalVisible(true);
  };

  const openEdit = (item: typeof cultivos[0]) => {
    setEditingId(item.id);
    setForm({
      propriedadeId: String(item.propriedadeId),
      nomeCultura: item.nomeCultura ?? "",
      variedade: item.variedade ?? "",
      dataPlantio: item.dataPlantio ? (item.dataPlantio instanceof Date ? item.dataPlantio.toISOString().split('T')[0] : String(item.dataPlantio)) : "",
      faseAtual: item.faseAtual ?? "plantio",
      areaPlantada: item.areaPlantada ? String(item.areaPlantada) : "",
      previsaoColheita: item.previsaoColheita ? (item.previsaoColheita instanceof Date ? item.previsaoColheita.toISOString().split('T')[0] : String(item.previsaoColheita)) : "",
      status: (item.status as any) ?? "em_andamento",
      observacoes: item.observacoes ?? "",
    });
    const terreno = terrenos.find((t) => t.id === item.terrenoId) ?? null;
    setSelectedTerreno(terreno);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.nomeCultura.trim()) { Alert.alert("Atenção", "Informe o nome da cultura."); return; }
    if (!form.propriedadeId) { Alert.alert("Atenção", "Selecione uma propriedade."); return; }
    setSaving(true);
    try {
      if (!selectedTerreno?.id) {
        Alert.alert("Atenção", "Selecione um talhão.");
        return;
      }
      const payload = {
        propriedadeId: parseInt(form.propriedadeId),
        terrenoId: selectedTerreno.id as number,
        nomeCultura: form.nomeCultura.trim(),
        variedade: form.variedade.trim() || undefined,
        dataPlantio: form.dataPlantio || undefined,
        faseAtual: form.faseAtual || undefined,
        areaPlantada: form.areaPlantada ? parseFloat(form.areaPlantada) : undefined,
        previsaoColheita: form.previsaoColheita || undefined,
        status: form.status,
        observacoes: form.observacoes.trim() || undefined,
      };
      if (editingId) {
        await runMutation("cultivo", "update", { id: editingId, data: payload });
      } else {
        await runMutation("cultivo", "create", payload);
      }
      setModalVisible(false);
    } catch (e: any) {
      Alert.alert("Erro", e.message ?? "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: number, nome: string) => {
    Alert.alert("Excluir Cultivo", `Deseja excluir "${nome}"?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: async () => {
        try { await runMutation("cultivo", "delete", { id }); }
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
    statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
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
  });

  const renderItem = ({ item }: { item: typeof cultivos[0] }) => {
    const statusColor = STATUS_COLORS[item.status ?? "em_andamento"] ?? "#38A169";
    const statusLabel = STATUS_LABELS[item.status ?? "em_andamento"] ?? "Em andamento";
    const propNome = propriedades.find((p) => p.id === item.propriedadeId)?.nome;
    return (
      <TouchableOpacity style={styles.card} onPress={() => router.push(`/cultivos/${item.id}` as any)}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.nomeCultura}{item.variedade ? ` — ${item.variedade}` : ""}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + "22" }]}>
            <Text style={{ fontSize: 11, fontWeight: "600", color: statusColor }}>{statusLabel}</Text>
          </View>
        </View>
        {propNome && <Text style={styles.cardMeta}>🏡 {propNome}</Text>}
        {item.faseAtual && <Text style={styles.cardMeta}>🌱 Fase: {item.faseAtual.replace(/_/g, " ")}</Text>}
        {item.areaPlantada && <Text style={styles.cardMeta}>📐 {Number(item.areaPlantada).toLocaleString("pt-BR")} ha</Text>}
        <View style={styles.cardActions}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary + "18" }]} onPress={() => openEdit(item)}>
            <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 13 }}>✏️ Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.error + "18" }]} onPress={() => handleDelete(item.id, item.nomeCultura)}>
            <Text style={{ color: colors.error, fontWeight: "600", fontSize: 13 }}>🗑️ Excluir</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Cultivos</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openNew}>
          <IconSymbol name="plus" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.emptyBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.emptyText}>Carregando...</Text>
        </View>
      ) : cultivos.length === 0 ? (
        <View style={styles.emptyBox}>
          <IconSymbol name="leaf.fill" size={48} color={colors.muted} />
          <Text style={styles.emptyText}>Nenhum cultivo cadastrado</Text>
          <Text style={styles.emptySubText}>Toque em "+" para registrar seu primeiro cultivo.</Text>
          <TouchableOpacity style={[styles.saveBtn, { marginTop: 20, paddingHorizontal: 24 }]} onPress={openNew}>
            <Text style={styles.saveBtnText}>+ Novo Cultivo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={cultivos}
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
            <Text style={styles.sheetTitle}>{editingId ? "Editar Cultivo" : "Novo Cultivo"}</Text>

            <Text style={styles.label}>Propriedade *</Text>
            <View style={styles.chipRow}>
              {propriedades.map((p) => (
                <TouchableOpacity key={p.id} style={[styles.chip, { backgroundColor: form.propriedadeId === String(p.id) ? colors.primary : colors.surface, borderColor: form.propriedadeId === String(p.id) ? colors.primary : colors.border }]} onPress={() => setForm((f) => ({ ...f, propriedadeId: String(p.id) }))}>
                  <Text style={[styles.chipText, { color: form.propriedadeId === String(p.id) ? "#fff" : colors.foreground }]}>{p.nome}</Text>
                </TouchableOpacity>
              ))}
              {propriedades.length === 0 && <Text style={{ color: colors.muted, fontSize: 13 }}>Cadastre uma propriedade primeiro.</Text>}
            </View>

            <Text style={styles.label}>Cultura *</Text>
            <TextInput style={styles.input} value={form.nomeCultura} onChangeText={(v) => setForm((f) => ({ ...f, nomeCultura: v }))} placeholder="Ex: Soja, Milho, Trigo" placeholderTextColor={colors.muted} />
            <View style={styles.chipRow}>
              {CULTURAS_COMUNS.slice(0, 8).map((c) => (
                <TouchableOpacity key={c} style={[styles.chip, { backgroundColor: form.nomeCultura === c ? colors.primary : colors.surface, borderColor: form.nomeCultura === c ? colors.primary : colors.border }]} onPress={() => setForm((f) => ({ ...f, nomeCultura: c }))}>
                  <Text style={[styles.chipText, { color: form.nomeCultura === c ? "#fff" : colors.foreground }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Variedade</Text>
            <TextInput style={styles.input} value={form.variedade} onChangeText={(v) => setForm((f) => ({ ...f, variedade: v }))} placeholder="Ex: BRS 1010, NK 7059" placeholderTextColor={colors.muted} />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Data de Plantio</Text>
                <TextInput style={styles.input} value={form.dataPlantio} onChangeText={(v) => setForm((f) => ({ ...f, dataPlantio: v }))} placeholder="AAAA-MM-DD" placeholderTextColor={colors.muted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Previsão Colheita</Text>
                <TextInput style={styles.input} value={form.previsaoColheita} onChangeText={(v) => setForm((f) => ({ ...f, previsaoColheita: v }))} placeholder="AAAA-MM-DD" placeholderTextColor={colors.muted} />
              </View>
            </View>

            <Text style={styles.label}>Terreno *</Text>
            <View style={styles.chipRow}>
              {terrenos.map((t) => (
                <TouchableOpacity key={t.id} style={[styles.chip, { backgroundColor: selectedTerreno?.id === t.id ? colors.primary : colors.surface, borderColor: selectedTerreno?.id === t.id ? colors.primary : colors.border }]} onPress={() => setSelectedTerreno(t)}>
                  <Text style={[styles.chipText, { color: selectedTerreno?.id === t.id ? "#fff" : colors.foreground }]}>{t.nome}</Text>
                </TouchableOpacity>
              ))}
              {terrenos.length === 0 && <Text style={{ color: colors.muted, fontSize: 13 }}>Cadastre um terreno primeiro.</Text>}
            </View>

            <Text style={styles.label}>Área Plantada (ha) *</Text>
            <TextInput
              style={[styles.input, { borderColor: !isAreaValid ? colors.error : colors.border }]}
              value={form.areaPlantada}
              onChangeText={(v) => {
                setForm((f) => ({ ...f, areaPlantada: v }));
                areaValidation.validate(parseFloat(v) || 0);
              }}
              placeholder="0.00"
              placeholderTextColor={colors.muted}
              keyboardType="decimal-pad"
            />
            {!isAreaValid && selectedTerreno && (
              <AreaValidationAlert
                result={areaValidation.validate(parseFloat(form.areaPlantada) || 0)}
                visible={!isAreaValid}
                showDetails={true}
              />
            )}

            <Text style={styles.label}>Status</Text>
            <View style={styles.chipRow}>
              {(["planejado","em_andamento","colhido","perdido"] as const).map((s) => (
                <TouchableOpacity key={s} style={[styles.chip, { backgroundColor: form.status === s ? STATUS_COLORS[s] : colors.surface, borderColor: form.status === s ? STATUS_COLORS[s] : colors.border }]} onPress={() => setForm((f) => ({ ...f, status: s }))}>
                  <Text style={[styles.chipText, { color: form.status === s ? "#fff" : colors.foreground }]}>{STATUS_LABELS[s]}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Fase Atual</Text>
            <View style={styles.chipRow}>
              {FASES.map((f) => (
                <TouchableOpacity key={f} style={[styles.chip, { backgroundColor: form.faseAtual === f ? colors.primary : colors.surface, borderColor: form.faseAtual === f ? colors.primary : colors.border }]} onPress={() => setForm((prev) => ({ ...prev, faseAtual: f }))}>
                  <Text style={[styles.chipText, { color: form.faseAtual === f ? "#fff" : colors.foreground }]}>{f.replace(/_/g, " ")}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Observações</Text>
            <TextInput style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]} value={form.observacoes} onChangeText={(v) => setForm((f) => ({ ...f, observacoes: v }))} placeholder="Observações adicionais..." placeholderTextColor={colors.muted} multiline />

            <TouchableOpacity style={[styles.saveBtn, { opacity: saving || !isAreaValid || !selectedTerreno ? 0.5 : 1 }]} onPress={handleSave} disabled={saving || !isAreaValid || !selectedTerreno}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{editingId ? "Salvar Alterações" : "Cadastrar Cultivo"}</Text>}
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
