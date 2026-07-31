/** Etapa 4 — cálculo de próxima ocorrência para eventos recorrentes. */

export type Recorrencia =
  | "nenhuma"
  | "diaria"
  | "semanal"
  | "quinzenal"
  | "mensal"
  | null
  | undefined;

export function nextOccurrenceDate(
  from: Date | string,
  recorrencia: Recorrencia,
): Date | null {
  if (!recorrencia || recorrencia === "nenhuma") return null;
  const base = from instanceof Date ? new Date(from.getTime()) : new Date(from);
  if (Number.isNaN(base.getTime())) return null;
  switch (recorrencia) {
    case "diaria":
      base.setDate(base.getDate() + 1);
      return base;
    case "semanal":
      base.setDate(base.getDate() + 7);
      return base;
    case "quinzenal":
      base.setDate(base.getDate() + 14);
      return base;
    case "mensal":
      base.setMonth(base.getMonth() + 1);
      return base;
    default:
      return null;
  }
}

export function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
