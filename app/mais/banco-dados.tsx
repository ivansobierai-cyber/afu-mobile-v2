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

interface Campo {
  nome: string;
  tipo: string;
  descricao: string;
  pk?: boolean;
  fk?: boolean;
  enum?: boolean;
}

interface Tabela {
  nome: string;
  icone: string;
  cor: string;
  descricao: string;
  campos: Campo[];
}

const TABELAS: Tabela[] = [
  {
    nome: "usuarios_afu",
    icone: "👤",
    cor: "#2D6A4F",
    descricao: "Perfis dos usuários do sistema AFU",
    campos: [
      { nome: "id", tipo: "INT PK", descricao: "Identificador único", pk: true },
      { nome: "userId", tipo: "INT FK", descricao: "Ref. usuário OAuth", fk: true },
      { nome: "nome", tipo: "VARCHAR(150)", descricao: "Nome completo" },
      { nome: "email", tipo: "VARCHAR(150)", descricao: "E-mail de contato" },
      { nome: "telefone", tipo: "VARCHAR(30)", descricao: "Telefone" },
      { nome: "tipoUsuario", tipo: "ENUM", descricao: "administrador | técnico | produtor | parceiro | comprador", enum: true },
      { nome: "status", tipo: "ENUM", descricao: "ativo | inativo | suspenso", enum: true },
      { nome: "registroProfissional", tipo: "VARCHAR(50)", descricao: "CREA, CRBio, etc." },
      { nome: "cargo", tipo: "VARCHAR(100)", descricao: "Cargo/função" },
      { nome: "createdAt", tipo: "TIMESTAMP", descricao: "Data de criação" },
    ],
  },
  {
    nome: "produtores",
    icone: "🌾",
    cor: "#40916C",
    descricao: "Dados específicos de produtores rurais",
    campos: [
      { nome: "id", tipo: "INT PK", descricao: "Identificador único", pk: true },
      { nome: "usuarioId", tipo: "INT FK", descricao: "Ref. usuarios_afu", fk: true },
      { nome: "documento", tipo: "VARCHAR(50)", descricao: "CPF ou CNPJ" },
      { nome: "cidade", tipo: "VARCHAR(100)", descricao: "Cidade" },
      { nome: "estado", tipo: "VARCHAR(100)", descricao: "Estado/UF" },
      { nome: "pais", tipo: "VARCHAR(100)", descricao: "País (padrão: Brasil)" },
      { nome: "regiao", tipo: "VARCHAR(100)", descricao: "Região geográfica" },
      { nome: "tipoProdutor", tipo: "ENUM", descricao: "familiar | comercial | orgânico | cooperado | empresarial", enum: true },
      { nome: "cadastroAtivo", tipo: "BOOLEAN", descricao: "Cadastro ativo" },
    ],
  },
  {
    nome: "propriedades",
    icone: "🏡",
    cor: "#52B788",
    descricao: "Propriedades rurais cadastradas",
    campos: [
      { nome: "id", tipo: "INT PK", descricao: "Identificador único", pk: true },
      { nome: "produtorId", tipo: "INT FK", descricao: "Ref. produtores", fk: true },
      { nome: "nome", tipo: "VARCHAR(150)", descricao: "Nome da propriedade" },
      { nome: "cidade", tipo: "VARCHAR(100)", descricao: "Cidade" },
      { nome: "estado", tipo: "VARCHAR(100)", descricao: "Estado/UF" },
      { nome: "latitude", tipo: "DECIMAL(10,8)", descricao: "Latitude GPS" },
      { nome: "longitude", tipo: "DECIMAL(11,8)", descricao: "Longitude GPS" },
      { nome: "tamanhoArea", tipo: "DECIMAL(12,2)", descricao: "Área total" },
      { nome: "unidadeArea", tipo: "ENUM", descricao: "ha | alqueire | m²", enum: true },
      { nome: "tipoSolo", tipo: "VARCHAR(100)", descricao: "Tipo de solo" },
      { nome: "fonteAgua", tipo: "VARCHAR(100)", descricao: "Fonte hídrica" },
      { nome: "sistemaIrrigacao", tipo: "VARCHAR(100)", descricao: "Sistema de irrigação" },
      { nome: "tipoProducao", tipo: "ENUM", descricao: "grãos | hortifruti | fruticultura | etc.", enum: true },
    ],
  },
  {
    nome: "terrenos",
    icone: "🗺️",
    cor: "#74C69D",
    descricao: "Talhões dentro de propriedades",
    campos: [
      { nome: "id", tipo: "INT PK", descricao: "Identificador único", pk: true },
      { nome: "propriedadeId", tipo: "INT FK", descricao: "Ref. propriedades", fk: true },
      { nome: "nome", tipo: "VARCHAR(100)", descricao: "Nome do talhão" },
      { nome: "area", tipo: "DECIMAL(10,2)", descricao: "Área em hectares" },
      { nome: "tipoSolo", tipo: "VARCHAR(100)", descricao: "Tipo de solo" },
      { nome: "sistemaIrrigacao", tipo: "VARCHAR(100)", descricao: "Sistema de irrigação" },
      { nome: "observacoes", tipo: "TEXT", descricao: "Observações gerais" },
    ],
  },
  {
    nome: "culturas",
    icone: "🌱",
    cor: "#95D5B2",
    descricao: "Cultivos por propriedade/talhão",
    campos: [
      { nome: "id", tipo: "INT PK", descricao: "Identificador único", pk: true },
      { nome: "propriedadeId", tipo: "INT FK", descricao: "Ref. propriedades", fk: true },
      { nome: "terrenoId", tipo: "INT FK", descricao: "Ref. terrenos (opcional)", fk: true },
      { nome: "nomeCultura", tipo: "VARCHAR(100)", descricao: "Nome da cultura" },
      { nome: "variedade", tipo: "VARCHAR(100)", descricao: "Variedade/cultivar" },
      { nome: "dataPlantio", tipo: "DATE", descricao: "Data de plantio" },
      { nome: "faseAtual", tipo: "VARCHAR(100)", descricao: "Fase fenológica atual" },
      { nome: "areaPlantada", tipo: "DECIMAL(12,2)", descricao: "Área plantada (ha)" },
      { nome: "previsaoColheita", tipo: "DATE", descricao: "Previsão de colheita" },
      { nome: "producaoEstimada", tipo: "DECIMAL(12,2)", descricao: "Produção estimada" },
      { nome: "status", tipo: "ENUM", descricao: "planejado | em_andamento | colhido | perdido", enum: true },
    ],
  },
  {
    nome: "diagnosticos_ia",
    icone: "🔬",
    cor: "#1B4332",
    descricao: "Diagnósticos fitossanitários por IA",
    campos: [
      { nome: "id", tipo: "INT PK", descricao: "Identificador único", pk: true },
      { nome: "usuarioId", tipo: "INT FK", descricao: "Ref. usuarios_afu", fk: true },
      { nome: "propriedadeId", tipo: "INT FK", descricao: "Ref. propriedades", fk: true },
      { nome: "culturaId", tipo: "INT FK", descricao: "Ref. culturas", fk: true },
      { nome: "imagemUrl", tipo: "TEXT", descricao: "URL da imagem enviada" },
      { nome: "partePlanta", tipo: "VARCHAR(50)", descricao: "Parte analisada" },
      { nome: "sintomasInformados", tipo: "TEXT", descricao: "Sintomas relatados" },
      { nome: "resultado", tipo: "TEXT JSON", descricao: "Análise completa da IA" },
      { nome: "pragaProvavel", tipo: "VARCHAR(150)", descricao: "Praga identificada" },
      { nome: "doencaProvavel", tipo: "VARCHAR(150)", descricao: "Doença identificada" },
      { nome: "deficienciaNutricional", tipo: "VARCHAR(150)", descricao: "Deficiência identificada" },
      { nome: "gravidade", tipo: "ENUM", descricao: "saudável | leve | moderada | grave | crítica", enum: true },
      { nome: "confiancaIa", tipo: "INT (0-100)", descricao: "Confiança da IA (%)" },
      { nome: "recomendacao", tipo: "TEXT", descricao: "Recomendação de tratamento" },
      { nome: "statusRevisao", tipo: "ENUM", descricao: "pendente | revisado | confirmado | descartado", enum: true },
      { nome: "dataDiagnostico", tipo: "TIMESTAMP", descricao: "Data do diagnóstico" },
    ],
  },
  {
    nome: "analises_fitotecnicas",
    icone: "🧪",
    cor: "#D4A017",
    descricao: "Análises de solo, água e foliar",
    campos: [
      { nome: "id", tipo: "INT PK", descricao: "Identificador único", pk: true },
      { nome: "usuarioId", tipo: "INT FK", descricao: "Ref. usuarios_afu", fk: true },
      { nome: "propriedadeId", tipo: "INT FK", descricao: "Ref. propriedades", fk: true },
      { nome: "culturaId", tipo: "INT FK", descricao: "Ref. culturas", fk: true },
      { nome: "tipoAnalise", tipo: "ENUM", descricao: "solo | água | foliar | completa", enum: true },
      { nome: "phSolo", tipo: "DECIMAL(4,2)", descricao: "pH do solo" },
      { nome: "phAgua", tipo: "DECIMAL(4,2)", descricao: "pH da água" },
      { nome: "nitrogenio", tipo: "DECIMAL(8,3)", descricao: "Nitrogênio (N)" },
      { nome: "fosforo", tipo: "DECIMAL(8,3)", descricao: "Fósforo (P)" },
      { nome: "potassio", tipo: "DECIMAL(8,3)", descricao: "Potássio (K)" },
      { nome: "calcio", tipo: "DECIMAL(8,3)", descricao: "Cálcio (Ca)" },
      { nome: "magnesio", tipo: "DECIMAL(8,3)", descricao: "Magnésio (Mg)" },
      { nome: "materiaOrganica", tipo: "DECIMAL(6,2)", descricao: "Matéria orgânica (%)" },
      { nome: "umidade", tipo: "DECIMAL(6,2)", descricao: "Umidade (%)" },
      { nome: "condutividadeEletrica", tipo: "DECIMAL(8,4)", descricao: "CE (dS/m)" },
      { nome: "resultadoTecnico", tipo: "TEXT JSON", descricao: "Interpretação da IA" },
      { nome: "recomendacao", tipo: "TEXT", descricao: "Recomendação técnica" },
    ],
  },
  {
    nome: "relatorios",
    icone: "📄",
    cor: "#6B4226",
    descricao: "Laudos e relatórios técnicos gerados",
    campos: [
      { nome: "id", tipo: "INT PK", descricao: "Identificador único", pk: true },
      { nome: "usuarioId", tipo: "INT FK", descricao: "Ref. usuarios_afu", fk: true },
      { nome: "diagnosticoId", tipo: "INT FK", descricao: "Ref. diagnosticos_ia", fk: true },
      { nome: "analiseId", tipo: "INT FK", descricao: "Ref. analises_fitotecnicas", fk: true },
      { nome: "titulo", tipo: "VARCHAR(255)", descricao: "Título do relatório" },
      { nome: "tipoRelatorio", tipo: "ENUM", descricao: "diagnóstico | análise_solo | histórico | certificado | recomendação", enum: true },
      { nome: "arquivoPdfUrl", tipo: "TEXT", descricao: "URL do PDF gerado" },
      { nome: "status", tipo: "ENUM", descricao: "rascunho | emitido | assinado | cancelado", enum: true },
      { nome: "tecnicoResponsavelId", tipo: "INT FK", descricao: "Técnico responsável", fk: true },
      { nome: "conteudo", tipo: "TEXT JSON", descricao: "Dados do relatório" },
      { nome: "dataEmissao", tipo: "TIMESTAMP", descricao: "Data de emissão" },
    ],
  },
  {
    nome: "pragas_doencas",
    icone: "🐛",
    cor: "#C1440E",
    descricao: "Banco de conhecimento fitossanitário",
    campos: [
      { nome: "id", tipo: "INT PK", descricao: "Identificador único", pk: true },
      { nome: "nome", tipo: "VARCHAR(150)", descricao: "Nome comum" },
      { nome: "nomeCientifico", tipo: "VARCHAR(200)", descricao: "Nome científico" },
      { nome: "tipo", tipo: "ENUM", descricao: "praga | doença | deficiência", enum: true },
      { nome: "culturaAfetada", tipo: "VARCHAR(200)", descricao: "Culturas afetadas" },
      { nome: "sintomas", tipo: "TEXT", descricao: "Sintomas observados" },
      { nome: "causas", tipo: "TEXT", descricao: "Causas e vetores" },
      { nome: "tratamento", tipo: "TEXT", descricao: "Métodos de tratamento" },
      { nome: "prevencao", tipo: "TEXT", descricao: "Medidas preventivas" },
      { nome: "imagensReferencia", tipo: "TEXT JSON", descricao: "URLs de imagens" },
      { nome: "nivelRisco", tipo: "ENUM", descricao: "baixo | médio | alto | crítico", enum: true },
    ],
  },
  {
    nome: "materiais_didaticos",
    icone: "📚",
    cor: "#5C4033",
    descricao: "Conteúdo educativo para produtores e técnicos",
    campos: [
      { nome: "id", tipo: "INT PK", descricao: "Identificador único", pk: true },
      { nome: "titulo", tipo: "VARCHAR(255)", descricao: "Título do material" },
      { nome: "tipoMaterial", tipo: "ENUM", descricao: "vídeo | áudio | apostila | guia | checklist | infográfico", enum: true },
      { nome: "tema", tipo: "VARCHAR(100)", descricao: "Tema/categoria" },
      { nome: "descricao", tipo: "TEXT", descricao: "Descrição" },
      { nome: "arquivoUrl", tipo: "TEXT", descricao: "URL do arquivo" },
      { nome: "videoUrl", tipo: "TEXT", descricao: "URL do vídeo" },
      { nome: "idioma", tipo: "VARCHAR(20)", descricao: "Idioma (padrão: pt-BR)" },
      { nome: "publicoAlvo", tipo: "ENUM", descricao: "produtor | técnico | todos", enum: true },
      { nome: "nivel", tipo: "ENUM", descricao: "iniciante | intermediário | avançado", enum: true },
      { nome: "status", tipo: "ENUM", descricao: "ativo | inativo | rascunho", enum: true },
    ],
  },
  {
    nome: "calendario_cuidados",
    icone: "📅",
    cor: "#1565C0",
    descricao: "Agenda de atividades agrícolas",
    campos: [
      { nome: "id", tipo: "INT PK", descricao: "Identificador único", pk: true },
      { nome: "usuarioId", tipo: "INT FK", descricao: "Ref. usuarios_afu", fk: true },
      { nome: "propriedadeId", tipo: "INT FK", descricao: "Ref. propriedades", fk: true },
      { nome: "culturaId", tipo: "INT FK", descricao: "Ref. culturas", fk: true },
      { nome: "tipoAtividade", tipo: "ENUM", descricao: "plantio | irrigação | adubação | pulverização | etc.", enum: true },
      { nome: "titulo", tipo: "VARCHAR(200)", descricao: "Título do evento" },
      { nome: "descricao", tipo: "TEXT", descricao: "Descrição detalhada" },
      { nome: "dataProgramada", tipo: "TIMESTAMP", descricao: "Data/hora programada" },
      { nome: "recorrencia", tipo: "ENUM", descricao: "nenhuma | diária | semanal | quinzenal | mensal", enum: true },
      { nome: "prioridade", tipo: "ENUM", descricao: "baixa | normal | alta | crítica", enum: true },
      { nome: "status", tipo: "ENUM", descricao: "pendente | em_andamento | concluído | cancelado", enum: true },
      { nome: "lembreteAtivo", tipo: "BOOLEAN", descricao: "Lembrete ativado" },
    ],
  },
  {
    nome: "sensores",
    icone: "📡",
    cor: "#6A1B9A",
    descricao: "Sensores IoT instalados nas propriedades",
    campos: [
      { nome: "id", tipo: "INT PK", descricao: "Identificador único", pk: true },
      { nome: "propriedadeId", tipo: "INT FK", descricao: "Ref. propriedades", fk: true },
      { nome: "tipoSensor", tipo: "ENUM", descricao: "temperatura | umidade_solo | pH | CE | chuva | vento | etc.", enum: true },
      { nome: "codigoSensor", tipo: "VARCHAR(100)", descricao: "Código/serial do sensor" },
      { nome: "localInstalacao", tipo: "VARCHAR(200)", descricao: "Local de instalação" },
      { nome: "status", tipo: "ENUM", descricao: "ativo | inativo | manutenção | falha", enum: true },
      { nome: "ultimaLeitura", tipo: "DECIMAL(10,4)", descricao: "Último valor lido" },
      { nome: "unidadeLeitura", tipo: "VARCHAR(20)", descricao: "Unidade de medida" },
      { nome: "dataInstalacao", tipo: "DATE", descricao: "Data de instalação" },
    ],
  },
  {
    nome: "leituras_sensores",
    icone: "📊",
    cor: "#4A148C",
    descricao: "Histórico de leituras dos sensores IoT",
    campos: [
      { nome: "id", tipo: "INT PK", descricao: "Identificador único", pk: true },
      { nome: "sensorId", tipo: "INT FK", descricao: "Ref. sensores", fk: true },
      { nome: "valor", tipo: "DECIMAL(10,4)", descricao: "Valor da leitura" },
      { nome: "unidade", tipo: "VARCHAR(20)", descricao: "Unidade de medida" },
      { nome: "dataLeitura", tipo: "TIMESTAMP", descricao: "Data/hora da leitura" },
      { nome: "alertaGerado", tipo: "BOOLEAN", descricao: "Alerta gerado?" },
      { nome: "alertaMensagem", tipo: "VARCHAR(255)", descricao: "Mensagem do alerta" },
    ],
  },
  {
    nome: "produtos_marketplace",
    icone: "🛒",
    cor: "#E65100",
    descricao: "Produtos disponíveis no marketplace",
    campos: [
      { nome: "id", tipo: "INT PK", descricao: "Identificador único", pk: true },
      { nome: "vendedorId", tipo: "INT FK", descricao: "Ref. usuarios_afu", fk: true },
      { nome: "nomeProduto", tipo: "VARCHAR(200)", descricao: "Nome do produto" },
      { nome: "categoria", tipo: "ENUM", descricao: "sementes | fertilizantes | defensivos | equipamentos | serviços | etc.", enum: true },
      { nome: "descricao", tipo: "TEXT", descricao: "Descrição do produto" },
      { nome: "preco", tipo: "DECIMAL(12,2)", descricao: "Preço unitário (R$)" },
      { nome: "estoque", tipo: "DECIMAL(12,2)", descricao: "Quantidade em estoque" },
      { nome: "unidade", tipo: "VARCHAR(30)", descricao: "Unidade (kg, L, un, etc.)" },
      { nome: "imagemUrl", tipo: "TEXT", descricao: "URL da imagem" },
      { nome: "status", tipo: "ENUM", descricao: "disponível | indisponível | pausado", enum: true },
    ],
  },
  {
    nome: "pedidos",
    icone: "📦",
    cor: "#BF360C",
    descricao: "Pedidos do marketplace",
    campos: [
      { nome: "id", tipo: "INT PK", descricao: "Identificador único", pk: true },
      { nome: "compradorId", tipo: "INT FK", descricao: "Ref. usuarios_afu (comprador)", fk: true },
      { nome: "vendedorId", tipo: "INT FK", descricao: "Ref. usuarios_afu (vendedor)", fk: true },
      { nome: "produtoId", tipo: "INT FK", descricao: "Ref. produtos_marketplace", fk: true },
      { nome: "quantidade", tipo: "DECIMAL(10,2)", descricao: "Quantidade pedida" },
      { nome: "valorUnitario", tipo: "DECIMAL(12,2)", descricao: "Preço unitário" },
      { nome: "valorTotal", tipo: "DECIMAL(12,2)", descricao: "Valor total (R$)" },
      { nome: "statusPedido", tipo: "ENUM", descricao: "aguardando | confirmado | em_preparo | enviado | entregue | cancelado", enum: true },
      { nome: "statusPagamento", tipo: "ENUM", descricao: "pendente | pago | estornado | cancelado", enum: true },
      { nome: "enderecoEntrega", tipo: "TEXT", descricao: "Endereço de entrega" },
      { nome: "dataPedido", tipo: "TIMESTAMP", descricao: "Data do pedido" },
      { nome: "dataEntrega", tipo: "TIMESTAMP", descricao: "Data de entrega" },
    ],
  },
  {
    nome: "parceiros",
    icone: "🤝",
    cor: "#004D40",
    descricao: "Parceiros e prestadores de serviço",
    campos: [
      { nome: "id", tipo: "INT PK", descricao: "Identificador único", pk: true },
      { nome: "nome", tipo: "VARCHAR(200)", descricao: "Nome do parceiro" },
      { nome: "tipo", tipo: "ENUM", descricao: "laboratório | cooperativa | consultoria | revendedor | instituição | outro", enum: true },
      { nome: "descricao", tipo: "TEXT", descricao: "Descrição dos serviços" },
      { nome: "cidade", tipo: "VARCHAR(100)", descricao: "Cidade" },
      { nome: "estado", tipo: "VARCHAR(100)", descricao: "Estado/UF" },
      { nome: "telefone", tipo: "VARCHAR(30)", descricao: "Telefone" },
      { nome: "email", tipo: "VARCHAR(150)", descricao: "E-mail" },
      { nome: "website", tipo: "VARCHAR(255)", descricao: "Website" },
      { nome: "servicosOferecidos", tipo: "TEXT", descricao: "Lista de serviços" },
      { nome: "status", tipo: "ENUM", descricao: "ativo | inativo", enum: true },
    ],
  },
];

