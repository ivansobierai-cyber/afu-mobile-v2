import { toDateKey } from "./date-utils";
import type { ClimaDiaHint, EventoParaSugestao, SugestaoIA } from "./ia-sugestoes";

const TIPOS = new Set(["conflito", "clima", "otimizacao", "atraso", "fase"]);
const SEV = new Set(["info", "atencao", "critico"]);

export function buildEventosAgendaPrompt(input: {
  eventos: EventoParaSugestao[];
  climaDias: ClimaDiaHint[];
  regrasCount: number;
}): string {
  const linhas = input.eventos
    .filter((e) => e.status !== "concluido" && e.status !== "cancelado")
    .slice(0, 35)
    .map(
      (e) =>
        `id=${e.id} | ${toDateKey(e.dataProgramada)} | ${e.tipoAtividade} | ${e.prioridade ?? "normal"} | ${e.titulo.slice(0, 80)}`,
    )
    .join("\n");

  const clima = input.climaDias
    .slice(0, 7)
    .map(
      (c) =>
        `${c.date}: chuva ${c.precipitationSumMm ?? 0}mm${c.weatherLabel ? ` (${c.weatherLabel})` : ""}`,
    )
    .join("\n");

  return [
    "Você é assistente de operações agrícolas (AFU Agro).",
    `Já existem ${input.regrasCount} alertas determinísticos (atraso, conflito, clima).`,
    "Sugira até 3 ações práticas ADICIONAIS (não repetir o óbvio).",
    "Responda APENAS JSON válido no formato:",
    '{"sugestoes":[{"tipo":"otimizacao|fase|atraso","severidade":"info|atencao|critico","titulo":"...","mensagem":"...","eventoId":number opcional,"dataSugerida":"YYYY-MM-DD" opcional}]}',
    "",
    "Eventos abertos:",
    linhas || "(nenhum)",
    "",
    "Clima (próximos dias):",
    clima || "(sem dados)",
  ].join("\n");
}

function sanitizeSugestao(raw: unknown, index: number): SugestaoIA | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const tipo = String(o.tipo ?? "otimizacao");
  const severidade = String(o.severidade ?? "info");
  const titulo = String(o.titulo ?? "").trim().slice(0, 120);
  const mensagem = String(o.mensagem ?? "").trim().slice(0, 500);
  if (!titulo || !mensagem) return null;
  if (!TIPOS.has(tipo) || !SEV.has(severidade)) return null;
  const eventoId =
    typeof o.eventoId === "number" && Number.isFinite(o.eventoId) ? o.eventoId : undefined;
  const dataSugerida =
    typeof o.dataSugerida === "string" && /^\d{4}-\d{2}-\d{2}$/.test(o.dataSugerida)
      ? o.dataSugerida
      : undefined;
  return {
    id: `llm-${index}-${titulo.slice(0, 24).replace(/\s+/g, "-").toLowerCase()}`,
    tipo: tipo as SugestaoIA["tipo"],
    severidade: severidade as SugestaoIA["severidade"],
    titulo,
    mensagem,
    eventoId,
    dataSugerida,
  };
}

/** Parseia resposta do modelo (objeto ou array). */
export function parseLlmSugestoesJson(raw: string): SugestaoIA[] {
  const trimmed = raw.trim();
  const match = trimmed.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[0]) as unknown;
    const list = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object" && Array.isArray((parsed as { sugestoes?: unknown }).sugestoes)
        ? (parsed as { sugestoes: unknown[] }).sugestoes
        : [];
    const out: SugestaoIA[] = [];
    list.forEach((item, i) => {
      const s = sanitizeSugestao(item, i);
      if (s) out.push(s);
    });
    return out.slice(0, 5);
  } catch {
    return [];
  }
}

export function mergeSugestoesRegrasELlm(regras: SugestaoIA[], llm: SugestaoIA[]): SugestaoIA[] {
  const seen = new Set(regras.map((s) => s.titulo.toLowerCase()));
  const extra = llm.filter((s) => {
    const key = s.titulo.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return [...regras, ...extra].slice(0, 20);
}
