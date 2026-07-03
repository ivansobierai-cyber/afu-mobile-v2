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

type Aba = "tipos" | "amostras" | "indices" | "laudos" | "certificacoes" | "dashboard";

const COR_SOLO = "#795548";
const COR_AGUA = "#0277BD";
const COR_VEGETAL = "#2E7D32";
const COR_FERTILIZANTE = "#F57F17";
const COR_BIOINSUMO = "#6A1B9A";
const COR_ALIMENTO = "#C62828";
const COR_HEADER = "#1B4332";

const TIPOS_ANALISE = [
  {
    codigo: "AFU-LAB-01",
    nome: "Solo",
    icone: "🌱",
    cor: COR_SOLO,
    parametros: ["pH", "Matéria Orgânica", "CTC", "V%", "m%", "P", "K", "Ca", "Mg", "S", "Zn", "B", "Cu", "Fe", "Mn", "Al", "H+Al"],
    resultados: ["Fertilidade do solo", "Limitações identificadas", "Recomendação de correção", "Recomendação de adubação"],
    total: 17,
  },
  {
    codigo: "AFU-LAB-02",
    nome: "Água",
    icone: "💧",
    cor: COR_AGUA,
    parametros: ["pH", "Condutividade Elétrica", "TDS", "Dureza", "Turbidez", "Sódio", "Cloro", "Nitrato", "Coliformes"],
    resultados: ["Aptidão para irrigação", "Aptidão para consumo", "Aptidão para processamento"],
    total: 9,
  },
  {
    codigo: "AFU-LAB-03",
    nome: "Tecido Vegetal",
    icone: "🌿",
    cor: COR_VEGETAL,
    parametros: ["N", "P", "K", "Ca", "Mg", "S", "Zn", "B", "Cu", "Fe", "Mn"],
    resultados: ["Deficiência nutricional", "Excesso de nutrientes", "Equilíbrio nutricional"],
    total: 11,
  },
  {
    codigo: "AFU-LAB-04",
    nome: "Fertilizantes",
    icone: "🧪",
    cor: COR_FERTILIZANTE,
    parametros: ["N", "P₂O₅", "K₂O", "Umidade", "Pureza", "Granulometria"],
    resultados: ["Conformidade com rótulo", "Eficiência potencial"],
    total: 6,
  },
  {
    codigo: "AFU-LAB-05",
    nome: "Bioinsumos",
    icone: "🦠",
    cor: COR_BIOINSUMO,
    parametros: ["Carga Microbiana", "Viabilidade", "Contaminação", "Pureza"],
    resultados: ["Qualidade do produto", "Estabilidade", "Eficiência estimada"],
    total: 4,
  },
  {
    codigo: "AFU-LAB-06",
    nome: "Alimentos",
    icone: "🌾",
    cor: COR_ALIMENTO,
    parametros: ["Umidade", "Proteína", "Lipídios", "Fibras", "Cinzas", "Carboidratos", "Valor Energético"],
    resultados: ["Composição nutricional", "Qualidade alimentar", "Certificação"],
    total: 7,
  },
];

const INDICES = [
  {
    nome: "Índice de Fertilidade (IF)",
    sigla: "IF",
    cor: COR_SOLO,
    icone: "🌱",
    escala: "0 a 100",
    faixas: [
      { label: "Muito Baixa", range: "0 – 20", cor: "#C62828" },
      { label: "Baixa", range: "21 – 40", cor: "#EF6C00" },
      { label: "Média", range: "41 – 60", cor: "#F57F17" },
      { label: "Alta", range: "61 – 80", cor: "#2E7D32" },
      { label: "Muito Alta", range: "81 – 100", cor: "#1B5E20" },
    ],
    desc: "Avalia a fertilidade geral do solo com base nos parâmetros químicos analisados.",
  },
  {
    nome: "Índice Nutricional (IN)",
    sigla: "IN",
    cor: COR_VEGETAL,
    icone: "🌿",
    escala: "Equilíbrio",
    faixas: [
      { label: "Deficiente", range: "< Mínimo", cor: "#C62828" },
      { label: "Adequado", range: "Faixa ideal", cor: "#2E7D32" },
      { label: "Excessivo", range: "> Máximo", cor: "#EF6C00" },
    ],
    desc: "Avalia o equilíbrio dos macro e micronutrientes no tecido vegetal por cultura.",
  },
  {
    nome: "Índice de Qualidade da Água (IQA)",
    sigla: "IQA",
    cor: COR_AGUA,
    icone: "💧",
    escala: "5 classes",
    faixas: [
      { label: "Excelente", range: "Todos parâmetros ideais", cor: "#1B5E20" },
      { label: "Boa", range: "Parâmetros aceitáveis", cor: "#2E7D32" },
      { label: "Regular", range: "Alguns fora da faixa", cor: "#F57F17" },
      { label: "Ruim", range: "Vários fora da faixa", cor: "#EF6C00" },
      { label: "Crítica", range: "Uso não recomendado", cor: "#C62828" },
    ],
    desc: "Classifica a qualidade da água para irrigação, consumo e processamento agroindustrial.",
  },
  {
    nome: "Índice de Qualidade Alimentar (IQA-A)",
    sigla: "IQA-A",
    cor: COR_ALIMENTO,
    icone: "🌾",
    escala: "Certificação",
    faixas: [
      { label: "Aprovado", range: "Dentro dos padrões", cor: "#2E7D32" },
      { label: "Condicional", range: "Requer ajustes", cor: "#F57F17" },
      { label: "Reprovado", range: "Fora dos padrões", cor: "#C62828" },
    ],
    desc: "Utilizado para certificação de alimentos agrícolas destinados à comercialização.",
  },
];

