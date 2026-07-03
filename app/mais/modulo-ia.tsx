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

type Aba = "motores" | "fluxo" | "banco" | "confianca" | "prompts" | "governanca";

const COR_IA = "#6A1B9A";
const COR_IA_CLARA = "#AB47BC";
const COR_VERDE = "#2E7D32";
const COR_AZUL = "#1565C0";
const COR_LARANJA = "#EF6C00";
const COR_TEAL = "#00695C";
const COR_VERMELHO = "#C62828";

const MOTORES = [
  {
    id: "IA-01",
    nome: "Diagnóstico Visual",
    icone: "🔬",
    cor: COR_LARANJA,
    desc: "Analisa imagens enviadas pelos produtores para identificar problemas fitossanitários.",
    entradas: ["Foto da folha", "Foto do fruto", "Foto da raiz", "Foto do caule", "Foto da planta inteira"],
    saidas: ["Possível problema identificado", "Nível de confiança (%)", "Gravidade (leve/moderada/grave)", "Tratamento recomendado", "Medidas de prevenção"],
    meta: "90–95% de precisão operacional",
    comparacao: ["Banco de doenças", "Banco de pragas", "Banco de deficiências nutricionais", "Banco de estresses ambientais"],
  },
  {
    id: "IA-02",
    nome: "Solo Inteligente",
    icone: "🌱",
    cor: COR_VERDE,
    desc: "Interpreta resultados laboratoriais de solo para diagnóstico de fertilidade e manejo.",
    entradas: ["pH", "N, P, K, Ca, Mg, S", "Zn, B, Cu, Fe, Mn", "Matéria Orgânica", "CTC e V%"],
    saidas: ["Diagnóstico da fertilidade", "Limitações do solo", "Necessidade de correção", "Recomendação de manejo"],
    meta: "Interpretação baseada em normas EMBRAPA/IAC",
    comparacao: [],
  },
  {
    id: "IA-03",
    nome: "Irrigação Inteligente",
    icone: "💧",
    cor: COR_AZUL,
    desc: "Determina necessidade hídrica e otimiza o plano de irrigação por cultura e fase.",
    entradas: ["Umidade do solo", "Temperatura atual", "Previsão do tempo", "Tipo de cultura", "Fase da cultura"],
    saidas: ["Quando irrigar", "Volume recomendado (mm)", "Economia estimada (%)", "Risco hídrico"],
    meta: "Redução de 20–40% no consumo de água",
    comparacao: [],
  },
  {
    id: "IA-04",
    nome: "Nutrição Vegetal",
    icone: "🧪",
    cor: COR_TEAL,
    desc: "Identifica deficiências e excessos nutricionais com base em análise foliar e do solo.",
    entradas: ["Análise foliar", "Análise do solo", "Cultura selecionada", "Fase da planta"],
    saidas: ["Deficiência nutricional", "Excesso nutricional", "Recomendação de correção", "Plano de adubação"],
    meta: "Redução de custos com fertilizantes",
    comparacao: [],
  },
  {
    id: "IA-05",
    nome: "Previsão de Colheita",
    icone: "📊",
    cor: COR_IA,
    desc: "Estima produção, produtividade e data provável de colheita com base em histórico e clima.",
    entradas: ["Cultura e área (ha)", "Histórico de produção", "Dados climáticos", "Práticas de manejo"],
    saidas: ["Produção prevista (ton)", "Produtividade estimada (ton/ha)", "Data provável de colheita", "Faixa de risco"],
    meta: "Planejamento logístico e financeiro",
    comparacao: [],
  },
  {
    id: "IA-06",
    nome: "Assistente Agrícola",
    icone: "🤖",
    cor: COR_IA_CLARA,
    desc: "Chat inteligente especializado em agronomia para suporte ao produtor.",
    entradas: ["Dúvidas em linguagem natural", "Contexto da propriedade", "Histórico de diagnósticos"],
    saidas: ["Respostas especializadas", "Explicação de diagnósticos", "Orientação de manejo", "Práticas sustentáveis", "Interpretação de relatórios"],
    meta: "Disponível 24/7 em português",
    comparacao: [],
  },
  {
    id: "IA-07",
    nome: "Inteligência de Mercado",
    icone: "📈",
    cor: COR_VERMELHO,
    desc: "Analisa tendências de mercado e identifica janelas de venda para maximizar receita.",
    entradas: ["Cultura e região", "Histórico de preços", "Volume de produção"],
    saidas: ["Tendência de mercado", "Janela de venda ideal", "Estimativa de preço", "Oportunidades comerciais"],
    meta: "Aumento de 10–25% na receita",
    comparacao: [],
  },
];