const RELACOES = [
  "usuarios_afu (1) → produtores (N): um usuário pode ser produtor",
  "produtores (1) → propriedades (N): um produtor tem várias propriedades",
  "propriedades (1) → terrenos (N): uma propriedade tem vários talhões",
  "propriedades (1) → culturas (N): uma propriedade tem várias culturas",
  "terrenos (1) → culturas (N): um talhão pode ter várias culturas",
  "culturas (1) → diagnosticos_ia (N): uma cultura pode ter vários diagnósticos",
  "culturas (1) → analises_fitotecnicas (N): uma cultura pode ter várias análises",
  "diagnosticos_ia (1) → relatorios (1): um diagnóstico pode gerar um relatório",
  "analises_fitotecnicas (1) → relatorios (1): uma análise pode gerar um relatório",
  "propriedades (1) → sensores (N): uma propriedade pode ter vários sensores",
  "sensores (1) → leituras_sensores (N): um sensor tem várias leituras",
  "usuarios_afu (1) → produtos_marketplace (N): um usuário pode vender vários produtos",
  "usuarios_afu (1) → pedidos (N): um comprador pode fazer vários pedidos",
];

export default function BancoDadosScreen() {
  const colors = useColors();
  const router = useRouter();
  const [tabelaExpandida, setTabelaExpandida] = useState<string | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<"tabelas" | "relacoes" | "resumo">("tabelas");

  const toggleTabela = (nome: string) => {
    setTabelaExpandida(tabelaExpandida === nome ? null : nome);
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: "#1B4332" }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>🗄️ Banco de Dados</Text>
          <Text style={styles.headerSubtitle}>Esquema AFU — {TABELAS.length} tabelas</Text>
        </View>
      </View>

      {/* Abas */}
      <View style={[styles.tabs, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {(["tabelas", "relacoes", "resumo"] as const).map((aba) => (
          <TouchableOpacity
            key={aba}
            style={[styles.tab, abaAtiva === aba && { borderBottomColor: "#2D6A4F", borderBottomWidth: 2 }]}
            onPress={() => setAbaAtiva(aba)}
          >
            <Text style={[styles.tabText, { color: abaAtiva === aba ? "#2D6A4F" : colors.muted }]}>
              {aba === "tabelas" ? "Tabelas" : aba === "relacoes" ? "Relações" : "Resumo"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {/* ABA: TABELAS */}
        {abaAtiva === "tabelas" && (
          <View style={{ gap: 12 }}>
            {TABELAS.map((tabela) => (
              <View
                key={tabela.nome}
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <TouchableOpacity
                  style={styles.cardHeader}
                  onPress={() => toggleTabela(tabela.nome)}
                >
                  <View style={[styles.tabelaIcon, { backgroundColor: tabela.cor + "20" }]}>
                    <Text style={{ fontSize: 20 }}>{tabela.icone}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.tabelaNome, { color: tabela.cor }]}>{tabela.nome}</Text>
                    <Text style={[styles.tabelaDesc, { color: colors.muted }]}>{tabela.descricao}</Text>
                    <Text style={[styles.tabelaCampos, { color: colors.muted }]}>
                      {tabela.campos.length} campos
                    </Text>
                  </View>
                  <Text style={{ color: colors.muted, fontSize: 18 }}>
                    {tabelaExpandida === tabela.nome ? "▲" : "▼"}
                  </Text>
                </TouchableOpacity>

                {tabelaExpandida === tabela.nome && (
                  <View style={[styles.camposContainer, { borderTopColor: colors.border }]}>
                    {tabela.campos.map((campo, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.campoRow,
                          idx < tabela.campos.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
                        ]}
                      >
                        <View style={styles.campoLeft}>
                          {campo.pk && (
                            <View style={[styles.badge, { backgroundColor: "#FFD700" }]}>
                              <Text style={styles.badgeText}>PK</Text>
                            </View>
                          )}
                          {campo.fk && (
                            <View style={[styles.badge, { backgroundColor: "#4FC3F7" }]}>
                              <Text style={styles.badgeText}>FK</Text>
                            </View>
                          )}
                          {campo.enum && (
                            <View style={[styles.badge, { backgroundColor: "#CE93D8" }]}>
                              <Text style={styles.badgeText}>E</Text>
                            </View>
                          )}
                          <Text style={[styles.campoNome, { color: colors.foreground }]}>{campo.nome}</Text>
                        </View>
                        <View style={styles.campoRight}>
                          <Text style={[styles.campoTipo, { color: tabela.cor }]}>{campo.tipo}</Text>
                          <Text style={[styles.campoDesc, { color: colors.muted }]}>{campo.descricao}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ABA: RELAÇÕES */}
        {abaAtiva === "relacoes" && (
          <View style={{ gap: 10 }}>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 16 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                🔗 Relações entre Tabelas
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
                Estrutura relacional do banco AFU
              </Text>
            </View>
            {RELACOES.map((rel, idx) => (
              <View
                key={idx}
                style={[styles.relacaoCard, { backgroundColor: colors.surface, borderColor: "#2D6A4F" }]}
              >
                <Text style={{ fontSize: 16, marginRight: 8 }}>🔗</Text>
                <Text style={[styles.relacaoText, { color: colors.foreground }]}>{rel}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ABA: RESUMO */}
        {abaAtiva === "resumo" && (
          <View style={{ gap: 12 }}>
            <View style={[styles.card, { backgroundColor: "#1B4332", padding: 20 }]}>
              <Text style={styles.resumoTitulo}>🗄️ AFU — Banco de Dados</Text>
              <Text style={styles.resumoSubtitulo}>Etapa 3 — Estrutura Completa</Text>
            </View>

            {/* Estatísticas */}
            <View style={styles.statsGrid}>
              {[
                { label: "Tabelas", valor: TABELAS.length.toString(), icone: "📋", cor: "#2D6A4F" },
                { label: "Relações", valor: RELACOES.length.toString(), icone: "🔗", cor: "#1565C0" },
                { label: "Campos totais", valor: TABELAS.reduce((acc, t) => acc + t.campos.length, 0).toString(), icone: "🏷️", cor: "#E65100" },
                { label: "ENUMs", valor: TABELAS.reduce((acc, t) => acc + t.campos.filter(c => c.enum).length, 0).toString(), icone: "📌", cor: "#6A1B9A" },
              ].map((stat, idx) => (
                <View key={idx} style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={{ fontSize: 24 }}>{stat.icone}</Text>
                  <Text style={[styles.statValor, { color: stat.cor }]}>{stat.valor}</Text>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>{stat.label}</Text>
                </View>
              ))}
            </View>

            {/* Grupos de tabelas */}
            {[
              { titulo: "👤 Usuários e Perfis", tabelas: ["usuarios_afu", "produtores"], cor: "#2D6A4F" },
              { titulo: "🏡 Propriedades e Cultivos", tabelas: ["propriedades", "terrenos", "culturas"], cor: "#40916C" },
              { titulo: "🔬 Análise e Diagnóstico", tabelas: ["diagnosticos_ia", "analises_fitotecnicas", "relatorios"], cor: "#D4A017" },
              { titulo: "📚 Conhecimento", tabelas: ["pragas_doencas", "materiais_didaticos"], cor: "#5C4033" },
              { titulo: "📅 Gestão", tabelas: ["calendario_cuidados", "sensores", "leituras_sensores"], cor: "#1565C0" },
              { titulo: "🛒 Marketplace", tabelas: ["produtos_marketplace", "pedidos", "parceiros"], cor: "#E65100" },
            ].map((grupo, idx) => (
              <View key={idx} style={[styles.grupoCard, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: grupo.cor }]}>
                <Text style={[styles.grupoTitulo, { color: grupo.cor }]}>{grupo.titulo}</Text>
                {grupo.tabelas.map((t) => {
                  const tab = TABELAS.find(tb => tb.nome === t);
                  return (
                    <Text key={t} style={[styles.grupoItem, { color: colors.foreground }]}>
                      {tab?.icone} {t} — {tab?.campos.length} campos
                    </Text>
                  );
                })}
              </View>
            ))}

            {/* Tecnologias */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, padding: 16 }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>⚙️ Tecnologias</Text>
              {[
                { nome: "MySQL / PlanetScale", desc: "Banco relacional gerenciado" },
                { nome: "Drizzle ORM", desc: "Type-safe queries em TypeScript" },
                { nome: "tRPC", desc: "API type-safe cliente-servidor" },
                { nome: "Zod", desc: "Validação de esquemas" },
              ].map((tech, idx) => (
                <View key={idx} style={[styles.techRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.techNome, { color: "#2D6A4F" }]}>• {tech.nome}</Text>
                  <Text style={[styles.techDesc, { color: colors.muted }]}>{tech.desc}</Text>
                </View>
              ))}
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
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },
  headerSubtitle: { color: "#B7E4C7", fontSize: 13 },
  tabs: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, alignItems: "center", paddingVertical: 12 },
  tabText: { fontSize: 14, fontWeight: "600" },
  card: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  cardHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  tabelaIcon: { width: 44, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  tabelaNome: { fontSize: 14, fontWeight: "700", fontFamily: "monospace" },
  tabelaDesc: { fontSize: 12, marginTop: 2 },
  tabelaCampos: { fontSize: 11, marginTop: 2 },
  camposContainer: { borderTopWidth: StyleSheet.hairlineWidth },
  campoRow: { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 14, paddingVertical: 8, gap: 8 },
  campoLeft: { flexDirection: "row", alignItems: "center", gap: 4, width: 140, flexShrink: 0 },
  badge: { paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 },
  badgeText: { fontSize: 9, fontWeight: "700", color: "#333" },
  campoNome: { fontSize: 12, fontFamily: "monospace", flexShrink: 1 },
  campoRight: { flex: 1 },
  campoTipo: { fontSize: 11, fontWeight: "600" },
  campoDesc: { fontSize: 11, marginTop: 1 },
  relacaoCard: { flexDirection: "row", alignItems: "flex-start", padding: 12, borderRadius: 10, borderWidth: 1, borderLeftWidth: 3 },
  relacaoText: { fontSize: 13, flex: 1 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  sectionSubtitle: { fontSize: 13 },
  resumoTitulo: { color: "#fff", fontSize: 22, fontWeight: "800", textAlign: "center" },
  resumoSubtitulo: { color: "#B7E4C7", fontSize: 14, textAlign: "center", marginTop: 4 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: { flex: 1, minWidth: "45%", borderRadius: 12, borderWidth: 1, padding: 16, alignItems: "center", gap: 4 },
  statValor: { fontSize: 28, fontWeight: "800" },
  statLabel: { fontSize: 12 },
  grupoCard: { borderRadius: 12, borderWidth: 1, borderLeftWidth: 4, padding: 14, gap: 6 },
  grupoTitulo: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  grupoItem: { fontSize: 13 },
  techRow: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  techNome: { fontSize: 14, fontWeight: "600" },
  techDesc: { fontSize: 12, marginTop: 2 },
});
