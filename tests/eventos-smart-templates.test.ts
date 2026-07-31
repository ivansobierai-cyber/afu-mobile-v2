import { describe, expect, it } from "vitest";
import { SMART_EVENT_TEMPLATES, getSmartTemplate } from "../lib/eventos/smart-templates";

describe("eventos smart templates", () => {
  it("cobre os 8 tipos do plano mestre", () => {
    const labels = SMART_EVENT_TEMPLATES.map((t) => t.label);
    expect(labels).toEqual(
      expect.arrayContaining([
        "Plantio",
        "Irrigação",
        "Pulverização",
        "Adubação",
        "Colheita",
        "Inspeção",
        "Manutenção",
        "Laboratório",
      ]),
    );
    expect(SMART_EVENT_TEMPLATES).toHaveLength(8);
  });

  it("getSmartTemplate retorna template com defaults", () => {
    const tpl = getSmartTemplate("irrigacao");
    expect(tpl?.recorrencia).toBe("diaria");
    expect(tpl?.prioridade).toBe("normal");
    expect(tpl?.tituloSugerido.length).toBeGreaterThan(3);
  });
});
