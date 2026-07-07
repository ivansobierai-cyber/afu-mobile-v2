/**
 * scripts/seed.ts — Seed de dados demo (Fase 3 do DATABASE_SCHEMA_TECHNICAL_REPORT)
 *
 * Uso: npm run seed
 * Idempotente: se o usuário demo já existir, aborta sem duplicar dados.
 *
 * Credenciais demo criadas:
 *   e-mail: demo@afuagro.com.br
 *   senha:  Demo@1234
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { getDb } from "../server/db";
import { hashPassword } from "../server/db-auth";
import {
  users,
  usuariosAfu,
  produtores,
  propriedades,
  terrenos,
  culturas,
  pragasDoencas,
  materiaisDidaticos,
  calendarioCuidados,
  parceiros,
  produtosMarketplace,
  analisesFitotecnicas,
} from "../drizzle/schema";

const DEMO_EMAIL = "demo@afuagro.com.br";
const DEMO_PASSWORD = "Demo@1234";

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("FALHA: DATABASE_URL não configurada ou banco indisponível.");
    process.exit(1);
  }

  const existing = await db.select().from(users).where(eq(users.email, DEMO_EMAIL)).limit(1);
  if (existing.length > 0) {
    console.log(`Seed já aplicado (usuário ${DEMO_EMAIL} existe). Nada a fazer.`);
    process.exit(0);
  }

  console.log("Criando usuário demo...");
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const [userResult] = await db.insert(users).values({
    openId: "email_demo-afu-0001",
    name: "Produtor Demo",
    email: DEMO_EMAIL,
    passwordHash,
    loginMethod: "email",
    role: "user",
    emailVerified: true,
  });
  const userId = userResult.insertId;

  const [perfilResult] = await db.insert(usuariosAfu).values({
    userId,
    nome: "Produtor Demo",
    email: DEMO_EMAIL,
    telefone: "(11) 99999-0000",
    tipoUsuario: "produtor",
    status: "ativo",
  });
  const usuarioAfuId = perfilResult.insertId;

  const [produtorResult] = await db.insert(produtores).values({
    usuarioId: usuarioAfuId,
    documento: "123.456.789-00",
    cidade: "Ribeirão Preto",
    estado: "SP",
    regiao: "Sudeste",
    tipoProdutor: "comercial",
  });
  const produtorId = produtorResult.insertId;

  console.log("Criando propriedade, terrenos e cultivos...");
  const [propResult] = await db.insert(propriedades).values({
    produtorId,
    nome: "Fazenda Santa Clara",
    cidade: "Ribeirão Preto",
    estado: "SP",
    latitude: "-21.17750000",
    longitude: "-47.81030000",
    tamanhoArea: "120.00",
    unidadeArea: "ha",
    tipoSolo: "Latossolo Vermelho",
    fonteAgua: "Poço artesiano",
    sistemaIrrigacao: "Pivô central",
    tipoProducao: "graos",
  });
  const propriedadeId = propResult.insertId;

  const [terreno1] = await db.insert(terrenos).values({
    propriedadeId,
    nome: "Talhão Norte",
    area: "50.00",
    tipoSolo: "Latossolo Vermelho",
    sistemaIrrigacao: "Pivô central",
    observacoes: "Boa drenagem, pH corrigido em 2025.",
  });
  const [terreno2] = await db.insert(terrenos).values({
    propriedadeId,
    nome: "Talhão Sul",
    area: "35.00",
    tipoSolo: "Argissolo",
    sistemaIrrigacao: "Gotejamento",
    observacoes: "Área com histórico de compactação.",
  });

  await db.insert(culturas).values([
    {
      propriedadeId,
      terrenoId: terreno1.insertId,
      nomeCultura: "Soja",
      variedade: "BRS 1010",
      dataPlantio: new Date("2026-10-15"),
      faseAtual: "planejamento",
      areaPlantada: "45.00",
      previsaoColheita: new Date("2027-02-20"),
      producaoEstimada: "160.00",
      unidadeProducao: "sacas/ha",
      status: "planejado",
    },
    {
      propriedadeId,
      terrenoId: terreno2.insertId,
      nomeCultura: "Milho",
      variedade: "AG 8088",
      dataPlantio: new Date("2026-03-01"),
      faseAtual: "crescimento vegetativo",
      areaPlantada: "30.00",
      previsaoColheita: new Date("2026-08-10"),
      producaoEstimada: "120.00",
      unidadeProducao: "sacas/ha",
      status: "em_andamento",
    },
  ]);

  console.log("Populando banco de conhecimento (pragas e doenças)...");
  await db.insert(pragasDoencas).values([
    {
      nome: "Ferrugem Asiática da Soja",
      nomecientifico: "Phakopsora pachyrhizi",
      tipo: "doenca",
      culturaAfetada: "Soja",
      sintomas: "Pequenas lesões angulares castanho-avermelhadas na face inferior das folhas, evoluindo para desfolha precoce.",
      causas: "Fungo disseminado pelo vento em condições de alta umidade (>10h de molhamento foliar) e temperaturas entre 18–28°C.",
      tratamento: "Fungicidas triazóis + estrobilurinas em aplicação preventiva; rotação de mecanismos de ação.",
      prevencao: "Vazio sanitário, cultivares precoces, monitoramento semanal a partir do florescimento.",
      nivelRisco: "critico",
    },
    {
      nome: "Lagarta-do-cartucho",
      nomecientifico: "Spodoptera frugiperda",
      tipo: "praga",
      culturaAfetada: "Milho, Sorgo, Algodão",
      sintomas: "Folhas raspadas e perfuradas, cartucho destruído com excrementos, plantas com crescimento comprometido.",
      causas: "Mariposa de alta capacidade reprodutiva; ataques favorecidos por períodos secos.",
      tratamento: "Controle biológico (Bacillus thuringiensis, Trichogramma), inseticidas seletivos quando atingir nível de dano.",
      prevencao: "Milho Bt, plantio uniforme na região, monitoramento com armadilhas de feromônio.",
      nivelRisco: "alto",
    },
    {
      nome: "Mosca-branca",
      nomecientifico: "Bemisia tabaci",
      tipo: "praga",
      culturaAfetada: "Tomate, Feijão, Soja, Algodão",
      sintomas: "Fumagina nas folhas, amarelecimento, transmissão de viroses (mosaico dourado).",
      causas: "Clima quente e seco; hospedeiros alternativos próximos à lavoura.",
      tratamento: "Inseticidas sistêmicos em rotação, óleo de neem em cultivos orgânicos.",
      prevencao: "Eliminação de plantas daninhas hospedeiras, barreiras vivas, cultivares tolerantes.",
      nivelRisco: "alto",
    },
    {
      nome: "Requeima",
      nomecientifico: "Phytophthora infestans",
      tipo: "doenca",
      culturaAfetada: "Batata, Tomate",
      sintomas: "Manchas encharcadas nas folhas que evoluem para necrose; mofo branco na face inferior em alta umidade.",
      causas: "Oomiceto favorecido por temperaturas amenas (12–22°C) e alta umidade relativa.",
      tratamento: "Fungicidas protetores e sistêmicos em programa preventivo.",
      prevencao: "Batata-semente certificada, espaçamento adequado, evitar irrigação por aspersão no fim do dia.",
      nivelRisco: "critico",
    },
    {
      nome: "Deficiência de Nitrogênio",
      nomecientifico: null,
      tipo: "deficiencia",
      culturaAfetada: "Todas",
      sintomas: "Clorose uniforme começando pelas folhas mais velhas, crescimento reduzido, colmos finos.",
      causas: "Solo pobre em matéria orgânica, lixiviação por excesso de chuva, adubação insuficiente.",
      tratamento: "Adubação nitrogenada de cobertura (ureia, sulfato de amônio) parcelada.",
      prevencao: "Análise de solo anual, adubação verde com leguminosas, manejo da matéria orgânica.",
      nivelRisco: "medio",
    },
    {
      nome: "Deficiência de Potássio",
      nomecientifico: null,
      tipo: "deficiencia",
      culturaAfetada: "Todas",
      sintomas: "Clorose e necrose nas bordas das folhas velhas ('queima'), frutos pequenos e mal formados.",
      causas: "Solos arenosos com baixa CTC, exportação alta pela colheita sem reposição.",
      tratamento: "Cloreto ou sulfato de potássio conforme análise de solo.",
      prevencao: "Adubação de reposição baseada na exportação da cultura, parcelamento em solos arenosos.",
      nivelRisco: "medio",
    },
  ]);

  console.log("Populando materiais didáticos...");
  await db.insert(materiaisDidaticos).values([
    {
      titulo: "Guia de Manejo Integrado de Pragas na Soja",
      tipoMaterial: "guia",
      tema: "Fitossanidade",
      descricao: "Passo a passo de monitoramento, níveis de dano e decisão de controle para as principais pragas da soja.",
      publicoAlvo: "produtor",
      nivel: "intermediario",
    },
    {
      titulo: "Checklist de Plantio — Safra de Grãos",
      tipoMaterial: "checklist",
      tema: "Plantio",
      descricao: "Itens essenciais antes, durante e após o plantio: solo, sementes, maquinário e clima.",
      publicoAlvo: "todos",
      nivel: "iniciante",
    },
    {
      titulo: "Interpretação de Análise de Solo",
      tipoMaterial: "apostila",
      tema: "Solos e Nutrição",
      descricao: "Como ler laudos de análise química do solo e converter em recomendações de calagem e adubação.",
      publicoAlvo: "tecnico",
      nivel: "avancado",
    },
    {
      titulo: "Irrigação por Gotejamento na Prática",
      tipoMaterial: "video",
      tema: "Irrigação",
      descricao: "Dimensionamento básico, manutenção de gotejadores e fertirrigação para hortifruti.",
      videoUrl: "https://example.com/videos/gotejamento",
      publicoAlvo: "produtor",
      nivel: "iniciante",
    },
  ]);

  console.log("Criando eventos de calendário...");
  await db.insert(calendarioCuidados).values([
    {
      usuarioId: usuarioAfuId,
      propriedadeId,
      tipoAtividade: "monitoramento",
      titulo: "Monitorar lagarta-do-cartucho no milho",
      descricao: "Inspecionar 10 pontos do Talhão Sul; nível de dano: 20% de plantas atacadas.",
      dataProgramada: new Date("2026-07-10T08:00:00"),
      prioridade: "alta",
      status: "pendente",
      lembreteAtivo: true,
    },
    {
      usuarioId: usuarioAfuId,
      propriedadeId,
      tipoAtividade: "adubacao",
      titulo: "Adubação de cobertura do milho",
      descricao: "Aplicar 150 kg/ha de ureia no Talhão Sul.",
      dataProgramada: new Date("2026-07-18T07:00:00"),
      prioridade: "normal",
      status: "pendente",
      lembreteAtivo: true,
    },
    {
      usuarioId: usuarioAfuId,
      propriedadeId,
      tipoAtividade: "analise",
      titulo: "Coleta de solo para análise (Talhão Norte)",
      descricao: "20 subamostras 0–20cm antes do plantio da soja.",
      dataProgramada: new Date("2026-08-05T09:00:00"),
      prioridade: "normal",
      status: "pendente",
      lembreteAtivo: false,
    },
  ]);

  console.log("Criando parceiro e produtos de marketplace...");
  await db.insert(parceiros).values({
    nome: "AgroLab Análises",
    tipo: "laboratorio",
    descricao: "Laboratório de análise de solo, folha e água com emissão de laudo em 5 dias úteis.",
    cidade: "Ribeirão Preto",
    estado: "SP",
    telefone: "(16) 3333-0000",
    email: "contato@agrolab.com.br",
    servicosOferecidos: "Análise de solo; Análise foliar; Análise de água para irrigação",
    status: "ativo",
  });

  await db.insert(produtosMarketplace).values([
    {
      vendedorId: usuarioAfuId,
      nomeProduto: "Semente de Soja BRS 1010 (saca 40kg)",
      categoria: "sementes",
      descricao: "Semente certificada, alto vigor, tratamento industrial incluído.",
      preco: "890.00",
      estoque: "120.00",
      unidade: "saca",
      status: "disponivel",
    },
    {
      vendedorId: usuarioAfuId,
      nomeProduto: "Milho verde (caixa 20kg)",
      categoria: "producao_propria",
      descricao: "Colheita da semana, direto do produtor.",
      preco: "65.00",
      estoque: "40.00",
      unidade: "caixa",
      status: "disponivel",
    },
    {
      vendedorId: usuarioAfuId,
      nomeProduto: "Fertilizante NPK 20-05-20 (saca 50kg)",
      categoria: "fertilizantes",
      descricao: "Formulação balanceada para cobertura em grãos e hortaliças.",
      preco: "185.00",
      estoque: "200.00",
      unidade: "saca",
      status: "disponivel",
    },
    {
      vendedorId: usuarioAfuId,
      nomeProduto: "Herbicida Glifosato 480g/L (20L)",
      categoria: "defensivos",
      descricao: "Controle de plantas daninhas em pré-plantio e dessecação.",
      preco: "420.00",
      estoque: "35.00",
      unidade: "galão",
      status: "disponivel",
    },
    {
      vendedorId: usuarioAfuId,
      nomeProduto: "Pulverizador costal 20L",
      categoria: "equipamentos",
      descricao: "Bomba manual reforçada, bicos ajustáveis, ideal para áreas menores.",
      preco: "289.00",
      estoque: "15.00",
      unidade: "un",
      status: "disponivel",
    },
    {
      vendedorId: usuarioAfuId,
      nomeProduto: "Análise de solo completa (por amostra)",
      categoria: "servicos",
      descricao: "Coleta orientada + laudo com recomendação de calagem e adubação.",
      preco: "120.00",
      estoque: "999.00",
      unidade: "amostra",
      status: "disponivel",
    },
    {
      vendedorId: usuarioAfuId,
      nomeProduto: "Calcário dolomítico PRNT 90%",
      categoria: "fertilizantes",
      descricao: "Correção de acidez com fornecimento de Ca e Mg.",
      preco: "95.00",
      estoque: "500.00",
      unidade: "ton",
      status: "disponivel",
    },
    {
      vendedorId: usuarioAfuId,
      nomeProduto: "Semente de Milho Híbrido (saca 60kg)",
      categoria: "sementes",
      descricao: "Alto potencial produtivo, tolerância a pragas foliares.",
      preco: "780.00",
      estoque: "80.00",
      unidade: "saca",
      status: "disponivel",
    },
  ]);

  console.log("Criando análise fitotécnica demo...");
  await db.insert(analisesFitotecnicas).values({
    usuarioId: usuarioAfuId,
    propriedadeId,
    tipoAnalise: "solo",
    phSolo: "5.80",
    nitrogenio: "12.500",
    fosforo: "8.200",
    potassio: "0.180",
    calcio: "2.100",
    magnesio: "0.850",
    materiaOrganica: "3.20",
    resultadoTecnico: "Solo com pH levemente ácido e baixo teor de fósforo. Matéria orgânica em nível médio.",
    recomendacao: "Aplicar calcário dolomítico conforme necessidade de elevação do pH. Adubação fosfatada de plantio.",
  });

  console.log("");
  console.log("Seed concluído com sucesso!");
  console.log(`  Login demo: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log("  1 propriedade, 2 terrenos, 2 cultivos, 6 pragas/doenças,");
  console.log("  4 materiais, 3 eventos de calendário, 1 parceiro, 8 produtos, 1 análise fitotécnica.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Erro no seed:", err);
  process.exit(1);
});
