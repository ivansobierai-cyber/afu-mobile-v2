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

type Aba = "modulos" | "estrutura" | "fontes" | "ia" | "stats";

const COR_BC = "#1B5E20";
const COR_BC_CLARA = "#43A047";
const COR_VERDE = "#2E7D32";
const COR_AZUL = "#1565C0";
const COR_LARANJA = "#EF6C00";
const COR_TEAL = "#00695C";
const COR_VERMELHO = "#C62828";
const COR_IA = "#6A1B9A";
const COR_MARROM = "#4E342E";

const MODULOS = [
  {
    id: "BC-01",
    nome: "Banco de Culturas",
    icone: "🌾",
    cor: COR_VERDE,
    meta: "300+ culturas",
    desc: "Informações técnicas completas das culturas agrícolas brasileiras e mundiais.",
    campos: ["Nome comum e científico", "Família botânica e origem", "Ciclo e exigência hídrica", "Exigência nutricional", "Temperatura e altitude ideal", "pH ideal e espaçamento", "Produtividade média", "Principais pragas e doenças"],
    categorias: ["Grãos", "Frutíferas", "Hortaliças", "Florestais", "Medicinais", "Ornamentais", "Forrageiras"],
  },
  {
    id: "BC-02",
    nome: "Banco de Pragas",
    icone: "🐛",
    cor: COR_LARANJA,
    meta: "1.000+ registros",
    desc: "Base completa de pragas para auxiliar diagnóstico visual e manejo fitossanitário.",
    campos: ["Nome popular e científico", "Grupo biológico", "Culturas afetadas", "Sintomas e danos", "Nível de risco", "Métodos de controle", "Fotos e vídeos"],
    categorias: ["Lagarta-do-cartucho", "Mosca-branca", "Pulgões", "Ácaros", "Percevejos"],
  },
  {
    id: "BC-03",
    nome: "Banco de Doenças",
    icone: "🦠",
    cor: COR_VERMELHO,
    meta: "1.500+ registros",
    desc: "Identificação fitopatológica com agentes causais, sintomas e condições favoráveis.",
    campos: ["Nome e agente causal", "Tipo (fungo/bactéria/vírus)", "Culturas afetadas", "Sintomas visuais", "Condições favoráveis", "Métodos de controle", "Fotos e vídeos"],
    categorias: ["Fungos", "Bactérias", "Vírus", "Nematoides", "Fitoplasmas"],
  },
  {
    id: "BC-04",
    nome: "Nutrição Vegetal",
    icone: "🧪",
    cor: COR_TEAL,
    meta: "500+ registros",
    desc: "Macro e micronutrientes com funções, deficiências, excessos e correções.",
    campos: ["Função do nutriente", "Sintomas de deficiência", "Sintomas de excesso", "Métodos de correção", "Fotos de sintomas"],
    categorias: ["N, P, K, Ca, Mg, S (Macro)", "Zn, B, Cu, Fe, Mn, Mo, Cl, Ni (Micro)"],
  },
  {
    id: "BC-05",
    nome: "Banco de Solos",
    icone: "🌱",
    cor: COR_MARROM,
    meta: "Classes regionais",
    desc: "Classes de solo brasileiras com características físico-químicas e recomendações.",
    campos: ["Classe e textura", "pH e CTC", "Matéria orgânica", "Capacidade de retenção", "Limitações", "Recomendações"],
    categorias: ["Arenoso", "Franco Arenoso", "Franco", "Argiloso", "Muito Argiloso"],
  },
  {
    id: "BC-06",
    nome: "Banco Climático",
    icone: "🌤",
    cor: COR_AZUL,
    meta: "Séries históricas",
    desc: "Dados agroclimáticos para irrigação, previsão agrícola e alertas climáticos.",
    campos: ["Temperatura (min/med/max)", "Precipitação mensal", "Umidade relativa", "Velocidade do vento", "Evapotranspiração (ETP)", "Altitude"],
    categorias: ["Irrigação", "Previsão agrícola", "Alertas climáticos"],
  },
  {
    id: "BC-07",
    nome: "Legislação e Certificações",
    icone: "📜",
    cor: COR_IA,
    meta: "Atualizado continuamente",
    desc: "Normas, boas práticas e certificações agrícolas nacionais e internacionais.",
    campos: ["Normas agrícolas", "Boas práticas", "Certificações", "Legislação ambiental", "Legislação sanitária", "Legislação trabalhista"],
    categorias: ["Orgânico", "GlobalG.A.P.", "Fair Trade", "Rainforest Alliance"],
  },
  {
    id: "BC-08",
    nome: "Manejo e Sustentabilidade",
    icone: "♻️",
    cor: COR_BC_CLARA,
    meta: "Práticas sustentáveis",
    desc: "Técnicas de manejo sustentável com descrição, benefícios, custos e passo a passo.",
    campos: ["Descrição da prática", "Benefícios ambientais", "Custos estimados", "Passo a passo", "Vídeos e materiais"],
    categorias: ["Plantio direto", "Adubação verde", "Compostagem", "Bioinsumos", "Controle biológico", "Economia circular", "Conservação do solo", "Conservação da água"],
  },
];

