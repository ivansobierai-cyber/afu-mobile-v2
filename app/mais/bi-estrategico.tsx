import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";

// ─── Data ────────────────────────────────────────────────────────────────────

const DASHBOARDS = [
  {
    id: "executivo",
    nome: "Dashboard Executivo",
    icon: "chart.bar.fill",
    cor: "#1565C0",
    descricao: "Visão geral da plataforma para gestores e investidores",
    kpis: [
      { label: "Produtores Ativos", valor: "12.450", variacao: "+8%", positivo: true },
      { label: "Propriedades Cadastradas", valor: "34.780", variacao: "+12%", positivo: true },
      { label: "Culturas Monitoradas", valor: "89.230", variacao: "+15%", positivo: true },
      { label: "Diagnósticos Realizados", valor: "156.890", variacao: "+22%", positivo: true },
      { label: "Análises Laboratoriais", valor: "45.670", variacao: "+18%", positivo: true },
      { label: "Receita Marketplace", valor: "R$ 4,2M", variacao: "+35%", positivo: true },
      { label: "Cursos Concluídos", valor: "78.340", variacao: "+45%", positivo: true },
      { label: "Sensores Ativos", valor: "23.450", variacao: "+28%", positivo: true },
    ],
  },
  {
    id: "agronomico",
    nome: "Dashboard Agronômico",
    icon: "leaf.fill",
    cor: "#2E7D32",
    descricao: "Indicadores de saúde vegetal, solo e produtividade",
    kpis: [
      { label: "Fertilidade Média do Solo", valor: "72%", variacao: "+3%", positivo: true },
      { label: "Deficiências Nutricionais", valor: "1.234 casos", variacao: "-8%", positivo: true },
      { label: "Pragas Mais Frequentes", valor: "Mosca-branca", variacao: "Top 1", positivo: false },
      { label: "Doenças Mais Frequentes", valor: "Ferrugem", variacao: "Top 1", positivo: false },
      { label: "Produtividade Média", valor: "4,8 t/ha", variacao: "+6%", positivo: true },
      { label: "Uso de Irrigação", valor: "67% das prop.", variacao: "+4%", positivo: true },
    ],
    graficos: ["Linha (produtividade mensal)", "Barras (pragas por região)", "Radar (fertilidade NPK)", "Mapa de calor (doenças)"],
  },
  {
    id: "laboratorial",
    nome: "Dashboard Laboratorial",
    icon: "flask.fill",
    cor: "#6A1B9A",
    descricao: "Controle de qualidade e rastreabilidade laboratorial",
    kpis: [
      { label: "Amostras Recebidas", valor: "8.920", variacao: "+14%", positivo: true },
      { label: "Laudos Emitidos", valor: "8.456", variacao: "+12%", positivo: true },
      { label: "Tempo Médio de Análise", valor: "2,3 dias", variacao: "-0,5d", positivo: true },
      { label: "Conformidade", valor: "97,8%", variacao: "+1,2%", positivo: true },
      { label: "Certificados Emitidos", valor: "3.450", variacao: "+20%", positivo: true },
    ],
  },
  {
    id: "iot",
    nome: "Dashboard IoT",
    icon: "antenna.radiowaves.left.and.right",
    cor: "#E65100",
    descricao: "Monitoramento em tempo real de sensores e equipamentos",
    kpis: [
      { label: "Umidade Média do Solo", valor: "42%", variacao: "Normal", positivo: true },
      { label: "Temperatura Média", valor: "24°C", variacao: "Normal", positivo: true },
      { label: "pH Médio do Solo", valor: "6,2", variacao: "Ideal", positivo: true },
      { label: "Sistemas de Irrigação", valor: "1.234 ativos", variacao: "+8%", positivo: true },
      { label: "Alertas Ativos", valor: "23", variacao: "-15%", positivo: true },
    ],
    visualizacoes: ["Mapas de sensores", "Gráficos de séries temporais", "Painéis em tempo real"],
  },
  {
    id: "marketplace",
    nome: "Dashboard Marketplace",
    icon: "cart.fill",
    cor: "#1B4332",
    descricao: "Performance comercial e inteligência de mercado",
    kpis: [
      { label: "Volume Vendido", valor: "45.670 ton", variacao: "+28%", positivo: true },
      { label: "Receita Total", valor: "R$ 4,2M", variacao: "+35%", positivo: true },
      { label: "Produto Mais Vendido", valor: "Soja Orgânica", variacao: "Top 1", positivo: true },
      { label: "Compradores Ativos", valor: "3.456", variacao: "+22%", positivo: true },
      { label: "Ticket Médio", valor: "R$ 1.215", variacao: "+8%", positivo: true },
    ],
  },
  {
    id: "educacional",
    nome: "Dashboard Educacional",
    icon: "graduationcap.fill",
    cor: "#37474F",
    descricao: "Métricas de aprendizagem e capacitação rural",
    kpis: [
      { label: "Cursos Ativos", valor: "234", variacao: "+45%", positivo: true },
      { label: "Alunos Matriculados", valor: "78.340", variacao: "+38%", positivo: true },
      { label: "Certificados Emitidos", valor: "23.450", variacao: "+52%", positivo: true },
      { label: "Horas Estudadas", valor: "456.780h", variacao: "+41%", positivo: true },
      { label: "Eventos Realizados", valor: "89", variacao: "+28%", positivo: true },
    ],
  },
];

