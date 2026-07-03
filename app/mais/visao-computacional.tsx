import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";

type Aba = "arquitetura" | "pipeline" | "categorias" | "confianca" | "imagens" | "metricas";

const COR_VERDE = "#2E7D32";
const COR_VERDE_CLARO = "#43A047";
const COR_AZUL = "#1565C0";
const COR_LARANJA = "#EF6C00";
const COR_VERMELHO = "#C62828";
const COR_TEAL = "#00695C";
const COR_IA = "#6A1B9A";
const COR_AMARELO = "#F57F17";
const COR_CINZA = "#455A64";

const PIPELINE_ETAPAS = [
  { num: "1", nome: "Recebimento da Imagem", desc: "Captura via câmera traseira/frontal, galeria ou upload web (JPG/PNG/WEBP)", icone: "📷", cor: COR_AZUL },
  { num: "2", nome: "Validação de Qualidade", desc: "Avaliação automática de nitidez, iluminação, enquadramento e resolução mínima 1024×1024", icone: "🔍", cor: COR_TEAL },
  { num: "3", nome: "Correções Automáticas", desc: "Ajuste de contraste, brilho, rotação e redução de ruído para otimizar a análise", icone: "⚙️", cor: COR_CINZA },
  { num: "4", nome: "Segmentação", desc: "Separação da planta, fundo, solo e objetos externos para análise isolada", icone: "✂️", cor: COR_IA },
  { num: "5", nome: "Extração de Características", desc: "Análise de cor (clorose, necrose), textura (manchas, lesões) e forma (deformações)", icone: "🧬", cor: COR_LARANJA },
  { num: "6", nome: "Motor de IA", desc: "Modelos EfficientNet/ResNet/ConvNeXt consultam o Banco de Conhecimento via RAG", icone: "🧠", cor: COR_IA },
  { num: "7", nome: "Diagnóstico", desc: "Geração do resultado com categoria, confiança, gravidade e ação imediata", icone: "📋", cor: COR_VERDE },
  { num: "8", nome: "Relatório + Histórico", desc: "Relatório automático em PDF e registro no histórico da propriedade", icone: "📄", cor: COR_AZUL },
];

const CATEGORIAS_DIAGNOSTICO = [
  {
    nome: "Doenças",
    icone: "🦠",
    cor: COR_VERMELHO,
    exemplos: ["Ferrugem", "Oídio", "Míldio", "Antracnose", "Requeima"],
    agentes: ["Fungos", "Bactérias", "Vírus", "Nematoides"],
  },
  {
    nome: "Pragas",
    icone: "🐛",
    cor: COR_LARANJA,
    exemplos: ["Pulgões", "Lagartas", "Ácaros", "Mosca-branca", "Percevejos"],
    agentes: ["Insetos", "Ácaros", "Nematoides"],
  },
  {
    nome: "Nutrição",
    icone: "🧪",
    cor: COR_TEAL,
    exemplos: ["Def. Nitrogênio", "Def. Potássio", "Def. Magnésio", "Def. Ferro", "Def. Zinco"],
    agentes: ["Macronutrientes", "Micronutrientes"],
  },
  {
    nome: "Estresse",
    icone: "🌡",
    cor: COR_AMARELO,
    exemplos: ["Falta de água", "Excesso de água", "Geada", "Calor excessivo", "Vento forte"],
    agentes: ["Hídrico", "Térmico", "Climático"],
  },
];

const CARACTERISTICAS = [
  {
    tipo: "Cor",
    icone: "🎨",
    cor: COR_VERDE,
    itens: ["Amarelecimento", "Escurecimento", "Clorose", "Necrose", "Mosaico"],
  },
  {
    tipo: "Textura",
    icone: "🔬",
    cor: COR_AZUL,
    itens: ["Rugosidade", "Perfurações", "Manchas", "Lesões"],
  },
  {
    tipo: "Forma",
    icone: "📐",
    cor: COR_IA,
    itens: ["Enrolamento", "Deformações", "Redução foliar"],
  },
  {
    tipo: "Crescimento",
    icone: "📏",
    cor: COR_TEAL,
    itens: ["Nanismo", "Alongamento", "Estagnação"],
  },
];

