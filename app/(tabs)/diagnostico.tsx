import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { CULTURAS } from "@/lib/mock-data";
import { trpc } from "@/lib/trpc";
import { buildDiagnosticoFromAnalise, mapDiagnosticoFromDb } from "@/lib/diagnostico-mapper";
import { openLaudoHtml } from "@/lib/laudo-html";
import type { Diagnostico, DiagnosticoResultado, PartePlanta } from "@/shared/types";

type CultivoDb = {
  id: number;
  propriedadeId: number;
  nomeCultura: string;
  variedade: string | null;
  faseAtual: string | null;
  areaPlantada: string | null;
  status: string | null;
  terrenoId: number | null;
};

const PARTES: { value: PartePlanta; label: string; icon: string }[] = [
  { value: "folha", label: "Folha", icon: "leaf.fill" },
  { value: "caule", label: "Caule", icon: "leaf.fill" },
  { value: "raiz", label: "Raiz", icon: "leaf.fill" },
  { value: "flor", label: "Flor", icon: "leaf.fill" },
  { value: "fruto", label: "Fruto", icon: "leaf.fill" },
  { value: "semente", label: "Semente", icon: "leaf.fill" },
  { value: "planta_inteira", label: "Planta Inteira", icon: "leaf.fill" },
];

const SEVERIDADE_COLORS: Record<string, string> = {
  leve: "#38A169",
  moderada: "#D97706",
  grave: "#EF4444",
  critica: "#9B2335",
};

const TIPO_LABELS: Record<string, string> = {
  praga: "🐛 Praga",
  doenca: "🦠 Doença",
  deficiencia_nutricional: "🌿 Deficiência Nutricional",
  estresse_ambiental: "☀️ Estresse Ambiental",
  saudavel: "✅ Planta Saudável",
  outro: "❓ Outro",
};

const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  processando: "Processando",
  concluido: "Concluído",
  erro: "Erro",
};

const STATUS_COLORS: Record<string, string> = {
  pendente: "#D97706",
  processando: "#3B82F6",
  concluido: "#38A169",
  erro: "#EF4444",
};

function culturaChipIdFromNome(nomeCultura: string): string {
  const match = CULTURAS.find(
    (c) =>
      c.nomePopular.toLowerCase() === nomeCultura.toLowerCase() ||
      c.nomeCientifico?.toLowerCase() === nomeCultura.toLowerCase(),
  );
  return match?.id ?? "soja";
}

