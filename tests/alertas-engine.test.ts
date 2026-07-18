import { describe, expect, it } from "vitest";
import { gerarAlertas, METRICAS_CATALOGO } from "@/lib/propriedades/alertas-engine";
import { approxAreaHaFromGeoJson, squarePolygonAround } from "@/lib/propriedades/geojson-helpers";

describe("alertas-engine", () => {
  const now = new Date("2026-07-14T12:00:00Z");

  it("gera alerta de tarefa atrasada", () => {
    const alertas = gerarAlertas({
      tarefas: [
        {
          id: 1,
          titulo: "Pulverizar",
          status: "planejada",
          prioridade: "alta",
          dataPrevista: "2026-07-10T12:00:00Z",
        },
      ],
      cultivos: [],
      estoque: [],
      orcamentos: [],
      ocorrencias: [],
      temGeometriaPropriedade: true,
      now,
    });
    expect(alertas.some((a) => a.id === "tarefa-atrasada-1")).toBe(true);
    expect(alertas[0].gravidade).toBe("alto");
    expect(alertas[0].fonte).toContain("tarefas_operacionais");
  });

  it("gera alerta de estoque baixo e geometria ausente", () => {
    const alertas = gerarAlertas({
      tarefas: [],
      cultivos: [],
      estoque: [{ id: 9, nome: "Ureia", saldo: 0, estoqueMinimo: 5 }],
      orcamentos: [],
      ocorrencias: [],
      temGeometriaPropriedade: false,
      now,
    });
    expect(alertas.some((a) => a.id === "estoque-minimo-9" && a.gravidade === "critico")).toBe(true);
    expect(alertas.some((a) => a.id === "geometria-ausente")).toBe(true);
  });

  it("expõe catálogo de métricas da etapa 10", () => {
    expect(METRICAS_CATALOGO.length).toBeGreaterThanOrEqual(5);
    expect(METRICAS_CATALOGO.every((m) => m.formula && m.fonte)).toBe(true);
  });
});

describe("geojson-helpers", () => {
  it("cria polígono e estima área positiva", () => {
    const geo = squarePolygonAround(-23.5, -51.4, 0.01);
    const area = approxAreaHaFromGeoJson(geo);
    expect(area).not.toBeNull();
    expect(area!).toBeGreaterThan(0);
  });
});
