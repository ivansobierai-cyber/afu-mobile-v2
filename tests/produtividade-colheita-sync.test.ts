import { describe, expect, it } from "vitest";
import {
  parseQuantidadeProducao,
  resolveProducaoColheitaKg,
  shouldSyncProducaoColheita,
} from "../lib/eventos/produtividade-colheita";
import { serializeChecklist, newChecklistItem } from "../lib/eventos/produtividade";

describe("produtividade colheita sync", () => {
  it("parseia produção em kg e toneladas", () => {
    expect(parseQuantidadeProducao("Produção real: 4.500 kg")).toBe(4500);
    expect(parseQuantidadeProducao("colheita 12 t")).toBe(12000);
    expect(parseQuantidadeProducao("sem número")).toBeNull();
  });

  it("prioriza valor explícito", () => {
    expect(
      resolveProducaoColheitaKg({
        explicitKg: 3000,
        descricao: "Produção: 9999 kg",
      }),
    ).toBe(3000);
  });

  it("lê checklist concluído", () => {
    const items = [newChecklistItem("Pesar carga: 2200 kg")];
    items[0]!.feito = true;
    const json = serializeChecklist(items);
    expect(
      resolveProducaoColheitaKg({
        checklistJson: json,
      }),
    ).toBe(2200);
  });

  it("só sincroniza colheita concluída", () => {
    expect(shouldSyncProducaoColheita("colheita", true)).toBe(true);
    expect(shouldSyncProducaoColheita("plantio", true)).toBe(false);
    expect(shouldSyncProducaoColheita("colheita", false)).toBe(false);
  });
});
