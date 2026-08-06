/**
 * Quatro conceitos do domínio operacional — não são sinônimos (FASE 2B/2D).
 */

export const ENTIDADE_OPERACIONAL = [
  "evento",
  "tarefa",
  "operacao",
  "apontamento",
] as const;

export type EntidadeOperacional = (typeof ENTIDADE_OPERACIONAL)[number];

export type EntidadeOperacionalMeta = {
  /** Nome canônico em português */
  nome: string;
  definicao: string;
  /** Tabela principal quando há persistência; `null` para conceito sem tabela própria */
  tabelaPersistencia: string | null;
  /** Campo de tipo agrícola quando aplicável */
  campoTipoLegado: string | null;
};

export const ENTIDADE_OPERACIONAL_META: Record<EntidadeOperacional, EntidadeOperacionalMeta> = {
  evento: {
    nome: "Evento",
    definicao:
      "Algo que acontece ou deve ser lembrado no calendário (agenda, lembrete, status de acompanhamento).",
    tabelaPersistencia: "calendario_cuidados",
    campoTipoLegado: "tipoAtividade",
  },
  tarefa: {
    nome: "Tarefa",
    definicao:
      "Trabalho planejado ou atribuído na propriedade, com fluxo de status operacional e responsável.",
    tabelaPersistencia: "tarefas_operacionais",
    campoTipoLegado: "tipoOperacao",
  },
  operacao: {
    nome: "Operação",
    definicao:
      "Atividade agrícola planejada ou executada no campo, classificada pelo vocabulário canônico (sem tabela dedicada).",
    tabelaPersistencia: null,
    campoTipoLegado: null,
  },
  apontamento: {
    nome: "Apontamento",
    definicao: "Registro real da execução de uma tarefa (início/fim, área, notas, resultado).",
    tabelaPersistencia: "apontamentos_operacao",
    campoTipoLegado: null,
  },
};

export function getEntidadeOperacionalMeta(entidade: EntidadeOperacional): EntidadeOperacionalMeta {
  return ENTIDADE_OPERACIONAL_META[entidade];
}

/** Evento concluído ou lembrete ativo não substitui apontamento de execução. */
export function eventoCalendarioNaoEquivaleApontamento(): true {
  return true;
}

/** Tipo de operação em tarefa/evento descreve a atividade, não o registro de execução. */
export function tipoAgricolaNaoEquivaleApontamento(): true {
  return true;
}