const CERTIFICACOES = [
  { nome: "Certificado de Solo", icone: "🌱", cor: COR_SOLO, desc: "Atesta a qualidade e fertilidade do solo analisado, com recomendações técnicas de manejo" },
  { nome: "Certificado de Água", icone: "💧", cor: COR_AGUA, desc: "Confirma a aptidão da água para irrigação, consumo ou processamento agroindustrial" },
  { nome: "Certificado Nutricional", icone: "🌿", cor: COR_VEGETAL, desc: "Documenta o estado nutricional da cultura com base na análise de tecido vegetal" },
  { nome: "Certificado de Qualidade Agrícola", icone: "🏆", cor: "#F57F17", desc: "Certifica a qualidade geral da produção agrícola com base em múltiplas análises" },
  { nome: "Certificado de Sustentabilidade", icone: "♻️", cor: "#00695C", desc: "Atesta práticas sustentáveis de produção com base em indicadores ambientais e agronômicos" },
];

export default function AnalisesLabScreen() {
  const colors = useColors();
  const router = useRouter();
  const [abaAtiva, setAbaAtiva] = useState<Aba>("tipos");
  const [tipoExpandido, setTipoExpandido] = useState<string | null>("AFU-LAB-01");
  const [indiceExpandido, setIndiceExpandido] = useState<string | null>("IF");

  const abas: { id: Aba; label: string }[] = [
    { id: "tipos", label: "Tipos" },
    { id: "amostras", label: "Amostras" },
    { id: "indices", label: "Índices" },
    { id: "laudos", label: "Laudos" },
    { id: "certificacoes", label: "Certificações" },
    { id: "dashboard", label: "Dashboard" },
  ];

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: COR_HEADER }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>🔬 Análises Laboratoriais</Text>
          <Text style={styles.headerSubtitle}>Etapa 14 · Solo · Água · Tecido Vegetal · Fertilizantes · Bioinsumos · Alimentos</Text>
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
            style={[styles.tab, abaAtiva === aba.id && { borderBottomColor: COR_HEADER, borderBottomWidth: 2 }]}
            onPress={() => setAbaAtiva(aba.id)}
          >
            <Text style={[styles.tabText, { color: abaAtiva === aba.id ? COR_HEADER : colors.muted }]}>
              {aba.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>

        {/* ─── TIPOS ─── */}
        {abaAtiva === "tipos" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: COR_HEADER }]}>
              <Text style={styles.infoTitle}>6 Tipos de Análise Laboratorial</Text>
              <Text style={styles.infoSubtitle}>Solo · Água · Tecido Vegetal · Fertilizantes · Bioinsumos · Alimentos</Text>
            </View>

            {/* Grid de tipos */}
            <View style={styles.tiposGrid}>
              {TIPOS_ANALISE.map((t) => (
                <View key={t.codigo} style={[styles.tipoMiniCard, { backgroundColor: t.cor + "10", borderColor: t.cor + "30" }]}>
                  <Text style={{ fontSize: 28, textAlign: "center" }}>{t.icone}</Text>
                  <Text style={[styles.tipoMiniCodigo, { color: t.cor }]}>{t.codigo}</Text>
                  <Text style={[styles.tipoMiniNome, { color: colors.foreground }]}>{t.nome}</Text>
                  <Text style={[styles.tipoMiniTotal, { color: colors.muted }]}>{t.total} parâm.</Text>
                </View>
              ))}
            </View>

            {/* Expandíveis */}
            {TIPOS_ANALISE.map((tipo) => (
              <View key={tipo.codigo} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TouchableOpacity
                  style={styles.tipoHeader}
                  onPress={() => setTipoExpandido(tipoExpandido === tipo.codigo ? null : tipo.codigo)}
                >
                  <View style={[styles.tipoIcone, { backgroundColor: tipo.cor + "20" }]}>
                    <Text style={{ fontSize: 24 }}>{tipo.icone}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <View style={[styles.codigoBadge, { backgroundColor: tipo.cor }]}>
                        <Text style={styles.codigoBadgeText}>{tipo.codigo}</Text>
                      </View>
                    </View>
                    <Text style={[styles.tipoNome, { color: tipo.cor }]}>{tipo.nome}</Text>
                    <Text style={[styles.tipoTotal, { color: colors.muted }]}>{tipo.total} parâmetros analisados</Text>
                  </View>
                  <Text style={{ color: colors.muted, fontSize: 16 }}>
                    {tipoExpandido === tipo.codigo ? "▲" : "▼"}
                  </Text>
                </TouchableOpacity>

                {tipoExpandido === tipo.codigo && (
                  <View style={[styles.tipoBody, { borderTopColor: colors.border }]}>
                    <Text style={[styles.tipoSubtitle, { color: colors.muted }]}>Parâmetros:</Text>
                    <View style={styles.parametrosGrid}>
                      {tipo.parametros.map((p, i) => (
                        <View key={i} style={[styles.parametroChip, { backgroundColor: tipo.cor + "15", borderColor: tipo.cor + "30" }]}>
                          <Text style={[styles.parametroText, { color: tipo.cor }]}>{p}</Text>
                        </View>
                      ))}
                    </View>
                    <Text style={[styles.tipoSubtitle, { color: colors.muted, marginTop: 12 }]}>Resultados gerados:</Text>
                    {tipo.resultados.map((r, i) => (
                      <View key={i} style={styles.resultadoRow}>
                        <View style={[styles.resultadoDot, { backgroundColor: tipo.cor }]} />
                        <Text style={[styles.resultadoText, { color: colors.foreground }]}>{r}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}

            {/* Fluxo geral */}
            <View style={[styles.card, { backgroundColor: "#0A0A1A", padding: 16 }]}>
              <Text style={{ color: "#A5D6A7", fontSize: 13, fontWeight: "700", marginBottom: 12 }}>
                Fluxo Laboratorial
              </Text>
              <View style={{ gap: 4, alignItems: "center" }}>
                {[
                  { label: "🧺 Coleta da Amostra", cor: COR_SOLO },
                  { label: "⬇", cor: "#555" },
                  { label: "📦 Recebimento no Laboratório", cor: "#455A64" },
                  { label: "⬇", cor: "#555" },
                  { label: "📝 Registro + QR Code + ID Único", cor: COR_AGUA },
                  { label: "⬇", cor: "#555" },
                  { label: "🔬 Análise Laboratorial", cor: COR_VEGETAL },
                  { label: "⬇", cor: "#555" },
                  { label: "✅ Validação Técnica", cor: "#00695C" },
                  { label: "⬇", cor: "#555" },
                  { label: "🧠 Interpretação por IA", cor: "#6A1B9A" },
                  { label: "⬇", cor: "#555" },
                  { label: "📄 Laudo Técnico (PDF/HTML/JSON)", cor: COR_FERTILIZANTE },
                  { label: "⬇", cor: "#555" },
                  { label: "🏆 Certificação AFU", cor: "#F57F17" },
                  { label: "⬇", cor: "#555" },
                  { label: "📁 Histórico Permanente", cor: "#1565C0" },
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

        {/* ─── AMOSTRAS ─── */}
        {abaAtiva === "amostras" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: COR_HEADER }]}>
              <Text style={styles.infoTitle}>Cadastro e Rastreabilidade</Text>
              <Text style={styles.infoSubtitle}>QR Code · ID único · Histórico completo · Assinatura digital</Text>
            </View>

            {/* Campos de cadastro */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>📋 Campos do Cadastro</Text>
              <View style={{ gap: 8, marginTop: 12 }}>
                {[
                  { campo: "Código", exemplo: "AFU-SOLO-2026-000001", obrigatorio: true, cor: COR_SOLO },
                  { campo: "Produtor", exemplo: "João Silva", obrigatorio: true, cor: COR_AGUA },
                  { campo: "Propriedade", exemplo: "Fazenda Boa Vista", obrigatorio: true, cor: COR_VEGETAL },
                  { campo: "Cultura", exemplo: "Soja — Variedade BRS 360", obrigatorio: true, cor: COR_FERTILIZANTE },
                  { campo: "Tipo de Amostra", exemplo: "Solo / Água / Tecido Vegetal", obrigatorio: true, cor: COR_BIOINSUMO },
                  { campo: "Local da Coleta", exemplo: "Talhão 3 — Setor Norte", obrigatorio: true, cor: COR_ALIMENTO },
                  { campo: "Data da Coleta", exemplo: "13/06/2026", obrigatorio: true, cor: "#455A64" },
                  { campo: "Responsável", exemplo: "Eng. Agr. Maria Santos — CREA 12345", obrigatorio: true, cor: "#1565C0" },
                  { campo: "Observações", exemplo: "Coleta após chuva de 20mm", obrigatorio: false, cor: "#6A1B9A" },
                ].map((c, i) => (
                  <View key={i} style={[styles.campoRow, { backgroundColor: c.cor + "08", borderColor: c.cor + "20" }]}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={[styles.campoNome, { color: c.cor }]}>{c.campo}</Text>
                        {c.obrigatorio && (
                          <View style={[styles.obrigBadge, { backgroundColor: c.cor + "20" }]}>
                            <Text style={[styles.obrigText, { color: c.cor }]}>Obrigatório</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.campoExemplo, { color: colors.muted }]}>Ex: {c.exemplo}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Exemplo de código */}
            <View style={[styles.card, { backgroundColor: "#0A0A1A", padding: 16 }]}>
              <Text style={{ color: "#A5D6A7", fontSize: 13, fontWeight: "700", marginBottom: 12 }}>
                Formato do Código de Rastreabilidade
              </Text>
              <Text style={styles.jsonCode}>{`AFU-SOLO-2026-000001
AFU-AGUA-2026-000042
AFU-VEGETAL-2026-000103
AFU-FERTILIZANTE-2026-000007
AFU-BIOINSUMO-2026-000015
AFU-ALIMENTO-2026-000089`}</Text>
              <Text style={{ color: "#90CAF9", fontSize: 11, marginTop: 12 }}>
                Formato: AFU-[TIPO]-[ANO]-[SEQUENCIAL 6 dígitos]
              </Text>
            </View>

            {/* Rastreabilidade */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>🔍 Rastreabilidade</Text>
              <View style={styles.rastreGrid}>
                {[
                  { item: "QR Code", desc: "Gerado automaticamente para cada amostra", icone: "📱", cor: COR_AGUA },
                  { item: "ID Único", desc: "Identificador imutável no banco de dados", icone: "🔑", cor: COR_SOLO },
                  { item: "Histórico Completo", desc: "Todas as etapas registradas com timestamp", icone: "📁", cor: COR_VEGETAL },
                  { item: "Assinatura Digital", desc: "Valida autenticidade do laudo emitido", icone: "✍️", cor: COR_FERTILIZANTE },
                ].map((r, i) => (
                  <View key={i} style={[styles.rastreCard, { backgroundColor: r.cor + "10", borderColor: r.cor + "30" }]}>
                    <Text style={{ fontSize: 28, textAlign: "center" }}>{r.icone}</Text>
                    <Text style={[styles.rastreNome, { color: r.cor }]}>{r.item}</Text>
                    <Text style={[styles.rastreDesc, { color: colors.muted }]}>{r.desc}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Auditoria */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>📊 Registro de Auditoria</Text>
              <Text style={[styles.sectionDesc, { color: colors.muted }]}>Campos obrigatórios para cada análise realizada:</Text>
              <View style={{ gap: 8, marginTop: 12 }}>
                {["Operador responsável", "Equipamento utilizado", "Método analítico", "Data e hora", "Resultado bruto", "Validação técnica"].map((a, i) => (
                  <View key={i} style={styles.auditRow}>
                    <View style={[styles.auditDot, { backgroundColor: COR_HEADER }]} />
                    <Text style={[styles.auditText, { color: colors.foreground }]}>{a}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── ÍNDICES ─── */}
        {abaAtiva === "indices" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: COR_HEADER }]}>
              <Text style={styles.infoTitle}>Índices Automáticos</Text>
              <Text style={styles.infoSubtitle}>IF · IN · IQA · IQA-A · Calculados automaticamente pela IA</Text>
            </View>

            {INDICES.map((indice) => (
              <View key={indice.sigla} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TouchableOpacity
                  style={styles.indiceHeader}
                  onPress={() => setIndiceExpandido(indiceExpandido === indice.sigla ? null : indice.sigla)}
                >
                  <View style={[styles.indiceSigla, { backgroundColor: indice.cor }]}>
                    <Text style={styles.indiceSiglaText}>{indice.sigla}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.indiceNome, { color: indice.cor }]}>{indice.nome}</Text>
                    <Text style={[styles.indiceEscala, { color: colors.muted }]}>Escala: {indice.escala}</Text>
                  </View>
                  <Text style={{ color: colors.muted, fontSize: 16 }}>
                    {indiceExpandido === indice.sigla ? "▲" : "▼"}
                  </Text>
                </TouchableOpacity>

                {indiceExpandido === indice.sigla && (
                  <View style={[styles.indiceBody, { borderTopColor: colors.border }]}>
                    <Text style={[styles.indiceDesc, { color: colors.muted }]}>{indice.desc}</Text>
                    <View style={{ gap: 8, marginTop: 12 }}>
                      {indice.faixas.map((f, i) => (
                        <View key={i} style={[styles.faixaRow, { backgroundColor: f.cor + "10", borderColor: f.cor + "30", borderLeftColor: f.cor, borderLeftWidth: 4 }]}>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.faixaLabel, { color: f.cor }]}>{f.label}</Text>
                            <Text style={[styles.faixaRange, { color: colors.muted }]}>{f.range}</Text>
                          </View>
                          <View style={[styles.faixaIndicador, { backgroundColor: f.cor }]} />
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            ))}

            {/* Motor de interpretação */}
            <View style={[styles.card, { backgroundColor: "#6A1B9A" + "10", borderColor: "#6A1B9A" + "30", padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: "#6A1B9A" }]}>🧠 Motor de Interpretação IA</Text>
              <Text style={[styles.sectionDesc, { color: colors.muted }]}>
                A IA combina múltiplas fontes para gerar diagnóstico técnico completo:
              </Text>
              <View style={{ gap: 8, marginTop: 12 }}>
                {[
                  { fonte: "Resultados laboratoriais", icone: "🔬" },
                  { fonte: "Cultura e variedade", icone: "🌾" },
                  { fonte: "Região e tipo de solo", icone: "🗺" },
                  { fonte: "Dados climáticos", icone: "🌤" },
                  { fonte: "Histórico da propriedade", icone: "📁" },
                ].map((f, i) => (
                  <View key={i} style={[styles.fonteRow, { backgroundColor: "#6A1B9A" + "08" }]}>
                    <Text style={{ fontSize: 18 }}>{f.icone}</Text>
                    <Text style={[styles.fonteText, { color: colors.foreground }]}>{f.fonte}</Text>
                  </View>
                ))}
              </View>
              <View style={{ marginTop: 12, gap: 8 }}>
                <Text style={[styles.tipoSubtitle, { color: "#6A1B9A" }]}>Gera automaticamente:</Text>
                {["Diagnóstico técnico detalhado", "Recomendação agronômica", "Plano de correção", "Plano de manejo"].map((g, i) => (
                  <View key={i} style={styles.resultadoRow}>
                    <View style={[styles.resultadoDot, { backgroundColor: "#6A1B9A" }]} />
                    <Text style={[styles.resultadoText, { color: colors.foreground }]}>{g}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Banco de referência */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>📚 Banco de Referência</Text>
              <Text style={[styles.sectionDesc, { color: colors.muted }]}>
                Faixas de referência armazenadas para comparação automática:
              </Text>
              <View style={styles.referenciaGrid}>
                {[
                  { item: "Culturas", total: "300+", cor: COR_VEGETAL, icone: "🌾" },
                  { item: "Solos", total: "50+", cor: COR_SOLO, icone: "🌱" },
                  { item: "Águas", total: "30+", cor: COR_AGUA, icone: "💧" },
                  { item: "Alimentos", total: "200+", cor: COR_ALIMENTO, icone: "🍎" },
                  { item: "Fertilizantes", total: "500+", cor: COR_FERTILIZANTE, icone: "🧪" },
                ].map((r, i) => (
                  <View key={i} style={[styles.referenciaCard, { backgroundColor: r.cor + "10", borderColor: r.cor + "30" }]}>
                    <Text style={{ fontSize: 24, textAlign: "center" }}>{r.icone}</Text>
                    <Text style={[styles.referenciaNome, { color: r.cor }]}>{r.item}</Text>
                    <Text style={[styles.referenciaTotal, { color: colors.muted }]}>{r.total}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── LAUDOS ─── */}
        {abaAtiva === "laudos" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: COR_HEADER }]}>
              <Text style={styles.infoTitle}>Geração de Laudos</Text>
              <Text style={styles.infoSubtitle}>PDF · PDF Assinado · HTML · JSON · Assinatura Digital</Text>
            </View>

            {/* Formatos */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>📄 Formatos de Saída</Text>
              <View style={styles.formatosGrid}>
                {[
                  { formato: "PDF", desc: "Laudo padrão para impressão e arquivamento", icone: "📕", cor: COR_ALIMENTO },
                  { formato: "PDF Assinado", desc: "Com assinatura digital válida juridicamente", icone: "✍️", cor: COR_HEADER },
                  { formato: "HTML", desc: "Visualização online responsiva", icone: "🌐", cor: COR_AGUA },
                  { formato: "JSON", desc: "Integração com sistemas externos via API", icone: "{ }", cor: "#455A64" },
                ].map((f, i) => (
                  <View key={i} style={[styles.formatoCard, { backgroundColor: f.cor + "10", borderColor: f.cor + "30" }]}>
                    <Text style={{ fontSize: 28, textAlign: "center" }}>{f.icone}</Text>
                    <Text style={[styles.formatoNome, { color: f.cor }]}>{f.formato}</Text>
                    <Text style={[styles.formatoDesc, { color: colors.muted }]}>{f.desc}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Conteúdo do laudo */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>📋 Conteúdo do Laudo</Text>
              <View style={{ gap: 8, marginTop: 12 }}>
                {[
                  { item: "Identificação da amostra", icone: "🔖", cor: COR_SOLO },
                  { item: "Resultados analíticos completos", icone: "📊", cor: COR_AGUA },
                  { item: "Interpretação técnica pela IA", icone: "🧠", cor: "#6A1B9A" },
                  { item: "Gráficos comparativos", icone: "📈", cor: COR_VEGETAL },
                  { item: "Recomendações agronômicas", icone: "✅", cor: COR_HEADER },
                  { item: "Assinatura digital do técnico", icone: "✍️", cor: COR_FERTILIZANTE },
                ].map((c, i) => (
                  <View key={i} style={[styles.laudoItem, { borderBottomColor: colors.border }]}>
                    <Text style={{ fontSize: 20 }}>{c.icone}</Text>
                    <Text style={[styles.laudoText, { color: colors.foreground }]}>{c.item}</Text>
                    <View style={[styles.laudoBadge, { backgroundColor: c.cor + "20" }]}>
                      <Text style={[styles.laudoBadgeText, { color: c.cor }]}>✓</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Integração com módulos */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>🔗 Integração com Módulos</Text>
              <View style={{ gap: 10, marginTop: 12 }}>
                {[
                  { modulo: "IA", desc: "Recebe resultados para interpretação automática", cor: "#6A1B9A", icone: "🧠" },
                  { modulo: "Diagnóstico Visual", desc: "Combina imagem + análise laboratorial para maior precisão", cor: "#1A237E", icone: "🔬" },
                  { modulo: "Marketplace", desc: "Permite exibir certificações nos produtos à venda", cor: "#EF6C00", icone: "🛒" },
                  { modulo: "Relatórios", desc: "Inclui laudos automaticamente nos relatórios técnicos", cor: "#2D6A4F", icone: "📄" },
                  { modulo: "Sensores", desc: "Compara dados de campo com dados laboratoriais", cor: "#0277BD", icone: "📡" },
                ].map((m, i) => (
                  <View key={i} style={[styles.integracaoRow, { backgroundColor: m.cor + "08", borderColor: m.cor + "20" }]}>
                    <Text style={{ fontSize: 20 }}>{m.icone}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.integracaoModulo, { color: m.cor }]}>{m.modulo}</Text>
                      <Text style={[styles.integracaoDesc, { color: colors.muted }]}>{m.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── CERTIFICAÇÕES ─── */}
        {abaAtiva === "certificacoes" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: COR_HEADER }]}>
              <Text style={styles.infoTitle}>Certificações AFU</Text>
              <Text style={styles.infoSubtitle}>5 tipos de certificado · Solo · Água · Nutricional · Qualidade · Sustentabilidade</Text>
            </View>

            {CERTIFICACOES.map((cert, i) => (
              <View key={i} style={[styles.certCard, { backgroundColor: cert.cor + "10", borderColor: cert.cor + "30", borderLeftWidth: 4, borderLeftColor: cert.cor }]}>
                <View style={styles.certHeader}>
                  <Text style={{ fontSize: 32 }}>{cert.icone}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.certNome, { color: cert.cor }]}>{cert.nome}</Text>
                    <Text style={[styles.certDesc, { color: colors.muted }]}>{cert.desc}</Text>
                  </View>
                </View>
              </View>
            ))}

            {/* Integração com laboratórios */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>🔬 Integração com Laboratórios</Text>
              <View style={{ gap: 10, marginTop: 12 }}>
                {[
                  { tipo: "Manual", desc: "Técnico insere resultados diretamente no sistema", icone: "✍️", cor: "#455A64" },
                  { tipo: "CSV", desc: "Importação de planilhas com resultados laboratoriais", icone: "📊", cor: COR_AGUA },
                  { tipo: "API", desc: "Integração direta com sistemas de laboratórios parceiros", icone: "🔌", cor: COR_VEGETAL },
                ].map((t, i) => (
                  <View key={i} style={[styles.integTipoRow, { backgroundColor: t.cor + "10", borderColor: t.cor + "30" }]}>
                    <View style={[styles.integTipoIcone, { backgroundColor: t.cor }]}>
                      <Text style={{ fontSize: 18 }}>{t.icone}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.integTipoNome, { color: t.cor }]}>{t.tipo}</Text>
                      <Text style={[styles.integTipoDesc, { color: colors.muted }]}>{t.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── DASHBOARD ─── */}
        {abaAtiva === "dashboard" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: COR_HEADER }]}>
              <Text style={styles.infoTitle}>Dashboard Laboratorial</Text>
              <Text style={styles.infoSubtitle}>Indicadores em tempo real · Amostras · Laudos · Tempo médio · Conformidade</Text>
            </View>

            {/* KPIs */}
            <View style={styles.kpiGrid}>
              {[
                { label: "Amostras Recebidas", valor: "247", cor: COR_AGUA, icone: "📦" },
                { label: "Em Análise", valor: "38", cor: COR_FERTILIZANTE, icone: "🔬" },
                { label: "Laudos Emitidos", valor: "189", cor: COR_VEGETAL, icone: "📄" },
                { label: "Não Conformidades", valor: "12", cor: COR_ALIMENTO, icone: "⚠️" },
                { label: "Tempo Médio", valor: "2.4d", cor: COR_BIOINSUMO, icone: "⏱" },
                { label: "Taxa de Aprovação", valor: "94.7%", cor: COR_HEADER, icone: "✅" },
              ].map((kpi, i) => (
                <View key={i} style={[styles.kpiCard, { backgroundColor: kpi.cor + "10", borderColor: kpi.cor + "30" }]}>
                  <Text style={{ fontSize: 22, textAlign: "center" }}>{kpi.icone}</Text>
                  <Text style={[styles.kpiValor, { color: kpi.cor }]}>{kpi.valor}</Text>
                  <Text style={[styles.kpiLabel, { color: colors.muted }]}>{kpi.label}</Text>
                </View>
              ))}
            </View>

            {/* Distribuição por tipo */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Distribuição por Tipo de Análise</Text>
              <View style={{ gap: 10, marginTop: 12 }}>
                {[
                  { tipo: "Solo", total: 98, percentual: 40, cor: COR_SOLO },
                  { tipo: "Água", total: 49, percentual: 20, cor: COR_AGUA },
                  { tipo: "Tecido Vegetal", total: 61, percentual: 25, cor: COR_VEGETAL },
                  { tipo: "Fertilizantes", total: 24, percentual: 10, cor: COR_FERTILIZANTE },
                  { tipo: "Bioinsumos", total: 10, percentual: 4, cor: COR_BIOINSUMO },
                  { tipo: "Alimentos", total: 5, percentual: 2, cor: COR_ALIMENTO },
                ].map((d, i) => (
                  <View key={i} style={{ gap: 4 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={[styles.distTipo, { color: colors.foreground }]}>{d.tipo}</Text>
                      <Text style={[styles.distTotal, { color: d.cor }]}>{d.total} amostras ({d.percentual}%)</Text>
                    </View>
                    <View style={[styles.barraFundo, { backgroundColor: colors.border }]}>
                      <View style={[styles.barraPreenchimento, { backgroundColor: d.cor, width: `${d.percentual}%` as any }]} />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Status das amostras */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Status das Amostras</Text>
              <View style={{ gap: 8, marginTop: 12 }}>
                {[
                  { status: "Aguardando Coleta", total: 15, cor: "#9E9E9E" },
                  { status: "Em Trânsito", total: 8, cor: COR_AGUA },
                  { status: "Recebida no Lab", total: 22, cor: COR_FERTILIZANTE },
                  { status: "Em Análise", total: 38, cor: "#6A1B9A" },
                  { status: "Aguardando Validação", total: 14, cor: "#F57F17" },
                  { status: "Laudo Emitido", total: 189, cor: COR_VEGETAL },
                  { status: "Certificado Emitido", total: 87, cor: COR_HEADER },
                ].map((s, i) => (
                  <View key={i} style={[styles.statusRow, { borderBottomColor: colors.border }]}>
                    <View style={[styles.statusDot, { backgroundColor: s.cor }]} />
                    <Text style={[styles.statusNome, { color: colors.foreground }]}>{s.status}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: s.cor + "20" }]}>
                      <Text style={[styles.statusTotal, { color: s.cor }]}>{s.total}</Text>
                    </View>
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
  headerSubtitle: { color: "#A5D6A7", fontSize: 11 },
  tabsContainer: { borderBottomWidth: StyleSheet.hairlineWidth },
  tabsContent: { paddingHorizontal: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 12 },
  tabText: { fontSize: 13, fontWeight: "600" },
  infoCard: { borderRadius: 12, padding: 16 },
  infoTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  infoSubtitle: { color: "#A5D6A7", fontSize: 12, marginTop: 4 },
  card: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  sectionTitle: { fontSize: 14, fontWeight: "700" },
  sectionDesc: { fontSize: 12, marginTop: 4 },
  tiposGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tipoMiniCard: { borderRadius: 12, borderWidth: 1, padding: 10, width: "31%", alignItems: "center", gap: 4 },
  tipoMiniCodigo: { fontSize: 9, fontWeight: "800" },
  tipoMiniNome: { fontSize: 11, fontWeight: "700", textAlign: "center" },
  tipoMiniTotal: { fontSize: 10 },
  tipoHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 10 },
  tipoIcone: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  codigoBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  codigoBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  tipoNome: { fontSize: 14, fontWeight: "700", marginTop: 2 },
  tipoTotal: { fontSize: 11 },
  tipoBody: { borderTopWidth: StyleSheet.hairlineWidth, padding: 14, gap: 8 },
  tipoSubtitle: { fontSize: 12, fontWeight: "600" },
  parametrosGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  parametroChip: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  parametroText: { fontSize: 11, fontWeight: "600" },
  resultadoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  resultadoDot: { width: 6, height: 6, borderRadius: 3 },
  resultadoText: { fontSize: 12 },
  diagramaBox: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, minWidth: 220, alignItems: "center", marginVertical: 1 },
  diagramaText: { fontSize: 12, fontWeight: "600" },
  campoRow: { borderRadius: 10, borderWidth: 1, padding: 10 },
  campoNome: { fontSize: 13, fontWeight: "700" },
  obrigBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  obrigText: { fontSize: 10, fontWeight: "700" },
  campoExemplo: { fontSize: 11, marginTop: 2 },
  jsonCode: { color: "#A5D6A7", fontSize: 11, fontFamily: "monospace", lineHeight: 20 },
  rastreGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  rastreCard: { borderRadius: 10, borderWidth: 1, padding: 10, width: "48%", gap: 4 },
  rastreNome: { fontSize: 12, fontWeight: "700", textAlign: "center" },
  rastreDesc: { fontSize: 10, textAlign: "center" },
  auditRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  auditDot: { width: 6, height: 6, borderRadius: 3 },
  auditText: { fontSize: 12 },
  indiceHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 10 },
  indiceSigla: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  indiceSiglaText: { color: "#fff", fontSize: 13, fontWeight: "900" },
  indiceNome: { fontSize: 13, fontWeight: "700" },
  indiceEscala: { fontSize: 11, marginTop: 2 },
  indiceBody: { borderTopWidth: StyleSheet.hairlineWidth, padding: 14, gap: 8 },
  indiceDesc: { fontSize: 12 },
  faixaRow: { borderRadius: 8, borderWidth: 1, padding: 10, flexDirection: "row", alignItems: "center" },
  faixaLabel: { fontSize: 13, fontWeight: "700" },
  faixaRange: { fontSize: 11 },
  faixaIndicador: { width: 12, height: 12, borderRadius: 6 },
  fonteRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 8, borderRadius: 8 },
  fonteText: { fontSize: 13 },
  referenciaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  referenciaCard: { borderRadius: 10, borderWidth: 1, padding: 10, width: "31%", alignItems: "center", gap: 4 },
  referenciaNome: { fontSize: 11, fontWeight: "700", textAlign: "center" },
  referenciaTotal: { fontSize: 12, fontWeight: "800" },
  formatosGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  formatoCard: { borderRadius: 10, borderWidth: 1, padding: 10, width: "48%", gap: 4 },
  formatoNome: { fontSize: 13, fontWeight: "700", textAlign: "center" },
  formatoDesc: { fontSize: 10, textAlign: "center" },
  laudoItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  laudoText: { flex: 1, fontSize: 13 },
  laudoBadge: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  laudoBadgeText: { fontSize: 12, fontWeight: "800" },
  integracaoRow: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 10, borderWidth: 1, padding: 10 },
  integracaoModulo: { fontSize: 13, fontWeight: "700" },
  integracaoDesc: { fontSize: 11 },
  certCard: { borderRadius: 12, borderWidth: 1, padding: 14 },
  certHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  certNome: { fontSize: 15, fontWeight: "700" },
  certDesc: { fontSize: 12, marginTop: 4 },
  integTipoRow: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 10, borderWidth: 1, padding: 12 },
  integTipoIcone: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  integTipoNome: { fontSize: 14, fontWeight: "700" },
  integTipoDesc: { fontSize: 11 },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  kpiCard: { borderRadius: 12, borderWidth: 1, padding: 12, width: "31%", alignItems: "center", gap: 4 },
  kpiValor: { fontSize: 20, fontWeight: "900", textAlign: "center" },
  kpiLabel: { fontSize: 9, textAlign: "center" },
  distTipo: { fontSize: 13, fontWeight: "600" },
  distTotal: { fontSize: 12, fontWeight: "700" },
  barraFundo: { height: 8, borderRadius: 4, overflow: "hidden" },
  barraPreenchimento: { height: "100%", borderRadius: 4 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusNome: { flex: 1, fontSize: 13 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  statusTotal: { fontSize: 13, fontWeight: "800" },
});
