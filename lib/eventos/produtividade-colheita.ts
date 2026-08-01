import { parseChecklist } from "./produtividade";

/** Extrai quantidade numérica (kg) de texto livre em PT-BR. */
export function parseQuantidadeProducao(text: string): number | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const patterns = [
    /produ[cç][aã]o\s*(?:real|colhida)?\s*[:=]?\s*([\d][\d.,]*)/i,
    /colheita\s*[:=]?\s*([\d][\d.,]*)/i,
    /([\d][\d.,]*)\s*(?:kg|quilos?)\b/i,
    /([\d][\d.,]*)\s*(?:t|ton|toneladas?)\b/i,
  ];

  for (const re of patterns) {
    const m = trimmed.match(re);
    if (!m?.[1]) continue;
    const n = parseBrNumber(m[1]);
    if (n == null || n <= 0) continue;
    if (/ton|tonelada|\bt\b/i.test(trimmed) && !/kg|quilo/i.test(trimmed)) {
      return n * 1000;
    }
    return n;
  }
  return null;
}

function parseBrNumber(raw: string): number | null {
  const normalized = raw.replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

export function resolveProducaoColheitaKg(opts: {
  explicitKg?: number | null;
  titulo?: string | null;
  descricao?: string | null;
  checklistJson?: string | null;
}): number | null {
  if (opts.explicitKg != null && opts.explicitKg > 0) {
    return opts.explicitKg;
  }
  const chunks: string[] = [];
  if (opts.titulo) chunks.push(opts.titulo);
  if (opts.descricao) chunks.push(opts.descricao);
  const checklist = parseChecklist(opts.checklistJson);
  for (const item of checklist) {
    if (item.feito) chunks.push(item.texto);
  }
  for (const text of chunks) {
    const n = parseQuantidadeProducao(text);
    if (n != null) return n;
  }
  return null;
}

export function shouldSyncProducaoColheita(
  tipoAtividade: string | null | undefined,
  becomingDone: boolean,
): boolean {
  return becomingDone && tipoAtividade === "colheita";
}
