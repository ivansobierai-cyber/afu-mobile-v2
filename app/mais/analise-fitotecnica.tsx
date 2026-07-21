import { useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  TextInput, Alert, FlatList, Modal, ActivityIndicator, RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { ScreenHeader, ScreenHeaderIconButton } from "@/components/screen-header";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { MODULE_COLORS } from "@/constants/module-colors";
import { trpc } from "@/lib/trpc";
import { openLaudoHtml } from "@/lib/laudo-html";
import { useTenantQueryScope } from "@/hooks/use-tenant-query-scope";

const TIPOS = [
  { value: "solo", label: "Solo", color: "#92400E" },
  { value: "agua", label: "Água", color: "#3B82F6" },
  { value: "foliar", label: "Foliar", color: "#38A169" },
  { value: "completa", label: "Completa", color: "#8B5CF6" },
];

function interpretarPH(ph?: number | null): { label: string; color: string } | null {
  if (!ph) return null;
  if (ph < 5.5) return { label: "Muito ácido", color: "#E53E3E" };
  if (ph < 6.0) return { label: "Ácido", color: "#D97706" };
  if (ph <= 7.0) return { label: "Ideal", color: "#38A169" };
  if (ph <= 7.5) return { label: "Levemente alcalino", color: "#D97706" };
  return { label: "Alcalino", color: "#E53E3E" };
}

interface FormState {
  tipoAnalise: string;
  propriedadeId: number | null;
  phSolo: string; phAgua: string;
  nitrogenio: string; fosforo: string; potassio: string;
  calcio: string; magnesio: string; materiaOrganica: string;
  umidade: string; condutividadeEletrica: string;
  resultadoTecnico: string; recomendacao: string;
}
const EMPTY_FORM: FormState = {
  tipoAnalise: "solo", propriedadeId: null, phSolo: "", phAgua: "",
  nitrogenio: "", fosforo: "", potassio: "",
  calcio: "", magnesio: "", materiaOrganica: "",
  umidade: "", condutividadeEletrica: "",
  resultadoTecnico: "", recomendacao: "",
};

const TIPO_AMOSTRA: Record<string, string> = {
  solo: "solo",
  agua: "água de irrigação",
  foliar: "foliar",
  completa: "completa",
};

export default function AnaliseFitotecnicaScreen() {
  const colors = useColors();
  const router = useRouter();
  const utils = trpc.useUtils();

  const { cacheInput, activeOrganizationId, tenantReady } = useTenantQueryScope();
  
  const { data: analises = [], isLoading, refetch } = trpc.secondaryData.analises.list.useQuery(
    cacheInput,
    { enabled: tenantReady },
  );
  const { data: propriedades = [] } = trpc.coreData.propriedades.list.useQuery(cacheInput, {
    enabled: tenantReady,
  });
  const createMutation = trpc.secondaryData.analises.create.useMutation({
    onSuccess: () => utils.secondaryData.analises.list.invalidate(cacheInput),
  });
  const deleteMutation = trpc.secondaryData.analises.delete.useMutation({
    onSuccess: () => utils.secondaryData.analises.list.invalidate(cacheInput),
  });
  const interpretarMutation = trpc.analise.interpretar.useMutation();
  const pdfMutation = trpc.analise.gerarPDF.useMutation();

  const [modalVisible, setModalVisible] = useState(false);
  const [detailItem, setDetailItem] = useState<(typeof analises)[0] | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [interpretando, setInterpretando] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const parseNum = (v: string) => { const n = parseFloat(v); return isNaN(n) ? undefined : n; };

  const getPropriedadeNome = (id: number | null | undefined) =>
    propriedades.find((p) => p.id === id)?.nome ?? "Minha propriedade";

  const buildInterpretarInput = (source: {
    tipoAnalise?: string | null;
    propriedadeId?: number | null;
    phSolo?: string | null;
    phAgua?: string | null;
    nitrogenio?: string | null;
    fosforo?: string | null;
    potassio?: string | null;
    calcio?: string | null;
    magnesio?: string | null;
    materiaOrganica?: string | null;
    umidade?: string | null;
    condutividadeEletrica?: string | null;
  }) => ({
    tipoAmostra: TIPO_AMOSTRA[source.tipoAnalise ?? "solo"] ?? "solo",
    propriedadeId: source.propriedadeId ?? form.propriedadeId ?? undefined,
    propriedadeNome: getPropriedadeNome(source.propriedadeId ?? form.propriedadeId),
    phSolo: source.phSolo ? parseFloat(source.phSolo) : parseNum(form.phSolo),
    phAgua: source.phAgua ? parseFloat(source.phAgua) : parseNum(form.phAgua),
    nitrogenio: source.nitrogenio ? parseFloat(source.nitrogenio) : parseNum(form.nitrogenio),
    fosforo: source.fosforo ? parseFloat(source.fosforo) : parseNum(form.fosforo),
    potassio: source.potassio ? parseFloat(source.potassio) : parseNum(form.potassio),
    calcio: source.calcio ? parseFloat(source.calcio) : parseNum(form.calcio),
    magnesio: source.magnesio ? parseFloat(source.magnesio) : parseNum(form.magnesio),
    materiaOrganica: source.materiaOrganica ? parseFloat(source.materiaOrganica) : parseNum(form.materiaOrganica),
    umidade: source.umidade ? parseFloat(source.umidade) : parseNum(form.umidade),
    condutividadeEletrica: source.condutividadeEletrica
      ? parseFloat(source.condutividadeEletrica)
      : parseNum(form.condutividadeEletrica),
  });

  const handleInterpretar = async (source: "form" | "detail") => {
    setInterpretando(true);
    try {
      const input = source === "detail" && detailItem
        ? buildInterpretarInput(detailItem)
        : buildInterpretarInput({});
      const result = await interpretarMutation.mutateAsync(input);
      const resultado = [
        result.interpretacao,
        result.alertas.length > 0 ? `\n\nAlertas: ${result.alertas.join("; ")}` : "",
      ].join("");
      const recomendacao = result.recomendacoes.join("\n");
      if (source === "form") {
        setForm((f) => ({ ...f, resultadoTecnico: resultado, recomendacao }));
        Alert.alert("Interpretação concluída", `Classificação: ${result.classificacaoGeral}`);
      } else if (detailItem) {
        setDetailItem({ ...detailItem, resultadoTecnico: resultado, recomendacao });
        Alert.alert("Interpretação concluída", `Classificação: ${result.classificacaoGeral}`);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Não foi possível interpretar a análise.";
      Alert.alert("Erro", message);
    } finally {
      setInterpretando(false);
    }
  };

  const handleGerarPdf = async (item: (typeof analises)[0]) => {
    setGeneratingPdf(true);
    try {
      const tipo = TIPOS.find((t) => t.value === item.tipoAnalise) ?? TIPOS[0];
      const { html, titulo } = await pdfMutation.mutateAsync({
        tipo: "analise_fitotecnica",
        titulo: `Análise Fitotécnica — ${tipo.label}`,
        propriedadeNome: getPropriedadeNome(item.propriedadeId),
        conteudo: JSON.stringify({
          tipo: item.tipoAnalise,
          dataAnalise: item.dataAnalise,
          phSolo: item.phSolo,
          phAgua: item.phAgua,
          nitrogenio: item.nitrogenio,
          fosforo: item.fosforo,
          potassio: item.potassio,
          calcio: item.calcio,
          magnesio: item.magnesio,
          materiaOrganica: item.materiaOrganica,
          umidade: item.umidade,
          condutividadeEletrica: item.condutividadeEletrica,
          resultadoTecnico: item.resultadoTecnico,
          recomendacao: item.recomendacao,
        }),
        dataEmissao: new Date(item.dataAnalise).toLocaleDateString("pt-BR"),
      });
      await openLaudoHtml(html, titulo);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Não foi possível gerar o PDF.";
      Alert.alert("Erro", message);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await createMutation.mutateAsync({
        tipoAnalise: form.tipoAnalise as "solo" | "agua" | "foliar" | "completa",
        propriedadeId: form.propriedadeId ?? undefined,
        phSolo: parseNum(form.phSolo),
        phAgua: parseNum(form.phAgua),
        nitrogenio: parseNum(form.nitrogenio),
        fosforo: parseNum(form.fosforo),
        potassio: parseNum(form.potassio),
        calcio: parseNum(form.calcio),
        magnesio: parseNum(form.magnesio),
        materiaOrganica: parseNum(form.materiaOrganica),
        umidade: parseNum(form.umidade),
        condutividadeEletrica: parseNum(form.condutividadeEletrica),
        resultadoTecnico: form.resultadoTecnico.trim() || undefined,
        recomendacao: form.recomendacao.trim() || undefined,
      });
      setModalVisible(false);
      setForm(EMPTY_FORM);
    } catch (e: any) {
      Alert.alert("Erro", e.message ?? "Não foi possível salvar a análise.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert("Excluir análise?", "Esta ação não pode ser desfeita.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: async () => {
        try { await deleteMutation.mutateAsync({ id }); }
        catch (e: any) { Alert.alert("Erro", e.message ?? "Não foi possível excluir."); }
      }},
    ]);
  };

  const styles = StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
    label: { fontSize: 12, color: colors.muted, marginBottom: 4, fontWeight: "500" },
    input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: colors.foreground, marginBottom: 12 },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
    chip: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    sheet: { backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "92%", padding: 20 },
    saveBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 16 },
    saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
    cancelBtn: { borderRadius: 12, paddingVertical: 12, alignItems: "center", marginTop: 8 },
    cancelBtnText: { color: colors.muted, fontSize: 14 },
    row: { flexDirection: "row", gap: 10 },
    halfInput: { flex: 1 },
    metricRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  });

  return (
    <ScreenContainer>
      <ScreenHeader
        title="Análises"
        subtitle="Solo, foliar e água"
        accentColor={MODULE_COLORS.laboratorio}
        right={
          <ScreenHeaderIconButton
            icon="plus"
            accessibilityLabel="Nova análise"
            onPress={() => { setForm(EMPTY_FORM); setModalVisible(true); }}
          />
        }
      />

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : analises.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <IconSymbol name="flask.fill" size={48} color={colors.muted} />
          <Text style={{ fontSize: 16, color: colors.muted, marginTop: 12, fontWeight: "600" }}>Nenhuma análise registrada</Text>
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4, textAlign: "center" }}>Toque em "+" para registrar uma análise de solo, água ou foliar.</Text>
        </View>
      ) : (
        <FlatList
          data={analises}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
          renderItem={({ item }) => {
            const tipo = TIPOS.find((t) => t.value === item.tipoAnalise) ?? TIPOS[0];
            const phVal = item.tipoAnalise === "agua" ? parseFloat(item.phAgua ?? "0") : parseFloat(item.phSolo ?? "0");
            const phInfo = interpretarPH(phVal || undefined);
            return (
              <TouchableOpacity style={styles.card} onPress={() => setDetailItem(item)}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <View style={{ backgroundColor: tipo.color + "20", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 }}>
                        <Text style={{ fontSize: 12, fontWeight: "700", color: tipo.color }}>{tipo.label}</Text>
                      </View>
                      {phInfo && (
                        <View style={{ backgroundColor: phInfo.color + "20", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 }}>
                          <Text style={{ fontSize: 12, fontWeight: "700", color: phInfo.color }}>pH: {phInfo.label}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontSize: 12, color: colors.muted, marginTop: 6 }}>
                        {new Date(item.dataAnalise).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                      </Text>
                    {item.resultadoTecnico && (
                      <Text style={{ fontSize: 13, color: colors.foreground, marginTop: 6 }} numberOfLines={2}>{item.resultadoTecnico}</Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ marginLeft: 8 }}>
                    <IconSymbol name="trash.fill" size={16} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Detail Modal */}
      <Modal visible={!!detailItem} transparent animationType="slide">
        <View style={styles.overlay}>
          <ScrollView style={styles.sheet}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>Detalhes da Análise</Text>
              <TouchableOpacity onPress={() => setDetailItem(null)}>
                <IconSymbol name="xmark" size={22} color={colors.muted} />
              </TouchableOpacity>
            </View>
            {detailItem && (() => {
              const tipo = TIPOS.find((t) => t.value === detailItem.tipoAnalise) ?? TIPOS[0];
              const metrics: { label: string; value: string | null | undefined; unit: string }[] = [
                { label: "pH Solo", value: detailItem.phSolo, unit: "" },
                { label: "pH Água", value: detailItem.phAgua, unit: "" },
                { label: "Nitrogênio (N)", value: detailItem.nitrogenio, unit: "mg/kg" },
                { label: "Fósforo (P)", value: detailItem.fosforo, unit: "mg/kg" },
                { label: "Potássio (K)", value: detailItem.potassio, unit: "mg/kg" },
                { label: "Cálcio (Ca)", value: detailItem.calcio, unit: "cmolc/dm³" },
                { label: "Magnésio (Mg)", value: detailItem.magnesio, unit: "cmolc/dm³" },
                { label: "Matéria Orgânica", value: detailItem.materiaOrganica, unit: "%" },
                { label: "Umidade", value: detailItem.umidade, unit: "%" },
                { label: "Condutividade Elétrica", value: detailItem.condutividadeEletrica, unit: "dS/m" },
              ].filter((m) => m.value != null && m.value !== "");
              return (
                <>
                  <View style={{ backgroundColor: tipo.color + "20", borderRadius: 10, padding: 12, marginBottom: 16 }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: tipo.color }}>Tipo: {tipo.label}</Text>
                    <Text style={{ fontSize: 12, color: tipo.color, marginTop: 2 }}>{new Date(detailItem.dataAnalise).toLocaleDateString("pt-BR")}</Text>
                  </View>
                  {metrics.length > 0 && (
                    <>
                      <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>Parâmetros Medidos</Text>
                      {metrics.map((m, i) => (
                        <View key={i} style={styles.metricRow}>
                          <Text style={{ fontSize: 14, color: colors.muted }}>{m.label}</Text>
                          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>{m.value} {m.unit}</Text>
                        </View>
                      ))}
                    </>
                  )}
                  {detailItem.resultadoTecnico && (
                    <View style={{ marginTop: 16 }}>
                      <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 6 }}>Resultado Técnico</Text>
                      <Text style={{ fontSize: 14, color: colors.muted, lineHeight: 20 }}>{detailItem.resultadoTecnico}</Text>
                    </View>
                  )}
                  {detailItem.recomendacao && (
                    <View style={{ marginTop: 16, backgroundColor: colors.success + "15", borderRadius: 10, padding: 12 }}>
                      <Text style={{ fontSize: 14, fontWeight: "700", color: colors.success, marginBottom: 6 }}>Recomendação</Text>
                      <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 20 }}>{detailItem.recomendacao}</Text>
                    </View>
                  )}
                  <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
                    <TouchableOpacity
                      style={[styles.saveBtn, { flex: 1, backgroundColor: "#8B5CF6" }]}
                      onPress={() => handleInterpretar("detail")}
                      disabled={interpretando}
                    >
                      {interpretando ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Interpretar com IA</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.saveBtn, { flex: 1 }]}
                      onPress={() => handleGerarPdf(detailItem)}
                      disabled={generatingPdf}
                    >
                      {generatingPdf ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Gerar PDF</Text>}
                    </TouchableOpacity>
                  </View>
                </>
              );
            })()}
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.surface, marginTop: 12 }]} onPress={() => setDetailItem(null)}>
              <Text style={[styles.saveBtnText, { color: colors.foreground }]}>Fechar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Create Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <ScrollView style={styles.sheet} keyboardShouldPersistTaps="handled">
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 16 }}>Nova Análise</Text>

            <Text style={styles.label}>Tipo de Análise</Text>
            <View style={styles.chipRow}>
              {TIPOS.map((t) => (
                <TouchableOpacity key={t.value} style={[styles.chip, { backgroundColor: form.tipoAnalise === t.value ? t.color : colors.surface, borderColor: form.tipoAnalise === t.value ? t.color : colors.border }]} onPress={() => setForm((f) => ({ ...f, tipoAnalise: t.value }))}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: form.tipoAnalise === t.value ? "#fff" : colors.foreground }}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {propriedades.length > 0 && (
              <>
                <Text style={styles.label}>Propriedade (opcional)</Text>
                <View style={styles.chipRow}>
                  <TouchableOpacity
                    style={[styles.chip, {
                      backgroundColor: form.propriedadeId === null ? colors.primary : colors.surface,
                      borderColor: form.propriedadeId === null ? colors.primary : colors.border,
                    }]}
                    onPress={() => setForm((f) => ({ ...f, propriedadeId: null }))}
                  >
                    <Text style={{ fontSize: 12, fontWeight: "600", color: form.propriedadeId === null ? "#fff" : colors.foreground }}>Nenhuma</Text>
                  </TouchableOpacity>
                  {propriedades.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.chip, {
                        backgroundColor: form.propriedadeId === p.id ? colors.primary : colors.surface,
                        borderColor: form.propriedadeId === p.id ? colors.primary : colors.border,
                      }]}
                      onPress={() => setForm((f) => ({ ...f, propriedadeId: p.id }))}
                    >
                      <Text style={{ fontSize: 12, fontWeight: "600", color: form.propriedadeId === p.id ? "#fff" : colors.foreground }}>{p.nome}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>pH</Text>
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>pH Solo</Text>
                <TextInput style={styles.input} value={form.phSolo} onChangeText={(v) => setForm((f) => ({ ...f, phSolo: v }))} placeholder="Ex: 6.5" placeholderTextColor={colors.muted} keyboardType="decimal-pad" />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>pH Água</Text>
                <TextInput style={styles.input} value={form.phAgua} onChangeText={(v) => setForm((f) => ({ ...f, phAgua: v }))} placeholder="Ex: 7.0" placeholderTextColor={colors.muted} keyboardType="decimal-pad" />
              </View>
            </View>

            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>Macronutrientes (mg/kg)</Text>
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>N (Nitrogênio)</Text>
                <TextInput style={styles.input} value={form.nitrogenio} onChangeText={(v) => setForm((f) => ({ ...f, nitrogenio: v }))} placeholder="0.0" placeholderTextColor={colors.muted} keyboardType="decimal-pad" />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>P (Fósforo)</Text>
                <TextInput style={styles.input} value={form.fosforo} onChangeText={(v) => setForm((f) => ({ ...f, fosforo: v }))} placeholder="0.0" placeholderTextColor={colors.muted} keyboardType="decimal-pad" />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>K (Potássio)</Text>
                <TextInput style={styles.input} value={form.potassio} onChangeText={(v) => setForm((f) => ({ ...f, potassio: v }))} placeholder="0.0" placeholderTextColor={colors.muted} keyboardType="decimal-pad" />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>MO (%)</Text>
                <TextInput style={styles.input} value={form.materiaOrganica} onChangeText={(v) => setForm((f) => ({ ...f, materiaOrganica: v }))} placeholder="0.0" placeholderTextColor={colors.muted} keyboardType="decimal-pad" />
              </View>
            </View>

            <Text style={styles.label}>Resultado Técnico</Text>
            <TextInput style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]} value={form.resultadoTecnico} onChangeText={(v) => setForm((f) => ({ ...f, resultadoTecnico: v }))} placeholder="Descreva os resultados da análise..." placeholderTextColor={colors.muted} multiline />

            <Text style={styles.label}>Recomendação</Text>
            <TextInput style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]} value={form.recomendacao} onChangeText={(v) => setForm((f) => ({ ...f, recomendacao: v }))} placeholder="Recomendações de correção ou manejo..." placeholderTextColor={colors.muted} multiline />

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: "#8B5CF6", marginTop: 4 }]}
              onPress={() => handleInterpretar("form")}
              disabled={interpretando}
            >
              {interpretando ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Interpretar com IA</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Salvar Análise</Text>}
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
