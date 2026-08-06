/**
 * Literais persistidos no MySQL — espelham os ENUMs do schema.
 * Não renomear nem remover valores (compatibilidade FASE 2D).
 */

/** `calendario_cuidados.tipoAtividade` */
export const TIPO_ATIVIDADE_EVENTO_PERSISTIDO = [
  "plantio",
  "irrigacao",
  "adubacao",
  "pulverizacao",
  "monitoramento",
  "colheita",
  "analise",
  "manutencao",
  "inspecao",
  "laboratorio",
  "outro",
] as const;

export type TipoAtividadeEventoPersistido = (typeof TIPO_ATIVIDADE_EVENTO_PERSISTIDO)[number];

/** `tarefas_operacionais.tipoOperacao` */
export const TIPO_OPERACAO_TAREFA_PERSISTIDO = [
  "plantio",
  "irrigacao",
  "adubacao",
  "pulverizacao",
  "monitoramento",
  "colheita",
  "analise",
  "manutencao",
  "vistoria",
  "outro",
] as const;

export type TipoOperacaoTarefaPersistido = (typeof TIPO_OPERACAO_TAREFA_PERSISTIDO)[number];