const RELATORIOS = [
  {
    tipo: "Automáticos",
    icon: "clock.fill",
    cor: "#1565C0",
    frequencias: [
      { nome: "Diário", descricao: "Resumo operacional: análises, alertas, sensores, pedidos", hora: "06:00" },
      { nome: "Semanal", descricao: "Performance agronômica, comparativo semanal, top culturas", hora: "Segunda 07:00" },
      { nome: "Mensal", descricao: "Indicadores táticos, produtividade regional, qualidade", hora: "1º dia 08:00" },
      { nome: "Trimestral", descricao: "Análise estratégica, tendências, rentabilidade", hora: "1º dia do trimestre" },
      { nome: "Anual", descricao: "Relatório completo: produção, sustentabilidade, impacto", hora: "1º de janeiro" },
    ],
  },
  {
    tipo: "Técnicos",
    icon: "doc.text.fill",
    cor: "#2E7D32",
    conteudo: ["Análises laboratoriais detalhadas", "Diagnósticos por imagem com IA", "Recomendações agronômicas", "Indicadores de fertilidade do solo"],
    formatos: ["PDF", "Excel", "CSV", "JSON"],
  },
  {
    tipo: "Executivos",
    icon: "chart.bar.fill",
    cor: "#6A1B9A",
    destinatarios: ["Cooperativas", "Prefeituras e estados", "Investidores", "Órgãos públicos", "Instituições parceiras"],
    indicadores: ["Produção total e por região", "Qualidade e certificações", "Receita do marketplace", "Sustentabilidade e emissões", "Impacto social e econômico"],
  },
];

const KPI_DIMENSOES = [
  {
    nome: "Produção",
    icon: "tractor.fill",
    cor: "#2E7D32",
    kpis: ["Produtividade (t/ha)", "Área plantada (ha)", "Volume de colheita (ton)", "Perdas pós-colheita (%)"],
  },
  {
    nome: "Qualidade",
    icon: "checkmark.circle.fill",
    cor: "#1565C0",
    kpis: ["Conformidade laboratorial (%)", "Certificações emitidas", "Não conformidades detectadas", "Índice de Fertilidade (IF)"],
  },
  {
    nome: "Sustentabilidade",
    icon: "leaf.fill",
    cor: "#1B4332",
    kpis: ["Consumo de água (m³/ha)", "Consumo de energia (kWh)", "Resíduos gerados (kg)", "Emissões de CO₂ (ton)"],
  },
  {
    nome: "Mercado",
    icon: "chart.line.uptrend.xyaxis",
    cor: "#E65100",
    kpis: ["Receita total (R$)", "Lucro líquido (R$)", "Volume exportado (ton)", "Preço médio (R$/ton)"],
  },
];

const DW_AREAS = [
  { nome: "DW_PRODUCAO", descricao: "Dados de cultivos, colheitas, produtividade e perdas", tabelas: 12, registros: "45M+" },
  { nome: "DW_ANALISES", descricao: "Análises laboratoriais, diagnósticos e laudos técnicos", tabelas: 8, registros: "23M+" },
  { nome: "DW_IOT", descricao: "Leituras de sensores, telemetria e séries temporais", tabelas: 6, registros: "1B+" },
  { nome: "DW_MARKETPLACE", descricao: "Transações, pedidos, produtos e comportamento de compra", tabelas: 10, registros: "12M+" },
  { nome: "DW_EDUCACAO", descricao: "Matrículas, progresso, certificações e eventos", tabelas: 9, registros: "8M+" },
  { nome: "DW_FINANCEIRO", descricao: "Receitas, custos, margens e indicadores financeiros", tabelas: 7, registros: "5M+" },
];

