import { describe, expect, it } from "vitest";
import {
  buildEventosAgendaPrompt,
  mergeSugestoesRegrasELlm,
  parseLlmSugestoesJson,
} from "../lib/eventos/ia-sugestoes-llm";
import type { SugestaoIA } from "../lib/eventos/ia-sugestoes";

describe("eventos ia sugestões LLM", () => {
  it("buildEventosAgendaPrompt inclui eventos e clima", () => {
    const p = buildEventosAgendaPrompt({
      eventos: [
        {
          id: 1,
          titulo: "Pulverizar talhão 2",
          tipoAtividade: "pulverizacao",
          status: "pendente",
          dataProgramada: new Date("2026-07-25T12:00:00Z"),
        },
      ],
      climaDias: [{ date: "2026-07-25", precipitationSumMm: 5 }],
      regrasCount: 2,
    });
    expect(p).toContain("pulverizacao");
    expect(p).toContain("2026-07-25");
    expect(p).toContain("2 alertas determinísticos");
  });

  it("parseLlmSugestoesJson aceita objeto com sugestoes", () => {
    const raw = `{"sugestoes":[{"tipo":"otimizacao","severidade":"info","titulo":"Antecipar inspeção","mensagem":"Faça antes da chuva."}]}`;
    const out = parseLlmSugestoesJson(raw);
    expect(out).toHaveLength(1);
    expect(out[0]?.tipo).toBe("otimizacao");
    expect(out[0]?.titulo).toBe("Antecipar inspeção");
  });

  it("parseLlmSugestoesJson ignora tipos inválidos", () => {
    const out = parseLlmSugestoesJson(
      '{"sugestoes":[{"tipo":"foo","severidade":"info","titulo":"X","mensagem":"Y"}]}',
    );
    expect(out).toHaveLength(0);
  });

  it("mergeSugestoesRegrasELlm deduplica por título", () => {
    const regras: SugestaoIA[] = [
      {
        id: "r1",
        tipo: "atraso",
        severidade: "atencao",
        titulo: "Evento atrasado",
        mensagem: "m",
      },
    ];
    const llm: SugestaoIA[] = [
      {
        id: "l1",
        tipo: "otimizacao",
        severidade: "info",
        titulo: "evento atrasado",
        mensagem: "dup",
      },
      {
        id: "l2",
        tipo: "fase",
        severidade: "info",
        titulo: "Nova ação",
        mensagem: "ok",
      },
    ];
    const merged = mergeSugestoesRegrasELlm(regras, llm);
    expect(merged).toHaveLength(2);
    expect(merged[1]?.titulo).toBe("Nova ação");
  });
});