const TABELAS_RELACIONAIS = [
  { nome: "culturas", campos: 14, icone: "🌾", cor: COR_VERDE },
  { nome: "pragas", campos: 10, icone: "🐛", cor: COR_LARANJA },
  { nome: "doencas", campos: 9, icone: "🦠", cor: COR_VERMELHO },
  { nome: "nutrientes", campos: 6, icone: "🧪", cor: COR_TEAL },
  { nome: "solos", campos: 8, icone: "🌱", cor: COR_MARROM },
  { nome: "climas", campos: 6, icone: "🌤", cor: COR_AZUL },
  { nome: "certificacoes", campos: 5, icone: "🏅", cor: COR_IA },
  { nome: "legislacoes", campos: 5, icone: "📜", cor: COR_IA },
  { nome: "manejos", campos: 7, icone: "♻️", cor: COR_BC_CLARA },
];

const TECNOLOGIAS_VETORIAIS = [
  { nome: "pgvector", desc: "Extensão PostgreSQL para busca vetorial integrada ao banco relacional", cor: COR_AZUL },
  { nome: "Qdrant", desc: "Banco vetorial de alta performance para busca semântica em escala", cor: COR_VERDE },
  { nome: "Weaviate", desc: "Banco vetorial com suporte a RAG e multimodalidade (texto + imagem)", cor: COR_IA },
];

const FONTES = [
  { nome: "EMBRAPA", url: "embrapa.br", desc: "Empresa Brasileira de Pesquisa Agropecuária — principal fonte de dados fitossanitários", cor: COR_VERDE, tipo: "Nacional" },
  { nome: "MAPA", url: "gov.br/agricultura", desc: "Ministério da Agricultura — legislação, registros de defensivos e certificações", cor: COR_AZUL, tipo: "Nacional" },
  { nome: "FAO", url: "fao.org", desc: "Organização das Nações Unidas para Alimentação e Agricultura — dados globais", cor: COR_TEAL, tipo: "Internacional" },
  { nome: "INMET", url: "inmet.gov.br", desc: "Instituto Nacional de Meteorologia — séries históricas climáticas", cor: COR_AZUL, tipo: "Nacional" },
  { nome: "IAC", url: "iac.sp.gov.br", desc: "Instituto Agronômico de Campinas — solos, culturas e fitossanidade", cor: COR_LARANJA, tipo: "Nacional" },
  { nome: "Universidades", url: "USP, UNICAMP, UFLA...", desc: "Publicações científicas, teses e dissertações agronômicas", cor: COR_IA, tipo: "Acadêmico" },
];

const FLUXO_RAG = [
  { etapa: "1", nome: "Pergunta do usuário", desc: "Produtor faz pergunta em linguagem natural via app ou web", icone: "💬", cor: COR_AZUL },
  { etapa: "2", nome: "Busca no banco vetorial", desc: "Query é convertida em embedding e buscada por similaridade semântica", icone: "🔍", cor: COR_TEAL },
  { etapa: "3", nome: "Recuperação de conhecimento", desc: "Top-K documentos mais relevantes são recuperados do banco agronômico", icone: "📚", cor: COR_BC },
  { etapa: "4", nome: "IA analisa contexto", desc: "LLM recebe pergunta + contexto recuperado (RAG) para gerar resposta", icone: "🧠", cor: COR_IA },
  { etapa: "5", nome: "Resposta técnica", desc: "Resposta especializada em agronomia, em português, com fontes citadas", icone: "📋", cor: COR_VERDE },
  { etapa: "6", nome: "Registro da consulta", desc: "Consulta registrada para auditoria, melhoria contínua e histórico", icone: "📝", cor: COR_LARANJA },
];

