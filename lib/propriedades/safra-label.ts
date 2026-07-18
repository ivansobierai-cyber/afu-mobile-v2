/** Rótulo de safra BR (jul–jun). Entidade `safras` virá depois; UI já contextualiza. */
export function currentSafraLabel(date = new Date()): string {
  const y = date.getFullYear();
  const month = date.getMonth();
  if (month >= 6) return `Safra ${y}/${String(y + 1).slice(-2)}`;
  return `Safra ${y - 1}/${String(y).slice(-2)}`;
}

/** Safra imediatamente anterior ao rótulo atual (histórico). */
export function previousSafraLabel(date = new Date()): string {
  const current = currentSafraLabel(date);
  const m = current.match(/Safra\s+(\d{4})\/(\d{2})/i);
  if (!m) return current;
  const start = Number(m[1]) - 1;
  const end = String(Number(m[2]) - 1).padStart(2, "0");
  return `Safra ${start}/${end}`;
}

/**
 * Etapa 7 — compara rótulos de safra de forma tolerante
 * ("Safra 2026/27" ≈ "2026/27" ≈ "safra 2026/27").
 */
export function safraLabelsMatch(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  if (!a || !b) return false;
  const norm = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .replace(/^safra\s+/i, "")
      .replace(/\s+/g, "");
  return norm(a) === norm(b);
}

/** true quando o usuário está consultando safra diferente da atual. */
export function isHistoricoSafra(
  selected: string | null | undefined,
  date = new Date(),
): boolean {
  if (!selected) return false;
  return !safraLabelsMatch(selected, currentSafraLabel(date));
}

/**
 * Opções do seletor: atual + anterior + rótulos extras (orçamentos/cultivos),
 * sem duplicar.
 */
export function buildSafraOptions(
  extraLabels: Array<string | null | undefined> = [],
  date = new Date(),
): string[] {
  const ordered = [currentSafraLabel(date), previousSafraLabel(date)];
  for (const label of extraLabels) {
    if (!label?.trim()) continue;
    if (!ordered.some((o) => safraLabelsMatch(o, label))) {
      ordered.push(label.trim());
    }
  }
  return ordered;
}
