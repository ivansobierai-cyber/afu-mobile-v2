/** Utilitários de data para calendário / agenda / timeline de Eventos. */

const WEEKDAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;
/** `YYYY-MM-DD` (sem hora) — `new Date("YYYY-MM-DD")` é UTC e desloca o dia em fusos negativos. */
const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

export type MonthCell = {
  date: Date;
  key: string; // YYYY-MM-DD
  inMonth: boolean;
  isToday: boolean;
};

/** Converte Date | string | number para Date em calendário local (date-only sem shift UTC). */
export function coerceLocalDate(input: Date | string | number): Date {
  if (input instanceof Date) return input;
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (DATE_ONLY_RE.test(trimmed)) return parseDateKey(trimmed);
  }
  return new Date(input);
}

export function toDateKey(input: Date | string | number): string {
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (DATE_ONLY_RE.test(trimmed)) return trimmed;
  }
  const d = coerceLocalDate(input);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Grade 6×7 começando no domingo (pt-BR agrícola / calendário clássico). */
export function buildMonthGrid(month: Date, today = new Date()): MonthCell[] {
  const first = startOfMonth(month);
  const startPad = first.getDay(); // 0=Dom
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - startPad);

  const cells: MonthCell[] = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    cells.push({
      date,
      key: toDateKey(date),
      inMonth: date.getMonth() === month.getMonth(),
      isToday: isSameDay(date, today),
    });
  }
  return cells;
}

export function formatMonthTitle(date: Date): string {
  const label = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatDayLabel(date: Date | string): string {
  const d = coerceLocalDate(date);
  return d.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatShortDate(date: Date | string): string {
  const d = coerceLocalDate(date);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export { WEEKDAYS_SHORT };

/** Agrupa itens por dia (chave YYYY-MM-DD), ordenados cronologicamente. */
export function groupByDateKey<T>(
  items: T[],
  getDate: (item: T) => Date | string | null | undefined,
): { key: string; label: string; items: T[] }[] {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const raw = getDate(item);
    if (!raw) continue;
    const key = toDateKey(raw);
    if (!key) continue;
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, groupItems]) => ({
      key,
      label: formatDayLabel(parseDateKey(key)),
      items: groupItems,
    }));
}
