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
