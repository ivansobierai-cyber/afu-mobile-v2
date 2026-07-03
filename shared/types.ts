// Shared types for AFU - Analisador Fitotécnico Universal

export type FuncaoPerfil = "produtor" | "tecnico" | "administrador" | "parceiro" | "comprador";
export type StatusPerfil = "ativo" | "bloqueado";

export interface PerfilUsuario {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  funcao: FuncaoPerfil;
  status: StatusPerfil;
  cargo?: string;
  empresa?: string;
  registroProfissional?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Propriedade {
  id: string;
  nome: string;
  tipo: "fazenda" | "sitio" | "chacara" | "area_produtiva";
  areaTotal: number; // hectares
  localizacao: string;
  municipio: string;
  estado: string;
  pais?: string;
  tipoProdução: string;
  descricao?: string;
  status?: "ativo" | "inativo";
  createdAt: string;
  updatedAt: string;
}

export interface Terreno {
  id: string;
  propriedadeId: string;
  nome: string;
  area: number; // hectares
  tipoSolo?: "argiloso" | "arenoso" | "siltoso" | "franco" | "organico";
  texturaSolo?: "argiloso" | "arenoso" | "siltoso" | "franco";
  phMedio?: number;
  tipoDrenagem?: "bom" | "medio" | "ruim";
  tipoIrrigacao?: "gotejamento" | "aspersao" | "microaspersao" | "sulcos" | "inundacao" | "manual" | "nenhum";
  observacoes?: string;
  status?: "ativo" | "inativo";
  createdAt?: string;
}

export type FaseCultivo =
  | "planejamento"
  | "plantio"
  | "germinacao"
  | "muda"
  | "crescimento_vegetativo"
  | "floracao"
  | "frutificacao"
  | "maturacao"
  | "colheita";

export interface Cultivo {
  id: string;
  nome?: string;
  propriedadeId: string;
  terrenoId?: string;
  terrenoNome?: string;
  culturaId: string;
  culturaNome: string;
  variedade: string;
  dataPlantio: string;
  dataColheitaPrevista: string;
  dataColheitaReal?: string;
  areaPlantada: number; // hectares
  sistemaIrrigacao?: string;
  sistemaCultivo?: string;
  status: "planejado" | "em_andamento" | "colhido" | "perdido";
  faseFenologica: string;
  faseAtual?: FaseCultivo;
  observacoes?: string;
  createdAt: string;
}

export interface Cultura {
  id: string;
  nomePopular: string;
  nomeCientifico: string;
  familiaBotanica: string;
  cicloProdutivoMin: number; // dias
  cicloProdutivoMax: number; // dias
  descricao: string;
  categoria: "graos" | "hortalicas" | "frutas" | "oleaginosas" | "fibrosas" | "forrageiras" | "outros";
  imagemUrl?: string;
  fasesFenologicas: string[];
  temperaturaMin?: number;
  temperaturaMax?: number;
  precipitacaoMin?: number;
  precipitacaoMax?: number;
  necessidadeLuz?: string;
  tipoSolo?: string;
  epocasPlantio?: string[];
  produtividadeMedia?: string;
  formasMultiplicacao?: string[];
}

export interface Praga {
  id: string;
  nome: string;
  nomeCientifico: string;
  culturas: string[];
  faseSusceptivel?: string;
  sintomas: string;
  nivelRisco: "baixo" | "medio" | "alto" | "critico";
  controleBiologico?: string;
  controleOrganico?: string;
  metodoControle: string;
  prevencao: string;
  imagemUrl?: string;
}

export interface Doenca {
  id: string;
  nome: string;
  agenteCausal: string;
  tipo: "fungica" | "bacteriana" | "viral" | "nematoide" | "fisiologica" | "nutricional" | "outro";
  culturas: string[];
  condicoesFavoraveis: string;
  sintomas: string;
  controle: string;
  prevencao: string;
  nivelRisco?: "baixo" | "medio" | "alto" | "critico";
  imagemUrl?: string;
}

export interface Nutriente {
  id: string;
  nome: string;
  simbolo: string;
  tipo: "macronutriente" | "micronutriente";
  funcao: string;
  sintomasDeficiencia: string;
  sintomasExcesso: string;
  fontesFertilizantes: string;
}

export type PartePlanta = "folha" | "caule" | "raiz" | "flor" | "fruto" | "semente" | "planta_inteira";
export type StatusDiagnostico = "pendente" | "processando" | "concluido" | "erro";
export type CategoriaDiagnostico = "saudavel" | "praga" | "doenca" | "deficiencia" | "estresse" | "indefinido";

export interface Diagnostico {
  id: string;
  cultivoId?: string;
  cultivoNome?: string;
  culturaId?: string;
  culturaNome?: string;
  parteAnalisada: PartePlanta;
  sintomas?: string;
  imagemUrl: string;
  status: StatusDiagnostico;
  resultado: DiagnosticoResultado;
  createdAt: string;
  updatedAt?: string;
}

export interface DiagnosticoResultado {
  problema: string;
  tipo: "praga" | "doenca" | "deficiencia_nutricional" | "estresse_ambiental" | "saudavel" | "outro";
  categoria?: CategoriaDiagnostico;
  confianca: number; // 0-100
  severidade: "leve" | "moderada" | "grave" | "critica";
  descricao: string;
  recomendacoes: string[];
  agenteCausal?: string;
  observacoesTecnicas?: string;
}

export type PrioridadeEvento = "baixa" | "normal" | "alta" | "critica";
export type StatusEvento = "pendente" | "em_andamento" | "concluido" | "cancelado" | "adiado";
export type TipoEvento =
  | "plantio"
  | "colheita"
  | "aplicacao_defensivo"
  | "adubacao"
  | "irrigacao"
  | "monitoramento"
  | "manutencao"
  | "treinamento"
  | "reuniao"
  | "poda"
  | "outro";

export type EventoAgricola = EventoCalendario;

export interface EventoCalendario {
  id: string;
  cultivoId?: string;
  cultivoNome?: string;
  propriedadeId?: string;
  culturaId?: string;
  titulo: string;
  tipo: TipoEvento;
  atividade?: string;
  fase?: string;
  data: string;
  hora?: string;
  dataFim?: string;
  prioridade?: PrioridadeEvento;
  statusEvento?: StatusEvento;
  responsavel?: string;
  custo?: number;
  descricao?: string;
  /** @deprecated use statusEvento instead */
  concluido: boolean;
  createdAt?: string;
}

export interface ClimaCultura {
  culturaId: string;
  tempMin: number;
  tempIdeal: number;
  tempMax: number;
  umidadeMin: number;
  umidadeMax: number;
  precipitacaoAnual: string;
  altitudeMin: number;
  altitudeMax: number;
  luminosidade: string;
}

export interface RecomendacaoIrrigacao {
  culturaId: string;
  fase: string;
  necessidadeHidrica: string; // mm/dia
  frequencia: string;
  metodoRecomendado: string;
  observacoes: string;
}

export type UserProfile = {
  id: number;
  name: string | null;
  email: string | null;
  role: "user" | "admin";
  perfil: FuncaoPerfil;
};

// Análise Fitotécnica
export type StatusAnalise = "rascunho" | "concluida" | "laudado";
export type TipoAmostra = "solo" | "agua" | "foliar" | "fruto";

export interface AnaliseFitotecnica {
  id: string;
  propriedadeId: string;
  propriedadeNome?: string;
  terrenoId?: string;
  terrenoNome?: string;
  cultivoId?: string;
  cultivoNome?: string;
  tipoAmostra: TipoAmostra;
  dataColeta: string;
  responsavel?: string;
  status: StatusAnalise;
  // Solo
  phSolo?: number;
  materiaOrganica?: number; // %
  umidade?: number; // %
  condutividadeEletrica?: number; // dS/m
  // Água
  phAgua?: number;
  // Macronutrientes (mg/dm³ ou cmolc/dm³)
  nitrogenio?: number;
  fosforo?: number;
  potassio?: number;
  calcio?: number;
  magnesio?: number;
  enxofre?: number;
  // Micronutrientes
  ferro?: number;
  manganes?: number;
  zinco?: number;
  cobre?: number;
  boro?: number;
  molibdenio?: number;
  // Interpretação IA
  interpretacaoIA?: string;
  recomendacoesIA?: string[];
  observacoes?: string;
  createdAt: string;
  updatedAt?: string;
}

// Relatórios e Laudos
export type TipoRelatorio = "diagnostico" | "analise_fitotecnica" | "historico_propriedade" | "recomendacao" | "certificado";
export type StatusRelatorio = "gerando" | "pronto" | "erro";

export interface Relatorio {
  id: string;
  tipo: TipoRelatorio;
  titulo: string;
  propriedadeId?: string;
  propriedadeNome?: string;
  cultivoId?: string;
  diagnosticoId?: string;
  analiseId?: string;
  status: StatusRelatorio;
  pdfUrl?: string;
  createdAt: string;
  geradoPor?: string;
}

// Parceiros e Marketplace
export type TipoParceiro = "laboratorio" | "cooperativa" | "revendedor" | "consultoria" | "certificadora" | "outro";
export type StatusParceiro = "ativo" | "inativo" | "pendente";

export interface Parceiro {
  id: string;
  nome: string;
  tipo: TipoParceiro;
  cnpj?: string;
  email?: string;
  telefone?: string;
  cidade?: string;
  estado?: string;
  descricao?: string;
  servicos?: string[];
  status: StatusParceiro;
  createdAt: string;
}

export type CategoriaProduto = "insumo" | "servico" | "equipamento" | "semente" | "fertilizante" | "defensivo" | "outro";

export interface ProdutoMarketplace {
  id: string;
  parceiroId: string;
  parceiroNome?: string;
  nome: string;
  descricao: string;
  categoria: CategoriaProduto;
  preco?: number;
  unidade?: string;
  disponivel: boolean;
  imagemUrl?: string;
  createdAt: string;
}
