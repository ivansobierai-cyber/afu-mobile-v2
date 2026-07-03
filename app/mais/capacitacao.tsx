import React, { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

type TabId = "areas" | "cursos" | "certificacao" | "trilhas" | "ia" | "dashboard";

const AREAS = [
  {
    id: "AFU EDU 01",
    nome: "Agricultura",
    icon: "🌱",
    cor: "#2E7D32",
    cursos: [
      "Produção de Hortaliças",
      "Produção de Frutas",
      "Produção de Grãos",
      "Irrigação",
      "Manejo do Solo",
      "Bioinsumos",
      "Agricultura Orgânica",
    ],
    descricao: "Técnicas de cultivo, manejo e produção vegetal sustentável",
  },
  {
    id: "AFU EDU 02",
    nome: "Pecuária",
    icon: "🐄",
    cor: "#795548",
    cursos: [
      "Bovinocultura",
      "Avicultura",
      "Apicultura",
      "Piscicultura",
      "Ovinocultura",
    ],
    descricao: "Criação e manejo de animais para produção e sustento",
  },
  {
    id: "AFU EDU 03",
    nome: "Agroindústria",
    icon: "🏭",
    cor: "#E65100",
    cursos: [
      "Processamento de Alimentos",
      "Boas Práticas de Fabricação",
      "Embalagem e Rotulagem",
      "Controle de Qualidade",
    ],
    descricao: "Transformação e agregação de valor aos produtos rurais",
  },
  {
    id: "AFU EDU 04",
    nome: "Gestão Rural",
    icon: "📊",
    cor: "#1565C0",
    cursos: [
      "Custos de Produção",
      "Comercialização",
      "Planejamento Rural",
      "Cooperativismo",
    ],
    descricao: "Administração, finanças e gestão de propriedades rurais",
  },
  {
    id: "AFU EDU 05",
    nome: "Tecnologia e IA",
    icon: "🤖",
    cor: "#6A1B9A",
    cursos: [
      "Uso do AFU",
      "Sensores IoT",
      "Drones",
      "Agricultura de Precisão",
      "Inteligência Artificial",
    ],
    descricao: "Inovação tecnológica aplicada ao campo moderno",
  },
  {
    id: "AFU EDU 06",
    nome: "Sustentabilidade",
    icon: "♻️",
    cor: "#00695C",
    cursos: [
      "Agroecologia",
      "Manejo de Resíduos",
      "Energia Renovável Rural",
      "Crédito de Carbono",
    ],
    descricao: "Práticas sustentáveis e preservação ambiental no agro",
  },
];

const MODALIDADES = [
  { nome: "Cursos Livres", duracao: "1 a 20 horas", icon: "📚", cor: "#2E7D32" },
  { nome: "Formação Técnica", duracao: "20 a 200 horas", icon: "🎓", cor: "#1565C0" },
  { nome: "Trilhas de Aprendizagem", duracao: "Sequência organizada", icon: "🗺️", cor: "#E65100" },
  { nome: "Webinars", duracao: "Eventos ao vivo", icon: "📡", cor: "#6A1B9A" },
  { nome: "Oficinas Práticas", duracao: "Presencial ou híbrido", icon: "🔧", cor: "#795548" },
];

const ESTRUTURA_CURSO = [
  { item: "Apresentação", desc: "Visão geral e objetivos do curso", icon: "📋" },
  { item: "Módulos", desc: "Conteúdo organizado em unidades temáticas", icon: "📦" },
  { item: "Vídeos", desc: "Aulas gravadas com streaming adaptativo", icon: "🎬" },
  { item: "Materiais PDF", desc: "Apostilas, guias e checklists para download", icon: "📄" },
  { item: "Áudios", desc: "Podcasts e aulas em formato de áudio", icon: "🎧" },
  { item: "Exercícios", desc: "Atividades práticas e estudos de caso", icon: "✏️" },
  { item: "Avaliação", desc: "Questionários e provas para certificação", icon: "📝" },
  { item: "Certificado", desc: "Certificado Digital AFU com QR Code", icon: "🏆" },
];

const MEDALHAS = [
  { nome: "Especialista em Solo", icon: "🌍", nivel: "Ouro", pontos: 500 },
  { nome: "Especialista em Irrigação", icon: "💧", nivel: "Ouro", pontos: 500 },
  { nome: "Especialista em IA Agrícola", icon: "🤖", nivel: "Platina", pontos: 1000 },
  { nome: "Produtor Orgânico", icon: "🌿", nivel: "Prata", pontos: 300 },
  { nome: "Gestor Rural", icon: "📊", nivel: "Prata", pontos: 300 },
  { nome: "Pecuarista Técnico", icon: "🐄", nivel: "Bronze", pontos: 150 },
  { nome: "Inovador do Campo", icon: "🚀", nivel: "Platina", pontos: 1000 },
  { nome: "Mestre em Drones", icon: "🚁", nivel: "Ouro", pontos: 500 },
];

const TRILHAS = [
  {
    nome: "Agricultura Familiar",
    icon: "🌾",
    cor: "#2E7D32",
    etapas: ["Introdução", "Solo", "Plantio", "Irrigação", "Comercialização", "Certificação"],
    duracao: "80 horas",
    nivel: "Iniciante",
  },
  {
    nome: "Produtor Tecnológico",
    icon: "💻",
    cor: "#1565C0",
    etapas: ["Fundamentos", "IoT", "Drones", "IA Agrícola", "Análise de Dados", "Automação"],
    duracao: "120 horas",
    nivel: "Avançado",
  },
  {
    nome: "Gestor Rural Completo",
    icon: "📈",
    cor: "#E65100",
    etapas: ["Planejamento", "Custos", "Comercialização", "Cooperativismo", "Exportação", "Liderança"],
    duracao: "100 horas",
    nivel: "Intermediário",
  },
  {
    nome: "Sustentabilidade no Campo",
    icon: "♻️",
    cor: "#00695C",
    etapas: ["Agroecologia", "Bioinsumos", "Orgânicos", "Resíduos", "Carbono", "Certificação"],
    duracao: "60 horas",
    nivel: "Intermediário",
  },
];

const INTEGRACOES = [
  { modulo: "Diagnóstico IA", descricao: "Cursos recomendados conforme problemas detectados", icon: "🔬" },
  { modulo: "Laboratório", descricao: "Capacitação baseada nos resultados das análises", icon: "🧪" },
  { modulo: "Marketplace", descricao: "Cursos sobre comercialização e gestão", icon: "🛒" },
  { modulo: "Sensores IoT", descricao: "Treinamentos sobre agricultura inteligente", icon: "📡" },
  { modulo: "Calendário", descricao: "Eventos e webinars integrados ao calendário", icon: "📅" },
];

const TABELAS_BD = [
  { nome: "cursos", campos: 12, descricao: "Catálogo completo de cursos com metadados" },
  { nome: "modulos", campos: 8, descricao: "Módulos e unidades de cada curso" },
  { nome: "aulas", campos: 10, descricao: "Aulas individuais com tipo e conteúdo" },
  { nome: "materiais", campos: 9, descricao: "Arquivos PDF, vídeos, áudios e infográficos" },
  { nome: "avaliacoes", campos: 7, descricao: "Provas, questionários e trabalhos" },
  { nome: "questoes", campos: 8, descricao: "Banco de questões por área e dificuldade" },
  { nome: "certificados", campos: 10, descricao: "Certificados emitidos com QR Code e validação" },
  { nome: "matriculas", campos: 8, descricao: "Inscrições de alunos em cursos" },
  { nome: "progresso", campos: 7, descricao: "Acompanhamento de progresso por aula" },
  { nome: "eventos", campos: 9, descricao: "Webinars, oficinas e eventos ao vivo" },
];

export default function CapacitacaoScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabId>("areas");
  const [expandedArea, setExpandedArea] = useState<string | null>(null);
  const [expandedTrilha, setExpandedTrilha] = useState<string | null>(null);
  const [expandedTabela, setExpandedTabela] = useState<string | null>(null);

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: "areas", label: "Áreas", icon: "🎓" },
    { id: "cursos", label: "Cursos", icon: "📚" },
    { id: "certificacao", label: "Certif.", icon: "🏆" },
    { id: "trilhas", label: "Trilhas", icon: "🗺️" },
    { id: "ia", label: "IA Edu", icon: "🤖" },
    { id: "dashboard", label: "Dashboard", icon: "📊" },
  ];

  const renderAreas = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>6 Grandes Áreas Educacionais</Text>
        <Text style={[styles.sectionSub, { color: colors.muted }]}>
          500.000 alunos · 10.000 cursos · 5.000.000 certificados
        </Text>
      </View>

      {AREAS.map((area) => (
        <TouchableOpacity
          key={area.id}
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setExpandedArea(expandedArea === area.id ? null : area.id)}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.areaBadge, { backgroundColor: area.cor + "22" }]}>
              <Text style={styles.areaIcon}>{area.icon}</Text>
            </View>
            <View style={styles.cardInfo}>
              <View style={styles.cardTitleRow}>
                <Text style={[styles.cardId, { color: area.cor }]}>{area.id}</Text>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>{area.nome}</Text>
              </View>
              <Text style={[styles.cardSub, { color: colors.muted }]}>{area.descricao}</Text>
              <Text style={[styles.cardCount, { color: area.cor }]}>{area.cursos.length} cursos disponíveis</Text>
            </View>
            <Text style={[styles.chevron, { color: colors.muted }]}>
              {expandedArea === area.id ? "▲" : "▼"}
            </Text>
          </View>
          {expandedArea === area.id && (
            <View style={[styles.expandedContent, { borderTopColor: colors.border }]}>
              {area.cursos.map((curso, i) => (
                <View key={i} style={styles.courseItem}>
                  <View style={[styles.courseDot, { backgroundColor: area.cor }]} />
                  <Text style={[styles.courseText, { color: colors.foreground }]}>{curso}</Text>
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>
      ))}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Modalidades de Ensino</Text>
      </View>
      {MODALIDADES.map((mod, i) => (
        <View key={i} style={[styles.modalidadeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.modIcon}>{mod.icon}</Text>
          <View style={styles.modInfo}>
            <Text style={[styles.modNome, { color: colors.foreground }]}>{mod.nome}</Text>
            <Text style={[styles.modDuracao, { color: mod.cor }]}>{mod.duracao}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderCursos = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Estrutura de Cada Curso</Text>
        <Text style={[styles.sectionSub, { color: colors.muted }]}>8 elementos obrigatórios por curso</Text>
      </View>
      {ESTRUTURA_CURSO.map((item, i) => (
        <View key={i} style={[styles.estruturaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.estruturaIcon}>{item.icon}</Text>
          <View style={styles.estruturaInfo}>
            <Text style={[styles.estruturaNome, { color: colors.foreground }]}>{item.item}</Text>
            <Text style={[styles.estruturaDesc, { color: colors.muted }]}>{item.desc}</Text>
          </View>
          <View style={[styles.stepBadge, { backgroundColor: "#2E7D32" + "22" }]}>
            <Text style={[styles.stepNum, { color: "#2E7D32" }]}>{i + 1}</Text>
          </View>
        </View>
      ))}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Biblioteca Digital</Text>
      </View>
      <View style={[styles.bibCard, { backgroundColor: "#1B4332", borderColor: colors.border }]}>
        {["📖 Apostilas", "📋 Manuais", "🗺️ Guias", "✅ Checklists", "📜 Cartilhas", "📚 Livros Digitais", "🔍 Estudos de Caso"].map((item, i) => (
          <View key={i} style={styles.bibItem}>
            <Text style={styles.bibText}>{item}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Biblioteca Multimídia</Text>
      </View>
      <View style={[styles.multimidiaGrid, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {[
          { tipo: "Vídeo", icon: "🎬", desc: "Streaming adaptativo + legendas" },
          { tipo: "Áudio", icon: "🎧", desc: "Podcasts e aulas em áudio" },
          { tipo: "Podcast", icon: "🎙️", desc: "Episódios temáticos semanais" },
          { tipo: "Infográfico", icon: "📊", desc: "Visualizações técnicas" },
          { tipo: "Apresentação", icon: "📽️", desc: "Slides interativos" },
        ].map((item, i) => (
          <View key={i} style={[styles.multimidiaItem, { borderColor: colors.border }]}>
            <Text style={styles.multimidiaIcon}>{item.icon}</Text>
            <Text style={[styles.multimidia, { color: colors.foreground }]}>{item.tipo}</Text>
            <Text style={[styles.multimidiaDesc, { color: colors.muted }]}>{item.desc}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderCertificacao = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Certificado Digital AFU</Text>
      </View>
      <View style={[styles.certCard, { backgroundColor: "#1B4332" }]}>
        <Text style={styles.certTitle}>🏆 CERTIFICADO DIGITAL AFU</Text>
        <Text style={styles.certSub}>Universidade Rural Digital</Text>
        <View style={styles.certDivider} />
        {[
          { campo: "Nome", exemplo: "João da Silva" },
          { campo: "Curso", exemplo: "Manejo do Solo" },
          { campo: "Carga Horária", exemplo: "40 horas" },
          { campo: "Data", exemplo: "13/06/2026" },
          { campo: "Código de Validação", exemplo: "AFU-2026-0001234" },
          { campo: "QR Code", exemplo: "✅ Verificação online" },
        ].map((item, i) => (
          <View key={i} style={styles.certField}>
            <Text style={styles.certLabel}>{item.campo}:</Text>
            <Text style={styles.certValue}>{item.exemplo}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Requisitos para Certificação</Text>
      </View>
      {[
        { req: "Prova mínima", desc: "Nota ≥ 70% na avaliação final", icon: "📝" },
        { req: "Frequência mínima", desc: "≥ 75% das aulas assistidas", icon: "📅" },
        { req: "Atividades obrigatórias", desc: "100% dos exercícios entregues", icon: "✅" },
      ].map((item, i) => (
        <View key={i} style={[styles.reqCard, { backgroundColor: colors.surface, borderColor: "#2E7D32" }]}>
          <Text style={styles.reqIcon}>{item.icon}</Text>
          <View>
            <Text style={[styles.reqNome, { color: colors.foreground }]}>{item.req}</Text>
            <Text style={[styles.reqDesc, { color: colors.muted }]}>{item.desc}</Text>
          </View>
        </View>
      ))}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>🎮 Gamificação</Text>
        <Text style={[styles.sectionSub, { color: colors.muted }]}>Medalhas, níveis e ranking por conquistas</Text>
      </View>
      {MEDALHAS.map((medalha, i) => (
        <View key={i} style={[styles.medalhaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.medalhaIcon}>{medalha.icon}</Text>
          <View style={styles.medalhaInfo}>
            <Text style={[styles.medalhaNome, { color: colors.foreground }]}>{medalha.nome}</Text>
            <Text style={[styles.medalhaLevel, { color: medalha.nivel === "Platina" ? "#9C27B0" : medalha.nivel === "Ouro" ? "#F59E0B" : medalha.nivel === "Prata" ? "#9BA1A6" : "#CD7F32" }]}>
              {medalha.nivel}
            </Text>
          </View>
          <View style={[styles.pontosBadge, { backgroundColor: "#2E7D32" + "22" }]}>
            <Text style={[styles.pontosText, { color: "#2E7D32" }]}>{medalha.pontos} pts</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderTrilhas = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Trilhas de Aprendizagem</Text>
        <Text style={[styles.sectionSub, { color: colors.muted }]}>Sequências organizadas de cursos por objetivo</Text>
      </View>
      {TRILHAS.map((trilha) => (
        <TouchableOpacity
          key={trilha.nome}
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setExpandedTrilha(expandedTrilha === trilha.nome ? null : trilha.nome)}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.areaBadge, { backgroundColor: trilha.cor + "22" }]}>
              <Text style={styles.areaIcon}>{trilha.icon}</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>{trilha.nome}</Text>
              <View style={styles.trilhaMetaRow}>
                <Text style={[styles.trilhaMeta, { color: trilha.cor }]}>⏱ {trilha.duracao}</Text>
                <Text style={[styles.trilhaMeta, { color: colors.muted }]}>  •  </Text>
                <Text style={[styles.trilhaMeta, { color: colors.muted }]}>{trilha.nivel}</Text>
              </View>
            </View>
            <Text style={[styles.chevron, { color: colors.muted }]}>
              {expandedTrilha === trilha.nome ? "▲" : "▼"}
            </Text>
          </View>
          {expandedTrilha === trilha.nome && (
            <View style={[styles.expandedContent, { borderTopColor: colors.border }]}>
              {trilha.etapas.map((etapa, i) => (
                <View key={i} style={styles.trilhaEtapa}>
                  <View style={[styles.etapaCircle, { backgroundColor: trilha.cor }]}>
                    <Text style={styles.etapaNum}>{i + 1}</Text>
                  </View>
                  <Text style={[styles.etapaText, { color: colors.foreground }]}>{etapa}</Text>
                  {i < trilha.etapas.length - 1 && (
                    <View style={[styles.etapaLine, { backgroundColor: trilha.cor + "44" }]} />
                  )}
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>
      ))}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>📡 Eventos e Webinars</Text>
      </View>
      <View style={[styles.eventoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {[
          { campo: "Data", icon: "📅" },
          { campo: "Horário", icon: "⏰" },
          { campo: "Instrutor", icon: "👨‍🏫" },
          { campo: "Tema", icon: "📋" },
          { campo: "Link de Acesso", icon: "🔗" },
          { campo: "Materiais", icon: "📎" },
        ].map((item, i) => (
          <View key={i} style={[styles.eventoItem, { borderBottomColor: colors.border }]}>
            <Text style={styles.eventoIcon}>{item.icon}</Text>
            <Text style={[styles.eventoCampo, { color: colors.foreground }]}>{item.campo}</Text>
          </View>
        ))}
        <View style={[styles.eventoInteg, { backgroundColor: "#2E7D32" + "22" }]}>
          <Text style={[styles.eventoIntegText, { color: "#2E7D32" }]}>
            📅 Integração automática com Calendário AFU
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Perfil Educacional do Aluno</Text>
      </View>
      <View style={[styles.perfilCard, { backgroundColor: "#1B4332" }]}>
        {[
          { item: "Cursos iniciados", icon: "▶️" },
          { item: "Cursos concluídos", icon: "✅" },
          { item: "Certificados", icon: "🏆" },
          { item: "Pontuação total", icon: "⭐" },
          { item: "Competências adquiridas", icon: "💡" },
        ].map((item, i) => (
          <View key={i} style={styles.perfilItem}>
            <Text style={styles.perfilIcon}>{item.icon}</Text>
            <Text style={styles.perfilText}>{item.item}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderIA = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>🤖 Assistente Educacional IA</Text>
        <Text style={[styles.sectionSub, { color: colors.muted }]}>IA especializada em educação agronômica</Text>
      </View>
      <View style={[styles.iaCard, { backgroundColor: "#1B4332" }]}>
        <Text style={styles.iaTitle}>AFU EDU-IA</Text>
        <Text style={styles.iaSub}>Assistente de Aprendizagem Rural</Text>
        <View style={styles.iaDivider} />
        {[
          { func: "Responder dúvidas", desc: "Perguntas sobre conteúdo dos cursos em tempo real", icon: "💬" },
          { func: "Recomendar cursos", desc: "Sugestões baseadas no perfil e diagnósticos do produtor", icon: "🎯" },
          { func: "Explicar conteúdos", desc: "Simplificação de conceitos técnicos complexos", icon: "📖" },
          { func: "Gerar resumos", desc: "Síntese automática de módulos e aulas", icon: "📝" },
          { func: "Criar planos de estudo", desc: "Cronograma personalizado por objetivo e disponibilidade", icon: "🗓️" },
        ].map((item, i) => (
          <View key={i} style={styles.iaFuncItem}>
            <Text style={styles.iaFuncIcon}>{item.icon}</Text>
            <View style={styles.iaFuncInfo}>
              <Text style={styles.iaFuncNome}>{item.func}</Text>
              <Text style={styles.iaFuncDesc}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>🔗 Integrações com AFU</Text>
      </View>
      {INTEGRACOES.map((integ, i) => (
        <View key={i} style={[styles.integCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.integIcon}>{integ.icon}</Text>
          <View style={styles.integInfo}>
            <Text style={[styles.integModulo, { color: "#2E7D32" }]}>{integ.modulo}</Text>
            <Text style={[styles.integDesc, { color: colors.muted }]}>{integ.descricao}</Text>
          </View>
        </View>
      ))}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Sistema de Avaliação</Text>
      </View>
      <View style={[styles.avalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {[
          { tipo: "Questionários", icon: "❓", desc: "Múltipla escolha e verdadeiro/falso" },
          { tipo: "Estudos de Caso", icon: "🔍", desc: "Situações reais do campo para análise" },
          { tipo: "Exercícios Práticos", icon: "🌱", desc: "Atividades aplicadas na propriedade" },
          { tipo: "Trabalhos", icon: "📋", desc: "Projetos e relatórios técnicos" },
          { tipo: "Avaliações Finais", icon: "🏁", desc: "Prova para emissão de certificado" },
        ].map((item, i) => (
          <View key={i} style={[styles.avalItem, { borderBottomColor: colors.border }]}>
            <Text style={styles.avalIcon}>{item.icon}</Text>
            <View>
              <Text style={[styles.avalTipo, { color: colors.foreground }]}>{item.tipo}</Text>
              <Text style={[styles.avalDesc, { color: colors.muted }]}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderDashboard = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Dashboard Educacional</Text>
        <Text style={[styles.sectionSub, { color: colors.muted }]}>Indicadores da Universidade Rural Digital</Text>
      </View>
      <View style={styles.kpiGrid}>
        {[
          { label: "Alunos Ativos", valor: "500K", icon: "👥", cor: "#2E7D32" },
          { label: "Cursos Concluídos", valor: "1.2M", icon: "✅", cor: "#1565C0" },
          { label: "Horas Estudadas", valor: "8.5M", icon: "⏱️", cor: "#E65100" },
          { label: "Certificados", valor: "5M", icon: "🏆", cor: "#F59E0B" },
          { label: "Eventos", valor: "2.400", icon: "📡", cor: "#6A1B9A" },
          { label: "Instrutores", valor: "1.200", icon: "👨‍🏫", cor: "#00695C" },
        ].map((kpi, i) => (
          <View key={i} style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={styles.kpiIcon}>{kpi.icon}</Text>
            <Text style={[styles.kpiValor, { color: kpi.cor }]}>{kpi.valor}</Text>
            <Text style={[styles.kpiLabel, { color: colors.muted }]}>{kpi.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Banco de Dados Educacional</Text>
        <Text style={[styles.sectionSub, { color: colors.muted }]}>10 tabelas especializadas</Text>
      </View>
      {TABELAS_BD.map((tabela) => (
        <TouchableOpacity
          key={tabela.nome}
          style={[styles.tabelaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setExpandedTabela(expandedTabela === tabela.nome ? null : tabela.nome)}
        >
          <View style={styles.tabelaHeader}>
            <View style={[styles.tabelaBadge, { backgroundColor: "#2E7D32" + "22" }]}>
              <Text style={[styles.tabelaNome, { color: "#2E7D32" }]}>{tabela.nome}</Text>
            </View>
            <Text style={[styles.tabelaCampos, { color: colors.muted }]}>{tabela.campos} campos</Text>
          </View>
          {expandedTabela === tabela.nome && (
            <Text style={[styles.tabelaDesc, { color: colors.muted }]}>{tabela.descricao}</Text>
          )}
        </TouchableOpacity>
      ))}

      <View style={[styles.metaCard, { backgroundColor: "#1B4332" }]}>
        <Text style={styles.metaTitle}>🎯 Meta de Escalabilidade</Text>
        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaValor}>500K</Text>
            <Text style={styles.metaLabel}>Alunos</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaValor}>10K</Text>
            <Text style={styles.metaLabel}>Cursos</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaValor}>5M</Text>
            <Text style={styles.metaLabel}>Certificados</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "areas": return renderAreas();
      case "cursos": return renderCursos();
      case "certificacao": return renderCertificacao();
      case "trilhas": return renderTrilhas();
      case "ia": return renderIA();
      case "dashboard": return renderDashboard();
    }
  };

  return (
    <ScreenContainer>
      <View style={[styles.header, { backgroundColor: "#1B4332" }]}>
        <Text style={styles.headerTitle}>🎓 Centro de Capacitação AFU</Text>
        <Text style={styles.headerSub}>Universidade Rural Digital · Etapa 17</Text>
      </View>

      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                activeTab === tab.id && { borderBottomColor: "#2E7D32", borderBottomWidth: 2 },
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, { color: activeTab === tab.id ? "#2E7D32" : colors.muted }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.content}>
        {renderContent()}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  headerSub: { fontSize: 12, color: "#A7F3D0", marginTop: 2 },
  tabBar: { borderBottomWidth: 1 },
  tabScroll: { paddingHorizontal: 8 },
  tab: { paddingHorizontal: 12, paddingVertical: 10, alignItems: "center", marginRight: 4 },
  tabIcon: { fontSize: 16 },
  tabLabel: { fontSize: 11, marginTop: 2, fontWeight: "500" },
  content: { flex: 1, paddingHorizontal: 12 },
  section: { paddingTop: 16, paddingBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: "700" },
  sectionSub: { fontSize: 12, marginTop: 2 },
  card: { borderRadius: 10, borderWidth: 1, marginBottom: 8, overflow: "hidden" },
  cardHeader: { flexDirection: "row", alignItems: "center", padding: 12, gap: 10 },
  areaBadge: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  areaIcon: { fontSize: 22 },
  cardInfo: { flex: 1 },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  cardId: { fontSize: 11, fontWeight: "700" },
  cardTitle: { fontSize: 14, fontWeight: "600" },
  cardSub: { fontSize: 11, marginTop: 2 },
  cardCount: { fontSize: 11, marginTop: 4, fontWeight: "600" },
  chevron: { fontSize: 12 },
  expandedContent: { borderTopWidth: 1, padding: 12, gap: 6 },
  courseItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  courseDot: { width: 6, height: 6, borderRadius: 3 },
  courseText: { fontSize: 13 },
  modalidadeCard: { flexDirection: "row", alignItems: "center", borderRadius: 8, borderWidth: 1, padding: 10, marginBottom: 6, gap: 10 },
  modIcon: { fontSize: 20 },
  modInfo: { flex: 1 },
  modNome: { fontSize: 13, fontWeight: "600" },
  modDuracao: { fontSize: 11, marginTop: 2 },
  estruturaCard: { flexDirection: "row", alignItems: "center", borderRadius: 8, borderWidth: 1, padding: 10, marginBottom: 6, gap: 10 },
  estruturaIcon: { fontSize: 20 },
  estruturaInfo: { flex: 1 },
  estruturaNome: { fontSize: 13, fontWeight: "600" },
  estruturaDesc: { fontSize: 11, marginTop: 2 },
  stepBadge: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  stepNum: { fontSize: 13, fontWeight: "700" },
  bibCard: { borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  bibItem: { backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
  bibText: { color: "#A7F3D0", fontSize: 12 },
  multimidiaGrid: { borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 8 },
  multimidiaItem: { borderBottomWidth: 1, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 10 },
  multimidiaIcon: { fontSize: 18 },
  multimidia: { fontSize: 13, fontWeight: "600", flex: 1 },
  multimidiaDesc: { fontSize: 11 },
  certCard: { borderRadius: 12, padding: 16, marginBottom: 8 },
  certTitle: { color: "#F59E0B", fontSize: 16, fontWeight: "700", textAlign: "center" },
  certSub: { color: "#A7F3D0", fontSize: 12, textAlign: "center", marginTop: 4 },
  certDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.2)", marginVertical: 12 },
  certField: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  certLabel: { color: "#A7F3D0", fontSize: 12 },
  certValue: { color: "#fff", fontSize: 12, fontWeight: "600" },
  reqCard: { flexDirection: "row", alignItems: "center", borderRadius: 8, borderWidth: 1.5, padding: 10, marginBottom: 6, gap: 10 },
  reqIcon: { fontSize: 20 },
  reqNome: { fontSize: 13, fontWeight: "600" },
  reqDesc: { fontSize: 11, marginTop: 2 },
  medalhaCard: { flexDirection: "row", alignItems: "center", borderRadius: 8, borderWidth: 1, padding: 10, marginBottom: 6, gap: 10 },
  medalhaIcon: { fontSize: 22 },
  medalhaInfo: { flex: 1 },
  medalhaNome: { fontSize: 13, fontWeight: "600" },
  medalhaLevel: { fontSize: 11, fontWeight: "700", marginTop: 2 },
  pontosBadge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  pontosText: { fontSize: 11, fontWeight: "700" },
  trilhaMetaRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  trilhaMeta: { fontSize: 11 },
  trilhaEtapa: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4, position: "relative" },
  etapaCircle: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  etapaNum: { color: "#fff", fontSize: 11, fontWeight: "700" },
  etapaText: { fontSize: 13 },
  etapaLine: { position: "absolute", left: 11, top: 28, width: 2, height: 8 },
  eventoCard: { borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 8 },
  eventoItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: 1 },
  eventoIcon: { fontSize: 18 },
  eventoCampo: { fontSize: 13 },
  eventoInteg: { borderRadius: 8, padding: 10, marginTop: 8 },
  eventoIntegText: { fontSize: 12, fontWeight: "600" },
  perfilCard: { borderRadius: 10, padding: 12, marginBottom: 16 },
  perfilItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  perfilIcon: { fontSize: 18 },
  perfilText: { color: "#A7F3D0", fontSize: 13 },
  iaCard: { borderRadius: 12, padding: 16, marginBottom: 8 },
  iaTitle: { color: "#F59E0B", fontSize: 16, fontWeight: "700" },
  iaSub: { color: "#A7F3D0", fontSize: 12, marginTop: 2 },
  iaDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.2)", marginVertical: 12 },
  iaFuncItem: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 6 },
  iaFuncIcon: { fontSize: 18 },
  iaFuncInfo: { flex: 1 },
  iaFuncNome: { color: "#fff", fontSize: 13, fontWeight: "600" },
  iaFuncDesc: { color: "#A7F3D0", fontSize: 11, marginTop: 2 },
  integCard: { flexDirection: "row", alignItems: "center", borderRadius: 8, borderWidth: 1, padding: 10, marginBottom: 6, gap: 10 },
  integIcon: { fontSize: 20 },
  integInfo: { flex: 1 },
  integModulo: { fontSize: 13, fontWeight: "600" },
  integDesc: { fontSize: 11, marginTop: 2 },
  avalCard: { borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 16 },
  avalItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: 1 },
  avalIcon: { fontSize: 20 },
  avalTipo: { fontSize: 13, fontWeight: "600" },
  avalDesc: { fontSize: 11, marginTop: 2 },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  kpiCard: { width: "30.5%", borderRadius: 10, borderWidth: 1, padding: 10, alignItems: "center" },
  kpiIcon: { fontSize: 20 },
  kpiValor: { fontSize: 16, fontWeight: "700", marginTop: 4 },
  kpiLabel: { fontSize: 10, textAlign: "center", marginTop: 2 },
  tabelaCard: { borderRadius: 8, borderWidth: 1, padding: 10, marginBottom: 6 },
  tabelaHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  tabelaBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  tabelaNome: { fontSize: 12, fontWeight: "700", fontFamily: "monospace" },
  tabelaCampos: { fontSize: 11 },
  tabelaDesc: { fontSize: 12, marginTop: 6 },
  metaCard: { borderRadius: 12, padding: 16, marginVertical: 8 },
  metaTitle: { color: "#F59E0B", fontSize: 15, fontWeight: "700", textAlign: "center", marginBottom: 12 },
  metaGrid: { flexDirection: "row", justifyContent: "space-around" },
  metaItem: { alignItems: "center" },
  metaValor: { color: "#fff", fontSize: 22, fontWeight: "700" },
  metaLabel: { color: "#A7F3D0", fontSize: 11, marginTop: 2 },
});
