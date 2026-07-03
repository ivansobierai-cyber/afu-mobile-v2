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

type Aba = "sensores" | "comunicacao" | "irrigacao" | "drones" | "alertas" | "dashboard";

const COR_HEADER = "#1B4332";
const COR_SOLO = "#795548";
const COR_AMBIENTE = "#0277BD";
const COR_AGUA = "#00695C";
const COR_IRRIGACAO = "#1565C0";
const COR_DRONE = "#4A148C";
const COR_ALERTA = "#C62828";
const COR_TELEMETRIA = "#E65100";

const SENSORES_SOLO = [
  { nome: "Umidade do Solo", unidade: "%", icone: "💧", desc: "Monitoramento contínuo da disponibilidade hídrica" },
  { nome: "Temperatura do Solo", unidade: "°C", icone: "🌡", desc: "Temperatura em diferentes profundidades" },
  { nome: "pH do Solo", unidade: "0 – 14", icone: "⚗️", desc: "Acidez e alcalinidade para gestão de calagem" },
  { nome: "Condutividade Elétrica", unidade: "µS/cm", icone: "⚡", desc: "Salinidade e fertilidade do solo" },
  { nome: "Salinidade", unidade: "ppm", icone: "🧂", desc: "Concentração de sais dissolvidos" },
  { nome: "Potencial Matricial", unidade: "kPa", icone: "📊", desc: "Tensão da água no solo para irrigação" },
];

const SENSORES_AMBIENTE = [
  { nome: "Temperatura do Ar", unidade: "°C", icone: "🌡" },
  { nome: "Umidade Relativa", unidade: "%", icone: "💨" },
  { nome: "Pressão Atmosférica", unidade: "hPa", icone: "🌀" },
  { nome: "Velocidade do Vento", unidade: "km/h", icone: "🌬" },
  { nome: "Direção do Vento", unidade: "°", icone: "🧭" },
  { nome: "Radiação Solar", unidade: "W/m²", icone: "☀️" },
  { nome: "Luminosidade", unidade: "lux", icone: "💡" },
  { nome: "Chuva", unidade: "mm", icone: "🌧" },
];

const SENSORES_AGUA = [
  { nome: "Nível de Reservatório", unidade: "m / %", icone: "🏊", desc: "Monitoramento do volume disponível" },
  { nome: "Vazão", unidade: "L/h", icone: "🚿", desc: "Controle do fluxo de irrigação" },
  { nome: "Qualidade da Água", unidade: "Multi", icone: "🔬", desc: "pH, CE, turbidez e coliformes" },
];

const PROTOCOLOS = [
  { nome: "MQTT", desc: "Principal protocolo IoT — leve, eficiente e confiável", uso: "Todos os sensores em tempo real", cor: COR_HEADER, icone: "📡" },
  { nome: "HTTP API", desc: "Integrações com sistemas externos e parceiros", uso: "Laboratórios, ERPs, plataformas", cor: COR_IRRIGACAO, icone: "🌐" },
  { nome: "LoRaWAN", desc: "Longo alcance para grandes propriedades rurais", uso: "Fazendas > 500 ha", cor: COR_SOLO, icone: "📶" },
  { nome: "Wi-Fi", desc: "Conectividade local para pequenas propriedades", uso: "Sítios e pequenas fazendas", cor: COR_AMBIENTE, icone: "📶" },
  { nome: "4G / 5G", desc: "Conectividade em áreas remotas sem infraestrutura", uso: "Áreas sem Wi-Fi ou LoRa", cor: COR_TELEMETRIA, icone: "📱" },
];

const ALERTAS_AGRICOLAS = [
  { nome: "Déficit Hídrico", desc: "Umidade do solo abaixo do limite crítico para a cultura", nivel: "Crítico", cor: COR_ALERTA },
  { nome: "Excesso de Água", desc: "Saturação do solo com risco de encharcamento e podridão", nivel: "Alto", cor: "#E65100" },
  { nome: "Temperatura Crítica", desc: "Temperatura fora da faixa ideal para a fase fenológica", nivel: "Alto", cor: "#E65100" },
  { nome: "Geada", desc: "Temperatura do ar próxima a 0°C com risco de danos", nivel: "Crítico", cor: COR_ALERTA },
  { nome: "Onda de Calor", desc: "Temperatura acima de 35°C por mais de 3 dias consecutivos", nivel: "Alto", cor: "#E65100" },
  { nome: "Ventos Fortes", desc: "Velocidade do vento acima de 60 km/h com risco de acamamento", nivel: "Médio", cor: "#F57F17" },
];

const ALERTAS_OPERACIONAIS = [
  { nome: "Sensor Offline", desc: "Dispositivo sem comunicação por mais de 15 minutos", nivel: "Alto", cor: "#E65100" },
  { nome: "Bateria Baixa", desc: "Nível de bateria abaixo de 20% em dispositivo de campo", nivel: "Médio", cor: "#F57F17" },
  { nome: "Falha de Comunicação", desc: "Perda de pacotes acima de 10% no gateway IoT", nivel: "Alto", cor: "#E65100" },
  { nome: "Falha de Equipamento", desc: "Leitura fora dos limites físicos do sensor", nivel: "Crítico", cor: COR_ALERTA },
];

