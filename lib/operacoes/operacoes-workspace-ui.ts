/**
 * FASE 2F — regras puras de listagem/filtro/RBAC da UX de operações agrícolas.
 */
import type { TipoOperacaoAgricola } from "./tipo-operacao-agricola";
import { OPERACAO_AGRICOLA_LABELS } from "./tipo-operacao-agricola";

export const OPERACAO_STATUS_VALUES = [
  "planejada",
  "em_execucao",
  "concluida",
  "cancelada",
] as const;

export type OperacaoStatusUi = (typeof OPERACAO_STATUS_VALUES)[number];

export const OPERACAO_STATUS_LABELS: Record<OperacaoStatusUi, string> = {
  planejada: "Planejada",
  em_execucao: "Em execução",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

export const OPERACAO_ORIGEM_LABELS: Record<
  "manual" | "evento_calendario" | "tarefa",
  string
> = {
  manual: "Manual",
  evento_calendario: "Agenda",
  tarefa: "Tarefa",
};

export type OperacoesViewMode = "lista" | "kanban";

export type OperacaoListItem = {
  id: number;
  organizationId: number;
  propriedadeId: number;
  safraId: number | null;
  terrenoId: number | null;
  culturaId: number | null;
  tarefaId: number | null;
  tipoOperacao: TipoOperacaoAgricola;
  titulo: string;
  descricao: string | null;
  status: OperacaoStatusUi;
  dataPrevista: Date | string;
  origem: "manual" | "evento_calendario" | "tarefa";
  eventoOrigemId?: number | null;
};

export type OperacoesClientFilters = {
  safraId?: number | null;
  terrenoId?: number | null;
  culturaId?: number | null;
  tipoOperacao?: TipoOperacaoAgricola | "todos";
  status?: OperacaoStatusUi | "todos";
  /** inclusive YYYY-MM-DD */
  dataDe?: string;
  /** inclusive YYYY-MM-DD */
  dataAte?: string;
};

export function labelTipoOperacao(tipo: string): string {
  if (tipo in OPERACAO_AGRICOLA_LABELS) {
    return OPERACAO_AGRICOLA_LABELS[tipo as TipoOperacaoAgricola];
  }
  return tipo;
}

function toDateKey(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function filterOperacoesAgricolas(
  items: OperacaoListItem[],
  filters: OperacoesClientFilters,
): OperacaoListItem[] {
  return items.filter((op) => {
    if (filters.safraId != null && filters.safraId > 0 && op.safraId !== filters.safraId) {
      return false;
    }
    if (filters.terrenoId != null && filters.terrenoId > 0 && op.terrenoId !== filters.terrenoId) {
      return false;
    }
    if (filters.culturaId != null && filters.culturaId > 0 && op.culturaId !== filters.culturaId) {
      return false;
    }
    if (filters.tipoOperacao && filters.tipoOperacao !== "todos" && op.tipoOperacao !== filters.tipoOperacao) {
      return false;
    }
    if (filters.status && filters.status !== "todos" && op.status !== filters.status) {
      return false;
    }
    const key = toDateKey(op.dataPrevista);
    if (filters.dataDe && key && key < filters.dataDe) return false;
    if (filters.dataAte && key && key > filters.dataAte) return false;
    return true;
  });
}

export function groupOperacoesByStatus(
  items: OperacaoListItem[],
): Record<OperacaoStatusUi, OperacaoListItem[]> {
  const base: Record<OperacaoStatusUi, OperacaoListItem[]> = {
    planejada: [],
    em_execucao: [],
    concluida: [],
    cancelada: [],
  };
  for (const op of items) {
    if (OPERACAO_STATUS_VALUES.includes(op.status)) {
      base[op.status].push(op);
    }
  }
  return base;
}

export function canShowCreateOperacaoButton(opts: {
  readOnly: boolean;
  canWriteOperations: boolean;
}): boolean {
  return !opts.readOnly && opts.canWriteOperations;
}

export function historicalSafraMessage(): string {
  return "Safra encerrada — somente consulta";
}

/** Garante que itens de outra propriedade não apareçam se a API retornar lixo. */
export function resolveDefaultOperacoesViewMode(isNarrowViewport: boolean): OperacoesViewMode {
  return isNarrowViewport ? "lista" : "kanban";
}

export function toggleOperacoesViewMode(current: OperacoesViewMode): OperacoesViewMode {
  return current === "lista" ? "kanban" : "lista";
}

export function assertOperacoesPropriedadeScope(
  items: OperacaoListItem[],
  propriedadeId: number,
): OperacaoListItem[] {
  return items.filter((op) => op.propriedadeId === propriedadeId);
}
