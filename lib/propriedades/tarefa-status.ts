/**
 * Máquina de estados — tarefas operacionais (Etapa 3).
 * Planejada → Liberada → Em execução → Pausada → Concluída → Aprovada
 * Saídas: cancelada, bloqueada; reabertura limitada.
 */

export const TAREFA_STATUS = [
  "planejada",
  "liberada",
  "em_execucao",
  "pausada",
  "concluida",
  "aprovada",
  "cancelada",
  "bloqueada",
] as const;

export type TarefaStatus = (typeof TAREFA_STATUS)[number];

const TRANSITIONS: Record<TarefaStatus, TarefaStatus[]> = {
  planejada: ["liberada", "em_execucao", "cancelada", "bloqueada"],
  liberada: ["em_execucao", "cancelada", "bloqueada", "planejada"],
  em_execucao: ["pausada", "concluida", "cancelada", "bloqueada"],
  pausada: ["em_execucao", "concluida", "cancelada", "bloqueada"],
  concluida: ["aprovada", "em_execucao"], // reabrir = em_execucao
  aprovada: [],
  cancelada: ["planejada"],
  bloqueada: ["planejada", "liberada", "cancelada"],
};

export function canTransition(from: TarefaStatus, to: TarefaStatus): boolean {
  if (from === to) return true;
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: TarefaStatus, to: TarefaStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Transição inválida: ${from} → ${to}`);
  }
}

export const TAREFA_STATUS_LABELS: Record<TarefaStatus, string> = {
  planejada: "Planejada",
  liberada: "Liberada",
  em_execucao: "Em execução",
  pausada: "Pausada",
  concluida: "Concluída",
  aprovada: "Aprovada",
  cancelada: "Cancelada",
  bloqueada: "Bloqueada",
};

/** Status que ainda exigem ação do operador */
export const STATUS_ABERTOS: TarefaStatus[] = [
  "planejada",
  "liberada",
  "em_execucao",
  "pausada",
  "bloqueada",
];
