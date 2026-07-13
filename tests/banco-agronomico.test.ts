import { describe, it, expect } from "vitest";
import {
  listarCatalogoCulturas,
  consultaAgronomica,
  countCatalogoCulturas,
} from "@/server/db-banco-agronomico";

describe("Banco Agronômico (Etapa 30)", () => {
  it("listarCatalogoCulturas retorna array", async () => {
    const items = await listarCatalogoCulturas();
    expect(Array.isArray(items)).toBe(true);
  });

  it("countCatalogoCulturas é número >= 0", async () => {
    const count = await countCatalogoCulturas();
    expect(typeof count).toBe("number");
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it("consultaAgronomica retorna null para id inexistente", async () => {
    const result = await consultaAgronomica(999999);
    expect(result).toBeNull();
  });
});
