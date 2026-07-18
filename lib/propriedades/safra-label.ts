/** Rótulo de safra BR (jul–jun). Entidade `safras` virá depois; UI já contextualiza. */
export function currentSafraLabel(date = new Date()): string {
  const y = date.getFullYear();
  const month = date.getMonth();
  if (month >= 6) return `Safra ${y}/${String(y + 1).slice(-2)}`;
  return `Safra ${y - 1}/${String(y).slice(-2)}`;
}
