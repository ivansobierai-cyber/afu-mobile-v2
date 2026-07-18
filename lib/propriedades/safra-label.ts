/** Rótulo de safra BR (jul–jun). Entidade `safras` virá depois; UI já contextualiza. */
export function currentSafraLabel(date = new Date()): string {
  const y = date.getFullYear();
  const month = date.getMonth();
  if (month >= 6) return `Safra ${y}/${String(y + 1).slice(-2)}`;
  return `Safra ${y - 1}/${String(y).slice(-2)}`;
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
