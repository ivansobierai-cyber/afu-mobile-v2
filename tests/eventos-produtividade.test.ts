import { describe, expect, it } from "vitest";
import {
  checklistProgress,
  newChecklistItem,
  parseChecklist,
  parseEtiquetas,
  serializeChecklist,
  serializeEtiquetas,
} from "../lib/eventos/produtividade";

describe("eventos produtividade", () => {
  it("serializa e parseia etiquetas", () => {
    const raw = serializeEtiquetas(["Urgente", "clima", "urgente"]);
    expect(parseEtiquetas(raw)).toEqual(["urgente", "clima"]);
  });

  it("serializa e parseia checklist", () => {
    const items = [newChecklistItem("Checar EPI"), newChecklistItem("Calibrar")];
    items[0]!.feito = true;
    const raw = serializeChecklist(items);
    const parsed = parseChecklist(raw);
    expect(parsed).toHaveLength(2);
    expect(checklistProgress(parsed)).toEqual({ done: 1, total: 2 });
  });

  it("parseEtiquetas tolera CSV legado", () => {
    expect(parseEtiquetas("praga, irrigacao")).toEqual(["praga", "irrigacao"]);
  });

  it("serializa lista vazia de etiquetas", () => {
    expect(serializeEtiquetas([])).toBe("[]");
    expect(parseEtiquetas("[]")).toEqual([]);
  });
});