const FLUXO_ETAPAS = [
  { etapa: "1", nome: "Usuário envia dados", desc: "Foto, análise laboratorial ou pergunta via app/web", icone: "📤", cor: COR_AZUL },
  { etapa: "2", nome: "Validação", desc: "Verificação do formato, qualidade e completude dos dados", icone: "✅", cor: COR_VERDE },
  { etapa: "3", nome: "Pré-processamento", desc: "Normalização, redimensionamento e extração de features", icone: "⚙️", cor: COR_TEAL },
  { etapa: "4", nome: "Motor de IA", desc: "Seleção do motor adequado (IA-01 a IA-07)", icone: "🧠", cor: COR_IA },
  { etapa: "5", nome: "Banco de Conhecimento", desc: "Consulta à base agronômica com 3.000+ registros", icone: "📚", cor: COR_IA_CLARA },
  { etapa: "6", nome: "Análise", desc: "Processamento e comparação com padrões conhecidos", icone: "🔍", cor: COR_LARANJA },
  { etapa: "7", nome: "Resultado", desc: "Geração do diagnóstico com nível de confiança", icone: "📋", cor: COR_VERDE },
  { etapa: "8", nome: "Recomendação", desc: "Sugestões de tratamento, manejo e prevenção", icone: "💡", cor: COR_AZUL },
  { etapa: "9", nome: "Relatório", desc: "Geração de laudo técnico em PDF para compartilhamento", icone: "📄", cor: COR_TEAL },
];

const BANCO_CONHECIMENTO = [
  { categoria: "Culturas", quantidade: "300+", icone: "🌾", cor: COR_VERDE, desc: "Culturas anuais, perenes, hortaliças, frutíferas e florestais" },
  { categoria: "Pragas", quantidade: "1.000+", icone: "🐛", cor: COR_LARANJA, desc: "Insetos, ácaros, nematoides e outros organismos nocivos" },
  { categoria: "Doenças", quantidade: "1.500+", icone: "🦠", cor: COR_VERMELHO, desc: "Fungos, bactérias, vírus e fitoplasmas por cultura" },
  { categoria: "Deficiências Nutricionais", quantidade: "500+", icone: "🧪", cor: COR_IA, desc: "Sintomas visuais e análise foliar por elemento e cultura" },
  { categoria: "Classes de Solo", quantidade: "Regional", icone: "🌱", cor: COR_TEAL, desc: "Latossolo, Argissolo, Cambissolo e outras classes brasileiras" },
  { categoria: "Dados Climáticos", quantidade: "Histórico", icone: "🌤", cor: COR_AZUL, desc: "Séries históricas de temperatura, chuva e ETP por região" },
  { categoria: "Legislação", quantidade: "Atualizada", icone: "📜", cor: COR_IA_CLARA, desc: "Normas MAPA, ANVISA, EMBRAPA e certificações orgânicas" },
];

const FAIXAS_CONFIANCA = [
  { faixa: "95–100%", nivel: "Muito Alta", cor: COR_VERDE, acao: "Resultado direto ao produtor", icone: "🟢" },
  { faixa: "85–94%", nivel: "Alta", cor: COR_TEAL, acao: "Resultado com nota de observação", icone: "🔵" },
  { faixa: "70–84%", nivel: "Moderada", cor: COR_LARANJA, acao: "Resultado com alerta de revisão", icone: "🟡" },
  { faixa: "< 70%", nivel: "Revisão Técnica", cor: COR_VERMELHO, acao: "Encaminhar para técnico especialista", icone: "🔴" },
];

