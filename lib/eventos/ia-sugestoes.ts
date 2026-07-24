/**
 * Etapa 5 — sugestões inteligentes de agenda (regras + clima).
 * Determinístico e testável; LLM opcional no servidor.
 */

import { toDateKey } from "./date-utils";

export type EventoParaSugestao = {
  id: number;
  titulo: string;
  tipoAtividade: string;
  prioridade?: string | null;
  status?: string | null;
  dataProgramada: Date | string;
  propriedadeId?: number | null;
};

export type ClimaDiaHint = {
  date: string; // YYYY-MM-DD
  precipitationSumMm?: number;
  windSpeedMax?: number;
  weatherLabel?: string;
};

export type SugestaoIA = {
  id: string;
  tipo: "conflito" | "clima" | "otimizacao" | "atraso" | "fase";
  severidade: "info" | "atencao" | "critico";
  titulo: string;
  mensagem: string;
  eventoId?: number;
  dataSugerida?: string;
};

const CLIMA_SENSIVEIS = new Set(["pulverizacao", "adubacao", "plantio", "colheita"]);

function dayKey(d: Date | string): string {
  return toDateKey(d);
}

/** Detecta conflitos: ≥2 eventos críticos/alta no mesmo dia na mesma propriedade. */
export function detectarConflitos(eventos: EventoParaSugestao[]): SugestaoIA[] {
  const abertos = eventos.filter(
    (e) => e.status !== "concluido" && e.status !== "cancelado",
  );
  const byDayProp = new Map<string, EventoParaSugestao[]>();
  for (const e of abertos) {
    const key = `${dayKey(e.dataProgramada)}:${e.propriedadeId ?? "x"}`;
    const list = byDayProp.get(key) ?? [];
    list.push(e);
    byDayProp.set(key, list);
  }
  const out: SugestaoIA[] = [];
  for (const [key, list] of byDayProp) {
    if (list.length < 2) continue;
    const pesados = list.filter(
      (e) => e.prioridade === "alta" || e.prioridade === "critica",
    );
    if (pesados.length < 2 && list.length < 3) continue;
    const [date] = key.split(":");
    out.push({
      id: `conflito-${key}`,
      tipo: "conflito",
      severidade: pesados.length >= 2 ? "critico" : "atencao",
      titulo: "Conflito de agenda",
      mensagem: `${list.length} operações no dia ${date?.split("-").reverse().join("/")} — considere redistribuir.`,
      eventoId: list[0]?.id,
      dataSugerida: date
        ? toDateKey(new Date(new Date(date + "T12:00:00").getTime() + 86400000))
        : undefined,
    });
  }
  return out;
}

/** Alertas climáticos para operações sensíveis à chuva/vento. */
export function sugerirPorClima(
  eventos: EventoParaSugestao[],
  climaDias: ClimaDiaHint[],
): SugestaoIA[] {
  if (!climaDias.length) return [];
  const byDate = new Map(climaDias.map((c) => [c.date, c]));
  const out: SugestaoIA[] = [];
  for (const e of eventos) {
    if (e.status === "concluido" || e.status === "cancelado") continue;
    if (!CLIMA_SENSIVEIS.has(e.tipoAtividade)) continue;
    const c = byDate.get(dayKey(e.dataProgramada));
    if (!c) continue;
    const rain = c.precipitationSumMm ?? 0;
    if (rain >= 5 && (e.tipoAtividade === "pulverizacao" || e.tipoAtividade === "adubacao")) {
      const alt = climaDias.find(
        (d) => d.date > c.date && (d.precipitationSumMm ?? 0) < 2,
      );
      out.push({
        id: `clima-chuva-${e.id}`,
        tipo: "clima",
        severidade: rain >= 15 ? "critico" : "atencao",
        titulo: "Risco climático",
        mensagem: `${e.titulo}: previsão de ${rain.toFixed(0)} mm — ${c.weatherLabel ?? "chuva"}. ${
          alt ? `Sugestão: remarcar para ${alt.date.split("-").reverse().join("/")}.` : "Monitore a janela."
        }`,
        eventoId: e.id,
        dataSugerida: alt?.date,
      });
    }
  }
  return out;
}

/** Eventos atrasados (data < hoje e ainda pendentes). */
export function detectarAtrasos(
  eventos: EventoParaSugestao[],
  hoje = new Date(),
): SugestaoIA[] {
  const todayKey = toDateKey(hoje);
  return eventos
    .filter(
      (e) =>
        (e.status === "pendente" || e.status === "em_andamento") &&
        dayKey(e.dataProgramada) < todayKey,
    )
    .slice(0, 8)
    .map((e) => ({
      id: `atraso-${e.id}`,
      tipo: "atraso" as const,
      severidade: e.prioridade === "critica" ? ("critico" as const) : ("atencao" as const),
      titulo: "Evento atrasado",
      mensagem: `${e.titulo} passou da data programada. Priorize ou remarque.`,
      eventoId: e.id,
      dataSugerida: todayKey,
    }));
}

/** Otimização simples: concentrar inspeções no mesmo dia da semana. */
export function sugerirOtimizacao(eventos: EventoParaSugestao[]): SugestaoIA[] {
  const inspecoes = eventos.filter(
    (e) =>
      (e.tipoAtividade === "inspecao" || e.tipoAtividade === "monitoramento") &&
      e.status !== "concluido" &&
      e.status !== "cancelado",
  );
  if (inspecoes.length < 2) return [];
  const days = new Set(inspecoes.map((e) => dayKey(e.dataProgramada)));
  if (days.size <= 1) return [];
  return [
    {
      id: "otim-inspecoes",
      tipo: "otimizacao",
      severidade: "info",
      titulo: "Otimizar inspeções",
      mensagem: `${inspecoes.length} inspeções em ${days.size} dias diferentes — agrupar reduz deslocamento.`,
      eventoId: inspecoes[0]?.id,
    },
  ];
}

export function montarSugestoesIA(input: {
  eventos: EventoParaSugestao[];
  climaDias?: ClimaDiaHint[];
  hoje?: Date;
}): SugestaoIA[] {
  const { eventos, climaDias = [], hoje } = input;
  return [
    ...detectarAtrasos(eventos, hoje),
    ...detectarConflitos(eventos),
    ...sugerirPorClima(eventos, climaDias),
    ...sugerirOtimizacao(eventos),
  ].slice(0, 20);
}