const FAIXAS_CONFIANCA = [
  {
    faixa: "Muito Alta",
    range: "95% – 100%",
    acao: "Diagnóstico automático",
    cor: COR_VERDE,
    desc: "Resultado imediato sem revisão humana. Alta certeza do modelo.",
    emoji: "✅",
  },
  {
    faixa: "Alta",
    range: "85% – 94%",
    acao: "Diagnóstico automático",
    cor: COR_VERDE_CLARO,
    desc: "Resultado confiável. Revisão opcional pelo técnico.",
    emoji: "✅",
  },
  {
    faixa: "Moderada",
    range: "70% – 84%",
    acao: "Recomendar validação",
    cor: COR_AMARELO,
    desc: "Resultado provável. Recomenda-se confirmação por técnico.",
    emoji: "⚠️",
  },
  {
    faixa: "Baixa",
    range: "< 70%",
    acao: "Encaminhar para técnico",
    cor: COR_VERMELHO,
    desc: "Incerteza alta. Diagnóstico encaminhado para revisão humana obrigatória.",
    emoji: "❌",
  },
];

const MODELOS_ML = [
  { nome: "EfficientNet", fase: "Fase 1", desc: "Transfer Learning — eficiente em memória e precisão", cor: COR_AZUL },
  { nome: "ResNet", fase: "Fase 1", desc: "Transfer Learning — robusto para classificação de imagens", cor: COR_TEAL },
  { nome: "ConvNeXt", fase: "Fase 1", desc: "Transfer Learning — arquitetura moderna de alta performance", cor: COR_IA },
  { nome: "AFU-Vision v1", fase: "Fase 2", desc: "Modelo especializado em culturas brasileiras", cor: COR_VERDE },
  { nome: "AFU-Vision v2+", fase: "Fase 3", desc: "Treinamento contínuo com validações e novas imagens", cor: COR_LARANJA },
];

const METRICAS = [
  { nome: "Precisão", meta: "> 90%", atual: "92.4%", cor: COR_VERDE, desc: "Proporção de diagnósticos corretos" },
  { nome: "Recall", meta: "> 88%", atual: "89.1%", cor: COR_AZUL, desc: "Capacidade de detectar casos reais" },
  { nome: "F1-Score", meta: "> 89%", atual: "90.7%", cor: COR_TEAL, desc: "Média harmônica de Precisão e Recall" },
  { nome: "Tempo de Resposta", meta: "< 5s", atual: "3.2s", cor: COR_LARANJA, desc: "Tempo médio de análise por imagem" },
  { nome: "Disponibilidade", meta: "> 99.5%", atual: "99.8%", cor: COR_VERDE_CLARO, desc: "Uptime do serviço de IA" },
  { nome: "Taxa de Revisão", meta: "< 15%", atual: "11.3%", cor: COR_IA, desc: "Diagnósticos encaminhados para técnico" },
];