const PROMPTS_BASE = [
  {
    motor: "IA-01 — Diagnóstico Visual",
    icone: "🔬",
    cor: COR_LARANJA,
    prompt: "Analise a imagem enviada da cultura informada. Identifique possíveis doenças, pragas, deficiências nutricionais ou estresses ambientais. Apresente sintomas observados, hipótese diagnóstica, nível de confiança, gravidade e recomendações sustentáveis.",
  },
  {
    motor: "IA-02 — Solo Inteligente",
    icone: "🌱",
    cor: COR_VERDE,
    prompt: "Analise os resultados laboratoriais informados. Avalie fertilidade, limitações químicas e físicas, necessidade de correção e plano de manejo recomendado para a cultura selecionada.",
  },
  {
    motor: "IA-03 — Irrigação Inteligente",
    icone: "💧",
    cor: COR_AZUL,
    prompt: "Analise os dados de umidade, clima e cultura. Determine a necessidade hídrica e proponha um plano de irrigação eficiente com volume, frequência e economia estimada.",
  },
  {
    motor: "IA-04 — Nutrição Vegetal",
    icone: "🧪",
    cor: COR_TEAL,
    prompt: "Com base na análise foliar e do solo fornecida, identifique deficiências ou excessos nutricionais para a cultura e fase informadas. Elabore um plano de adubação corretiva e de manutenção.",
  },
  {
    motor: "IA-05 — Previsão de Colheita",
    icone: "📊",
    cor: COR_IA,
    prompt: "Analise os dados históricos, climáticos e de manejo da propriedade. Estime a produção total, produtividade por hectare, data provável de colheita e faixa de risco para a cultura informada.",
  },
  {
    motor: "IA-07 — Mercado",
    icone: "📈",
    cor: COR_VERMELHO,
    prompt: "Analise as tendências de mercado para a cultura e região informadas. Identifique a janela de venda ideal, estime o preço por unidade e aponte oportunidades comerciais com base no volume de produção.",
  },
];

const GOVERNANCA = [
  { regra: "Registrar todas as análises", desc: "Cada consulta à IA é persistida no banco com timestamp e versão do modelo", icone: "📝" },
  { regra: "Armazenar versões dos modelos", desc: "Controle de versão semântico (v1.0, v1.1...) com changelog e rollback", icone: "🗂" },
  { regra: "Permitir revisão técnica", desc: "Técnicos podem revisar e corrigir diagnósticos de baixa confiança", icone: "👨‍🔬" },
  { regra: "Manter histórico de decisões", desc: "Log imutável de todas as recomendações emitidas por propriedade", icone: "📋" },
  { regra: "Registrar nível de confiança", desc: "Percentual de confiança armazenado junto ao resultado para auditoria", icone: "📊" },
  { regra: "Gerar trilha de auditoria", desc: "Audit trail completo: quem solicitou, quando, qual modelo, qual resultado", icone: "🔍" },
];

