/**
 * Resultado do cultivo — payload e HTML do relatório.
 */
import { describe, expect, it } from "vitest";
import { buildResultadoCultivoConteudo } from "../lib/cultivos/resultado-cultivo-report";
import { buildReportHtml } from "../server/report-html";

describe("buildResultadoCultivoConteudo", () => {
  it("monta indicadores e interpretação", () => {
    const payload = buildResultadoCultivoConteudo({
      indicadores: {
        areaHa: 10,
        custosOperacionais: 1000,
        custoPorHectare: 100,
        receita: 5000,
        despesas: 200,
        lucro: 3800,
        margemPct: 76,
        roiPct: 316.67,
        produtividade: 450,
        produtividadeFonte: "real",
        producaoUsada: 4500,
      },
      dashboard: {
        cultivo: {
          nomeCultura: "Soja",
          variedade: "TMG",
          status: "colhido",
          faseAtual: "colheita",
          producaoReal: 4500,
          unidadeProducao: "kg",
        },
        saudePercent: 82,
        diasAposPlantio: 120,
      },
    });
    expect(payload.indicadores.some((i) => i.label === "Produtividade")).toBe(true);
    expect(payload.interpretacao).toContain("Soja");
    expect(payload.interpretacao).toContain("4500");
  });
});

describe("buildReportHtml resultado_cultivo", () => {
  it("renderiza seção de indicadores", () => {
    const html = buildReportHtml({
      tipo: "resultado_cultivo",
      titulo: "Resultado — Soja",
      culturaNome: "Soja",
      propriedadeNome: "Fazenda Teste",
      dataEmissao: "2026-07-23",
      conteudo: JSON.stringify({
        interpretacao: "Cultivo Soja colhido.",
        indicadores: [
          { label: "Área (ha)", value: "10" },
          { label: "Lucro", value: "R$ 3800.00" },
        ],
        recomendacoes: ["Validar pesagem."],
      }),
    });
    expect(html).toContain("Relatório de Resultado do Cultivo");
    expect(html).toContain("Indicadores");
    expect(html).toContain("Área (ha)");
    expect(html).toContain("Lucro");
  });
});