export default function BancoConhecimentoScreen() {
  const colors = useColors();
  const router = useRouter();
  const [abaAtiva, setAbaAtiva] = useState<Aba>("modulos");
  const [moduloExpandido, setModuloExpandido] = useState<string | null>("BC-01");

  const abas: { id: Aba; label: string }[] = [
    { id: "modulos", label: "Módulos" },
    { id: "estrutura", label: "Estrutura" },
    { id: "fontes", label: "Fontes" },
    { id: "ia", label: "IA/RAG" },
    { id: "stats", label: "Resumo" },
  ];

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: COR_BC }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>📚 Banco de Conhecimento</Text>
          <Text style={styles.headerSubtitle}>Etapa 12 · 8 módulos · 3.300+ registros · RAG + pgvector</Text>
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
            style={[styles.tab, abaAtiva === aba.id && { borderBottomColor: COR_BC, borderBottomWidth: 2 }]}
            onPress={() => setAbaAtiva(aba.id)}
          >
            <Text style={[styles.tabText, { color: abaAtiva === aba.id ? COR_BC : colors.muted }]}>
              {aba.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>

        {/* ─── MÓDULOS ─── */}
        {abaAtiva === "modulos" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: COR_BC }]}>
              <Text style={styles.infoTitle}>8 Módulos do Banco de Conhecimento</Text>
              <Text style={styles.infoSubtitle}>BC-01 a BC-08 · Memória técnica do sistema AFU</Text>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              {[
                { label: "Culturas", valor: "300+", cor: COR_VERDE },
                { label: "Pragas", valor: "1.000+", cor: COR_LARANJA },
                { label: "Doenças", valor: "1.500+", cor: COR_VERMELHO },
                { label: "Nutrientes", valor: "500+", cor: COR_TEAL },
              ].map((s) => (
                <View key={s.label} style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.statValor, { color: s.cor }]}>{s.valor}</Text>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>{s.label}</Text>
                </View>
              ))}
            </View>

            {MODULOS.map((mod) => (
              <View key={mod.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TouchableOpacity
                  style={styles.modHeader}
                  onPress={() => setModuloExpandido(moduloExpandido === mod.id ? null : mod.id)}
                >
                  <View style={[styles.modBadge, { backgroundColor: mod.cor }]}>
                    <Text style={styles.modBadgeText}>{mod.id}</Text>
                  </View>
                  <View style={[styles.modIcone, { backgroundColor: mod.cor + "20" }]}>
                    <Text style={{ fontSize: 22 }}>{mod.icone}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.modNome, { color: mod.cor }]}>{mod.nome}</Text>
                    <View style={[styles.metaBadge, { backgroundColor: mod.cor + "20" }]}>
                      <Text style={[styles.metaText, { color: mod.cor }]}>{mod.meta}</Text>
                    </View>
                  </View>
                  <Text style={{ color: colors.muted, fontSize: 16 }}>
                    {moduloExpandido === mod.id ? "▲" : "▼"}
                  </Text>
                </TouchableOpacity>

                {moduloExpandido === mod.id && (
                  <View style={[styles.modBody, { borderTopColor: colors.border }]}>
                    <Text style={[styles.modDesc, { color: colors.foreground }]}>{mod.desc}</Text>

                    <View style={styles.ioRow}>
                      <View style={[styles.ioBox, { backgroundColor: mod.cor + "08", borderColor: mod.cor + "30" }]}>
                        <Text style={[styles.ioTitulo, { color: mod.cor }]}>📋 Campos</Text>
                        {mod.campos.map((c, i) => (
                          <View key={i} style={styles.ioItem}>
                            <View style={[styles.ioDot, { backgroundColor: mod.cor }]} />
                            <Text style={[styles.ioText, { color: colors.foreground }]}>{c}</Text>
                          </View>
                        ))}
                      </View>
                      <View style={[styles.ioBox, { backgroundColor: COR_AZUL + "08", borderColor: COR_AZUL + "30" }]}>
                        <Text style={[styles.ioTitulo, { color: COR_AZUL }]}>🏷 Categorias</Text>
                        {mod.categorias.map((c, i) => (
                          <View key={i} style={styles.ioItem}>
                            <View style={[styles.ioDot, { backgroundColor: COR_AZUL }]} />
                            <Text style={[styles.ioText, { color: colors.foreground }]}>{c}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ─── ESTRUTURA ─── */}
        {abaAtiva === "estrutura" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: COR_BC }]}>
              <Text style={styles.infoTitle}>Estrutura Física do Banco</Text>
              <Text style={styles.infoSubtitle}>Relacional (MySQL/PostgreSQL) + Vetorial (pgvector/Qdrant)</Text>
            </View>

            {/* Banco Relacional */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: COR_AZUL }]}>🗄 Banco Relacional</Text>
              <Text style={[styles.sectionDesc, { color: colors.muted }]}>
                9 tabelas principais para armazenamento estruturado de dados agronômicos
              </Text>
              <View style={{ gap: 8, marginTop: 12 }}>
                {TABELAS_RELACIONAIS.map((t, idx) => (
                  <View key={idx} style={[styles.tabelaRow, { backgroundColor: t.cor + "10", borderColor: t.cor + "30" }]}>
                    <Text style={{ fontSize: 18 }}>{t.icone}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.tabelaNome, { color: t.cor }]}>{t.nome}</Text>
                    </View>
                    <View style={[styles.camposBadge, { backgroundColor: t.cor + "20" }]}>
                      <Text style={[styles.camposText, { color: t.cor }]}>{t.campos} campos</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Banco Vetorial */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: COR_IA }]}>🔮 Banco Vetorial (IA)</Text>
              <Text style={[styles.sectionDesc, { color: colors.muted }]}>
                Para busca semântica, RAG, chat agrícola e assistente técnico
              </Text>
              <View style={{ gap: 10, marginTop: 12 }}>
                {TECNOLOGIAS_VETORIAIS.map((t, idx) => (
                  <View key={idx} style={[styles.vetorialCard, { backgroundColor: t.cor + "10", borderColor: t.cor + "30" }]}>
                    <View style={[styles.vetorialBadge, { backgroundColor: t.cor }]}>
                      <Text style={styles.vetorialBadgeText}>{t.nome}</Text>
                    </View>
                    <Text style={[styles.vetorialDesc, { color: colors.muted }]}>{t.desc}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Diagrama de arquitetura */}
            <View style={[styles.card, { backgroundColor: "#0A0A1A", padding: 16 }]}>
              <Text style={{ color: "#A5D6A7", fontSize: 13, fontWeight: "700", marginBottom: 12 }}>
                Arquitetura de Dados
              </Text>
              <View style={{ gap: 6 }}>
                {[
                  { label: "📱 App / 🌐 Web / 🤖 IA", cor: COR_AZUL },
                  { label: "⬇ API / tRPC", cor: "#555" },
                  { label: "🔄 Camada de Serviço", cor: COR_TEAL },
                  { label: "⬇", cor: "#555" },
                  { label: "🗄 MySQL/PostgreSQL (Relacional)", cor: COR_VERDE },
                  { label: "🔮 pgvector / Qdrant (Vetorial)", cor: COR_IA },
                  { label: "⬇", cor: "#555" },
                  { label: "📚 Banco de Conhecimento Agronômico", cor: COR_BC_CLARA },
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

        {/* ─── FONTES ─── */}
        {abaAtiva === "fontes" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: COR_BC }]}>
              <Text style={styles.infoTitle}>Fontes Oficiais de Dados</Text>
              <Text style={styles.infoSubtitle}>Prioridade para dados técnicos de fontes reconhecidas</Text>
            </View>

            {FONTES.map((f, idx) => (
              <View key={idx} style={[styles.fonteCard, { backgroundColor: f.cor + "10", borderColor: f.cor + "30" }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <View style={[styles.fonteBadge, { backgroundColor: f.cor }]}>
                    <Text style={styles.fonteBadgeText}>{f.nome}</Text>
                  </View>
                  <View style={[styles.tipoChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.tipoText, { color: colors.muted }]}>{f.tipo}</Text>
                  </View>
                </View>
                <Text style={[styles.fonteUrl, { color: f.cor }]}>🔗 {f.url}</Text>
                <Text style={[styles.fonteDesc, { color: colors.foreground }]}>{f.desc}</Text>
              </View>
            ))}

            {/* Processo de curadoria */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: COR_BC }]}>🔬 Processo de Curadoria</Text>
              <View style={{ gap: 10, marginTop: 12 }}>
                {[
                  { etapa: "1", desc: "Coleta de dados de fontes oficiais e publicações científicas", cor: COR_AZUL },
                  { etapa: "2", desc: "Revisão técnica por agrônomos e especialistas", cor: COR_VERDE },
                  { etapa: "3", desc: "Validação cruzada entre múltiplas fontes", cor: COR_TEAL },
                  { etapa: "4", desc: "Estruturação e padronização no banco de dados", cor: COR_IA },
                  { etapa: "5", desc: "Atualização contínua com novas publicações", cor: COR_LARANJA },
                ].map((e, i) => (
                  <View key={i} style={styles.etapaRow}>
                    <View style={[styles.etapaCirculo, { backgroundColor: e.cor }]}>
                      <Text style={styles.etapaNum}>{e.etapa}</Text>
                    </View>
                    <Text style={[styles.etapaDesc, { color: colors.foreground }]}>{e.desc}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── IA/RAG ─── */}
        {abaAtiva === "ia" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: COR_BC }]}>
              <Text style={styles.infoTitle}>Integração com IA — Fluxo RAG</Text>
              <Text style={styles.infoSubtitle}>Retrieval-Augmented Generation · Busca semântica + LLM</Text>
            </View>

            {/* O que é RAG */}
            <View style={[styles.card, { backgroundColor: COR_IA + "10", borderColor: COR_IA + "30", padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: COR_IA }]}>🔮 O que é RAG?</Text>
              <Text style={[styles.ragExplicacao, { color: colors.foreground }]}>
                RAG (Retrieval-Augmented Generation) é uma técnica que combina busca semântica em banco vetorial com geração de texto por LLM. O modelo não precisa memorizar todo o conhecimento agronômico — ele busca as informações relevantes em tempo real e as usa como contexto para gerar respostas precisas.
              </Text>
            </View>

            {/* Fluxo */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 16 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Fluxo RAG do AFU</Text>
              <View style={{ gap: 0, marginTop: 12 }}>
                {FLUXO_RAG.map((etapa, idx) => (
                  <View key={idx} style={{ flexDirection: "row", gap: 12 }}>
                    <View style={{ alignItems: "center", width: 36 }}>
                      <View style={[styles.fluxoCirculo, { backgroundColor: etapa.cor }]}>
                        <Text style={styles.fluxoNumero}>{etapa.etapa}</Text>
                      </View>
                      {idx < FLUXO_RAG.length - 1 && (
                        <View style={[styles.fluxoLinha, { backgroundColor: etapa.cor + "40" }]} />
                      )}
                    </View>
                    <View style={{ flex: 1, paddingBottom: idx < FLUXO_RAG.length - 1 ? 16 : 0 }}>
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

            {/* Diagrama dark */}
            <View style={[styles.card, { backgroundColor: "#0A0A1A", padding: 16 }]}>
              <Text style={{ color: "#A5D6A7", fontSize: 13, fontWeight: "700", marginBottom: 12 }}>
                Diagrama RAG Simplificado
              </Text>
              <View style={{ gap: 6 }}>
                {[
                  { label: "💬 Pergunta do Produtor", cor: COR_AZUL },
                  { label: "⬇ Embedding (text-embedding-3)", cor: "#555" },
                  { label: "🔍 Busca Vetorial (cosine similarity)", cor: COR_TEAL },
                  { label: "⬇ Top-K documentos relevantes", cor: "#555" },
                  { label: "📚 Banco de Conhecimento Agronômico", cor: COR_BC_CLARA },
                  { label: "⬇ Contexto recuperado", cor: "#555" },
                  { label: "🧠 LLM (GPT-4 / Claude / Gemini)", cor: COR_IA },
                  { label: "⬇ Prompt = Pergunta + Contexto", cor: "#555" },
                  { label: "📋 Resposta técnica em português", cor: COR_VERDE },
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

            {/* Casos de uso */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Casos de Uso do RAG no AFU</Text>
              <View style={{ gap: 8, marginTop: 12 }}>
                {[
                  { caso: "Assistente Agrícola (IA-06)", desc: "Responde dúvidas do produtor com base no banco de conhecimento", cor: COR_IA },
                  { caso: "Diagnóstico Visual (IA-01)", desc: "Recupera fichas de pragas/doenças similares para contextualizar a análise", cor: COR_LARANJA },
                  { caso: "Solo Inteligente (IA-02)", desc: "Busca recomendações de manejo para o tipo de solo e cultura", cor: COR_VERDE },
                  { caso: "Materiais Didáticos", desc: "Sugere conteúdos relevantes baseados no histórico do produtor", cor: COR_TEAL },
                ].map((c, i) => (
                  <View key={i} style={[styles.casoCard, { backgroundColor: c.cor + "10", borderColor: c.cor + "30" }]}>
                    <Text style={[styles.casoNome, { color: c.cor }]}>{c.caso}</Text>
                    <Text style={[styles.casoDesc, { color: colors.muted }]}>{c.desc}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── RESUMO ─── */}
        {abaAtiva === "stats" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.infoCard, { backgroundColor: COR_BC }]}>
              <Text style={styles.infoTitle}>Resumo do Banco de Conhecimento</Text>
              <Text style={styles.infoSubtitle}>Visão geral dos 8 módulos e metas de conteúdo</Text>
            </View>

            {/* Total geral */}
            <View style={[styles.card, { backgroundColor: COR_BC + "10", borderColor: COR_BC + "30", padding: 16 }]}>
              <Text style={{ color: COR_BC, fontSize: 36, fontWeight: "800", textAlign: "center" }}>3.300+</Text>
              <Text style={{ color: COR_BC_CLARA, fontSize: 13, textAlign: "center", marginTop: 4 }}>
                Registros agronômicos na base de conhecimento inicial
              </Text>
            </View>

            {/* Tabela resumo */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, overflow: "hidden" }]}>
              <View style={[styles.tabelaHeader, { backgroundColor: COR_BC }]}>
                <Text style={[styles.thId, { color: "#fff" }]}>ID</Text>
                <Text style={[styles.thNome, { color: "#fff" }]}>Módulo</Text>
                <Text style={[styles.thMeta, { color: "#fff" }]}>Meta</Text>
              </View>
              {MODULOS.map((mod, idx) => (
                <View key={idx} style={[styles.tabelaLinha, { borderBottomColor: colors.border, backgroundColor: idx % 2 === 0 ? colors.surface : colors.background }]}>
                  <View style={[styles.tdId, { backgroundColor: mod.cor }]}>
                    <Text style={styles.tdIdText}>{mod.id}</Text>
                  </View>
                  <View style={styles.tdNome}>
                    <Text style={{ fontSize: 12 }}>{mod.icone}</Text>
                    <Text style={[styles.tdNomeText, { color: colors.foreground }]}>{mod.nome}</Text>
                  </View>
                  <View style={[styles.tdMeta, { backgroundColor: mod.cor + "15" }]}>
                    <Text style={[styles.tdMetaText, { color: mod.cor }]}>{mod.meta}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Tecnologias */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 14 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Stack Tecnológica</Text>
              <View style={{ gap: 8, marginTop: 12 }}>
                {[
                  { label: "Banco Relacional", valor: "MySQL / PostgreSQL", cor: COR_AZUL },
                  { label: "Banco Vetorial", valor: "pgvector + Qdrant", cor: COR_IA },
                  { label: "Embeddings", valor: "text-embedding-3-small", cor: COR_TEAL },
                  { label: "LLM", valor: "GPT-4o / Claude 3.5", cor: COR_VERDE },
                  { label: "ORM", valor: "Drizzle ORM / Prisma", cor: COR_LARANJA },
                  { label: "API", valor: "NestJS + tRPC", cor: COR_BC },
                ].map((s, i) => (
                  <View key={i} style={[styles.stackRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.stackLabel, { color: colors.muted }]}>{s.label}</Text>
                    <View style={[styles.stackBadge, { backgroundColor: s.cor + "20", borderColor: s.cor + "40" }]}>
                      <Text style={[styles.stackValor, { color: s.cor }]}>{s.valor}</Text>
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
  statsRow: { flexDirection: "row", gap: 8 },
  statCard: { flex: 1, borderRadius: 10, borderWidth: 1, padding: 10, alignItems: "center" },
  statValor: { fontSize: 18, fontWeight: "800" },
  statLabel: { fontSize: 10, marginTop: 2 },
  modHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 10 },
  modBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  modBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  modIcone: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  modNome: { fontSize: 14, fontWeight: "700" },
  metaBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: "flex-start", marginTop: 4 },
  metaText: { fontSize: 10, fontWeight: "700" },
  modBody: { borderTopWidth: StyleSheet.hairlineWidth, padding: 14, gap: 12 },
  modDesc: { fontSize: 13, lineHeight: 20 },
  ioRow: { flexDirection: "row", gap: 8 },
  ioBox: { flex: 1, borderRadius: 10, borderWidth: 1, padding: 10, gap: 6 },
  ioTitulo: { fontSize: 11, fontWeight: "700", marginBottom: 4 },
  ioItem: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  ioDot: { width: 5, height: 5, borderRadius: 3, marginTop: 6 },
  ioText: { fontSize: 11, flex: 1 },
  tabelaRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 10, borderWidth: 1 },
  tabelaNome: { fontSize: 13, fontWeight: "700", fontFamily: "monospace" },
  camposBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  camposText: { fontSize: 11, fontWeight: "700" },
  vetorialCard: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 6 },
  vetorialBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: "flex-start" },
  vetorialBadgeText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  vetorialDesc: { fontSize: 12, lineHeight: 18 },
  diagramaBox: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, minWidth: 220, alignItems: "center" },
  diagramaText: { fontSize: 12, fontWeight: "600" },
  fonteCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 6 },
  fonteBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  fonteBadgeText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  tipoChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  tipoText: { fontSize: 10 },
  fonteUrl: { fontSize: 11, fontWeight: "600" },
  fonteDesc: { fontSize: 12, lineHeight: 18 },
  etapaRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  etapaCirculo: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  etapaNum: { color: "#fff", fontSize: 12, fontWeight: "800" },
  etapaDesc: { flex: 1, fontSize: 13, paddingTop: 4 },
  ragExplicacao: { fontSize: 13, lineHeight: 20, marginTop: 8 },
  fluxoCirculo: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  fluxoNumero: { color: "#fff", fontSize: 12, fontWeight: "800" },
  fluxoLinha: { width: 2, flex: 1, minHeight: 16 },
  fluxoNome: { fontSize: 13, fontWeight: "700" },
  fluxoDesc: { fontSize: 11, marginTop: 2 },
  casoCard: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 4 },
  casoNome: { fontSize: 13, fontWeight: "700" },
  casoDesc: { fontSize: 11 },
  tabelaHeader: { flexDirection: "row", padding: 10, alignItems: "center" },
  thId: { width: 60, fontSize: 11, fontWeight: "700" },
  thNome: { flex: 1, fontSize: 11, fontWeight: "700" },
  thMeta: { width: 90, fontSize: 11, fontWeight: "700", textAlign: "right" },
  tabelaLinha: { flexDirection: "row", alignItems: "center", padding: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  tdId: { width: 52, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, marginRight: 8 },
  tdIdText: { color: "#fff", fontSize: 9, fontWeight: "800", textAlign: "center" },
  tdNome: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  tdNomeText: { fontSize: 12 },
  tdMeta: { width: 90, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  tdMetaText: { fontSize: 10, fontWeight: "700", textAlign: "center" },
  stackRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  stackLabel: { fontSize: 13 },
  stackBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  stackValor: { fontSize: 12, fontWeight: "700" },
});
