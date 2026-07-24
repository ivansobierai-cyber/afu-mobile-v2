import { describe, expect, it } from "vitest";
import { gerarEventosDoCiclo } from "../lib/eventos/ciclo-cultura";
import { nextOccurrenceDate, toDateInputValue } from "../lib/eventos/recurrence";

describe("eventos automações", () => {
  it("nextOccurrenceDate cobre recorrências", () => {
    const base = new Date(2026, 6, 1);
    expect(toDateInputValue(nextOccurrenceDate(base, "diaria")!)).toBe("2026-07-02");
    expect(toDateInputValue(nextOccurrenceDate(base, "semanal")!)).toBe("2026-07-08");
    expect(toDateInputValue(nextOccurrenceDate(base, "quinzenal")!)).toBe("2026-07-15");
    expect(toDateInputValue(nextOccurrenceDate(base, "mensal")!)).toBe("2026-08-01");
    expect(nextOccurrenceDate(base, "nenhuma")).toBeNull();
  });

  it("gerarEventosDoCiclo cria cadeia com dependências", () => {
    const drafts = gerarEventosDoCiclo({
      nomeCultura: "Soja",
      dataPlantio: "2026-07-01",
      previsaoColheita: "2026-11-01",
    });
    expect(drafts.length).toBeGreaterThanOrEqual(6);
    expect(drafts[0]?.tipoAtividade).toBe("plantio");
    expect(drafts.some((d) => d.tipoAtividade === "colheita")).toBe(true);
    expect(drafts.filter((d) => d.dependsOnIndex != null).length).toBeGreaterThan(2);
  });
});
