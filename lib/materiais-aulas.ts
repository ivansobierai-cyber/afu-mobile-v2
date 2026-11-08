/**
 * Aulas embutidas dos materiais de demonstração.
 * O banco guarda título e descrição; estes roteiros deixam o material
 * utilizável quando ainda não há arquivo ou vídeo publicado.
 */

export type SecaoAula = {
  titulo: string;
  itens: string[];
};

export type AulaMaterial = {
  chave: string;
  secoes: SecaoAula[];
};

const AULAS: AulaMaterial[] = [
  {
    chave: "manejo integrado de pragas na soja",
    secoes: [
      {
        titulo: "Como monitorar",
        itens: [
          "Percorra o talhão em zigue-zague e pare em pelo menos 10 pontos.",
          "Em cada ponto, examine 1 metro de linha: folhas, ponteiros e vagens.",
          "Anote praga, fase (ovo, lagarta, adulto) e plantas atacadas.",
          "Repita o monitoramento a cada 7 dias, ou a cada 3 dias em surto.",
        ],
      },
      {
        titulo: "Quando decidir o controle",
        itens: [
          "Lagartas desfolhadoras: agir se a desfolha passar de 30% no vegetativo ou 15% no reprodutivo.",
          "Percevejos: nível de 2 por pano no grão e 1 por pano em semente.",
          "Prefira o produto seletivo ao inimigo natural presente no talhão.",
          "Não aplique só porque o vizinho aplicou. Use a contagem do seu talhão.",
        ],
      },
      {
        titulo: "Registro no AFU",
        itens: [
          "Grave a data, o talhão e o nível encontrado no calendário de cuidados.",
          "Se a planta estiver com sintoma, abra um diagnóstico com foto no Laboratório.",
          "Depois da aplicação, volte ao mesmo ponto em 5 a 7 dias e compare a contagem.",
        ],
      },
    ],
  },
  {
    chave: "checklist de plantio",
    secoes: [
      {
        titulo: "Antes de entrar na lavoura",
        itens: [
          "Laudo de solo da safra vigente e calcário/adubo já dimensionados.",
          "Semente com germinação e vigor informados no lote.",
          "Tratamento de semente conferido com a praga e a doença da região.",
          "Previsão de chuva: evite plantar com solo encharcado ou sem umidade na semente.",
        ],
      },
      {
        titulo: "No dia do plantio",
        itens: [
          "Profundidade uniforme, em geral 3 a 5 cm para grãos.",
          "Discos, condutores e dosadores sem entupimento.",
          "Velocidade da máquina compatível com a distribuição da semente.",
          "Confira 4 pontos do talhão: sementes por metro e espaçamento.",
        ],
      },
      {
        titulo: "Depois do plantio",
        itens: [
          "Anote data, cultivar, população e talhão na propriedade.",
          "Marque a vistoria de emergência entre 7 e 12 dias.",
          "Se faltar planta, meça a falha antes de decidir replantio.",
        ],
      },
    ],
  },
  {
    chave: "interpretação de análise de solo",
    secoes: [
      {
        titulo: "Leitura do laudo",
        itens: [
          "Comece por pH, saturação por bases (V%) e alumínio.",
          "CTC alta segura mais nutrientes; CTC baixa pede parcelamento.",
          "Fósforo e potássio se interpretam pela faixa da cultura, não por um número único.",
          "Matéria orgânica explica resposta a nitrogênio e estrutura do solo.",
        ],
      },
      {
        titulo: "Da análise para a recomendação",
        itens: [
          "Calagem: use o método do estado (saturação por bases ou neutralização do alumínio).",
          "Adubação de plantio cobre P e K da faixa desejada para a cultura.",
          "Adubação de cobertura segue a expectativa de produtividade e o histórico do talhão.",
          "Micronutrientes só entram se o laudo ou o sintoma indicar deficiência.",
        ],
      },
      {
        titulo: "Uso no AFU",
        itens: [
          "Registre o laudo em Análises do Laboratório, com a data da coleta.",
          "Guarde a recomendação no relatório do talhão para a próxima safra.",
          "Colete de novo a cada 2 ou 3 safras, ou depois de correção pesada.",
        ],
      },
    ],
  },
  {
    chave: "irrigação por gotejamento",
    secoes: [
      {
        titulo: "Dimensionar o setor",
        itens: [
          "Meça a vazão real de 4 gotejadores no início, no meio e no fim da linha.",
          "A variação entre eles deve ficar abaixo de 10%. Acima disso, revise pressão e filtro.",
          "O tempo de irrigação sai da lâmina do dia dividida pela vazão do gotejador.",
          "Separe setores para não ligar mais emissores do que a bomba suporta.",
        ],
      },
      {
        titulo: "Manutenção",
        itens: [
          "Abra o final de linha uma vez por semana e descarte a água suja.",
          "Limpe o filtro antes que a diferença de pressão entre entrada e saída suba.",
          "Procure gotejadores entupidos caminhando a linha, não só pelo hidrômetro.",
          "No fim da safra, faça a limpeza química recomendada para o seu emissor.",
        ],
      },
      {
        titulo: "Fertirrigação",
        itens: [
          "Injete o fertilizante no terço do meio do tempo de irrigação.",
          "Antes e depois, rode só água para encher a linha e lavar o sistema.",
          "Não misture na mesma solução produtos que formem precipitado.",
          "Anote o volume aplicado no calendário do talhão.",
        ],
      },
    ],
  },
];

function normalizar(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function aulaDoMaterial(titulo: string | null | undefined): AulaMaterial | null {
  if (!titulo) return null;
  const texto = normalizar(titulo);
  return AULAS.find((aula) => texto.includes(normalizar(aula.chave))) ?? null;
}

const HOSTS_PLACEHOLDER = new Set(["example.com", "www.example.com", "localhost"]);

/** Link externo que o produtor pode abrir. Endereços de exemplo não contam. */
export function linkPublicavel(url: string | null | undefined): string | null {
  if (!url) return null;
  const limpo = url.trim();
  if (!limpo) return null;
  try {
    const parsed = new URL(limpo);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (HOSTS_PLACEHOLDER.has(parsed.hostname.toLowerCase())) return null;
    return limpo;
  } catch {
    return null;
  }
}
