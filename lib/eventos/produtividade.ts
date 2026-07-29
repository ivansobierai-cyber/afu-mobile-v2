/** Etapa 8 — helpers de etiquetas e checklist. */

export type ChecklistItem = {
  id: string;
  texto: string;
  feito: boolean;
};

export const ETIQUETAS_SUGERIDAS = [
  "urgente",
  "clima",
  "praga",
  "irrigacao",
  "nutricao",
  "colheita",
  "laboratorio",
  "manutencao",
] as const;

export function parseEtiquetas(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((t): t is string => typeof t === "string")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 20);
  } catch {
    return raw
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 20);
  }
}

export function serializeEtiquetas(tags: string[]): string {
  const clean = [...new Set(tags.map((t) => t.trim().toLowerCase()).filter(Boolean))].slice(
    0,
    20,
  );
  return JSON.stringify(clean);
}

export function parseChecklist(raw: string | null | undefined): ChecklistItem[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((i) => i && typeof i === "object")
      .map((i: { id?: unknown; texto?: unknown; feito?: unknown }, idx: number) => ({
        id: String(i.id ?? `item-${idx}`),
        texto: String(i.texto ?? "").slice(0, 200),
        feito: Boolean(i.feito),
      }))
      .filter((i) => i.texto)
      .slice(0, 50);
  } catch {
    return [];
  }
}

export function serializeChecklist(items: ChecklistItem[]): string {
  return JSON.stringify(
    items.slice(0, 50).map((i) => ({
      id: i.id,
      texto: i.texto.slice(0, 200),
      feito: !!i.feito,
    })),
  );
}

export function checklistProgress(items: ChecklistItem[]): { done: number; total: number } {
  const total = items.length;
  const done = items.filter((i) => i.feito).length;
  return { done, total };
}

export function newChecklistItem(texto: string): ChecklistItem {
  return {
    id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    texto: texto.trim().slice(0, 200),
    feito: false,
  };
}