const ALERTAS_ANALITICOS = [
  {
    nivel: "Informativo",
    cor: "#1565C0",
    icone: "info.circle",
    exemplos: ["Nova tendência de mercado identificada", "Aumento de 5% na produtividade regional", "Novo lote de análises concluído"],
  },
  {
    nivel: "Atenção",
    cor: "#F59E0B",
    icone: "exclamationmark.triangle.fill",
    exemplos: ["Queda de 10% na produtividade detectada", "Aumento de casos de ferrugem na região", "Baixa fertilidade em 15% das propriedades"],
  },
  {
    nivel: "Alerta",
    cor: "#EF6C00",
    icone: "exclamationmark.triangle.fill",
    exemplos: ["Redução de 20% nas vendas do marketplace", "Surto de praga em área crítica", "Falha em 30+ sensores IoT"],
  },
  {
    nivel: "Crítico",
    cor: "#C62828",
    icone: "xmark.circle.fill",
    exemplos: ["Colapso de produtividade em região estratégica", "Contaminação detectada em análise laboratorial", "Falha sistêmica no monitoramento IoT"],
  },
];

const EXPORTACAO = [
  { formato: "PDF", descricao: "Relatórios formatados para impressão e apresentação", icone: "doc.fill" },
  { formato: "Excel", descricao: "Planilhas para análise e manipulação de dados", icone: "doc.text.fill" },
  { formato: "CSV", descricao: "Dados brutos para importação em sistemas externos", icone: "doc.text.fill" },
  { formato: "Power BI", descricao: "Integração direta com Microsoft Power BI", icone: "chart.bar.fill" },
  { formato: "Tableau", descricao: "Integração com Tableau para visualizações avançadas", icone: "chart.bar.fill" },
  { formato: "API REST", descricao: "Acesso programático via endpoints JSON/GraphQL", icone: "globe" },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function BiEstrategicoScreen() {
  const colors = useColors();
  const router = useRouter();
  const [abaAtiva, setAbaAtiva] = useState<"dashboards" | "relatorios" | "geo" | "kpis" | "dw" | "alertas">("dashboards");
  const [dashboardExpandido, setDashboardExpandido] = useState<string | null>("executivo");
  const [relatorioExpandido, setRelatorioExpandido] = useState<string | null>("Automáticos");
  const [kpiExpandido, setKpiExpandido] = useState<string | null>("Produção");
  const [dwExpandido, setDwExpandido] = useState<string | null>(null);
  const [alertaExpandido, setAlertaExpandido] = useState<string | null>(null);

  const styles = StyleSheet.create({
    aba: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 8,
    },
    abaTexto: { fontSize: 12, fontWeight: "600" },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    cardTitulo: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.foreground,
      flex: 1,
      marginLeft: 8,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
    },
    badgeTexto: { fontSize: 10, fontWeight: "700", color: "#fff" },
    kpiGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 10,
    },
    kpiCard: {
      flex: 1,
      minWidth: "45%",
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    kpiValor: { fontSize: 18, fontWeight: "800", color: colors.foreground },
    kpiLabel: { fontSize: 10, color: colors.muted, marginTop: 2 },
    kpiVariacao: { fontSize: 11, fontWeight: "600", marginTop: 4 },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.foreground,
      marginTop: 10,
      marginBottom: 6,
    },
    chip: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
      marginRight: 6,
      marginBottom: 6,
    },
    chipText: { fontSize: 11, fontWeight: "600" },
    row: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
    dot: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
    itemText: { fontSize: 12, color: colors.foreground, flex: 1 },
    dwCard: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 10,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dwNome: { fontSize: 13, fontWeight: "700", color: "#1565C0", fontFamily: "monospace" },
    dwDesc: { fontSize: 11, color: colors.muted, marginTop: 3 },
    dwStats: { flexDirection: "row", gap: 12, marginTop: 6 },
    dwStat: { fontSize: 11, color: colors.foreground, fontWeight: "600" },
    alertaCard: {
      borderRadius: 10,
      padding: 12,
      marginBottom: 10,
      borderWidth: 1.5,
    },
    alertaNivel: { fontSize: 14, fontWeight: "800" },
    alertaExemplo: { fontSize: 11, color: colors.foreground, marginBottom: 4 },
    geoLayer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 10,
      marginBottom: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    geoLayerText: { fontSize: 12, color: colors.foreground, marginLeft: 8, fontWeight: "600" },
    exportCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 10,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    exportNome: { fontSize: 13, fontWeight: "700", color: colors.foreground, marginLeft: 10 },
    exportDesc: { fontSize: 11, color: colors.muted, marginLeft: 10, flex: 1 },
  });

  const abas: { id: typeof abaAtiva; label: string }[] = [
    { id: "dashboards", label: "Dashboards" },
    { id: "relatorios", label: "Relatórios" },
    { id: "geo", label: "BI Geo" },
    { id: "kpis", label: "KPIs" },
    { id: "dw", label: "Data Warehouse" },
    { id: "alertas", label: "Alertas" },
  ];

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ backgroundColor: "#1565C0", padding: 16, paddingBottom: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 8 }}>
          <IconSymbol name="chevron.left" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "800", color: "#fff" }}>BI & Inteligência Estratégica</Text>
        <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>Etapa 18 · Business Intelligence · Data Warehouse · 6 Dashboards</Text>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ backgroundColor: colors.surface, paddingVertical: 10, paddingHorizontal: 12 }}>
        {abas.map((aba) => (
          <TouchableOpacity
            key={aba.id}
            style={[styles.aba, { backgroundColor: abaAtiva === aba.id ? "#1565C0" : colors.background, borderWidth: 1, borderColor: abaAtiva === aba.id ? "#1565C0" : colors.border }]}
            onPress={() => setAbaAtiva(aba.id)}
          >
            <Text style={[styles.abaTexto, { color: abaAtiva === aba.id ? "#fff" : colors.muted }]}>{aba.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* ── DASHBOARDS ── */}
        {abaAtiva === "dashboards" && (
          <View>
            <Text style={{ fontSize: 16, fontWeight: "800", color: colors.foreground, marginBottom: 4 }}>6 Dashboards Analíticos</Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 16 }}>Visões operacional, tática e estratégica para todos os perfis</Text>

            {/* Arquitetura */}
            <View style={{ backgroundColor: "#0D1B2A", borderRadius: 12, padding: 14, marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#64B5F6", marginBottom: 8 }}>Arquitetura Analítica AFU</Text>
              {["Sensores · Diagnósticos · Laboratório · Marketplace · Capacitação · Produção", "↓", "Data Warehouse AFU", "↓", "Processamento Analítico (IA + ETL)", "↓", "Dashboards em Tempo Real", "↓", "Relatórios Automáticos", "↓", "Tomada de Decisão"].map((linha, i) => (
                <Text key={i} style={{ fontSize: 11, color: i % 2 === 1 ? "#81C784" : "#E0E0E0", textAlign: "center", marginBottom: 2, fontFamily: "monospace" }}>{linha}</Text>
              ))}
            </View>

            {/* Camadas BI */}
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
              {[
                { nome: "Operacional", desc: "Monitoramento diário", cor: "#2E7D32" },
                { nome: "Tática", desc: "Gestão mensal", cor: "#1565C0" },
                { nome: "Estratégica", desc: "Planejamento", cor: "#6A1B9A" },
              ].map((c) => (
                <View key={c.nome} style={{ flex: 1, backgroundColor: c.cor + "20", borderRadius: 10, padding: 10, borderWidth: 1, borderColor: c.cor + "40" }}>
                  <Text style={{ fontSize: 11, fontWeight: "800", color: c.cor }}>{c.nome}</Text>
                  <Text style={{ fontSize: 10, color: colors.muted, marginTop: 2 }}>{c.desc}</Text>
                </View>
              ))}
            </View>

            {DASHBOARDS.map((dash) => (
              <TouchableOpacity key={dash.id} style={styles.card} onPress={() => setDashboardExpandido(dashboardExpandido === dash.id ? null : dash.id)}>
                <View style={styles.cardHeader}>
                  <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: dash.cor + "20", alignItems: "center", justifyContent: "center" }}>
                    <IconSymbol name={dash.icon as any} size={16} color={dash.cor} />
                  </View>
                  <Text style={styles.cardTitulo}>{dash.nome}</Text>
                  <View style={[styles.badge, { backgroundColor: dash.cor }]}>
                    <Text style={styles.badgeTexto}>{dash.kpis.length} KPIs</Text>
                  </View>
                  <IconSymbol name={dashboardExpandido === dash.id ? "chevron.up" : "chevron.down"} size={16} color={colors.muted} style={{ marginLeft: 6 }} />
                </View>
                <Text style={{ fontSize: 11, color: colors.muted, marginTop: 6 }}>{dash.descricao}</Text>

                {dashboardExpandido === dash.id && (
                  <View style={styles.kpiGrid}>
                    {dash.kpis.map((kpi, i) => (
                      <View key={i} style={styles.kpiCard}>
                        <Text style={[styles.kpiValor, { color: dash.cor }]}>{kpi.valor}</Text>
                        <Text style={styles.kpiLabel}>{kpi.label}</Text>
                        <Text style={[styles.kpiVariacao, { color: kpi.positivo ? "#2E7D32" : "#C62828" }]}>{kpi.variacao}</Text>
                      </View>
                    ))}
                    {(dash as any).graficos && (
                      <View style={{ width: "100%", marginTop: 6 }}>
                        <Text style={styles.sectionTitle}>Tipos de Gráficos</Text>
                        {(dash as any).graficos.map((g: string, i: number) => (
                          <View key={i} style={styles.row}>
                            <View style={[styles.dot, { backgroundColor: dash.cor }]} />
                            <Text style={styles.itemText}>{g}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    {(dash as any).visualizacoes && (
                      <View style={{ width: "100%", marginTop: 6 }}>
                        <Text style={styles.sectionTitle}>Visualizações</Text>
                        {(dash as any).visualizacoes.map((v: string, i: number) => (
                          <View key={i} style={styles.row}>
                            <View style={[styles.dot, { backgroundColor: dash.cor }]} />
                            <Text style={styles.itemText}>{v}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── RELATÓRIOS ── */}
        {abaAtiva === "relatorios" && (
          <View>
            <Text style={{ fontSize: 16, fontWeight: "800", color: colors.foreground, marginBottom: 4 }}>Relatórios Automáticos e Técnicos</Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 16 }}>Geração automática em múltiplos formatos para todos os perfis</Text>

            {RELATORIOS.map((rel) => (
              <TouchableOpacity key={rel.tipo} style={styles.card} onPress={() => setRelatorioExpandido(relatorioExpandido === rel.tipo ? null : rel.tipo)}>
                <View style={styles.cardHeader}>
                  <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: rel.cor + "20", alignItems: "center", justifyContent: "center" }}>
                    <IconSymbol name={rel.icon as any} size={16} color={rel.cor} />
                  </View>
                  <Text style={styles.cardTitulo}>Relatórios {rel.tipo}</Text>
                  <IconSymbol name={relatorioExpandido === rel.tipo ? "chevron.up" : "chevron.down"} size={16} color={colors.muted} />
                </View>

                {relatorioExpandido === rel.tipo && (
                  <View style={{ marginTop: 12 }}>
                    {rel.tipo === "Automáticos" && rel.frequencias && (
                      <>
                        <Text style={styles.sectionTitle}>Frequências de Geração</Text>
                        {rel.frequencias.map((f, i) => (
                          <View key={i} style={{ backgroundColor: colors.background, borderRadius: 8, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: colors.border }}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                              <Text style={{ fontSize: 13, fontWeight: "700", color: rel.cor }}>{f.nome}</Text>
                              <View style={[styles.badge, { backgroundColor: rel.cor + "20" }]}>
                                <Text style={[styles.badgeTexto, { color: rel.cor }]}>{f.hora}</Text>
                              </View>
                            </View>
                            <Text style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>{f.descricao}</Text>
                          </View>
                        ))}
                      </>
                    )}
                    {rel.tipo === "Técnicos" && (
                      <>
                        <Text style={styles.sectionTitle}>Conteúdo</Text>
                        {rel.conteudo?.map((c, i) => (
                          <View key={i} style={styles.row}>
                            <View style={[styles.dot, { backgroundColor: rel.cor }]} />
                            <Text style={styles.itemText}>{c}</Text>
                          </View>
                        ))}
                        <Text style={styles.sectionTitle}>Formatos de Exportação</Text>
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                          {rel.formatos?.map((f, i) => (
                            <View key={i} style={[styles.chip, { backgroundColor: rel.cor + "20" }]}>
                              <Text style={[styles.chipText, { color: rel.cor }]}>{f}</Text>
                            </View>
                          ))}
                        </View>
                      </>
                    )}
                    {rel.tipo === "Executivos" && (
                      <>
                        <Text style={styles.sectionTitle}>Destinatários</Text>
                        {rel.destinatarios?.map((d, i) => (
                          <View key={i} style={styles.row}>
                            <View style={[styles.dot, { backgroundColor: rel.cor }]} />
                            <Text style={styles.itemText}>{d}</Text>
                          </View>
                        ))}
                        <Text style={styles.sectionTitle}>Indicadores Estratégicos</Text>
                        {rel.indicadores?.map((ind, i) => (
                          <View key={i} style={styles.row}>
                            <View style={[styles.dot, { backgroundColor: rel.cor }]} />
                            <Text style={styles.itemText}>{ind}</Text>
                          </View>
                        ))}
                      </>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            ))}

            {/* Inteligência Estratégica IA */}
            <View style={[styles.card, { borderColor: "#6A1B9A" + "40", borderWidth: 1.5 }]}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#6A1B9A", marginBottom: 8 }}>Inteligência Estratégica com IA</Text>
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>A IA analisa:</Text>
              {["Histórico de produção e análises", "Dados de mercado e preços", "Clima e previsões meteorológicas", "Custos operacionais e margens"].map((item, i) => (
                <View key={i} style={styles.row}>
                  <View style={[styles.dot, { backgroundColor: "#6A1B9A" }]} />
                  <Text style={styles.itemText}>{item}</Text>
                </View>
              ))}
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.foreground, marginTop: 8, marginBottom: 6 }}>Para prever:</Text>
              {["Riscos de safra e climáticos", "Oportunidades de mercado", "Tendências de consumo", "Rentabilidade por cultura e região"].map((item, i) => (
                <View key={i} style={styles.row}>
                  <View style={[styles.dot, { backgroundColor: "#2E7D32" }]} />
                  <Text style={styles.itemText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── BI GEOGRÁFICO ── */}
        {abaAtiva === "geo" && (
          <View>
            <Text style={{ fontSize: 16, fontWeight: "800", color: colors.foreground, marginBottom: 4 }}>BI Geográfico</Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 16 }}>Mapa inteligente com 6 camadas de dados agronômicos</Text>

            {/* Mapa mockup */}
            <View style={{ backgroundColor: "#0D1B2A", borderRadius: 12, padding: 16, marginBottom: 16, alignItems: "center" }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#64B5F6", marginBottom: 12 }}>Mapa Inteligente AFU</Text>
              <View style={{ width: "100%", height: 140, backgroundColor: "#1A2F1A", borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#2E7D32" + "60" }}>
                <IconSymbol name="map.fill" size={40} color="#2E7D32" />
                <Text style={{ color: "#81C784", fontSize: 11, marginTop: 8 }}>Brasil — Mapa de Calor Agronômico</Text>
                <Text style={{ color: "#64B5F6", fontSize: 10, marginTop: 4 }}>34.780 propriedades · 12.450 produtores</Text>
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                {[
                  { nome: "Regiões", cor: "#1565C0" },
                  { nome: "Culturas", cor: "#2E7D32" },
                  { nome: "Sensores", cor: "#E65100" },
                  { nome: "Pragas", cor: "#C62828" },
                  { nome: "Doenças", cor: "#6A1B9A" },
                  { nome: "Produção", cor: "#F59E0B" },
                ].map((layer) => (
                  <View key={layer.nome} style={{ flexDirection: "row", alignItems: "center", backgroundColor: layer.cor + "30", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: layer.cor, marginRight: 5 }} />
                    <Text style={{ fontSize: 11, color: layer.cor, fontWeight: "600" }}>{layer.nome}</Text>
                  </View>
                ))}
              </View>
            </View>

            <Text style={styles.sectionTitle}>Funcionalidades do Mapa</Text>
            {[
              { nome: "Filtros Avançados", desc: "Por cultura, período, região, indicador e status", icone: "slider.horizontal.3" },
              { nome: "Mapa de Calor", desc: "Visualização de densidade de pragas, doenças e produtividade", icone: "thermometer" },
              { nome: "Clusters", desc: "Agrupamento automático de propriedades e sensores por proximidade", icone: "location.fill" },
              { nome: "Inteligência Regional", desc: "Relatórios por município, região, estado e país", icone: "chart.bar.fill" },
              { nome: "Comparativo Regional", desc: "Indicadores comparativos para políticas públicas", icone: "chart.line.uptrend.xyaxis" },
            ].map((func, i) => (
              <View key={i} style={styles.geoLayer}>
                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: "#1565C0" + "20", alignItems: "center", justifyContent: "center" }}>
                  <IconSymbol name={func.icone as any} size={16} color="#1565C0" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.geoLayerText}>{func.nome}</Text>
                  <Text style={{ fontSize: 11, color: colors.muted }}>{func.desc}</Text>
                </View>
              </View>
            ))}

            <Text style={styles.sectionTitle}>Inteligência Regional</Text>
            <View style={styles.card}>
              {["Município", "Região", "Estado", "País"].map((nivel, i) => (
                <View key={i} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: i < 3 ? 1 : 0, borderBottomColor: colors.border }}>
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "#1565C0", alignItems: "center", justifyContent: "center", marginRight: 10 }}>
                    <Text style={{ fontSize: 11, fontWeight: "800", color: "#fff" }}>{i + 1}</Text>
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}>Nível {nivel}</Text>
                  <Text style={{ fontSize: 11, color: colors.muted, marginLeft: 8 }}>— Indicadores comparativos</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── KPIs ── */}
        {abaAtiva === "kpis" && (
          <View>
            <Text style={{ fontSize: 16, fontWeight: "800", color: colors.foreground, marginBottom: 4 }}>KPIs Estratégicos do AFU</Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 16 }}>4 dimensões · 16 indicadores-chave de performance</Text>

            {KPI_DIMENSOES.map((dim) => (
              <TouchableOpacity key={dim.nome} style={styles.card} onPress={() => setKpiExpandido(kpiExpandido === dim.nome ? null : dim.nome)}>
                <View style={styles.cardHeader}>
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: dim.cor + "20", alignItems: "center", justifyContent: "center" }}>
                    <IconSymbol name={dim.icon as any} size={18} color={dim.cor} />
                  </View>
                  <Text style={styles.cardTitulo}>{dim.nome}</Text>
                  <View style={[styles.badge, { backgroundColor: dim.cor }]}>
                    <Text style={styles.badgeTexto}>{dim.kpis.length} KPIs</Text>
                  </View>
                  <IconSymbol name={kpiExpandido === dim.nome ? "chevron.up" : "chevron.down"} size={16} color={colors.muted} style={{ marginLeft: 6 }} />
                </View>

                {kpiExpandido === dim.nome && (
                  <View style={{ marginTop: 12 }}>
                    {dim.kpis.map((kpi, i) => (
                      <View key={i} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: i < dim.kpis.length - 1 ? 1 : 0, borderBottomColor: colors.border }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: dim.cor, marginRight: 10 }} />
                        <Text style={{ fontSize: 13, color: colors.foreground, flex: 1 }}>{kpi}</Text>
                        <View style={[styles.badge, { backgroundColor: dim.cor + "20" }]}>
                          <Text style={[styles.badgeTexto, { color: dim.cor }]}>KPI</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            ))}

            {/* Exportação */}
            <View style={[styles.card, { marginTop: 8 }]}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>Exportação de Dados</Text>
              {EXPORTACAO.map((exp, i) => (
                <View key={i} style={styles.exportCard}>
                  <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: "#1565C0" + "20", alignItems: "center", justifyContent: "center" }}>
                    <IconSymbol name={exp.icone as any} size={16} color="#1565C0" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.exportNome}>{exp.formato}</Text>
                    <Text style={styles.exportDesc}>{exp.descricao}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── DATA WAREHOUSE ── */}
        {abaAtiva === "dw" && (
          <View>
            <Text style={{ fontSize: 16, fontWeight: "800", color: colors.foreground, marginBottom: 4 }}>Data Warehouse AFU</Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 16 }}>6 áreas analíticas · Bilhões de registros · ETL automatizado</Text>

            {/* Arquitetura DW */}
            <View style={{ backgroundColor: "#0D1B2A", borderRadius: 12, padding: 14, marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#64B5F6", marginBottom: 10 }}>Arquitetura do Data Warehouse</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {DW_AREAS.map((area) => (
                  <View key={area.nome} style={{ backgroundColor: "#1565C0" + "30", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "#1565C0" + "50" }}>
                    <Text style={{ fontSize: 10, color: "#64B5F6", fontFamily: "monospace", fontWeight: "700" }}>{area.nome}</Text>
                  </View>
                ))}
              </View>
              <View style={{ marginTop: 12 }}>
                {["ETL Automatizado (Apache Airflow)", "Processamento Analítico (Apache Spark)", "Armazenamento Colunar (ClickHouse)", "Cache em Memória (Redis)", "API de Consulta (GraphQL + REST)"].map((item, i) => (
                  <Text key={i} style={{ fontSize: 10, color: "#E0E0E0", marginBottom: 3, fontFamily: "monospace" }}>→ {item}</Text>
                ))}
              </View>
            </View>

            {DW_AREAS.map((area) => (
              <TouchableOpacity key={area.nome} style={styles.card} onPress={() => setDwExpandido(dwExpandido === area.nome ? null : area.nome)}>
                <View style={styles.cardHeader}>
                  <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: "#1565C0" + "20", alignItems: "center", justifyContent: "center" }}>
                    <IconSymbol name="server.rack" size={16} color="#1565C0" />
                  </View>
                  <Text style={[styles.cardTitulo, { fontFamily: "monospace", color: "#1565C0" }]}>{area.nome}</Text>
                  <IconSymbol name={dwExpandido === area.nome ? "chevron.up" : "chevron.down"} size={16} color={colors.muted} />
                </View>
                <Text style={{ fontSize: 11, color: colors.muted, marginTop: 4 }}>{area.descricao}</Text>

                {dwExpandido === area.nome && (
                  <View style={styles.dwStats}>
                    <View style={{ backgroundColor: "#1565C0" + "15", borderRadius: 8, padding: 8, flex: 1 }}>
                      <Text style={{ fontSize: 18, fontWeight: "800", color: "#1565C0" }}>{area.tabelas}</Text>
                      <Text style={{ fontSize: 10, color: colors.muted }}>Tabelas</Text>
                    </View>
                    <View style={{ backgroundColor: "#2E7D32" + "15", borderRadius: 8, padding: 8, flex: 1 }}>
                      <Text style={{ fontSize: 18, fontWeight: "800", color: "#2E7D32" }}>{area.registros}</Text>
                      <Text style={{ fontSize: 10, color: colors.muted }}>Registros</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))}

            {/* Totais */}
            <View style={[styles.card, { backgroundColor: "#1565C0" + "10", borderColor: "#1565C0" + "40" }]}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#1565C0", marginBottom: 10 }}>Totais do Data Warehouse</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {[
                  { label: "Áreas DW", valor: "6" },
                  { label: "Total Tabelas", valor: "52" },
                  { label: "Total Registros", valor: "1B+" },
                  { label: "Retenção", valor: "10 anos" },
                  { label: "Backup", valor: "Diário" },
                  { label: "SLA", valor: "99,9%" },
                ].map((stat, i) => (
                  <View key={i} style={{ flex: 1, minWidth: "30%", backgroundColor: colors.background, borderRadius: 8, padding: 8, alignItems: "center", borderWidth: 1, borderColor: colors.border }}>
                    <Text style={{ fontSize: 16, fontWeight: "800", color: "#1565C0" }}>{stat.valor}</Text>
                    <Text style={{ fontSize: 10, color: colors.muted }}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ── ALERTAS ── */}
        {abaAtiva === "alertas" && (
          <View>
            <Text style={{ fontSize: 16, fontWeight: "800", color: colors.foreground, marginBottom: 4 }}>Sistema de Alertas Analíticos</Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 16 }}>4 níveis de criticidade · Notificações automáticas por canal</Text>

            {ALERTAS_ANALITICOS.map((alerta) => (
              <TouchableOpacity
                key={alerta.nivel}
                style={[styles.alertaCard, { backgroundColor: alerta.cor + "10", borderColor: alerta.cor + "50" }]}
                onPress={() => setAlertaExpandido(alertaExpandido === alerta.nivel ? null : alerta.nivel)}
              >
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <IconSymbol name={alerta.icone as any} size={18} color={alerta.cor} />
                    <Text style={[styles.alertaNivel, { color: alerta.cor, marginLeft: 8 }]}>{alerta.nivel}</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View style={[styles.badge, { backgroundColor: alerta.cor }]}>
                      <Text style={styles.badgeTexto}>{alerta.exemplos.length} exemplos</Text>
                    </View>
                    <IconSymbol name={alertaExpandido === alerta.nivel ? "chevron.up" : "chevron.down"} size={14} color={alerta.cor} />
                  </View>
                </View>

                {alertaExpandido === alerta.nivel && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: alerta.cor, marginBottom: 6 }}>Exemplos de Alertas:</Text>
                    {alerta.exemplos.map((ex, i) => (
                      <View key={i} style={styles.row}>
                        <View style={[styles.dot, { backgroundColor: alerta.cor }]} />
                        <Text style={styles.alertaExemplo}>{ex}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            ))}

            {/* Canais de Notificação */}
            <View style={styles.card}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 10 }}>Canais de Notificação</Text>
              {[
                { canal: "Push Notification", desc: "App mobile e PWA", icone: "bell.fill", cor: "#1565C0" },
                { canal: "E-mail", desc: "Relatórios automáticos e alertas críticos", icone: "envelope.fill", cor: "#2E7D32" },
                { canal: "WhatsApp Business", desc: "Alertas urgentes e relatórios diários", icone: "phone.fill", cor: "#25D366" },
                { canal: "SMS", desc: "Alertas críticos sem internet", icone: "phone.fill", cor: "#E65100" },
                { canal: "Dashboard Web", desc: "Painel em tempo real para técnicos", icone: "desktopcomputer", cor: "#6A1B9A" },
              ].map((canal, i) => (
                <View key={i} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: i < 4 ? 1 : 0, borderBottomColor: colors.border }}>
                  <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: canal.cor + "20", alignItems: "center", justifyContent: "center", marginRight: 10 }}>
                    <IconSymbol name={canal.icone as any} size={14} color={canal.cor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: colors.foreground }}>{canal.canal}</Text>
                    <Text style={{ fontSize: 11, color: colors.muted }}>{canal.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Resumo */}
            <View style={[styles.card, { backgroundColor: "#1565C0" + "10", borderColor: "#1565C0" + "40" }]}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#1565C0", marginBottom: 10 }}>Resumo do Módulo BI</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {[
                  { label: "Dashboards", valor: "6" },
                  { label: "KPIs", valor: "38" },
                  { label: "Relatórios", valor: "5 freq." },
                  { label: "Camadas BI", valor: "3" },
                  { label: "Áreas DW", valor: "6" },
                  { label: "Formatos", valor: "6" },
                  { label: "Níveis Alerta", valor: "4" },
                  { label: "Canais", valor: "5" },
                ].map((stat, i) => (
                  <View key={i} style={{ flex: 1, minWidth: "22%", backgroundColor: colors.background, borderRadius: 8, padding: 8, alignItems: "center", borderWidth: 1, borderColor: colors.border }}>
                    <Text style={{ fontSize: 16, fontWeight: "800", color: "#1565C0" }}>{stat.valor}</Text>
                    <Text style={{ fontSize: 10, color: colors.muted, textAlign: "center" }}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

      </ScrollView>
    </ScreenContainer>
  );
}
