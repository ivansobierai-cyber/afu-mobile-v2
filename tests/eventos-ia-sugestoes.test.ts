import { describe, expect, it } from "vitest";
import {
  detectarAtrasos,
  detectarConflitos,
  montarSugestoesIA,
  sugerirPorClima,
} from "../lib/eventos/ia-sugestoes";

describe("eventos ia sugestões", () => {
  it("detecta atrasos", () => {
    const sug = detectarAtrasos(
      [
        {
          id: 1,
          titulo: "Pulverizar",
          tipoAtividade: "pulverizacao",
          status: "pendente",
          prioridade: "alta",
          dataProgramada: "2026-01-01",
        },
      ],
      new Date("2026-07-24"),
    );
    expect(sug[0]?.tipo).toBe("atraso");
  });

  it("detecta conflitos no mesmo dia", () => {
    const sug = detectarConflitos([
      {
        id: 1,
        titulo: "A",
        tipoAtividade: "colheita",
        prioridade: "critica",
        status: "pendente",
        dataProgramada: "2026-07-24",
        propriedadeId: 1,
      },
      {
        id: 2,
        titulo: "B",
        tipoAtividade: "pulverizacao",
        prioridade: "alta",
        status: "pendente",
        dataProgramada: "2026-07-24",
        propriedadeId: 1,
      },
    ]);
    expect(sug.some((s) => s.tipo === "conflito")).toBe(true);
  });

  it("alerta clima em pulverização com chuva", () => {
    const sug = sugerirPorClima(
      [
        {
          id: 9,
          titulo: "Spray",
          tipoAtividade: "pulverizacao",
          status: "pendente",
          dataProgramada: "2026-07-25",
        },
      ],
      [{ date: "2026-07-25", precipitationSumMm: 12, weatherLabel: "Chuva" }],
    );
    expect(sug[0]?.tipo).toBe("clima");
  });

  it("montarSugestoesIA agrega", () => {
    const all = montarSugestoesIA({
      eventos: [
        {
          id: 1,
          titulo: "Old",
          tipoAtividade: "inspecao",
          status: "pendente",
          dataProgramada: "2020-01-01",
        },
      ],
      hoje: new Date("2026-07-24"),
    });
    expect(all.length).toBeGreaterThan(0);
  });
});
