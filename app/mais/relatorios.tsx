import { useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Alert, FlatList, Modal, TextInput, ActivityIndicator, Share,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { ScreenHeader, ScreenHeaderIconButton } from "@/components/screen-header";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { MODULE_COLORS } from "@/constants/module-colors";
import { trpc } from "@/lib/trpc";
import { openLaudoHtml } from "@/lib/laudo-html";

const TIPO_LABELS: Record<string, string> = {
  diagnostico: "Laudo Diagnóstico",
  analise_solo: "Análise de Solo",
  historico: "Histórico da Propriedade",
  recomendacao: "Recomendações",
  certificado: "Certificado",
};
const TIPO_COLORS: Record<string, string> = {
  diagnostico: "#E53E3E", analise_solo: "#92400E", historico: "#2D6A4F",
  recomendacao: "#3B82F6", certificado: "#D97706",
};
const STATUS_LABELS: Record<string, string> = {
  rascunho: "Rascunho", emitido: "Emitido", assinado: "Assinado", cancelado: "Cancelado",
};
const STATUS_COLORS: Record<string, string> = {
  rascunho: "#6B7C6E", emitido: "#3B82F6", assinado: "#38A169", cancelado: "#E53E3E",
};

const TIPOS = ["diagnostico", "analise_solo", "historico", "recomendacao", "certificado"] as const;

const PDF_TIPO_MAP: Record<string, "diagnostico" | "analise_fitotecnica" | "historico_propriedade" | "recomendacao" | "certificado"> = {
  diagnostico: "diagnostico",
  analise_solo: "analise_fitotecnica",
  historico: "historico_propriedade",
  recomendacao: "recomendacao",
  certificado: "certificado",
};

interface FormState { titulo: string; tipoRelatorio: string; conteudo: string; }
const EMPTY_FORM: FormState = { titulo: "", tipoRelatorio: "diagnostico", conteudo: "" };

export default function RelatoriosScreen() {
  const colors = useColors();
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: relatorios = [], isLoading, refetch } = trpc.secondaryData.relatorios.list.useQuery();
  const createMutation = trpc.secondaryData.relatorios.create.useMutation({
    onSuccess: () => utils.secondaryData.relatorios.list.invalidate(),
  });
  const deleteMutation = trpc.secondaryData.relatorios.delete.useMutation({
    onSuccess: () => utils.secondaryData.relatorios.list.invalidate(),
  });
  const pdfMutation = trpc.analise.gerarPDF.useMutation();

  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [generatingPdfId, setGeneratingPdfId] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("todos");

  const handleSave = async () => {
    if (!form.titulo.trim()) {
      Alert.alert("Atenção", "Preencha o título do relatório.");
      return;
    }
    setSaving(true);
    try {
      await createMutation.mutateAsync({
        titulo: form.titulo.trim(),
        tipoRelatorio: form.tipoRelatorio as any,
        conteudo: form.conteudo.trim() || undefined,
        status: "rascunho",
      });
      setModalVisible(false);
      setForm(EMPTY_FORM);
    } catch (e: any) {
      Alert.alert("Erro", e.message ?? "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: number, titulo: string) => {
    Alert.alert("Excluir relatório?", `"${titulo}"`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: async () => {
        try { await deleteMutation.mutateAsync({ id }); }
        catch (e: any) { Alert.alert("Erro", e.message ?? "Não foi possível excluir."); }
      }},
    ]);
  };

  const handleShare = async (item: (typeof relatorios)[0]) => {
    try {
      await Share.share({
        title: item.titulo,
        message: `Relatório AFU: ${item.titulo}\nTipo: ${TIPO_LABELS[item.tipoRelatorio ?? "diagnostico"] ?? item.tipoRelatorio}\nStatus: ${STATUS_LABELS[item.status ?? "rascunho"] ?? item.status}\n\n${item.conteudo ?? ""}`,
      });
    } catch {
      // usuário cancelou
    }
  };

  const handleGerarPdf = async (item: (typeof relatorios)[0]) => {
    setGeneratingPdfId(item.id);
    try {
      const tipo = item.tipoRelatorio ?? "diagnostico";
      const { html, titulo } = await pdfMutation.mutateAsync({
        tipo: PDF_TIPO_MAP[tipo] ?? "diagnostico",
        titulo: item.titulo,
        conteudo: item.conteudo ?? JSON.stringify({ descricao: item.titulo }),
        dataEmissao: new Date(item.dataEmissao).toLocaleDateString("pt-BR"),
      });
      await openLaudoHtml(html, titulo);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Não foi possível gerar o PDF.";
      Alert.alert("Erro", message);
    } finally {
      setGeneratingPdfId(null);
    }
  };

  const filtered = filter === "todos" ? relatorios : relatorios.filter((r) => r.status === filter);

  const styles = StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
    label: { fontSize: 12, color: colors.muted, marginBottom: 4, fontWeight: "500" },
    input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: colors.foreground, marginBottom: 12 },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
    chip: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    sheet: { backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "90%", padding: 20 },
    saveBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 16 },
    saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
    cancelBtn: { borderRadius: 12, paddingVertical: 12, alignItems: "center", marginTop: 8 },
    cancelBtnText: { color: colors.muted, fontSize: 14 },
  });

  return (
    <ScreenContainer>
      <ScreenHeader
        title="Laudos"
        subtitle="Relatórios e documentos técnicos"
        accentColor={MODULE_COLORS.laudos}
        right={
          <ScreenHeaderIconButton
            icon="plus"
            accessibilityLabel="Novo relatório"
            onPress={() => { setForm(EMPTY_FORM); setModalVisible(true); }}
          />
        }
      />

      {/* Filtro de status */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 8, flexDirection: "row" }}>
        {["todos", "rascunho", "emitido", "assinado", "cancelado"].map((f) => (
          <TouchableOpacity key={f} style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: filter === f ? colors.primary : colors.background, borderWidth: 1, borderColor: filter === f ? colors.primary : colors.border }} onPress={() => setFilter(f)}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: filter === f ? "#fff" : colors.muted }}>
              {f === "todos" ? "Todos" : STATUS_LABELS[f] ?? f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <IconSymbol name="doc.fill" size={48} color={colors.muted} />
          <Text style={{ fontSize: 16, color: colors.muted, marginTop: 12, fontWeight: "600" }}>Nenhum relatório encontrado</Text>
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4, textAlign: "center" }}>Toque em "+" para criar um novo relatório ou laudo.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const tipo = item.tipoRelatorio ?? "diagnostico";
            const status = item.status ?? "rascunho";
            const tipoColor = TIPO_COLORS[tipo] ?? "#6B7C6E";
            const statusColor = STATUS_COLORS[status] ?? "#6B7C6E";
            return (
              <View style={styles.card}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }} numberOfLines={2}>{item.titulo}</Text>
                    <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
                      <View style={{ backgroundColor: tipoColor + "20", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                        <Text style={{ fontSize: 11, fontWeight: "700", color: tipoColor }}>{TIPO_LABELS[tipo] ?? tipo}</Text>
                      </View>
                      <View style={{ backgroundColor: statusColor + "20", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                        <Text style={{ fontSize: 11, fontWeight: "700", color: statusColor }}>{STATUS_LABELS[status] ?? status}</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                        {new Date(item.dataEmissao).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                      </Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: 8, marginLeft: 8 }}>
                    <TouchableOpacity onPress={() => handleGerarPdf(item)} disabled={generatingPdfId === item.id}>
                      {generatingPdfId === item.id ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <IconSymbol name="doc.fill" size={16} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleShare(item)}>
                      <IconSymbol name="paperplane.fill" size={16} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id, item.titulo)}>
                      <IconSymbol name="trash.fill" size={16} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
                {item.conteudo && (
                  <Text style={{ fontSize: 13, color: colors.muted, marginTop: 8, lineHeight: 18 }} numberOfLines={3}>{item.conteudo}</Text>
                )}
              </View>
            );
          }}
        />
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <ScrollView style={styles.sheet} keyboardShouldPersistTaps="handled">

            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 16 }}>Novo Relatório</Text>

            <Text style={styles.label}>Título *</Text>
            <TextInput style={styles.input} value={form.titulo} onChangeText={(v) => setForm((f) => ({ ...f, titulo: v }))} placeholder="Ex: Laudo de diagnóstico — Soja Talhão 3" placeholderTextColor={colors.muted} />

            <Text style={styles.label}>Tipo de Relatório</Text>
            <View style={styles.chipRow}>
              {TIPOS.map((t) => (
                <TouchableOpacity key={t} style={[styles.chip, { backgroundColor: form.tipoRelatorio === t ? (TIPO_COLORS[t] ?? colors.primary) : colors.surface, borderColor: form.tipoRelatorio === t ? (TIPO_COLORS[t] ?? colors.primary) : colors.border }]} onPress={() => setForm((f) => ({ ...f, tipoRelatorio: t }))}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: form.tipoRelatorio === t ? "#fff" : colors.foreground }}>{TIPO_LABELS[t]}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Conteúdo / Observações</Text>
            <TextInput style={[styles.input, { minHeight: 100, textAlignVertical: "top" }]} value={form.conteudo} onChangeText={(v) => setForm((f) => ({ ...f, conteudo: v }))} placeholder="Descreva os resultados, recomendações ou observações..." placeholderTextColor={colors.muted} multiline />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Salvar Relatório</Text>}
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
