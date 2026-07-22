/**
 * Filtragem por safraId (correção Etapa 4).
 * Registros com safraId null são órfãos — não entram no ciclo filtrado.
 */
export type SafraScopedRow = { safraId?: number | null };

export function filterRowsBySafraId<T extends SafraScopedRow>(
  rows: T[],
  safraId: number | null | undefined,
): { matched: T[]; orphans: number; otherSafras: number } {
  if (safraId == null) {
    return { matched: rows, orphans: 0, otherSafras: 0 };
  }
  let orphans = 0;
  let otherSafras = 0;
  const matched: T[] = [];
  for (const row of rows) {
    if (row.safraId == null) {
      orphans += 1;
      continue;
    }
    if (row.safraId === safraId) matched.push(row);
    else otherSafras += 1;
  }
  return { matched, orphans, otherSafras };
}

export function buildCompleteness(opts: {
  safraId: number | null;
  orphanCounts: Record<string, number>;
}): {
  status: "complete" | "partial";
  missing: string[];
  note: string;
} {
  if (opts.safraId == null) {
    return {
      status: "partial",
      missing: ["safraId"],
      note: "Nenhuma safra resolvida — filtro de ciclo não aplicado.",
    };
  }
  const missing = Object.entries(opts.orphanCounts)
    .filter(([, n]) => n > 0)
    .map(([k]) => k);
  if (missing.length > 0) {
    return {
      status: "partial",
      missing,
      note: "Há registros sem safraId; estes não entram no ciclo filtrado. Rode o backfill e corrija órfãos.",
    };
  }
  return {
    status: "complete",
    missing: [],
    note: "Filtro por organizationId + propriedadeId + safraId aplicado em tarefas, cultivos, ocorrências, orçamentos, custos e atividades.",
  };
}