export default function DiagnosticoScreen() {
  const colors = useColors();
  const router = useRouter();
  const { historico: historicoParam } = useLocalSearchParams<{ historico?: string }>();
  const utils = trpc.useUtils();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [culturaId, setCulturaId] = useState("soja");
  const [parte, setParte] = useState<PartePlanta>("folha");
  const [sintomas, setSintomas] = useState("");
  const [cultivoSelecionado, setCultivoSelecionado] = useState<CultivoDb | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [resultado, setResultado] = useState<Diagnostico | null>(null);
  const [showHistorico, setShowHistorico] = useState(false);
  const [showCultivoPicker, setShowCultivoPicker] = useState(false);
  const [generatingLaudoId, setGeneratingLaudoId] = useState<string | null>(null);

  useEffect(() => {
    if (historicoParam === "1") {
      setShowHistorico(true);
    }
  }, [historicoParam]);

  const { data: historicoDb = [], isLoading: loadingHistorico } =
    trpc.diagnostico.historico.useQuery(undefined, { enabled: showHistorico });

  const { data: cultivosDb = [], isLoading: loadingCultivos } =
    trpc.coreData.cultivos.list.useQuery(undefined, { enabled: showCultivoPicker });

  const analyzeMutation = trpc.diagnostico.analisar.useMutation();
  const salvarMutation = trpc.diagnostico.salvar.useMutation({
    onSuccess: () => utils.diagnostico.historico.invalidate(),
  });
  const gerarPdfMutation = trpc.analise.gerarPDF.useMutation();
  const createRelatorioMutation = trpc.secondaryData.relatorios.create.useMutation({
    onSuccess: () => utils.secondaryData.relatorios.list.invalidate(),
  });

  const historico = historicoDb.map((row) => mapDiagnosticoFromDb(row as any));
  const cultivos = (cultivosDb as CultivoDb[]).filter((c) => c.status === "em_andamento");

  const pickImage = async (fromCamera: boolean) => {
    if (fromCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permissão negada", "Precisamos de acesso à câmera para continuar.");
        return;
      }
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
          base64: true,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
          base64: true,
        });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 ?? null);
      setResultado(null);
    }
  };

  const handleAnalyze = async () => {
    if (!imageUri || !imageBase64) {
      Alert.alert("Atenção", "Selecione uma imagem da planta para analisar.");
      return;
    }

    setAnalyzing(true);
    const cultura = CULTURAS.find((c) => c.id === culturaId);
    const culturaNome = cultura?.nomePopular ?? culturaId;
    const cultivoNome = cultivoSelecionado
      ? `${cultivoSelecionado.nomeCultura}${cultivoSelecionado.variedade ? ` — ${cultivoSelecionado.variedade}` : ""}`
      : undefined;

    try {
      const analise = await analyzeMutation.mutateAsync({
        imageBase64,
        culturaNome,
        parteAnalisada: parte,
        sintomas: sintomas.trim() || undefined,
        faseFenologica: cultivoSelecionado?.faseAtual ?? undefined,
      });

      const { id } = await salvarMutation.mutateAsync({
        culturaNome,
        culturaChipId: culturaId,
        parteAnalisada: parte,
        sintomas: sintomas.trim() || undefined,
        cultivoId: cultivoSelecionado?.id,
        cultivoNome,
        propriedadeId: cultivoSelecionado?.propriedadeId,
        problema: analise.problema,
        tipo: analise.tipo,
        confianca: analise.confianca,
        severidade: analise.severidade,
        descricao: analise.descricao,
        recomendacoes: analise.recomendacoes,
        agenteCausal: analise.agenteCausal,
        observacoesTecnicas: analise.observacoesTecnicas,
        imagemUrl: imageUri,
      });

      setResultado(
        buildDiagnosticoFromAnalise({
          id,
          analise: analise as DiagnosticoResultado,
          culturaChipId: culturaId,
          culturaNome,
          parte,
          sintomas: sintomas.trim() || undefined,
          imagemUrl: imageUri,
          cultivoId: cultivoSelecionado?.id,
          cultivoNome,
        }),
      );
    } catch (err: any) {
      Alert.alert(
        "Erro na análise",
        err?.message || "Não foi possível analisar ou salvar o diagnóstico. Verifique sua conexão e se está autenticado.",
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGerarLaudo = async (diag: Diagnostico) => {
    const laudoId = diag.id;
    setGeneratingLaudoId(laudoId);
    const isCurrentResult = laudoId === resultado?.id;
    if (isCurrentResult) setGeneratingPdf(true);
    const dataEmissao = new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const titulo = `Laudo Fitossanitário — ${diag.resultado.problema}`;
    const dadosLaudo = {
      ...diag.resultado,
      culturaNome: diag.culturaNome,
      parteAnalisada: diag.parteAnalisada,
      sintomas: diag.sintomas,
      cultivoNome: diag.cultivoNome,
    };

    try {
      const { html } = await gerarPdfMutation.mutateAsync({
        tipo: "diagnostico",
        titulo,
        culturaNome: diag.culturaNome,
        conteudo: JSON.stringify(dadosLaudo),
        dataEmissao,
      });

      const diagnosticoId = parseInt(diag.id, 10);
      await createRelatorioMutation.mutateAsync({
        titulo,
        tipoRelatorio: "diagnostico",
        diagnosticoId: Number.isNaN(diagnosticoId) ? undefined : diagnosticoId,
        conteudo: JSON.stringify({ html, dados: dadosLaudo }),
        status: "emitido",
      });

      await openLaudoHtml(html, titulo);

      Alert.alert(
        "Laudo gerado",
        "O laudo foi salvo em Relatórios e aberto para visualização ou impressão (salvar como PDF).",
        [
          { text: "OK" },
          {
            text: "Ver Relatórios",
            onPress: () => router.push("/mais/relatorios" as any),
          },
        ],
      );
    } catch (err: any) {
      Alert.alert("Erro", err?.message ?? "Não foi possível gerar o laudo.");
    } finally {
      setGeneratingLaudoId(null);
      if (isCurrentResult) setGeneratingPdf(false);
    }
  };

  const handleGerarLaudoAtual = () => {
    if (resultado) void handleGerarLaudo(resultado);
  };

  const styles = StyleSheet.create({
    sectionTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.foreground,
      marginBottom: 8,
    },
    chipBtn: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 8,
      borderWidth: 1,
    },
    resultCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 14,
      color: colors.foreground,
      marginBottom: 16,
      textAlignVertical: "top",
    },
  });

  // ── Histórico ──────────────────────────────────────────────────────────────
  if (showHistorico) {
    return (
      <ScreenContainer>
        <View
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 20,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <TouchableOpacity onPress={() => setShowHistorico(false)}>
            <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#FFFFFF" }}>Histórico de Diagnósticos</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {loadingHistorico ? (
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ fontSize: 14, color: colors.muted, marginTop: 12 }}>Carregando histórico...</Text>
            </View>
          ) : historico.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <IconSymbol name="camera.fill" size={48} color={colors.border} />
              <Text style={{ fontSize: 16, color: colors.muted, marginTop: 12 }}>Nenhum diagnóstico realizado</Text>
            </View>
          ) : (
            historico.map((diag) => (
              <View key={diag.id} style={styles.resultCard}>
                <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
                  {diag.imagemUrl ? (
                    <Image source={{ uri: diag.imagemUrl }} style={{ width: 64, height: 64, borderRadius: 10 }} />
                  ) : (
                    <View
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 10,
                        backgroundColor: colors.border,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconSymbol name="photo.fill" size={24} color={colors.muted} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>
                      {diag.resultado.problema}
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>
                      {diag.culturaNome} · {PARTES.find((p) => p.value === diag.parteAnalisada)?.label}
                    </Text>
                    {diag.cultivoNome && (
                      <Text style={{ fontSize: 12, color: "#8B5CF6", marginTop: 2 }}>📍 {diag.cultivoNome}</Text>
                    )}
                    {diag.sintomas && (
                      <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }} numberOfLines={1}>
                        Sintomas: {diag.sintomas}
                      </Text>
                    )}
                    <View style={{ flexDirection: "row", gap: 8, marginTop: 6, alignItems: "center" }}>
                      <View
                        style={{
                          backgroundColor: (STATUS_COLORS[diag.status] ?? colors.muted) + "20",
                          borderRadius: 6,
                          paddingHorizontal: 7,
                          paddingVertical: 2,
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: "700", color: STATUS_COLORS[diag.status] ?? colors.muted }}>
                          {STATUS_LABELS[diag.status] ?? diag.status}
                        </Text>
                      </View>
                      <View
                        style={{
                          backgroundColor: (SEVERIDADE_COLORS[diag.resultado.severidade] ?? colors.muted) + "20",
                          borderRadius: 6,
                          paddingHorizontal: 7,
                          paddingVertical: 2,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: "700",
                            color: SEVERIDADE_COLORS[diag.resultado.severidade] ?? colors.muted,
                            textTransform: "capitalize",
                          }}
                        >
                          {diag.resultado.severidade}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 11, color: colors.muted }}>
                        {new Date(diag.createdAt).toLocaleDateString("pt-BR")}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={{
                        marginTop: 10,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        backgroundColor: colors.primary + "15",
                        borderRadius: 10,
                        paddingVertical: 8,
                      }}
                      onPress={() => handleGerarLaudo(diag)}
                      disabled={generatingLaudoId === diag.id}
                    >
                      {generatingLaudoId === diag.id ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <IconSymbol name="doc.fill" size={16} color={colors.primary} />
                      )}
                      <Text style={{ fontSize: 13, fontWeight: "600", color: colors.primary }}>
                        {generatingLaudoId === diag.id ? "Gerando laudo..." : "Gerar laudo"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ── Seletor de Cultivo ─────────────────────────────────────────────────────
  if (showCultivoPicker) {
    return (
      <ScreenContainer>
        <View
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 20,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <TouchableOpacity onPress={() => setShowCultivoPicker(false)}>
            <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#FFFFFF" }}>Vincular a Cultivo</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <TouchableOpacity
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: 8,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
            onPress={() => {
              setCultivoSelecionado(null);
              setShowCultivoPicker(false);
            }}
          >
            <IconSymbol name="xmark.circle.fill" size={22} color={colors.muted} />
            <Text style={{ fontSize: 15, color: colors.muted, fontWeight: "600" }}>Nenhum cultivo (análise geral)</Text>
          </TouchableOpacity>
          {loadingCultivos ? (
            <View style={{ alignItems: "center", paddingVertical: 32 }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ fontSize: 14, color: colors.muted, marginTop: 12 }}>Carregando cultivos...</Text>
            </View>
          ) : cultivos.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 32 }}>
              <Text style={{ fontSize: 14, color: colors.muted }}>Nenhum cultivo ativo encontrado.</Text>
            </View>
          ) : (
            cultivos.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={{
                  backgroundColor: cultivoSelecionado?.id === c.id ? colors.primary + "15" : colors.surface,
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: cultivoSelecionado?.id === c.id ? colors.primary : colors.border,
                  marginBottom: 8,
                }}
                onPress={() => {
                  setCultivoSelecionado(c);
                  setCulturaId(culturaChipIdFromNome(c.nomeCultura));
                  setShowCultivoPicker(false);
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>
                  {c.nomeCultura}{c.variedade ? ` — ${c.variedade}` : ""}
                </Text>
                <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>
                  {c.areaPlantada ? `${c.areaPlantada} ha` : ""}{c.faseAtual ? ` · ${c.faseAtual.replace(/_/g, " ")}` : ""}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ── Tela Principal ─────────────────────────────────────────────────────────
  return (
    <ScreenContainer>
      {/* Header */}
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
        <View>
          <Text style={{ fontSize: 22, fontWeight: "700", color: "#FFFFFF" }}>Diagnóstico IA</Text>
          <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>
            Análise fitossanitária por inteligência artificial
          </Text>
        </View>
        <TouchableOpacity
          style={{ backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20, padding: 8 }}
          onPress={() => setShowHistorico(true)}
        >
          <IconSymbol name="clock.fill" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        {/* Image Picker */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 20,
            borderWidth: 2,
            borderColor: imageUri ? colors.primary : colors.border,
            borderStyle: imageUri ? "solid" : "dashed",
            overflow: "hidden",
            marginBottom: 16,
          }}
        >
          {imageUri ? (
            <View>
              <Image source={{ uri: imageUri }} style={{ width: "100%", height: 220 }} resizeMode="cover" />
              <TouchableOpacity
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  backgroundColor: "rgba(0,0,0,0.6)",
                  borderRadius: 20,
                  padding: 8,
                }}
                onPress={() => { setImageUri(null); setImageBase64(null); setResultado(null); }}
              >
                <IconSymbol name="xmark" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ padding: 32, alignItems: "center" }}>
              <IconSymbol name="camera.fill" size={48} color={colors.muted} />
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginTop: 12 }}>
                Fotografar planta
              </Text>
              <Text style={{ fontSize: 13, color: colors.muted, textAlign: "center", marginTop: 6 }}>
                Tire uma foto ou selecione da galeria para análise por IA
              </Text>
            </View>
          )}
        </View>

        {/* Botões de captura */}
        {!imageUri && (
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: colors.primary,
                borderRadius: 12,
                paddingVertical: 14,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
              onPress={() => pickImage(true)}
            >
              <IconSymbol name="camera.fill" size={20} color="#FFFFFF" />
              <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 15 }}>Câmera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: 12,
                paddingVertical: 14,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                borderWidth: 1,
                borderColor: colors.border,
              }}
              onPress={() => pickImage(false)}
            >
              <IconSymbol name="photo.fill" size={20} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 15 }}>Galeria</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Vincular Cultivo */}
        <Text style={styles.sectionTitle}>Cultivo (opcional)</Text>
        <TouchableOpacity
          style={{
            backgroundColor: cultivoSelecionado ? colors.primary + "15" : colors.surface,
            borderRadius: 12,
            padding: 14,
            borderWidth: 1,
            borderColor: cultivoSelecionado ? colors.primary : colors.border,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            marginBottom: 16,
          }}
          onPress={() => setShowCultivoPicker(true)}
        >
          <IconSymbol name="leaf.fill" size={18} color={cultivoSelecionado ? colors.primary : colors.muted} />
          <View style={{ flex: 1 }}>
            {cultivoSelecionado ? (
              <>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.primary }}>
                  {cultivoSelecionado.nomeCultura}{cultivoSelecionado.variedade ? ` — ${cultivoSelecionado.variedade}` : ""}
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>
                  {cultivoSelecionado.faseAtual?.replace(/_/g, " ") ?? ""}
                </Text>
              </>
            ) : (
              <Text style={{ fontSize: 14, color: colors.muted }}>Vincular a um cultivo ativo...</Text>
            )}
          </View>
          <IconSymbol name="chevron.right" size={16} color={colors.muted} />
        </TouchableOpacity>

        {/* Seleção de Cultura */}
        <Text style={styles.sectionTitle}>Cultura</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {CULTURAS.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[
                styles.chipBtn,
                {
                  backgroundColor: culturaId === c.id ? colors.primary : colors.surface,
                  borderColor: culturaId === c.id ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setCulturaId(c.id)}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: culturaId === c.id ? "#FFFFFF" : colors.foreground,
                }}
              >
                {c.nomePopular}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Parte da planta */}
        <Text style={styles.sectionTitle}>Parte Analisada</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          {PARTES.map((p) => (
            <TouchableOpacity
              key={p.value}
              style={[
                styles.chipBtn,
                {
                  backgroundColor: parte === p.value ? colors.tint : colors.surface,
                  borderColor: parte === p.value ? colors.tint : colors.border,
                },
              ]}
              onPress={() => setParte(p.value)}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: parte === p.value ? "#FFFFFF" : colors.foreground,
                }}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sintomas */}
        <Text style={styles.sectionTitle}>Sintomas Observados (opcional)</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          value={sintomas}
          onChangeText={setSintomas}
          placeholder="Descreva os sintomas visíveis: manchas, descoloração, murcha, lesões..."
          placeholderTextColor={colors.muted}
          multiline
          returnKeyType="done"
        />

        {/* Aviso de triagem */}
        <View
          style={{
            backgroundColor: colors.warning + "15",
            borderRadius: 12,
            padding: 12,
            borderWidth: 1,
            borderColor: colors.warning + "40",
            flexDirection: "row",
            gap: 8,
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 16 }}>⚠️</Text>
          <Text style={{ fontSize: 12, color: colors.foreground, flex: 1, lineHeight: 18 }}>
            <Text style={{ fontWeight: "700" }}>Triagem, não laudo definitivo.</Text> Confirme com agrônomo, técnico ou laboratório quando necessário.
          </Text>
        </View>

        {/* Botão Analisar */}
        {imageUri && !resultado && (
          <TouchableOpacity
            style={{
              backgroundColor: analyzing ? colors.muted : colors.primary,
              borderRadius: 14,
              paddingVertical: 18,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 10,
              marginBottom: 20,
            }}
            onPress={handleAnalyze}
            disabled={analyzing}
          >
            {analyzing ? (
              <>
                <ActivityIndicator color="#FFFFFF" />
                <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>Analisando com IA...</Text>
              </>
            ) : (
              <>
                <IconSymbol name="sparkles" size={22} color="#FFFFFF" />
                <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>Analisar com IA</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Resultado */}
        {resultado && (
          <View>
            <View
              style={{
                backgroundColor: colors.success + "15",
                borderRadius: 14,
                padding: 14,
                borderWidth: 1,
                borderColor: colors.success + "40",
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <IconSymbol name="checkmark.circle.fill" size={22} color={colors.success} />
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.success }}>Análise Concluída</Text>
            </View>

            <View style={styles.resultCard}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>
                    {resultado.resultado.problema}
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>
                    {TIPO_LABELS[resultado.resultado.tipo] ?? resultado.resultado.tipo}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 6 }}>
                  <View
                    style={{
                      backgroundColor: (SEVERIDADE_COLORS[resultado.resultado.severidade] ?? colors.muted) + "20",
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: SEVERIDADE_COLORS[resultado.resultado.severidade] ?? colors.muted,
                        textTransform: "capitalize",
                      }}
                    >
                      {resultado.resultado.severidade}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 12, color: colors.muted }}>
                    {resultado.resultado.confianca}% confiança
                  </Text>
                </View>
              </View>

              {/* Barra de confiança */}
              <View style={{ marginBottom: 12 }}>
                <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: "hidden" }}>
                  <View
                    style={{
                      height: "100%",
                      width: `${resultado.resultado.confianca}%`,
                      backgroundColor:
                        resultado.resultado.confianca >= 80
                          ? colors.success
                          : resultado.resultado.confianca >= 50
                          ? colors.warning
                          : colors.error,
                      borderRadius: 3,
                    }}
                  />
                </View>
              </View>

              <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 22, marginBottom: 12 }}>
                {resultado.resultado.descricao}
              </Text>

              {resultado.resultado.agenteCausal && (
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 8,
                    padding: 10,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "600" }}>Agente Causal</Text>
                  <Text style={{ fontSize: 14, color: colors.foreground, marginTop: 2, fontStyle: "italic" }}>
                    {resultado.resultado.agenteCausal}
                  </Text>
                </View>
              )}

              {resultado.resultado.recomendacoes.length > 0 && (
                <View>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
                    Recomendações
                  </Text>
                  {resultado.resultado.recomendacoes.map((rec, i) => (
                    <View key={i} style={{ flexDirection: "row", gap: 8, marginBottom: 6 }}>
                      <Text style={{ fontSize: 14, color: colors.primary, fontWeight: "700", marginTop: 1 }}>
                        {i + 1}.
                      </Text>
                      <Text style={{ fontSize: 14, color: colors.foreground, flex: 1, lineHeight: 20 }}>{rec}</Text>
                    </View>
                  ))}
                </View>
              )}

              {resultado.resultado.observacoesTecnicas && (
                <View
                  style={{
                    backgroundColor: colors.primary + "10",
                    borderRadius: 8,
                    padding: 10,
                    marginTop: 12,
                    borderWidth: 1,
                    borderColor: colors.primary + "30",
                  }}
                >
                  <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "700", marginBottom: 4 }}>
                    Observações Técnicas
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.foreground, lineHeight: 20 }}>
                    {resultado.resultado.observacoesTecnicas}
                  </Text>
                </View>
              )}
            </View>

            {/* Estado Geral */}
            <View style={[styles.resultCard, { flexDirection: "row", gap: 12, alignItems: "center" }]}>
              <View style={{ backgroundColor: (SEVERIDADE_COLORS[resultado.resultado.severidade] ?? colors.muted) + "20", borderRadius: 12, padding: 12 }}>
                <IconSymbol name={resultado.resultado.tipo === "saudavel" ? "checkmark.circle.fill" : "exclamationmark.triangle.fill"} size={28} color={SEVERIDADE_COLORS[resultado.resultado.severidade] ?? colors.muted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }}>Estado Geral da Planta</Text>
                <Text style={{ fontSize: 16, fontWeight: "700", color: SEVERIDADE_COLORS[resultado.resultado.severidade] ?? colors.foreground, marginTop: 2, textTransform: "capitalize" }}>
                  {resultado.resultado.severidade === "leve" ? "Atenção Necessária" :
                   resultado.resultado.severidade === "moderada" ? "Tratamento Recomendado" :
                   resultado.resultado.severidade === "grave" ? "Situação Grave" :
                   resultado.resultado.severidade === "critica" ? "Situação Crítica" : "Planta Saudável"}
                </Text>
                <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>Confiança da IA: {resultado.resultado.confianca}%</Text>
              </View>
            </View>

            {/* Tipo de problema */}
            <View style={[styles.resultCard, { gap: 8 }]}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: colors.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Diagnóstico Detalhado</Text>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                {resultado.resultado.tipo === "praga" && (
                  <View style={{ backgroundColor: "#FEF3C7", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, flexDirection: "row", gap: 6, alignItems: "center" }}>
                    <Text style={{ fontSize: 14 }}>🐛</Text>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#92400E" }}>Praga Identificada</Text>
                  </View>
                )}
                {resultado.resultado.tipo === "doenca" && (
                  <View style={{ backgroundColor: "#FEE2E2", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, flexDirection: "row", gap: 6, alignItems: "center" }}>
                    <Text style={{ fontSize: 14 }}>🦠</Text>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#991B1B" }}>Doença Detectada</Text>
                  </View>
                )}
                {resultado.resultado.tipo === "deficiencia_nutricional" && (
                  <View style={{ backgroundColor: "#D1FAE5", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, flexDirection: "row", gap: 6, alignItems: "center" }}>
                    <Text style={{ fontSize: 14 }}>🌿</Text>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#065F46" }}>Deficiência Nutricional</Text>
                  </View>
                )}
                {resultado.resultado.tipo === "estresse_ambiental" && (
                  <View style={{ backgroundColor: "#E0F2FE", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, flexDirection: "row", gap: 6, alignItems: "center" }}>
                    <Text style={{ fontSize: 14 }}>☀️</Text>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#0C4A6E" }}>Estresse Ambiental</Text>
                  </View>
                )}
                {resultado.resultado.tipo === "saudavel" && (
                  <View style={{ backgroundColor: "#D1FAE5", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, flexDirection: "row", gap: 6, alignItems: "center" }}>
                    <Text style={{ fontSize: 14 }}>✅</Text>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#065F46" }}>Planta Saudável</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Prevenção */}
            {resultado.resultado.observacoesTecnicas && (
              <View style={[styles.resultCard, { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" }]}>
                <View style={{ flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 8 }}>
                  <IconSymbol name="shield.fill" size={18} color="#16A34A" />
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#15803D" }}>Prevenção e Cuidados</Text>
                </View>
                <Text style={{ fontSize: 13, color: "#166534", lineHeight: 20 }}>{resultado.resultado.observacoesTecnicas}</Text>
              </View>
            )}

            {/* Botões de ação */}
            <View style={{ gap: 10, marginBottom: 20 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: generatingPdf ? colors.muted : colors.primary,
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                }}
                onPress={handleGerarLaudoAtual}
                disabled={generatingPdf}
              >
                {generatingPdf ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <IconSymbol name="doc.fill" size={18} color="#FFFFFF" />
                )}
                <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 15 }}>
                  {generatingPdf ? "Gerando laudo..." : "Gerar Laudo PDF"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: colors.surface, borderRadius: 12, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: colors.border }}
                onPress={() => { setImageUri(null); setImageBase64(null); setResultado(null); setSintomas(""); setCultivoSelecionado(null); }}
              >
                <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 15 }}>Nova Análise</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
