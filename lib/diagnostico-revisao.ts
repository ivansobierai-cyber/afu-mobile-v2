/**
 * WP-04 — helpers puros de revisão técnica de diagnóstico IA.
 */

export const DIAGNOSTICO_STATUS_REVISAO = [
  "pendente",
  "revisado",
  "confirmado",
  "descartado",
] as const;

export type DiagnosticoStatusRevisao = (typeof DIAGNOSTICO_STATUS_REVISAO)[number];

export const DIAGNOSTICO_ACOES_REVISAO = [
  "confirmar",
  "corrigir",
  "descartar",
] as const;

export type DiagnosticoAcaoRevisao = (typeof DIAGNOSTICO_ACOES_REVISAO)[number];

export const STATUS_REVISAO_LABELS: Record<DiagnosticoStatusRevisao, string> = {
  pendente: "Aguardando revisão",
  revisado: "Corrigido pelo técnico",
  confirmado: "Confirmado pelo técnico",
  descartado: "Rejeitado pelo técnico",
};

/** Ação do técnico → statusRevisao persistido. */
export function mapAcaoRevisaoToStatus(
  acao: DiagnosticoAcaoRevisao,
): Exclude<DiagnosticoStatusRevisao, "pendente"> {
  switch (acao) {
    case "confirmar":
      return "confirmado";
    case "corrigir":
      return "revisado";
    case "descartar":
      return "descartado";
    default: {
      const _exhaustive: never = acao;
      return _exhaustive;
    }
  }
}

/**
 * Recomendações efetivas para tarefa / UI:
 * - se houver correção técnica, usa ela;
 * - senão, recomendações originais da IA.
 */
export function resolveRecomendacoesEfetivas(opts: {
  statusRevisao?: string | null;
  recomendacaoCorrigida?: string | null;
  recomendacoesIa: string[];
  recomendacaoIaTexto?: string | null;
}): { recomendacoes: string[]; fonte: "corrigida" | "ia" } {
  const corrigida = (opts.recomendacaoCorrigida ?? "").trim();
  if (
    corrigida &&
    (opts.statusRevisao === "revisado" || opts.statusRevisao === "confirmado")
  ) {
    const parts = corrigida
      .split(/\n|;/)
      .map((s) => s.trim())
      .filter(Boolean);
    return {
      recomendacoes: parts.length > 0 ? parts : [corrigida],
      fonte: "corrigida",
    };
  }

  if (opts.recomendacoesIa.length > 0) {
    return { recomendacoes: opts.recomendacoesIa, fonte: "ia" };
  }

  const fallback = (opts.recomendacaoIaTexto ?? "")
    .split("; ")
    .map((s) => s.trim())
    .filter(Boolean);
  return { recomendacoes: fallback, fonte: "ia" };
}

/** Diagnóstico descartado não deve virar tarefa operacional. */
export function canCreateTarefaFromRevisaoStatus(
  statusRevisao: string | null | undefined,
): boolean {
  return statusRevisao !== "descartado";
}

/** Marcador estável appendado às instruções quando o laudo é rejeitado. */
export const TAREFA_NEEDS_REVIEW_MARKER = "[PRECISA_REVISAO_TECNICA]";

const TAREFA_STATUS_BLOQUEAVEIS = new Set([
  "planejada",
  "liberada",
  "em_execucao",
  "pausada",
]);

/**
 * Monta nota aditiva para instruções da tarefa já vinculada (nunca apaga o texto anterior).
 */
export function buildNotaRevisaoParaTarefa(opts: {
  acao: DiagnosticoAcaoRevisao;
  parecerTecnico?: string | null;
  recomendacaoCorrigida?: string | null;
  revisadoEm?: Date | string | null;
}): string {
  const when =
    opts.revisadoEm != null
      ? new Date(opts.revisadoEm).toISOString()
      : new Date().toISOString();
  const lines: string[] = [`--- Revisão técnica (${when}) ---`];

  switch (opts.acao) {
    case "confirmar":
      lines.push("Laudo IA confirmado pelo técnico.");
      break;
    case "corrigir":
      lines.push("Recomendação corrigida pelo técnico (texto anterior preservado acima).");
      if (opts.recomendacaoCorrigida?.trim()) {
        lines.push(`Recomendação corrigida: ${opts.recomendacaoCorrigida.trim()}`);
      }
      break;
    case "descartar":
      lines.push(
        `${TAREFA_NEEDS_REVIEW_MARKER} Laudo rejeitado — tarefa sinalizada para revisão humana.`,
      );
      break;
    default: {
      const _exhaustive: never = opts.acao;
      return _exhaustive;
    }
  }

  if (opts.parecerTecnico?.trim()) {
    lines.push(`Parecer: ${opts.parecerTecnico.trim()}`);
  }
  return lines.join("\n");
}

/** Anexa nota sem duplicar o mesmo bloco idêntico. */
export function appendNotaToInstrucoes(
  instrucoes: string | null | undefined,
  nota: string,
): string {
  const base = (instrucoes ?? "").trimEnd();
  const n = nota.trim();
  if (!n) return base;
  if (base.includes(n)) return base;
  return base ? `${base}\n\n${n}` : n;
}

/**
 * Em descartar, tarefas ainda abertas passam a `bloqueada` (precisa revisão).
 * Status terminais (concluída/aprovada/cancelada/já bloqueada) não mudam.
 */
export function shouldBlockTarefaOnDescartar(
  status: string | null | undefined,
): boolean {
  return status != null && TAREFA_STATUS_BLOQUEAVEIS.has(status);
}

export function tarefaNeedsReviewFromInstrucoes(
  instrucoes: string | null | undefined,
): boolean {
  return (instrucoes ?? "").includes(TAREFA_NEEDS_REVIEW_MARKER);
}
