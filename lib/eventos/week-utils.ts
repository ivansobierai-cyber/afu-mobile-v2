import { toDateKey } from "./date-utils";

/** Domingo → sábado contendo `anchor`. */
export function startOfWeek(anchor: Date): Date {
  const d = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  d.setDate(d.getDate() - d.getDay());
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

export function buildWeekDays(anchor: Date): { date: Date; key: string }[] {
  const start = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i);
    return { date, key: toDateKey(date) };
  });
}

export function formatWeekRange(anchor: Date): string {
  const days = buildWeekDays(anchor);
  const a = days[0]!.date;
  const b = days[6]!.date;
  const fmt = (d: Date) =>
    d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  return `${fmt(a)} — ${fmt(b)}`;
}
