/**
 * FASE 2G — máquina de estados das operações agrícolas (distinta de tarefas).
 */
export const OPERACAO_AGRICOLA_STATUS = [
  "planejada",
  "liberada",
  "em_execucao",
  "pausada",
  "concluida",
  "aprovada",
  "cancelada",
  "bloqueada",
  "reaberta",
] as const;

export type OperacaoAgricolaStatus = (typeof OPERACAO_AGRICOLA_STATUS)[number];

const STATIC_TRANSITIONS: Record<OperacaoAgricolaStatus, OperacaoAgricolaStatus[]> = {
  planejada: ["liberada", "bloqueada", "cancelada"],
  liberada: ["em_execucao", "bloqueada", "cancelada"],
  em_execucao: ["pausada", "concluida", "bloqueada", "cancelada"],
  pausada: ["em_execucao", "bloqueada", "cancelada"],
  concluida: ["aprovada", "reaberta"],
  reaberta: ["liberada", "cancelada"],
  bloqueada: ["cancelada"],
  aprovada: [],
  cancelada: [],
};

export type OperacaoTransitionContext = {
  statusBeforeBlocked?: OperacaoAgricolaStatus | null;
};

export function canTransitionOperacaoAgricola(
  from: OperacaoAgricolaStatus,
  to: OperacaoAgricolaStatus,
  ctx: OperacaoTransitionContext = {},
): boolean {
  if (from === to) return true;
  if (from === "bloqueada") {
    if (to === "cancelada") return true;
    const resume = ctx.statusBeforeBlocked;
    return resume != null && to === resume;
  }
  return STATIC_TRANSITIONS[from].includes(to);
}

export function assertOperacaoAgricolaTransition(
  from: OperacaoAgricolaStatus,
  to: OperacaoAgricolaStatus,
  ctx: OperacaoTransitionContext = {},
): void {
  if (!canTransitionOperacaoAgricola(from, to, ctx)) {
    throw new Error(`INVALID_OPERATION_TRANSITION: ${from} → ${to}`);
  }
}

export const OPERACAO_AGRICOLA_STATUS_LABELS: Record<OperacaoAgricolaStatus, string> = {
  planejada: "Planejada",
  liberada: "Liberada",
  em_execucao: "Em execução",
  pausada: "Pausada",
  concluida: "Concluída",
  aprovada: "Aprovada",
  cancelada: "Cancelada",
  bloqueada: "Bloqueada",
  reaberta: "Reaberta",
};

/** Ordem de colunas Kanban / filtros. */
export const OPERACAO_AGRICOLA_STATUS_ORDER: OperacaoAgricolaStatus[] = [
  "planejada",
  "liberada",
  "reaberta",
  "em_execucao",
  "pausada",
  "concluida",
  "aprovada",
  "bloqueada",
  "cancelada",
];

export function operacaoTransitionRequiresMotivo(to: OperacaoAgricolaStatus): boolean {
  return to === "cancelada" || to === "bloqueada" || to === "reaberta";
}

export type OperacaoTransitionPermission = "operations.write" | "operations.approve";

export function operacaoTransitionRequiredPermission(
  to: OperacaoAgricolaStatus,
): OperacaoTransitionPermission {
  if (to === "aprovada" || to === "reaberta") return "operations.approve";
  return "operations.write";
}

export type OperacaoTransitionAction = {
  toStatus: OperacaoAgricolaStatus;
  label: string;
  destructive?: boolean;
};

const ACTION_LABEL: Partial<Record<OperacaoAgricolaStatus, string>> = {
  liberada: "Liberar",
  em_execucao: "Iniciar execução",
  pausada: "Pausar",
  concluida: "Concluir",
  aprovada: "Aprovar",
  bloqueada: "Bloquear",
  cancelada: "Cancelar",
  reaberta: "Reabrir",
};

export function listOperacaoTransitionActions(
  from: OperacaoAgricolaStatus,
  ctx: OperacaoTransitionContext = {},
): OperacaoTransitionAction[] {
  const targets = new Set<OperacaoAgricolaStatus>();
  for (const to of OPERACAO_AGRICOLA_STATUS) {
    if (to !== from && canTransitionOperacaoAgricola(from, to, ctx)) {
      targets.add(to);
    }
  }
  if (from === "pausada" && targets.has("em_execucao")) {
    targets.delete("em_execucao");
    targets.add("em_execucao");
  }
  const actions: OperacaoTransitionAction[] = [];
  for (const to of OPERACAO_AGRICOLA_STATUS_ORDER) {
    if (!targets.has(to)) continue;
    let label = ACTION_LABEL[to] ?? OPERACAO_AGRICOLA_STATUS_LABELS[to];
    if (from === "pausada" && to === "em_execucao") label = "Retomar";
    if (from === "bloqueada" && ctx.statusBeforeBlocked && to === ctx.statusBeforeBlocked) {
      label = "Desbloquear";
    }
    actions.push({
      toStatus: to,
      label,
      destructive: to === "cancelada" || to === "bloqueada",
    });
  }
  return actions;
}

export function filterOperacaoTransitionActionsByPermission(
  actions: OperacaoTransitionAction[],
  opts: { canWrite: boolean; canApprove: boolean },
): OperacaoTransitionAction[] {
  return actions.filter((a) => {
    const perm = operacaoTransitionRequiredPermission(a.toStatus);
    if (perm === "operations.approve") return opts.canApprove;
    return opts.canWrite;
  });
}