export default function ModuloIAScreen() {
  const colors = useColors();
  const router = useRouter();
  const [abaAtiva, setAbaAtiva] = useState<Aba>("motores");
  const [motorExpandido, setMotorExpandido] = useState<string | null>("IA-01");
  const [promptExpandido, setPromptExpandido] = useState<string | null>(null);

  const abas: { id: Aba; label: string }[] = [
    { id: "motores", label: "Motores" },
    { id: "fluxo", label: "Fluxo" },
    { id: "banco", label: "Banco" },
    { id: "confianca", label: "Confiança" },
    { id: "prompts", label: "Prompts" },
    { id: "governanca", label: "Governança" },
  ];

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: COR_IA }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>🧠 Módulo de IA — AFU</Text>
          <Text style={styles.headerSubtitle}>Etapa 11 · 7 Motores · 3.300+ registros · Governança</Text>
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
            style={[styles.tab, abaAtiva === aba.id && { borderBottomColor: COR_IA, borderBottomWidth: 2 }]}
            onPress={() => setAbaAtiva(aba.id)}
          >
            <Text style={[styles.tabText, { color: abaAtiva === aba.id ? COR_IA : colors.muted }]}>
              {aba.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>

        {/* ─── MOTORES ─── */}
        {abaAtiva === "motores" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: COR_IA }]}>
              <Text style={styles.infoTitle}>7 Motores Inteligentes</Text>
              <Text style={styles.infoSubtitle}>IA-01 a IA-07 · Diagnóstico · Solo · Irrigação · Nutrição · Colheita · Assistente · Mercado</Text>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              {[
                { label: "Motores", valor: "7", cor: COR_IA },
                { label: "Culturas", valor: "300+", cor: COR_VERDE },
                { label: "Doenças", valor: "1.500+", cor: COR_VERMELHO },
                { label: "Pragas", valor: "1.000+", cor: COR_LARANJA },
              ].map((s) => (
                <View key={s.label} style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.statValor, { color: s.cor }]}>{s.valor}</Text>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>{s.label}</Text>
                </View>
              ))}
            </View>

            {MOTORES.map((motor) => (
              <View key={motor.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TouchableOpacity
                  style={styles.motorHeader}
                  onPress={() => setMotorExpandido(motorExpandido === motor.id ? null : motor.id)}
                >
                  <View style={[styles.motorBadge, { backgroundColor: motor.cor }]}>
                    <Text style={styles.motorBadgeText}>{motor.id}</Text>
                  </View>
                  <View style={[styles.motorIcone, { backgroundColor: motor.cor + "20" }]}>
                    <Text style={{ fontSize: 22 }}>{motor.icone}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.motorNome, { color: motor.cor }]}>{motor.nome}</Text>
                    <Text style={[styles.motorDesc, { color: colors.muted }]} numberOfLines={1}>{motor.desc}</Text>
                  </View>
                  <Text style={{ color: colors.muted, fontSize: 16 }}>
                    {motorExpandido === motor.id ? "▲" : "▼"}
                  </Text>
                </TouchableOpacity>

                {motorExpandido === motor.id && (
                  <View style={[styles.motorBody, { borderTopColor: colors.border }]}>
                    <Text style={[styles.motorBodyDesc, { color: colors.foreground }]}>{motor.desc}</Text>

                    <View style={styles.ioRow}>
                      <View style={[styles.ioBox, { backgroundColor: COR_AZUL + "10", borderColor: COR_AZUL + "30" }]}>
                        <Text style={[styles.ioTitulo, { color: COR_AZUL }]}>📥 Entradas</Text>
                        {motor.entradas.map((e, i) => (
                          <View key={i} style={styles.ioItem}>
                            <View style={[styles.ioDot, { backgroundColor: COR_AZUL }]} />
                            <Text style={[styles.ioText, { color: colors.foreground }]}>{e}</Text>
                          </View>
                        ))}
                      </View>
                      <View style={[styles.ioBox, { backgroundColor: COR_VERDE + "10", borderColor: COR_VERDE + "30" }]}>
                        <Text style={[styles.ioTitulo, { color: COR_VERDE }]}>📤 Saídas</Text>
                        {motor.saidas.map((s, i) => (
                          <View key={i} style={styles.ioItem}>
                            <View style={[styles.ioDot, { backgroundColor: COR_VERDE }]} />
                            <Text style={[styles.ioText, { color: colors.foreground }]}>{s}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {motor.comparacao.length > 0 && (
                      <View style={[styles.comparacaoBox, { backgroundColor: motor.cor + "10", borderColor: motor.cor + "30" }]}>
                        <Text style={[styles.comparacaoTitulo, { color: motor.cor }]}>🔄 Comparação com:</Text>
                        {motor.comparacao.map((c, i) => (
                          <Text key={i} style={[styles.comparacaoItem, { color: colors.muted }]}>• {c}</Text>
                        ))}
                      </View>
                    )}

                    <View style={[styles.metaBox, { backgroundColor: motor.cor + "15", borderColor: motor.cor + "40" }]}>
                      <Text style={[styles.metaText, { color: motor.cor }]}>🎯 Meta: {motor.meta}</Text>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ─── FLUXO ─── */}
        {abaAtiva === "fluxo" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: COR_IA }]}>
              <Text style={styles.infoTitle}>Fluxo de Processamento da IA</Text>
              <Text style={styles.infoSubtitle}>9 etapas · Da entrada do usuário ao relatório final</Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 16 }]}>
              {FLUXO_ETAPAS.map((etapa, idx) => (
                <View key={idx} style={{ flexDirection: "row", gap: 12 }}>
                  {/* Linha vertical */}
                  <View style={{ alignItems: "center", width: 40 }}>
                    <View style={[styles.fluxoCirculo, { backgroundColor: etapa.cor }]}>
                      <Text style={styles.fluxoNumero}>{etapa.etapa}</Text>
                    </View>
                    {idx < FLUXO_ETAPAS.length - 1 && (
                      <View style={[styles.fluxoLinha, { backgroundColor: etapa.cor + "40" }]} />
                    )}
                  </View>
                  {/* Conteúdo */}
                  <View style={{ flex: 1, paddingBottom: idx < FLUXO_ETAPAS.length - 1 ? 16 : 0 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={{ fontSize: 18 }}>{etapa.icone}</Text>
                      <Text style={[styles.fluxoNome, { color: etapa.cor }]}>{etapa.nome}</Text>
                    </View>
                    <Text style={[styles.fluxoDesc, { color: colors.muted }]}>{etapa.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Diagrama visual */}
            <View style={[styles.card, { backgroundColor: "#0A0A1A", padding: 16 }]}>
              <Text style={{ color: "#CE93D8", fontSize: 13, fontWeight: "700", marginBottom: 12 }}>
                Diagrama de Fluxo Simplificado
              </Text>
              <View style={{ gap: 6 }}>
                {[
                  { label: "📱 App / 🌐 Web", cor: COR_AZUL },
                  { label: "⬇ API REST / tRPC", cor: "#555" },
                  { label: "🔒 Validação + Auth", cor: COR_TEAL },
                  { label: "⬇", cor: "#555" },
                  { label: "🧠 Motor de IA (IA-01 a IA-07)", cor: COR_IA },
                  { label: "⬇", cor: "#555" },
                  { label: "📚 Banco de Conhecimento", cor: COR_IA_CLARA },
                  { label: "⬇", cor: "#555" },
                  { label: "📋 Resultado + Confiança", cor: COR_VERDE },
                  { label: "⬇", cor: "#555" },
                  { label: "📄 Relatório PDF + Auditoria", cor: COR_LARANJA },
                ].map((item, idx) => (
                  <View key={idx} style={{ alignItems: "center" }}>
                    <View style={[
                      styles.diagramaBox,
                      item.label.startsWith("⬇") ? { backgroundColor: "transparent", borderWidth: 0 } : { backgroundColor: item.cor + "20", borderColor: item.cor + "50" }
                    ]}>
                      <Text style={[styles.diagramaText, { color: item.label.startsWith("⬇") ? "#555" : item.cor }]}>
                        {item.label}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── BANCO DE CONHECIMENTO ─── */}
        {abaAtiva === "banco" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: COR_IA }]}>
              <Text style={styles.infoTitle}>Banco de Conhecimento</Text>
              <Text style={styles.infoSubtitle}>3.300+ registros agronômicos · Base EMBRAPA/IAC/MAPA</Text>
            </View>

            {/* Total */}
            <View style={[styles.card, { backgroundColor: COR_IA + "10", borderColor: COR_IA + "30", padding: 16 }]}>
              <Text style={{ color: COR_IA, fontSize: 36, fontWeight: "800", textAlign: "center" }}>3.300+</Text>
              <Text style={{ color: COR_IA_CLARA, fontSize: 13, textAlign: "center", marginTop: 4 }}>
                Registros agronômicos na base de conhecimento
              </Text>
            </View>

            {BANCO_CONHECIMENTO.map((item, idx) => (
              <View key={idx} style={[styles.bancoCard, { backgroundColor: item.cor + "10", borderColor: item.cor + "30" }]}>
                <View style={[styles.bancoIcone, { backgroundColor: item.cor + "20" }]}>
                  <Text style={{ fontSize: 26 }}>{item.icone}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={[styles.bancoCategoria, { color: item.cor }]}>{item.categoria}</Text>
                    <View style={[styles.bancoBadge, { backgroundColor: item.cor }]}>
                      <Text style={styles.bancoBadgeText}>{item.quantidade}</Text>
                    </View>
                  </View>
                  <Text style={[styles.bancoDesc, { color: colors.muted }]}>{item.desc}</Text>
                </View>
              </View>
            ))}

            {/* Fontes */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Fontes de Dados</Text>
              <View style={{ gap: 8, marginTop: 12 }}>
                {[
                  { fonte: "EMBRAPA", desc: "Pesquisa agropecuária e fitossanidade" },
                  { fonte: "IAC", desc: "Instituto Agronômico de Campinas — solos e culturas" },
                  { fonte: "MAPA", desc: "Ministério da Agricultura — legislação e registros" },
                  { fonte: "INMET", desc: "Instituto Nacional de Meteorologia — clima" },
                  { fonte: "CRIA/INPA", desc: "Biodiversidade e espécies nativas" },
                ].map((f, idx) => (
                  <View key={idx} style={[styles.fonteRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <View style={[styles.fonteBadge, { backgroundColor: COR_IA }]}>
                      <Text style={styles.fonteBadgeText}>{f.fonte}</Text>
                    </View>
                    <Text style={[styles.fonteDesc, { color: colors.muted }]}>{f.desc}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── CONFIANÇA ─── */}
        {abaAtiva === "confianca" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: COR_IA }]}>
              <Text style={styles.infoTitle}>Sistema de Confiança</Text>
              <Text style={styles.infoSubtitle}>4 faixas · Ação automática por nível · Revisão técnica</Text>
            </View>

            {FAIXAS_CONFIANCA.map((faixa, idx) => (
              <View key={idx} style={[styles.confiancaCard, { backgroundColor: faixa.cor + "10", borderColor: faixa.cor + "40" }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Text style={{ fontSize: 28 }}>{faixa.icone}</Text>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={[styles.confiancaFaixa, { color: faixa.cor }]}>{faixa.faixa}</Text>
                      <View style={[styles.confiancaBadge, { backgroundColor: faixa.cor }]}>
                        <Text style={styles.confiancaBadgeText}>{faixa.nivel}</Text>
                      </View>
                    </View>
                    <Text style={[styles.confiancaAcao, { color: colors.muted }]}>{faixa.acao}</Text>
                  </View>
                </View>
              </View>
            ))}

            {/* Barra visual de confiança */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Escala Visual de Confiança</Text>
              <View style={{ marginTop: 16, gap: 8 }}>
                {[
                  { label: "Muito Alta", min: 95, max: 100, cor: COR_VERDE },
                  { label: "Alta", min: 85, max: 94, cor: COR_TEAL },
                  { label: "Moderada", min: 70, max: 84, cor: COR_LARANJA },
                  { label: "Revisão", min: 0, max: 69, cor: COR_VERMELHO },
                ].map((b, idx) => (
                  <View key={idx} style={{ gap: 4 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={[styles.barraLabel, { color: b.cor }]}>{b.label}</Text>
                      <Text style={[styles.barraRange, { color: colors.muted }]}>{b.min}–{b.max}%</Text>
                    </View>
                    <View style={[styles.barraFundo, { backgroundColor: colors.border }]}>
                      <View style={[styles.barraPreenchimento, { backgroundColor: b.cor, width: `${b.max}%` as any }]} />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Ações para baixa confiança */}
            <View style={[styles.card, { backgroundColor: COR_VERMELHO + "10", borderColor: COR_VERMELHO + "30", padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: COR_VERMELHO }]}>⚠️ Quando a Confiança for Baixa (&lt;70%)</Text>
              <View style={{ gap: 8, marginTop: 12 }}>
                {[
                  "Encaminhar automaticamente para técnico especialista",
                  "Solicitar novas fotos com melhor iluminação e ângulo",
                  "Solicitar informações adicionais sobre a cultura e sintomas",
                  "Registrar caso para revisão manual no painel administrativo",
                ].map((acao, i) => (
                  <View key={i} style={styles.acaoRow}>
                    <Text style={{ color: COR_VERMELHO, fontSize: 14 }}>→</Text>
                    <Text style={[styles.acaoText, { color: colors.foreground }]}>{acao}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── PROMPTS ─── */}
        {abaAtiva === "prompts" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: COR_IA }]}>
              <Text style={styles.infoTitle}>Prompts Base da IA</Text>
              <Text style={styles.infoSubtitle}>6 prompts especializados · Português · Agronômico</Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Sobre os Prompts</Text>
              <Text style={[styles.promptExplicacao, { color: colors.muted }]}>
                Os prompts base são instruções especializadas enviadas ao modelo de linguagem (LLM) junto com os dados do usuário. Cada motor da IA possui um prompt otimizado para o domínio agronômico específico, garantindo respostas técnicas, precisas e em português.
              </Text>
            </View>

            {PROMPTS_BASE.map((p) => (
              <View key={p.motor} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TouchableOpacity
                  style={styles.promptHeader}
                  onPress={() => setPromptExpandido(promptExpandido === p.motor ? null : p.motor)}
                >
                  <View style={[styles.promptIcone, { backgroundColor: p.cor + "20" }]}>
                    <Text style={{ fontSize: 22 }}>{p.icone}</Text>
                  </View>
                  <Text style={[styles.promptMotor, { color: p.cor, flex: 1 }]}>{p.motor}</Text>
                  <Text style={{ color: colors.muted, fontSize: 16 }}>
                    {promptExpandido === p.motor ? "▲" : "▼"}
                  </Text>
                </TouchableOpacity>
                {promptExpandido === p.motor && (
                  <View style={[styles.promptBody, { borderTopColor: colors.border, backgroundColor: "#0A0A1A" }]}>
                    <Text style={styles.promptTexto}>"{p.prompt}"</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ─── GOVERNANÇA ─── */}
        {abaAtiva === "governanca" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: COR_IA }]}>
              <Text style={styles.infoTitle}>Governança da IA</Text>
              <Text style={styles.infoSubtitle}>6 regras · Auditoria · Transparência · LGPD</Text>
            </View>

            {GOVERNANCA.map((g, idx) => (
              <View key={idx} style={[styles.govCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.govIcone, { backgroundColor: COR_IA + "20" }]}>
                  <Text style={{ fontSize: 22 }}>{g.icone}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.govRegra, { color: COR_IA }]}>{g.regra}</Text>
                  <Text style={[styles.govDesc, { color: colors.muted }]}>{g.desc}</Text>
                </View>
              </View>
            ))}

            {/* Estrutura de auditoria */}
            <View style={[styles.card, { backgroundColor: "#0A0A1A", padding: 16 }]}>
              <Text style={{ color: "#CE93D8", fontSize: 13, fontWeight: "700", marginBottom: 12 }}>
                Estrutura do Registro de Auditoria
              </Text>
              <View style={[styles.codeBlock, { backgroundColor: "#0F0F1F", borderColor: "#2A1A4A" }]}>
                {[
                  { chave: "id", valor: "uuid — identificador único" },
                  { chave: "usuarioId", valor: "FK → usuarios_afu" },
                  { chave: "motorIA", valor: '"IA-01" | "IA-02" | ... | "IA-07"' },
                  { chave: "versaoModelo", valor: '"v1.2.0"' },
                  { chave: "entrada", valor: "JSON com dados enviados" },
                  { chave: "saida", valor: "JSON com resultado gerado" },
                  { chave: "confianca", valor: "Float 0–100" },
                  { chave: "revisadoPor", valor: "FK → técnico (nullable)" },
                  { chave: "criadoEm", valor: "DateTime UTC" },
                ].map((l, i) => (
                  <Text key={i} style={styles.codeLine}>
                    {"  "}
                    <Text style={{ color: "#CE93D8" }}>{l.chave}</Text>
                    <Text style={{ color: "#fff" }}>: </Text>
                    <Text style={{ color: "#A5D6A7" }}>{l.valor}</Text>
                  </Text>
                ))}
              </View>
            </View>

            {/* LGPD */}
            <View style={[styles.card, { backgroundColor: COR_VERDE + "10", borderColor: COR_VERDE + "30", padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: COR_VERDE }]}>🔒 Conformidade LGPD</Text>
              <View style={{ gap: 8, marginTop: 12 }}>
                {[
                  "Dados de análise anonimizados para treinamento do modelo",
                  "Consentimento explícito do produtor para uso dos dados",
                  "Direito de exclusão: produtor pode apagar histórico de análises",
                  "Dados não compartilhados com terceiros sem autorização",
                ].map((item, i) => (
                  <View key={i} style={styles.lgpdRow}>
                    <Text style={{ color: COR_VERDE, fontSize: 14 }}>✓</Text>
                    <Text style={[styles.lgpdText, { color: colors.foreground }]}>{item}</Text>
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
  headerSubtitle: { color: "#CE93D8", fontSize: 11 },
  tabsContainer: { borderBottomWidth: StyleSheet.hairlineWidth },
  tabsContent: { paddingHorizontal: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 12 },
  tabText: { fontSize: 13, fontWeight: "600" },
  infoCard: { borderRadius: 12, padding: 16 },
  infoTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  infoSubtitle: { color: "#CE93D8", fontSize: 12, marginTop: 4 },
  card: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  sectionTitle: { fontSize: 14, fontWeight: "700" },
  statsRow: { flexDirection: "row", gap: 8 },
  statCard: { flex: 1, borderRadius: 10, borderWidth: 1, padding: 10, alignItems: "center" },
  statValor: { fontSize: 18, fontWeight: "800" },
  statLabel: { fontSize: 10, marginTop: 2 },
  motorHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 10 },
  motorBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  motorBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  motorIcone: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  motorNome: { fontSize: 14, fontWeight: "700" },
  motorDesc: { fontSize: 11, marginTop: 2 },
  motorBody: { borderTopWidth: StyleSheet.hairlineWidth, padding: 14, gap: 12 },
  motorBodyDesc: { fontSize: 13, lineHeight: 20 },
  ioRow: { flexDirection: "row", gap: 8 },
  ioBox: { flex: 1, borderRadius: 10, borderWidth: 1, padding: 10, gap: 6 },
  ioTitulo: { fontSize: 11, fontWeight: "700", marginBottom: 4 },
  ioItem: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  ioDot: { width: 5, height: 5, borderRadius: 3, marginTop: 6 },
  ioText: { fontSize: 11, flex: 1 },
  comparacaoBox: { borderRadius: 10, borderWidth: 1, padding: 10, gap: 4 },
  comparacaoTitulo: { fontSize: 11, fontWeight: "700", marginBottom: 4 },
  comparacaoItem: { fontSize: 11 },
  metaBox: { borderRadius: 10, borderWidth: 1, padding: 10 },
  metaText: { fontSize: 12, fontWeight: "700" },
  fluxoCirculo: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  fluxoNumero: { color: "#fff", fontSize: 12, fontWeight: "800" },
  fluxoLinha: { width: 2, flex: 1, minHeight: 16 },
  fluxoNome: { fontSize: 13, fontWeight: "700" },
  fluxoDesc: { fontSize: 11, marginTop: 2 },
  diagramaBox: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, minWidth: 200, alignItems: "center" },
  diagramaText: { fontSize: 12, fontWeight: "600" },
  bancoCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  bancoIcone: { width: 50, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  bancoCategoria: { fontSize: 13, fontWeight: "700" },
  bancoBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  bancoBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  bancoDesc: { fontSize: 11, marginTop: 4 },
  fonteRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 10, borderWidth: 1 },
  fonteBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  fonteBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  fonteDesc: { fontSize: 12, flex: 1 },
  confiancaCard: { borderRadius: 12, borderWidth: 1, padding: 14 },
  confiancaFaixa: { fontSize: 16, fontWeight: "800" },
  confiancaBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  confiancaBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  confiancaAcao: { fontSize: 12, marginTop: 4 },
  barraLabel: { fontSize: 12, fontWeight: "700" },
  barraRange: { fontSize: 11 },
  barraFundo: { height: 8, borderRadius: 4, overflow: "hidden" },
  barraPreenchimento: { height: 8, borderRadius: 4 },
  acaoRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  acaoText: { fontSize: 12, flex: 1 },
  promptExplicacao: { fontSize: 13, lineHeight: 20, marginTop: 8 },
  promptHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  promptIcone: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  promptMotor: { fontSize: 13, fontWeight: "700" },
  promptBody: { borderTopWidth: StyleSheet.hairlineWidth, padding: 14 },
  promptTexto: { color: "#CE93D8", fontSize: 12, fontFamily: "monospace", lineHeight: 20, fontStyle: "italic" },
  govCard: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  govIcone: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 2 },
  govRegra: { fontSize: 13, fontWeight: "700" },
  govDesc: { fontSize: 11, marginTop: 4 },
  codeBlock: { borderRadius: 10, borderWidth: 1, padding: 12 },
  codeLine: { color: "#fff", fontSize: 11, fontFamily: "monospace", lineHeight: 18 },
  lgpdRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  lgpdText: { fontSize: 12, flex: 1 },
});