const FUNCOES_DRONE = [
  { nome: "Mapeamento", desc: "Ortofoto de alta resolução da propriedade", icone: "🗺" },
  { nome: "Inspeção", desc: "Vistoria visual de cultivos e infraestrutura", icone: "🔍" },
  { nome: "Contagem de Plantas", desc: "Estimativa automática por visão computacional", icone: "🌱" },
  { nome: "Identificação de Falhas", desc: "Detecção de falhas no stand de plantas", icone: "⚠️" },
  { nome: "Pulverização", desc: "Aplicação precisa de defensivos e fertilizantes", icone: "💊" },
  { nome: "NDVI", desc: "Índice de vegetação por diferença normalizada", icone: "🟢" },
  { nome: "Índices Vegetativos", desc: "NDRE, EVI, SAVI e outros índices espectrais", icone: "📊" },
];

export default function IotAgriculturaScreen() {
  const colors = useColors();
  const router = useRouter();
  const [abaAtiva, setAbaAtiva] = useState<Aba>("sensores");
  const [grupoExpandido, setGrupoExpandido] = useState<string | null>("solo");

  const abas: { id: Aba; label: string }[] = [
    { id: "sensores", label: "Sensores" },
    { id: "comunicacao", label: "Comunicação" },
    { id: "irrigacao", label: "Irrigação" },
    { id: "drones", label: "Drones" },
    { id: "alertas", label: "Alertas" },
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
          <Text style={styles.headerTitle}>📡 IoT & Agricultura Inteligente</Text>
          <Text style={styles.headerSubtitle}>Etapa 15 · Sensores · Drones · Irrigação · IA Preditiva · Tempo Real</Text>
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

        {/* ─── SENSORES ─── */}
        {abaAtiva === "sensores" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: COR_HEADER }]}>
              <Text style={styles.infoTitle}>16 Tipos de Sensores</Text>
              <Text style={styles.infoSubtitle}>Solo (6) · Ambiente (8) · Água (3) · Leitura em tempo real</Text>
            </View>

            {/* Arquitetura */}
            <View style={[styles.card, { backgroundColor: "#0A0A1A", padding: 16 }]}>
              <Text style={{ color: "#A5D6A7", fontSize: 13, fontWeight: "700", marginBottom: 12 }}>
                Arquitetura IoT
              </Text>
              <View style={{ gap: 4, alignItems: "center" }}>
                {[
                  { label: "📡 Sensores de Campo", cor: COR_SOLO },
                  { label: "⬇", cor: "#555" },
                  { label: "🔌 Gateway IoT (Edge)", cor: "#455A64" },
                  { label: "⬇", cor: "#555" },
                  { label: "📨 Servidor MQTT (Broker)", cor: COR_AMBIENTE },
                  { label: "⬇", cor: "#555" },
                  { label: "⚙️ API AFU (Processamento)", cor: COR_HEADER },
                  { label: "⬇", cor: "#555" },
                  { label: "🗄 Banco de Dados IoT", cor: COR_IRRIGACAO },
                  { label: "⬇", cor: "#555" },
                  { label: "🧠 IA Preditiva", cor: "#6A1B9A" },
                  { label: "⬇", cor: "#555" },
                  { label: "📊 Dashboard em Tempo Real", cor: COR_TELEMETRIA },
                  { label: "⬇", cor: "#555" },
                  { label: "👨‍🌾 Produtor / Técnico", cor: "#2E7D32" },
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

            {/* Sensores Solo */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TouchableOpacity
                style={styles.grupoHeader}
                onPress={() => setGrupoExpandido(grupoExpandido === "solo" ? null : "solo")}
              >
                <View style={[styles.grupoIcone, { backgroundColor: COR_SOLO + "20" }]}>
                  <Text style={{ fontSize: 22 }}>🌱</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.grupoNome, { color: COR_SOLO }]}>Sensores de Solo</Text>
                  <Text style={[styles.grupoTotal, { color: colors.muted }]}>6 tipos · Umidade, Temperatura, pH, CE, Salinidade, Potencial Matricial</Text>
                </View>
                <Text style={{ color: colors.muted }}>{grupoExpandido === "solo" ? "▲" : "▼"}</Text>
              </TouchableOpacity>
              {grupoExpandido === "solo" && (
                <View style={[styles.grupoBody, { borderTopColor: colors.border }]}>
                  {SENSORES_SOLO.map((s, i) => (
                    <View key={i} style={[styles.sensorRow, { borderBottomColor: colors.border }]}>
                      <Text style={{ fontSize: 20, width: 32 }}>{s.icone}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.sensorNome, { color: colors.foreground }]}>{s.nome}</Text>
                        <Text style={[styles.sensorDesc, { color: colors.muted }]}>{s.desc}</Text>
                      </View>
                      <View style={[styles.unidadeBadge, { backgroundColor: COR_SOLO + "15" }]}>
                        <Text style={[styles.unidadeText, { color: COR_SOLO }]}>{s.unidade}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Sensores Ambiente */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TouchableOpacity
                style={styles.grupoHeader}
                onPress={() => setGrupoExpandido(grupoExpandido === "ambiente" ? null : "ambiente")}
              >
                <View style={[styles.grupoIcone, { backgroundColor: COR_AMBIENTE + "20" }]}>
                  <Text style={{ fontSize: 22 }}>🌤</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.grupoNome, { color: COR_AMBIENTE }]}>Sensores de Ambiente</Text>
                  <Text style={[styles.grupoTotal, { color: colors.muted }]}>8 tipos · Estação meteorológica completa</Text>
                </View>
                <Text style={{ color: colors.muted }}>{grupoExpandido === "ambiente" ? "▲" : "▼"}</Text>
              </TouchableOpacity>
              {grupoExpandido === "ambiente" && (
                <View style={[styles.grupoBody, { borderTopColor: colors.border }]}>
                  <View style={styles.ambienteGrid}>
                    {SENSORES_AMBIENTE.map((s, i) => (
                      <View key={i} style={[styles.ambienteCard, { backgroundColor: COR_AMBIENTE + "08", borderColor: COR_AMBIENTE + "20" }]}>
                        <Text style={{ fontSize: 24, textAlign: "center" }}>{s.icone}</Text>
                        <Text style={[styles.ambienteNome, { color: colors.foreground }]}>{s.nome}</Text>
                        <Text style={[styles.ambienteUnidade, { color: COR_AMBIENTE }]}>{s.unidade}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Sensores Água */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TouchableOpacity
                style={styles.grupoHeader}
                onPress={() => setGrupoExpandido(grupoExpandido === "agua" ? null : "agua")}
              >
                <View style={[styles.grupoIcone, { backgroundColor: COR_AGUA + "20" }]}>
                  <Text style={{ fontSize: 22 }}>💧</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.grupoNome, { color: COR_AGUA }]}>Sensores de Água</Text>
                  <Text style={[styles.grupoTotal, { color: colors.muted }]}>3 tipos · Nível, Vazão, Qualidade</Text>
                </View>
                <Text style={{ color: colors.muted }}>{grupoExpandido === "agua" ? "▲" : "▼"}</Text>
              </TouchableOpacity>
              {grupoExpandido === "agua" && (
                <View style={[styles.grupoBody, { borderTopColor: colors.border }]}>
                  {SENSORES_AGUA.map((s, i) => (
                    <View key={i} style={[styles.sensorRow, { borderBottomColor: colors.border }]}>
                      <Text style={{ fontSize: 20, width: 32 }}>{s.icone}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.sensorNome, { color: colors.foreground }]}>{s.nome}</Text>
                        <Text style={[styles.sensorDesc, { color: colors.muted }]}>{s.desc}</Text>
                      </View>
                      <View style={[styles.unidadeBadge, { backgroundColor: COR_AGUA + "15" }]}>
                        <Text style={[styles.unidadeText, { color: COR_AGUA }]}>{s.unidade}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Frequências */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>⏱ Frequências de Leitura</Text>
              <View style={styles.freqGrid}>
                {["1 min", "5 min", "15 min", "30 min", "1 hora", "6 horas", "24 horas"].map((f, i) => (
                  <View key={i} style={[styles.freqChip, { backgroundColor: COR_HEADER + "15", borderColor: COR_HEADER + "30" }]}>
                    <Text style={[styles.freqText, { color: COR_HEADER }]}>{f}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── COMUNICAÇÃO ─── */}
        {abaAtiva === "comunicacao" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: COR_HEADER }]}>
              <Text style={styles.infoTitle}>Comunicação e Dispositivos</Text>
              <Text style={styles.infoSubtitle}>MQTT · LoRaWAN · Wi-Fi · 4G/5G · Cadastro de dispositivos</Text>
            </View>

            {PROTOCOLOS.map((p, i) => (
              <View key={i} style={[styles.protocoloCard, { backgroundColor: p.cor + "10", borderColor: p.cor + "30", borderLeftWidth: 4, borderLeftColor: p.cor }]}>
                <View style={styles.protocoloHeader}>
                  <Text style={{ fontSize: 24 }}>{p.icone}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.protocoloNome, { color: p.cor }]}>{p.nome}</Text>
                    <Text style={[styles.protocoloDesc, { color: colors.muted }]}>{p.desc}</Text>
                  </View>
                </View>
                <View style={[styles.protocoloUso, { backgroundColor: p.cor + "10" }]}>
                  <Text style={[styles.protocoloUsoText, { color: p.cor }]}>Uso: {p.uso}</Text>
                </View>
              </View>
            ))}

            {/* Cadastro de dispositivos */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>📋 Cadastro de Dispositivos</Text>
              <View style={{ gap: 8, marginTop: 12 }}>
                {[
                  { campo: "ID", exemplo: "SENSOR-UMIDADE-00001", cor: COR_SOLO },
                  { campo: "Nome", exemplo: "Sensor Umidade Talhão 3", cor: COR_AMBIENTE },
                  { campo: "Tipo", exemplo: "Solo / Ambiente / Água", cor: COR_AGUA },
                  { campo: "Modelo", exemplo: "Sentek Drill & Drop", cor: COR_IRRIGACAO },
                  { campo: "Fabricante", exemplo: "Sentek Technologies", cor: COR_DRONE },
                  { campo: "Localização", exemplo: "Lat -15.7801, Lon -47.9292", cor: COR_TELEMETRIA },
                  { campo: "Propriedade", exemplo: "Fazenda Boa Vista", cor: COR_HEADER },
                  { campo: "Status", exemplo: "Ativo / Inativo / Manutenção", cor: "#455A64" },
                ].map((c, i) => (
                  <View key={i} style={[styles.campoRow, { backgroundColor: c.cor + "08", borderColor: c.cor + "20" }]}>
                    <Text style={[styles.campoNome, { color: c.cor }]}>{c.campo}</Text>
                    <Text style={[styles.campoExemplo, { color: colors.muted }]}>{c.exemplo}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Banco de dados IoT */}
            <View style={[styles.card, { backgroundColor: "#0A0A1A", padding: 16 }]}>
              <Text style={{ color: "#A5D6A7", fontSize: 13, fontWeight: "700", marginBottom: 12 }}>
                Tabelas do Banco IoT
              </Text>
              <View style={{ gap: 6 }}>
                {[
                  { tabela: "dispositivos", desc: "Cadastro de todos os dispositivos IoT", cor: COR_SOLO },
                  { tabela: "sensores", desc: "Configuração e metadados dos sensores", cor: COR_AMBIENTE },
                  { tabela: "leituras", desc: "Dados brutos de todas as leituras", cor: COR_AGUA },
                  { tabela: "alertas", desc: "Alertas gerados e histórico", cor: COR_ALERTA },
                  { tabela: "estacoes_meteorologicas", desc: "Dados das estações de campo", cor: COR_IRRIGACAO },
                  { tabela: "irrigacao", desc: "Eventos e controle de irrigação", cor: "#1565C0" },
                  { tabela: "drones", desc: "Missões e imagens de drones", cor: COR_DRONE },
                  { tabela: "telemetria", desc: "Dados de equipamentos e bombas", cor: COR_TELEMETRIA },
                ].map((t, i) => (
                  <View key={i} style={[styles.tabelaRow, { borderLeftColor: t.cor, borderLeftWidth: 3 }]}>
                    <Text style={[styles.tabelaNome, { color: t.cor }]}>{t.tabela}</Text>
                    <Text style={[styles.tabelaDesc, { color: "#9E9E9E" }]}>{t.desc}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Escalabilidade */}
            <View style={[styles.card, { backgroundColor: COR_HEADER + "10", borderColor: COR_HEADER + "30", padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: COR_HEADER }]}>📈 Escalabilidade</Text>
              <View style={styles.escalaGrid}>
                {[
                  { meta: "100.000", label: "Sensores", icone: "📡" },
                  { meta: "10.000", label: "Propriedades", icone: "🏡" },
                  { meta: "1 bilhão", label: "Leituras históricas", icone: "🗄" },
                ].map((e, i) => (
                  <View key={i} style={[styles.escalaCard, { backgroundColor: COR_HEADER + "15", borderColor: COR_HEADER + "30" }]}>
                    <Text style={{ fontSize: 28, textAlign: "center" }}>{e.icone}</Text>
                    <Text style={[styles.escalaMeta, { color: COR_HEADER }]}>{e.meta}</Text>
                    <Text style={[styles.escalaLabel, { color: colors.muted }]}>{e.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── IRRIGAÇÃO ─── */}
        {abaAtiva === "irrigacao" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: COR_IRRIGACAO }]}>
              <Text style={styles.infoTitle}>Irrigação Inteligente</Text>
              <Text style={styles.infoSubtitle}>Automação · Decisão por IA · Economia de água · Controle remoto</Text>
            </View>

            {/* Entradas e saídas */}
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={[styles.card, { flex: 1, backgroundColor: COR_IRRIGACAO + "10", borderColor: COR_IRRIGACAO + "30", padding: 12 }]}>
                <Text style={[styles.sectionTitle, { color: COR_IRRIGACAO }]}>📥 Entradas</Text>
                <View style={{ gap: 6, marginTop: 8 }}>
                  {["Umidade do solo", "Dados climáticos", "Cultura atual", "Estágio de desenvolvimento", "Previsão do tempo"].map((e, i) => (
                    <View key={i} style={styles.entradaRow}>
                      <View style={[styles.entradaDot, { backgroundColor: COR_IRRIGACAO }]} />
                      <Text style={[styles.entradaText, { color: colors.foreground }]}>{e}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={[styles.card, { flex: 1, backgroundColor: "#2E7D32" + "10", borderColor: "#2E7D32" + "30", padding: 12 }]}>
                <Text style={[styles.sectionTitle, { color: "#2E7D32" }]}>📤 Saídas</Text>
                <View style={{ gap: 6, marginTop: 8 }}>
                  {["Iniciar irrigação", "Parar irrigação", "Ajustar vazão", "Gerar alerta"].map((s, i) => (
                    <View key={i} style={styles.entradaRow}>
                      <View style={[styles.entradaDot, { backgroundColor: "#2E7D32" }]} />
                      <Text style={[styles.entradaText, { color: colors.foreground }]}>{s}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Fluxo de decisão */}
            <View style={[styles.card, { backgroundColor: "#0A0A1A", padding: 16 }]}>
              <Text style={{ color: "#90CAF9", fontSize: 13, fontWeight: "700", marginBottom: 12 }}>
                Fluxo de Decisão da IA
              </Text>
              {[
                { etapa: "1", label: "Leitura dos sensores de umidade", cor: COR_SOLO },
                { etapa: "2", label: "Consulta previsão do tempo (72h)", cor: COR_AMBIENTE },
                { etapa: "3", label: "Verifica estágio fenológico da cultura", cor: "#2E7D32" },
                { etapa: "4", label: "Calcula necessidade hídrica (ETc)", cor: COR_IRRIGACAO },
                { etapa: "5", label: "Compara com disponibilidade do solo", cor: "#6A1B9A" },
                { etapa: "6", label: "Decide: irrigar / aguardar / alertar", cor: COR_TELEMETRIA },
                { etapa: "7", label: "Envia comando ao controlador", cor: "#F57F17" },
                { etapa: "8", label: "Registra evento e notifica produtor", cor: "#455A64" },
              ].map((e, i) => (
                <View key={i} style={styles.fluxoRow}>
                  <View style={[styles.fluxoNum, { backgroundColor: e.cor }]}>
                    <Text style={styles.fluxoNumText}>{e.etapa}</Text>
                  </View>
                  <Text style={[styles.fluxoLabel, { color: "#E0E0E0" }]}>{e.label}</Text>
                </View>
              ))}
            </View>

            {/* Telemetria de equipamentos */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>⚙️ Telemetria de Equipamentos</Text>
              <View style={{ gap: 10, marginTop: 12 }}>
                {[
                  { equip: "Bombas", indicadores: ["Consumo kWh", "Horas de operação", "Falhas"], icone: "🔧", cor: COR_TELEMETRIA },
                  { equip: "Motores", indicadores: ["Temperatura", "Vibração", "Corrente"], icone: "⚙️", cor: "#455A64" },
                  { equip: "Geradores", indicadores: ["Combustível", "Potência", "Horas"], icone: "🔋", cor: "#F57F17" },
                  { equip: "Painéis Solares", indicadores: ["Geração kWh", "Eficiência", "Temperatura"], icone: "☀️", cor: "#F9A825" },
                  { equip: "Reservatórios", indicadores: ["Nível %", "Volume m³", "Vazão"], icone: "🏊", cor: COR_AGUA },
                ].map((e, i) => (
                  <View key={i} style={[styles.equipRow, { backgroundColor: e.cor + "08", borderColor: e.cor + "20" }]}>
                    <Text style={{ fontSize: 22 }}>{e.icone}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.equipNome, { color: e.cor }]}>{e.equip}</Text>
                      <Text style={[styles.equipIndicadores, { color: colors.muted }]}>{e.indicadores.join(" · ")}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── DRONES ─── */}
        {abaAtiva === "drones" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: COR_DRONE }]}>
              <Text style={styles.infoTitle}>Drones e Imagens Aéreas</Text>
              <Text style={styles.infoSubtitle}>Mapeamento · NDVI · Pulverização · RGB · Multiespectral · Termográfica</Text>
            </View>

            {/* Funções dos drones */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>🚁 Funções dos Drones</Text>
              <View style={styles.droneGrid}>
                {FUNCOES_DRONE.map((f, i) => (
                  <View key={i} style={[styles.droneCard, { backgroundColor: COR_DRONE + "10", borderColor: COR_DRONE + "30" }]}>
                    <Text style={{ fontSize: 28, textAlign: "center" }}>{f.icone}</Text>
                    <Text style={[styles.droneNome, { color: COR_DRONE }]}>{f.nome}</Text>
                    <Text style={[styles.droneDesc, { color: colors.muted }]}>{f.desc}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Tipos de imagem */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>📸 Tipos de Imagem Aérea</Text>
              <View style={{ gap: 10, marginTop: 12 }}>
                {[
                  { tipo: "RGB", desc: "Imagem colorida de alta resolução para inspeção visual", aplicacoes: ["Falhas de plantio", "Infraestrutura", "Danos visíveis"], cor: "#1565C0", icone: "🖼" },
                  { tipo: "Multiespectral", desc: "Captura bandas além do visível para análise de vegetação", aplicacoes: ["NDVI", "NDRE", "Vigor vegetativo"], cor: "#2E7D32", icone: "🌈" },
                  { tipo: "Termográfica", desc: "Mapa de temperatura para detecção de estresse hídrico", aplicacoes: ["Estresse hídrico", "Doenças", "Irrigação"], cor: "#C62828", icone: "🌡" },
                  { tipo: "NDVI", desc: "Índice de vegetação por diferença normalizada (0 a 1)", aplicacoes: ["Biomassa", "Saúde da cultura", "Produtividade"], cor: "#558B2F", icone: "🟢" },
                ].map((t, i) => (
                  <View key={i} style={[styles.imagemCard, { backgroundColor: t.cor + "08", borderColor: t.cor + "20", borderLeftWidth: 4, borderLeftColor: t.cor }]}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <Text style={{ fontSize: 24 }}>{t.icone}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.imagemTipo, { color: t.cor }]}>{t.tipo}</Text>
                        <Text style={[styles.imagemDesc, { color: colors.muted }]}>{t.desc}</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                      {t.aplicacoes.map((a, j) => (
                        <View key={j} style={[styles.aplicacaoChip, { backgroundColor: t.cor + "15" }]}>
                          <Text style={[styles.aplicacaoText, { color: t.cor }]}>{a}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Mapa inteligente */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>🗺 Mapa Inteligente da Propriedade</Text>
              <Text style={[styles.sectionDesc, { color: colors.muted }]}>Visualização geográfica com camadas sobrepostas:</Text>
              <View style={{ gap: 8, marginTop: 12 }}>
                {[
                  { camada: "Talhões", desc: "Divisão e identificação de cada talhão", cor: COR_SOLO },
                  { camada: "Culturas", desc: "Cultura plantada e fase fenológica", cor: "#2E7D32" },
                  { camada: "Sensores", desc: "Localização e status dos dispositivos IoT", cor: COR_AMBIENTE },
                  { camada: "Irrigação", desc: "Cobertura e eficiência do sistema", cor: COR_IRRIGACAO },
                  { camada: "Drones", desc: "Missões realizadas e imagens capturadas", cor: COR_DRONE },
                  { camada: "Alertas", desc: "Pontos de atenção e alertas ativos", cor: COR_ALERTA },
                ].map((c, i) => (
                  <View key={i} style={[styles.camadaRow, { borderLeftColor: c.cor, borderLeftWidth: 3 }]}>
                    <Text style={[styles.camadaNome, { color: c.cor }]}>{c.camada}</Text>
                    <Text style={[styles.camadaDesc, { color: colors.muted }]}>{c.desc}</Text>
                  </View>
                ))}
              </View>
              <View style={[styles.tecnologiasRow, { marginTop: 12 }]}>
                {["GPS", "GIS", "Mapas Satelitais"].map((t, i) => (
                  <View key={i} style={[styles.tecnologiaChip, { backgroundColor: COR_HEADER + "15" }]}>
                    <Text style={[styles.tecnologiaText, { color: COR_HEADER }]}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── ALERTAS ─── */}
        {abaAtiva === "alertas" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: COR_ALERTA }]}>
              <Text style={styles.infoTitle}>Sistema de Alertas</Text>
              <Text style={styles.infoSubtitle}>Agrícolas (6) · Operacionais (4) · Push · SMS · E-mail · WhatsApp</Text>
            </View>

            {/* Alertas agrícolas */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>🌾 Alertas Agrícolas</Text>
              <View style={{ gap: 8, marginTop: 12 }}>
                {ALERTAS_AGRICOLAS.map((a, i) => (
                  <View key={i} style={[styles.alertaCard, { backgroundColor: a.cor + "08", borderColor: a.cor + "20", borderLeftWidth: 4, borderLeftColor: a.cor }]}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Text style={[styles.alertaNome, { color: a.cor }]}>{a.nome}</Text>
                      <View style={[styles.nivelBadge, { backgroundColor: a.cor }]}>
                        <Text style={styles.nivelText}>{a.nivel}</Text>
                      </View>
                    </View>
                    <Text style={[styles.alertaDesc, { color: colors.muted }]}>{a.desc}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Alertas operacionais */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>⚙️ Alertas Operacionais</Text>
              <View style={{ gap: 8, marginTop: 12 }}>
                {ALERTAS_OPERACIONAIS.map((a, i) => (
                  <View key={i} style={[styles.alertaCard, { backgroundColor: a.cor + "08", borderColor: a.cor + "20", borderLeftWidth: 4, borderLeftColor: a.cor }]}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Text style={[styles.alertaNome, { color: a.cor }]}>{a.nome}</Text>
                      <View style={[styles.nivelBadge, { backgroundColor: a.cor }]}>
                        <Text style={styles.nivelText}>{a.nivel}</Text>
                      </View>
                    </View>
                    <Text style={[styles.alertaDesc, { color: colors.muted }]}>{a.desc}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Canais de notificação */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>📢 Canais de Notificação</Text>
              <View style={styles.canaisGrid}>
                {[
                  { canal: "Push", icone: "📱", cor: COR_HEADER },
                  { canal: "SMS", icone: "💬", cor: COR_AMBIENTE },
                  { canal: "E-mail", icone: "📧", cor: COR_IRRIGACAO },
                  { canal: "WhatsApp", icone: "📲", cor: "#2E7D32" },
                ].map((c, i) => (
                  <View key={i} style={[styles.canalCard, { backgroundColor: c.cor + "10", borderColor: c.cor + "30" }]}>
                    <Text style={{ fontSize: 28, textAlign: "center" }}>{c.icone}</Text>
                    <Text style={[styles.canalNome, { color: c.cor }]}>{c.canal}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Segurança IoT */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>🔒 Segurança IoT</Text>
              <View style={{ gap: 8, marginTop: 12 }}>
                {["TLS (Transport Layer Security)", "MQTT com autenticação segura", "Tokens únicos por dispositivo", "Criptografia end-to-end", "Logs de auditoria completos", "Backup contínuo dos dados"].map((s, i) => (
                  <View key={i} style={styles.segRow}>
                    <Text style={{ color: "#2E7D32", fontSize: 14 }}>🔐</Text>
                    <Text style={[styles.segText, { color: colors.foreground }]}>{s}</Text>
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
              <Text style={styles.infoTitle}>Dashboard em Tempo Real</Text>
              <Text style={styles.infoSubtitle}>7 painéis · Clima · Solo · Água · Irrigação · Equipamentos · Alertas · Produção</Text>
            </View>

            {/* Painéis */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>📊 Painéis do Dashboard</Text>
              <View style={{ gap: 10, marginTop: 12 }}>
                {[
                  { painel: "Clima", desc: "Temperatura, umidade, chuva, vento e radiação solar em tempo real", icone: "🌤", cor: COR_AMBIENTE },
                  { painel: "Solo", desc: "Umidade, temperatura, pH e CE de todos os sensores ativos", icone: "🌱", cor: COR_SOLO },
                  { painel: "Água", desc: "Nível dos reservatórios, vazão e qualidade da água", icone: "💧", cor: COR_AGUA },
                  { painel: "Irrigação", desc: "Status dos sistemas, consumo e eficiência hídrica", icone: "🚿", cor: COR_IRRIGACAO },
                  { painel: "Equipamentos", desc: "Telemetria de bombas, motores e painéis solares", icone: "⚙️", cor: COR_TELEMETRIA },
                  { painel: "Alertas", desc: "Alertas ativos, histórico e ações tomadas", icone: "🚨", cor: COR_ALERTA },
                  { painel: "Produção", desc: "Estimativas de produtividade e previsão de colheita", icone: "🌾", cor: "#2E7D32" },
                ].map((p, i) => (
                  <View key={i} style={[styles.painelRow, { backgroundColor: p.cor + "08", borderColor: p.cor + "20" }]}>
                    <Text style={{ fontSize: 24 }}>{p.icone}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.painelNome, { color: p.cor }]}>{p.painel}</Text>
                      <Text style={[styles.painelDesc, { color: colors.muted }]}>{p.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* IA Preditiva */}
            <View style={[styles.card, { backgroundColor: "#6A1B9A" + "10", borderColor: "#6A1B9A" + "30", padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: "#6A1B9A" }]}>🧠 Inteligência Preditiva</Text>
              <View style={{ gap: 8, marginTop: 12 }}>
                <Text style={[styles.sectionDesc, { color: colors.muted }]}>A IA combina múltiplas fontes para previsões precisas:</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                  {["Sensores IoT", "Dados climáticos", "Histórico da propriedade", "Imagens de drones", "Análises laboratoriais"].map((f, i) => (
                    <View key={i} style={[styles.fonteChip, { backgroundColor: "#6A1B9A" + "15" }]}>
                      <Text style={[styles.fonteChipText, { color: "#6A1B9A" }]}>{f}</Text>
                    </View>
                  ))}
                </View>
                <Text style={[styles.tipoSubtitle, { color: "#6A1B9A", marginTop: 8 }]}>Previsões geradas:</Text>
                {["Doenças (7 dias de antecedência)", "Pragas (risco por zona)", "Necessidade hídrica (ETc diária)", "Produtividade estimada (t/ha)", "Falhas operacionais (manutenção preditiva)"].map((p, i) => (
                  <View key={i} style={styles.previsaoRow}>
                    <Text style={{ color: "#6A1B9A", fontSize: 14 }}>🔮</Text>
                    <Text style={[styles.previsaoText, { color: colors.foreground }]}>{p}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* App mobile */}
            <View style={[styles.card, { backgroundColor: "#2E7D32" + "10", borderColor: "#2E7D32" + "30", padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: "#2E7D32" }]}>📱 Recursos no App Mobile</Text>
              <View style={{ gap: 8, marginTop: 12 }}>
                {[
                  "Visualizar leituras em tempo real",
                  "Receber alertas push instantâneos",
                  "Controlar irrigação remotamente",
                  "Visualizar mapas e imagens de drones",
                  "Acompanhar status dos sensores",
                ].map((r, i) => (
                  <View key={i} style={styles.recursoRow}>
                    <Text style={{ color: "#2E7D32", fontSize: 14 }}>✅</Text>
                    <Text style={[styles.recursoText, { color: colors.foreground }]}>{r}</Text>
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
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },
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
  diagramaBox: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, minWidth: 220, alignItems: "center", marginVertical: 1 },
  diagramaText: { fontSize: 12, fontWeight: "600" },
  grupoHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 10 },
  grupoIcone: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  grupoNome: { fontSize: 14, fontWeight: "700" },
  grupoTotal: { fontSize: 11, marginTop: 2 },
  grupoBody: { borderTopWidth: StyleSheet.hairlineWidth, padding: 12, gap: 4 },
  sensorRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  sensorNome: { fontSize: 13, fontWeight: "600" },
  sensorDesc: { fontSize: 11 },
  unidadeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  unidadeText: { fontSize: 11, fontWeight: "700" },
  ambienteGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, padding: 12 },
  ambienteCard: { borderRadius: 10, borderWidth: 1, padding: 10, width: "47%", alignItems: "center", gap: 4 },
  ambienteNome: { fontSize: 11, fontWeight: "600", textAlign: "center" },
  ambienteUnidade: { fontSize: 11, fontWeight: "700" },
  freqGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  freqChip: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  freqText: { fontSize: 12, fontWeight: "700" },
  protocoloCard: { borderRadius: 12, borderWidth: 1, padding: 12 },
  protocoloHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  protocoloNome: { fontSize: 15, fontWeight: "800" },
  protocoloDesc: { fontSize: 12 },
  protocoloUso: { marginTop: 8, padding: 6, borderRadius: 6 },
  protocoloUsoText: { fontSize: 11, fontWeight: "600" },
  campoRow: { borderRadius: 8, borderWidth: 1, padding: 8, flexDirection: "row", alignItems: "center", gap: 8 },
  campoNome: { fontSize: 12, fontWeight: "700", width: 100 },
  campoExemplo: { fontSize: 11, flex: 1 },
  tabelaRow: { paddingLeft: 10, paddingVertical: 6, gap: 2 },
  tabelaNome: { fontSize: 12, fontWeight: "700", fontFamily: "monospace" },
  tabelaDesc: { fontSize: 11 },
  escalaGrid: { flexDirection: "row", gap: 8, marginTop: 12 },
  escalaCard: { flex: 1, borderRadius: 10, borderWidth: 1, padding: 10, alignItems: "center", gap: 4 },
  escalaMeta: { fontSize: 14, fontWeight: "900", textAlign: "center" },
  escalaLabel: { fontSize: 10, textAlign: "center" },
  entradaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  entradaDot: { width: 6, height: 6, borderRadius: 3 },
  entradaText: { fontSize: 12 },
  fluxoRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 5 },
  fluxoNum: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  fluxoNumText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  fluxoLabel: { fontSize: 12 },
  equipRow: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 10, borderWidth: 1, padding: 10 },
  equipNome: { fontSize: 13, fontWeight: "700" },
  equipIndicadores: { fontSize: 11 },
  droneGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  droneCard: { borderRadius: 10, borderWidth: 1, padding: 10, width: "48%", alignItems: "center", gap: 4 },
  droneNome: { fontSize: 12, fontWeight: "700", textAlign: "center" },
  droneDesc: { fontSize: 10, textAlign: "center" },
  imagemCard: { borderRadius: 10, borderWidth: 1, padding: 12 },
  imagemTipo: { fontSize: 14, fontWeight: "800" },
  imagemDesc: { fontSize: 11 },
  aplicacaoChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  aplicacaoText: { fontSize: 10, fontWeight: "600" },
  camadaRow: { paddingLeft: 10, paddingVertical: 6, gap: 2 },
  camadaNome: { fontSize: 13, fontWeight: "700" },
  camadaDesc: { fontSize: 11 },
  tecnologiasRow: { flexDirection: "row", gap: 8 },
  tecnologiaChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  tecnologiaText: { fontSize: 12, fontWeight: "700" },
  alertaCard: { borderRadius: 10, borderWidth: 1, padding: 10, gap: 4 },
  alertaNome: { fontSize: 13, fontWeight: "700", flex: 1 },
  alertaDesc: { fontSize: 11 },
  nivelBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  nivelText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  canaisGrid: { flexDirection: "row", gap: 8, marginTop: 12 },
  canalCard: { flex: 1, borderRadius: 10, borderWidth: 1, padding: 10, alignItems: "center", gap: 4 },
  canalNome: { fontSize: 12, fontWeight: "700" },
  segRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  segText: { fontSize: 12 },
  painelRow: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 10, borderWidth: 1, padding: 10 },
  painelNome: { fontSize: 13, fontWeight: "700" },
  painelDesc: { fontSize: 11 },
  fonteChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  fonteChipText: { fontSize: 11, fontWeight: "600" },
  tipoSubtitle: { fontSize: 12, fontWeight: "600" },
  previsaoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  previsaoText: { fontSize: 12 },
  recursoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  recursoText: { fontSize: 12 },
});
