/**
 * Vocabulário canônico de operação agrícola (semântico, sem nova tabela).
 */

import {
  TIPO_ATIVIDADE_EVENTO_PERSISTIDO,
  TIPO_OPERACAO_TAREFA_PERSISTIDO,
  type TipoAtividadeEventoPersistido,
  type TipoOperacaoTarefaPersistido,
} from "./legado-tipos";

/** Atividade agrícola no vocabulário unificado do produto (FASE 2D). */
export const TIPO_OPERACAO_AGRICOLA = [
  "plantio",
  "adubacao",
  "irrigacao",
  "pulverizacao",
  "vistoria",
  "analise",
  "laboratorio",
  "amostragem",
  "monitoramento",
  "colheita",
  "manutencao",
  "outro",
] as const;

export type TipoOperacaoAgricola = (typeof TIPO_OPERACAO_AGRICOLA)[number];

/** Alias semântico usado na documentação e integrações futuras (2E+). */
export type OperacaoAgricola = TipoOperacaoAgricola;

export const OPERACAO_AGRICOLA_LABELS: Record<TipoOperacaoAgricola, string> = {
  plantio: "Plantio",
  adubacao: "Adubação",
  irrigacao: "Irrigação",
  pulverizacao: "Pulverização",
  vistoria: "Vistoria",
  analise: "Análise",
  laboratorio: "Laboratório",
  /** Reservado no vocabulário; sem valor ENUM legado mapeado na 2D (não confundir com analise/laboratorio). */
  amostragem: "Amostragem",
  monitoramento: "Monitoramento",
  colheita: "Colheita",
  manutencao: "Manutenção",
  outro: "Outro",
};

export type MapLegadoOrigem = "evento_tipo_atividade" | "tarefa_tipo_operacao";

export type MapLegadoParaOperacaoResult = {
  operacao: TipoOperacaoAgricola;
  origem: MapLegadoOrigem;
  /** Valor bruto recebido (persistido ou desconhecido) */
  legado: string;
  /** `true` quando o valor não consta nos ENUMs conhecidos do domínio */
  legadoDesconhecido: boolean;
};

const EVENTO_PARA_OPERACAO: Record<TipoAtividadeEventoPersistido, TipoOperacaoAgricola> = {
  plantio: "plantio",
  irrigacao: "irrigacao",
  adubacao: "adubacao",
  pulverizacao: "pulverizacao",
  monitoramento: "monitoramento",
  colheita: "colheita",
  analise: "analise",
  manutencao: "manutencao",
  inspecao: "vistoria",
  laboratorio: "laboratorio",
  outro: "outro",
};

const TAREFA_PARA_OPERACAO: Record<TipoOperacaoTarefaPersistido, TipoOperacaoAgricola> = {
  plantio: "plantio",
  irrigacao: "irrigacao",
  adubacao: "adubacao",
  pulverizacao: "pulverizacao",
  monitoramento: "monitoramento",
  colheita: "colheita",
  analise: "analise",
  manutencao: "manutencao",
  vistoria: "vistoria",
  outro: "outro",
};

function isTipoAtividadeEventoPersistido(value: string): value is TipoAtividadeEventoPersistido {
  return (TIPO_ATIVIDADE_EVENTO_PERSISTIDO as readonly string[]).includes(value);
}

function isTipoOperacaoTarefaPersistido(value: string): value is TipoOperacaoTarefaPersistido {
  return (TIPO_OPERACAO_TAREFA_PERSISTIDO as readonly string[]).includes(value);
}

function mapLegado(
  value: string | null | undefined,
  origem: MapLegadoOrigem,
  mapa: Record<string, TipoOperacaoAgricola>,
  isKnown: (v: string) => boolean,
): MapLegadoParaOperacaoResult {
  const legado = (value ?? "").trim();
  if (!legado) {
    return { operacao: "outro", origem, legado: "", legadoDesconhecido: true };
  }
  if (!isKnown(legado)) {
    return { operacao: "outro", origem, legado, legadoDesconhecido: true };
  }
  const operacao = mapa[legado] ?? "outro";
  return { operacao, origem, legado, legadoDesconhecido: false };
}

/** Mapeia `calendario_cuidados.tipoAtividade` → vocabulário canônico (não altera persistência). */
export function mapTipoAtividadeToOperacao(
  tipoAtividade: string | null | undefined,
): MapLegadoParaOperacaoResult {
  return mapLegado(
    tipoAtividade,
    "evento_tipo_atividade",
    EVENTO_PARA_OPERACAO,
    isTipoAtividadeEventoPersistido,
  );
}

/** Mapeia `tarefas_operacionais.tipoOperacao` → vocabulário canônico (não altera persistência). */
export function mapTipoOperacaoTarefaToOperacao(
  tipoOperacao: string | null | undefined,
): MapLegadoParaOperacaoResult {
  return mapLegado(
    tipoOperacao,
    "tarefa_tipo_operacao",
    TAREFA_PARA_OPERACAO,
    isTipoOperacaoTarefaPersistido,
  );
}

/** Tabela legado → canônico para documentação e testes. */
export function listarMapeamentosEvento(): Array<{
  legado: TipoAtividadeEventoPersistido;
  operacao: TipoOperacaoAgricola;
}> {
  return TIPO_ATIVIDADE_EVENTO_PERSISTIDO.map((legado) => ({
    legado,
    operacao: EVENTO_PARA_OPERACAO[legado],
  }));
}

export function listarMapeamentosTarefa(): Array<{
  legado: TipoOperacaoTarefaPersistido;
  operacao: TipoOperacaoAgricola;
}> {
  return TIPO_OPERACAO_TAREFA_PERSISTIDO.map((legado) => ({
    legado,
    operacao: TAREFA_PARA_OPERACAO[legado],
  }));
}