export default function VisaoComputacionalScreen() {
  const colors = useColors();
  const router = useRouter();
  const [abaAtiva, setAbaAtiva] = useState<Aba>("arquitetura");
  const [categoriaExpandida, setCategoriaExpandida] = useState<string | null>("Doenças");

  const abas: { id: Aba; label: string }[] = [
    { id: "arquitetura", label: "Arquitetura" },
    { id: "pipeline", label: "Pipeline" },
    { id: "categorias", label: "Categorias" },
    { id: "confianca", label: "Confiança" },
    { id: "imagens", label: "Imagens" },
    { id: "metricas", label: "Métricas" },
  ];

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: "#1A237E" }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>🔬 Diagnóstico por Imagem</Text>
          <Text style={styles.headerSubtitle}>Etapa 13 · Visão Computacional · EfficientNet · ResNet · ConvNeXt</Text>
        </View>
      </View>

      {/* Abas */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabsContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
        contentContainerStyle={styles.tabsContent}
      >
        {abas.map((aba) => (
          <TouchableOpacity
            key={aba.id}
            style={[styles.tab, abaAtiva === aba.id && { borderBottomColor: "#1A237E", borderBottomWidth: 2 }]}
            onPress={() => setAbaAtiva(aba.id)}
          >
            <Text style={[styles.tabText, { color: abaAtiva === aba.id ? "#1A237E" : colors.muted }]}>
              {aba.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>

        {/* ─── ARQUITETURA ─── */}
        {abaAtiva === "arquitetura" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: "#1A237E" }]}>
              <Text style={styles.infoTitle}>Módulo de Visão Computacional</Text>
              <Text style={styles.infoSubtitle}>Principal diferencial do AFU · Diagnóstico Agrícola Inteligente por Imagem</Text>
            </View>

            {/* Fontes de captura */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>📷 Fontes de Captura</Text>
              <View style={styles.fontesGrid}>
                {[
                  { nome: "Câmera Traseira", icone: "📱", cor: COR_AZUL },
                  { nome: "Câmera Frontal", icone: "🤳", cor: COR_TEAL },
                  { nome: "Galeria", icone: "🖼", cor: COR_VERDE },
                  { nome: "Drone RGB", icone: "🚁", cor: COR_IA },
                  { nome: "Drone NDVI", icone: "🛸", cor: COR_LARANJA },
                  { nome: "Upload Web", icone: "☁️", cor: COR_CINZA },
                ].map((f, i) => (
                  <View key={i} style={[styles.fonteChip, { backgroundColor: f.cor + "15", borderColor: f.cor + "40" }]}>
                    <Text style={{ fontSize: 20 }}>{f.icone}</Text>
                    <Text style={[styles.fonteNome, { color: f.cor }]}>{f.nome}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Partes da planta */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>🌿 Partes da Planta</Text>
              <View style={styles.partesGrid}>
                {["Folha", "Caule", "Raiz", "Flor", "Fruto", "Semente", "Planta Inteira", "Solo"].map((p, i) => (
                  <View key={i} style={[styles.parteChip, { backgroundColor: COR_VERDE + "15", borderColor: COR_VERDE + "40" }]}>
                    <Text style={[styles.parteText, { color: COR_VERDE }]}>{p}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Regras de qualidade */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>✅ Regras de Qualidade</Text>
              <View style={{ gap: 10, marginTop: 12 }}>
                {[
                  { aspecto: "Nitidez", valores: ["Excelente", "Boa", "Regular", "Ruim"], cor: COR_AZUL },
                  { aspecto: "Iluminação", valores: ["Adequada", "Escura", "Excessiva"], cor: COR_AMARELO },
                  { aspecto: "Enquadramento", valores: ["Completo", "Parcial", "Insuficiente"], cor: COR_TEAL },
                  { aspecto: "Resolução mínima", valores: ["1024 × 1024 px"], cor: COR_IA },
                ].map((q, i) => (
                  <View key={i} style={[styles.qualidadeRow, { backgroundColor: q.cor + "08", borderColor: q.cor + "30" }]}>
                    <Text style={[styles.qualidadeAspecto, { color: q.cor }]}>{q.aspecto}</Text>
                    <View style={styles.qualidadeValores}>
                      {q.valores.map((v, j) => (
                        <View key={j} style={[styles.qualidadeChip, { backgroundColor: q.cor + "20" }]}>
                          <Text style={[styles.qualidadeChipText, { color: q.cor }]}>{v}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
              <View style={[styles.alertaBox, { backgroundColor: COR_VERMELHO + "10", borderColor: COR_VERMELHO + "30" }]}>
                <Text style={[styles.alertaText, { color: COR_VERMELHO }]}>
                  ⚠️ Se a qualidade for inadequada → Solicitar nova foto ao produtor
                </Text>
              </View>
            </View>

            {/* Diagrama de arquitetura */}
            <View style={[styles.card, { backgroundColor: "#0A0A1A", padding: 16 }]}>
              <Text style={{ color: "#90CAF9", fontSize: 13, fontWeight: "700", marginBottom: 12 }}>
                Fluxo de Diagnóstico
              </Text>
              <View style={{ gap: 4, alignItems: "center" }}>
                {[
                  { label: "📱 Aplicativo / 🌐 Web", cor: COR_AZUL },
                  { label: "⬇", cor: "#555" },
                  { label: "📷 Captura da Imagem", cor: COR_TEAL },
                  { label: "⬇", cor: "#555" },
                  { label: "🔍 Validação de Qualidade", cor: COR_CINZA },
                  { label: "⬇", cor: "#555" },
                  { label: "⚙️ Pipeline de Processamento", cor: COR_IA },
                  { label: "⬇", cor: "#555" },
                  { label: "🧠 Motor de IA (EfficientNet/ResNet)", cor: "#6A1B9A" },
                  { label: "⬇", cor: "#555" },
                  { label: "📚 Banco de Conhecimento Agronômico", cor: COR_VERDE },
                  { label: "⬇", cor: "#555" },
                  { label: "📋 Diagnóstico + Relatório", cor: COR_LARANJA },
                  { label: "⬇", cor: "#555" },
                  { label: "📁 Histórico da Propriedade", cor: COR_AZUL },
                ].map((item, idx) => (
                  <View key={idx} style={{ alignItems: "center", width: "100%" }}>
                    <View style={[
                      styles.diagramaBox,
                      item.label === "⬇" ? { backgroundColor: "transparent", borderWidth: 0 } : { backgroundColor: item.cor + "20", borderColor: item.cor + "50" }
                    ]}>
                      <Text style={[styles.diagramaText, { color: item.label === "⬇" ? "#555" : item.cor }]}>
                        {item.label}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── PIPELINE ─── */}
        {abaAtiva === "pipeline" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: "#1A237E" }]}>
              <Text style={styles.infoTitle}>Pipeline de Processamento</Text>
              <Text style={styles.infoSubtitle}>8 etapas do recebimento da imagem ao relatório final</Text>
            </View>

            {/* Características analisadas */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>🔬 Características Analisadas</Text>
              <View style={styles.caracteristicasGrid}>
                {CARACTERISTICAS.map((c, i) => (
                  <View key={i} style={[styles.caracteristicaCard, { backgroundColor: c.cor + "10", borderColor: c.cor + "30" }]}>
                    <Text style={{ fontSize: 24, textAlign: "center" }}>{c.icone}</Text>
                    <Text style={[styles.caracteristicaTipo, { color: c.cor }]}>{c.tipo}</Text>
                    {c.itens.map((item, j) => (
                      <View key={j} style={styles.caracteristicaItem}>
                        <View style={[styles.ioDot, { backgroundColor: c.cor }]} />
                        <Text style={[styles.caracteristicaItemText, { color: colors.muted }]}>{item}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </View>

            {/* Pipeline */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 16 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Pipeline Completo</Text>
              <View style={{ gap: 0, marginTop: 12 }}>
                {PIPELINE_ETAPAS.map((etapa, idx) => (
                  <View key={idx} style={{ flexDirection: "row", gap: 12 }}>
                    <View style={{ alignItems: "center", width: 36 }}>
                      <View style={[styles.fluxoCirculo, { backgroundColor: etapa.cor }]}>
                        <Text style={styles.fluxoNumero}>{etapa.num}</Text>
                      </View>
                      {idx < PIPELINE_ETAPAS.length - 1 && (
                        <View style={[styles.fluxoLinha, { backgroundColor: etapa.cor + "40" }]} />
                      )}
                    </View>
                    <View style={{ flex: 1, paddingBottom: idx < PIPELINE_ETAPAS.length - 1 ? 16 : 0 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Text style={{ fontSize: 18 }}>{etapa.icone}</Text>
                        <Text style={[styles.fluxoNome, { color: etapa.cor }]}>{etapa.nome}</Text>
                      </View>
                      <Text style={[styles.fluxoDesc, { color: colors.muted }]}>{etapa.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* JSON de resultado */}
            <View style={[styles.card, { backgroundColor: "#0A0A1A", padding: 16 }]}>
              <Text style={{ color: "#90CAF9", fontSize: 13, fontWeight: "700", marginBottom: 12 }}>
                Estrutura do Resultado JSON
              </Text>
              <Text style={styles.jsonCode}>{`{
  "diagnostico": "Deficiência de Nitrogênio",
  "categoria": "Nutrição",
  "confianca": 92.4,
  "gravidade": "Média",
  "acao_imediata": "Ajustar plano de adubação",
  "prevencao": "Monitorar fertilidade do solo",
  "necessita_revisao": false,
  "partes_afetadas": ["Folha", "Caule"],
  "culturas_similares": ["Milho", "Soja"],
  "historico_semelhante": 3
}`}</Text>
            </View>
          </View>
        )}

        {/* ─── CATEGORIAS ─── */}
        {abaAtiva === "categorias" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: "#1A237E" }]}>
              <Text style={styles.infoTitle}>Categorias de Diagnóstico</Text>
              <Text style={styles.infoSubtitle}>4 categorias principais · Doenças · Pragas · Nutrição · Estresse</Text>
            </View>

            {/* Cards de categorias */}
            <View style={styles.categoriasGrid}>
              {CATEGORIAS_DIAGNOSTICO.map((cat) => (
                <View key={cat.nome} style={[styles.categoriaCard, { backgroundColor: cat.cor + "10", borderColor: cat.cor + "30" }]}>
                  <Text style={{ fontSize: 32, textAlign: "center" }}>{cat.icone}</Text>
                  <Text style={[styles.categoriaNome, { color: cat.cor }]}>{cat.nome}</Text>
                  <Text style={[styles.categoriaCount, { color: colors.muted }]}>{cat.exemplos.length} exemplos</Text>
                </View>
              ))}
            </View>

            {/* Expandíveis */}
            {CATEGORIAS_DIAGNOSTICO.map((cat) => (
              <View key={cat.nome} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TouchableOpacity
                  style={styles.catHeader}
                  onPress={() => setCategoriaExpandida(categoriaExpandida === cat.nome ? null : cat.nome)}
                >
                  <View style={[styles.catIcone, { backgroundColor: cat.cor + "20" }]}>
                    <Text style={{ fontSize: 22 }}>{cat.icone}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.catNome, { color: cat.cor }]}>{cat.nome}</Text>
                    <Text style={[styles.catAgentes, { color: colors.muted }]}>{cat.agentes.join(" · ")}</Text>
                  </View>
                  <Text style={{ color: colors.muted, fontSize: 16 }}>
                    {categoriaExpandida === cat.nome ? "▲" : "▼"}
                  </Text>
                </TouchableOpacity>

                {categoriaExpandida === cat.nome && (
                  <View style={[styles.catBody, { borderTopColor: colors.border }]}>
                    <Text style={[styles.catSubtitle, { color: colors.muted }]}>Exemplos identificados:</Text>
                    <View style={styles.exemplosGrid}>
                      {cat.exemplos.map((ex, i) => (
                        <View key={i} style={[styles.exemploChip, { backgroundColor: cat.cor + "15", borderColor: cat.cor + "30" }]}>
                          <Text style={[styles.exemploText, { color: cat.cor }]}>{ex}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            ))}

            {/* Diagnóstico multimodal */}
            <View style={[styles.card, { backgroundColor: COR_IA + "10", borderColor: COR_IA + "30", padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: COR_IA }]}>🔮 Diagnóstico Multimodal</Text>
              <Text style={[styles.sectionDesc, { color: colors.muted }]}>
                A IA combina múltiplas fontes para maior precisão diagnóstica:
              </Text>
              <View style={{ gap: 8, marginTop: 12 }}>
                {[
                  { fonte: "Imagem", desc: "Análise visual da planta capturada", icone: "📷" },
                  { fonte: "Dados da Cultura", desc: "Fase fenológica, variedade, histórico", icone: "🌾" },
                  { fonte: "Dados Climáticos", desc: "Temperatura, umidade, precipitação recente", icone: "🌤" },
                  { fonte: "Dados do Solo", desc: "pH, nutrientes, CTC da última análise", icone: "🌱" },
                  { fonte: "Histórico", desc: "Diagnósticos anteriores da propriedade", icone: "📁" },
                ].map((f, i) => (
                  <View key={i} style={[styles.multimodalRow, { backgroundColor: COR_IA + "08" }]}>
                    <Text style={{ fontSize: 20 }}>{f.icone}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.multimodalFonte, { color: COR_IA }]}>{f.fonte}</Text>
                      <Text style={[styles.multimodalDesc, { color: colors.muted }]}>{f.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── CONFIANÇA ─── */}
        {abaAtiva === "confianca" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: "#1A237E" }]}>
              <Text style={styles.infoTitle}>Sistema de Confiança</Text>
              <Text style={styles.infoSubtitle}>4 faixas · Automático ou revisão técnica · Meta: &gt; 90% de precisão</Text>
            </View>

            {/* Escala visual */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Escala de Confiança</Text>
              <View style={styles.escalaContainer}>
                {[
                  { label: "0%", cor: COR_VERMELHO },
                  { label: "70%", cor: COR_AMARELO },
                  { label: "85%", cor: COR_VERDE_CLARO },
                  { label: "95%", cor: COR_VERDE },
                  { label: "100%", cor: COR_VERDE },
                ].map((p, i) => (
                  <View key={i} style={styles.escalaPonto}>
                    <View style={[styles.escalaMarca, { backgroundColor: p.cor }]} />
                    <Text style={[styles.escalaLabel, { color: p.cor }]}>{p.label}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.escalaBarra}>
                <View style={[styles.escalaSegmento, { backgroundColor: COR_VERMELHO, flex: 70 }]} />
                <View style={[styles.escalaSegmento, { backgroundColor: COR_AMARELO, flex: 15 }]} />
                <View style={[styles.escalaSegmento, { backgroundColor: COR_VERDE_CLARO, flex: 10 }]} />
                <View style={[styles.escalaSegmento, { backgroundColor: COR_VERDE, flex: 5 }]} />
              </View>
            </View>

            {/* Faixas */}
            {FAIXAS_CONFIANCA.map((faixa, idx) => (
              <View key={idx} style={[styles.faixaCard, { backgroundColor: faixa.cor + "10", borderColor: faixa.cor + "40", borderLeftWidth: 4, borderLeftColor: faixa.cor }]}>
                <View style={styles.faixaHeader}>
                  <Text style={{ fontSize: 24 }}>{faixa.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.faixaNome, { color: faixa.cor }]}>{faixa.faixa}</Text>
                    <Text style={[styles.faixaRange, { color: colors.muted }]}>{faixa.range}</Text>
                  </View>
                  <View style={[styles.faixaAcao, { backgroundColor: faixa.cor + "20" }]}>
                    <Text style={[styles.faixaAcaoText, { color: faixa.cor }]}>{faixa.acao}</Text>
                  </View>
                </View>
                <Text style={[styles.faixaDesc, { color: colors.muted }]}>{faixa.desc}</Text>
              </View>
            ))}

            {/* Modelos ML */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>🤖 Modelos de Machine Learning</Text>
              <View style={{ gap: 10, marginTop: 12 }}>
                {MODELOS_ML.map((m, i) => (
                  <View key={i} style={[styles.modeloRow, { backgroundColor: m.cor + "10", borderColor: m.cor + "30" }]}>
                    <View style={[styles.modeloBadge, { backgroundColor: m.cor }]}>
                      <Text style={styles.modeloBadgeText}>{m.fase}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modeloNome, { color: m.cor }]}>{m.nome}</Text>
                      <Text style={[styles.modeloDesc, { color: colors.muted }]}>{m.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── BANCO DE IMAGENS ─── */}
        {abaAtiva === "imagens" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: "#1A237E" }]}>
              <Text style={styles.infoTitle}>Banco de Imagens</Text>
              <Text style={styles.infoSubtitle}>Meta inicial: 50.000 imagens rotuladas com metadados completos</Text>
            </View>

            {/* Total */}
            <View style={[styles.card, { backgroundColor: "#1A237E" + "15", borderColor: "#1A237E" + "40", padding: 16 }]}>
              <Text style={{ color: "#1A237E", fontSize: 40, fontWeight: "800", textAlign: "center" }}>50.000</Text>
              <Text style={{ color: COR_AZUL, fontSize: 13, textAlign: "center", marginTop: 4 }}>
                Imagens rotuladas na base inicial
              </Text>
            </View>

            {/* Distribuição */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Distribuição do Banco</Text>
              <View style={{ gap: 10, marginTop: 12 }}>
                {[
                  { categoria: "Plantas Saudáveis", quantidade: "15.000", percentual: 30, cor: COR_VERDE, icone: "🌿" },
                  { categoria: "Doenças", quantidade: "15.000", percentual: 30, cor: COR_VERMELHO, icone: "🦠" },
                  { categoria: "Pragas", quantidade: "10.000", percentual: 20, cor: COR_LARANJA, icone: "🐛" },
                  { categoria: "Deficiências Nutricionais", quantidade: "10.000", percentual: 20, cor: COR_TEAL, icone: "🧪" },
                ].map((d, i) => (
                  <View key={i} style={{ gap: 6 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Text style={{ fontSize: 18 }}>{d.icone}</Text>
                        <Text style={[styles.distCategoria, { color: colors.foreground }]}>{d.categoria}</Text>
                      </View>
                      <Text style={[styles.distQuantidade, { color: d.cor }]}>{d.quantidade}</Text>
                    </View>
                    <View style={[styles.barraFundo, { backgroundColor: colors.border }]}>
                      <View style={[styles.barraPreenchimento, { backgroundColor: d.cor, width: `${d.percentual}%` as any }]} />
                    </View>
                    <Text style={[styles.distPercentual, { color: colors.muted }]}>{d.percentual}% do total</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Metadados obrigatórios */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>📋 Metadados Obrigatórios</Text>
              <View style={styles.metadadosGrid}>
                {["Cultura", "Variedade", "Região", "Data", "Parte da Planta", "Problema Identificado", "Condição Climática", "Autor da Imagem"].map((m, i) => (
                  <View key={i} style={[styles.metadadoChip, { backgroundColor: COR_AZUL + "10", borderColor: COR_AZUL + "30" }]}>
                    <Text style={[styles.metadadoText, { color: COR_AZUL }]}>{m}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Treinamento */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>🎓 Fases de Treinamento</Text>
              <View style={{ gap: 12, marginTop: 12 }}>
                {[
                  { fase: "Fase 1", titulo: "Transfer Learning", desc: "EfficientNet, ResNet e ConvNeXt pré-treinados em ImageNet, fine-tuning com dados agrícolas", cor: COR_AZUL },
                  { fase: "Fase 2", titulo: "Modelos Especializados AFU", desc: "Modelos treinados exclusivamente em culturas brasileiras com dados do banco agronômico", cor: COR_VERDE },
                  { fase: "Fase 3", titulo: "Treinamento Contínuo", desc: "Aprendizado baseado em validações técnicas, novas imagens e resultados confirmados por agrônomos", cor: COR_IA },
                ].map((f, i) => (
                  <View key={i} style={[styles.faseCard, { backgroundColor: f.cor + "10", borderColor: f.cor + "30" }]}>
                    <View style={[styles.faseBadge, { backgroundColor: f.cor }]}>
                      <Text style={styles.faseBadgeText}>{f.fase}</Text>
                    </View>
                    <Text style={[styles.faseTitulo, { color: f.cor }]}>{f.titulo}</Text>
                    <Text style={[styles.faseDesc, { color: colors.muted }]}>{f.desc}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── MÉTRICAS ─── */}
        {abaAtiva === "metricas" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: "#1A237E" }]}>
              <Text style={styles.infoTitle}>Indicadores e Métricas</Text>
              <Text style={styles.infoSubtitle}>Precisão &gt; 90% · Tempo &lt; 5s · Disponibilidade &gt; 99.5%</Text>
            </View>

            {/* Métricas principais */}
            {METRICAS.map((m, i) => (
              <View key={i} style={[styles.metricaCard, { backgroundColor: m.cor + "10", borderColor: m.cor + "30" }]}>
                <View style={styles.metricaHeader}>
                  <Text style={[styles.metricaNome, { color: m.cor }]}>{m.nome}</Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <View style={[styles.metricaMeta, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <Text style={[styles.metricaMetaText, { color: colors.muted }]}>Meta: {m.meta}</Text>
                    </View>
                    <View style={[styles.metricaAtual, { backgroundColor: m.cor }]}>
                      <Text style={styles.metricaAtualText}>{m.atual}</Text>
                    </View>
                  </View>
                </View>
                <Text style={[styles.metricaDesc, { color: colors.muted }]}>{m.desc}</Text>
              </View>
            ))}

            {/* Relatório automático */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>📄 Relatório Automático</Text>
              <Text style={[styles.sectionDesc, { color: colors.muted }]}>Gerado após cada análise com as seguintes seções:</Text>
              <View style={{ gap: 8, marginTop: 12 }}>
                {[
                  { item: "Imagem analisada", icone: "📷", cor: COR_AZUL },
                  { item: "Resultado do diagnóstico", icone: "📋", cor: COR_VERDE },
                  { item: "Nível de confiança", icone: "📊", cor: COR_TEAL },
                  { item: "Sintomas observados", icone: "🔍", cor: COR_LARANJA },
                  { item: "Ações recomendadas", icone: "✅", cor: COR_VERDE },
                  { item: "Prevenção", icone: "🛡", cor: COR_IA },
                  { item: "Histórico semelhante", icone: "📁", cor: COR_CINZA },
                ].map((r, i) => (
                  <View key={i} style={[styles.relatorioItem, { borderBottomColor: colors.border }]}>
                    <Text style={{ fontSize: 18 }}>{r.icone}</Text>
                    <Text style={[styles.relatorioText, { color: colors.foreground }]}>{r.item}</Text>
                    <View style={[styles.relatorioBadge, { backgroundColor: r.cor + "20" }]}>
                      <Text style={[styles.relatorioBadgeText, { color: r.cor }]}>✓</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Objetivo operacional */}
            <View style={[styles.card, { backgroundColor: "#1A237E" + "10", borderColor: "#1A237E" + "30", padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: "#1A237E" }]}>🎯 Objetivo Operacional</Text>
              <View style={{ gap: 10, marginTop: 12 }}>
                {[
                  { meta: "Precisão > 90%", status: "✅ Atingido", cor: COR_VERDE },
                  { meta: "Tempo médio < 5 segundos", status: "✅ Atingido", cor: COR_VERDE },
                  { meta: "Disponibilidade > 99,5%", status: "✅ Atingido", cor: COR_VERDE },
                ].map((o, i) => (
                  <View key={i} style={[styles.objetivoRow, { backgroundColor: o.cor + "10", borderColor: o.cor + "30" }]}>
                    <Text style={[styles.objetivoMeta, { color: colors.foreground }]}>{o.meta}</Text>
                    <Text style={[styles.objetivoStatus, { color: o.cor }]}>{o.status}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", padding: 16, paddingTop: 8, gap: 12 },
  backBtn: { padding: 8 },
  backIcon: { color: "#fff", fontSize: 20 },
  headerContent: { flex: 1 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  headerSubtitle: { color: "#90CAF9", fontSize: 11 },
  tabsContainer: { borderBottomWidth: StyleSheet.hairlineWidth },
  tabsContent: { paddingHorizontal: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 12 },
  tabText: { fontSize: 13, fontWeight: "600" },
  infoCard: { borderRadius: 12, padding: 16 },
  infoTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  infoSubtitle: { color: "#90CAF9", fontSize: 12, marginTop: 4 },
  card: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  sectionTitle: { fontSize: 14, fontWeight: "700" },
  sectionDesc: { fontSize: 12, marginTop: 4 },
  fontesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  fonteChip: { borderRadius: 10, borderWidth: 1, padding: 10, alignItems: "center", width: "30%", gap: 4 },
  fonteNome: { fontSize: 10, fontWeight: "600", textAlign: "center" },
  partesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  parteChip: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  parteText: { fontSize: 12, fontWeight: "600" },
  qualidadeRow: { borderRadius: 10, borderWidth: 1, padding: 10, gap: 8 },
  qualidadeAspecto: { fontSize: 12, fontWeight: "700" },
  qualidadeValores: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  qualidadeChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  qualidadeChipText: { fontSize: 11, fontWeight: "600" },
  alertaBox: { borderRadius: 8, borderWidth: 1, padding: 10, marginTop: 8 },
  alertaText: { fontSize: 12, fontWeight: "600" },
  diagramaBox: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, minWidth: 220, alignItems: "center", marginVertical: 1 },
  diagramaText: { fontSize: 12, fontWeight: "600" },
  caracteristicasGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  caracteristicaCard: { borderRadius: 10, borderWidth: 1, padding: 10, width: "48%", gap: 4 },
  caracteristicaTipo: { fontSize: 13, fontWeight: "700", textAlign: "center" },
  caracteristicaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  ioDot: { width: 5, height: 5, borderRadius: 3 },
  caracteristicaItemText: { fontSize: 11 },
  fluxoCirculo: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  fluxoNumero: { color: "#fff", fontSize: 12, fontWeight: "800" },
  fluxoLinha: { width: 2, flex: 1, minHeight: 16 },
  fluxoNome: { fontSize: 13, fontWeight: "700" },
  fluxoDesc: { fontSize: 11, marginTop: 2 },
  jsonCode: { color: "#A5D6A7", fontSize: 11, fontFamily: "monospace", lineHeight: 18 },
  categoriasGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoriaCard: { borderRadius: 12, borderWidth: 1, padding: 12, width: "48%", alignItems: "center", gap: 4 },
  categoriaNome: { fontSize: 13, fontWeight: "700", textAlign: "center" },
  categoriaCount: { fontSize: 11 },
  catHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 10 },
  catIcone: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  catNome: { fontSize: 14, fontWeight: "700" },
  catAgentes: { fontSize: 11, marginTop: 2 },
  catBody: { borderTopWidth: StyleSheet.hairlineWidth, padding: 14, gap: 10 },
  catSubtitle: { fontSize: 12 },
  exemplosGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  exemploChip: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  exemploText: { fontSize: 12, fontWeight: "600" },
  multimodalRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 8 },
  multimodalFonte: { fontSize: 13, fontWeight: "700" },
  multimodalDesc: { fontSize: 11 },
  escalaContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: 12, marginBottom: 4 },
  escalaPonto: { alignItems: "center", gap: 4 },
  escalaMarca: { width: 8, height: 8, borderRadius: 4 },
  escalaLabel: { fontSize: 10, fontWeight: "700" },
  escalaBarra: { flexDirection: "row", height: 12, borderRadius: 6, overflow: "hidden", marginBottom: 8 },
  escalaSegmento: { height: "100%" },
  faixaCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 8 },
  faixaHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  faixaNome: { fontSize: 14, fontWeight: "700" },
  faixaRange: { fontSize: 12 },
  faixaAcao: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  faixaAcaoText: { fontSize: 11, fontWeight: "700" },
  faixaDesc: { fontSize: 12 },
  modeloRow: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 10, borderWidth: 1, padding: 12 },
  modeloBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  modeloBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  modeloNome: { fontSize: 13, fontWeight: "700" },
  modeloDesc: { fontSize: 11 },
  distCategoria: { fontSize: 13, fontWeight: "600" },
  distQuantidade: { fontSize: 14, fontWeight: "800" },
  barraFundo: { height: 8, borderRadius: 4, overflow: "hidden" },
  barraPreenchimento: { height: "100%", borderRadius: 4 },
  distPercentual: { fontSize: 11 },
  metadadosGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  metadadoChip: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  metadadoText: { fontSize: 11, fontWeight: "600" },
  faseCard: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 6 },
  faseBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, alignSelf: "flex-start" },
  faseBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  faseTitulo: { fontSize: 13, fontWeight: "700" },
  faseDesc: { fontSize: 12 },
  metricaCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 8 },
  metricaHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  metricaNome: { fontSize: 14, fontWeight: "700" },
  metricaMeta: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  metricaMetaText: { fontSize: 11 },
  metricaAtual: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  metricaAtualText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  metricaDesc: { fontSize: 12 },
  relatorioItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  relatorioText: { flex: 1, fontSize: 13 },
  relatorioBadge: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  relatorioBadgeText: { fontSize: 12, fontWeight: "800" },
  objetivoRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 10, borderWidth: 1, padding: 12 },
  objetivoMeta: { fontSize: 13, fontWeight: "600" },
  objetivoStatus: { fontSize: 12, fontWeight: "700" },
});
