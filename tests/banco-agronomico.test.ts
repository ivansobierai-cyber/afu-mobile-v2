import { describe, it, expect } from "vitest";
import { TODAS_CULTURAS } from "@/lib/mock-data";
import {
  listarCatalogoCulturas,
  consultaAgronomica,
  countCatalogoCulturas,
} from "@/server/db-banco-agronomico";

describe("Banco Agronômico (Etapa 30)", () => {
  it("TODAS_CULTURAS tem 17 fichas (meta catálogo)", () => {
    expect(TODAS_CULTURAS.length).toBe(17);
    const slugs = new Set(TODAS_CULTURAS.map((c) => c.id));
    expect(slugs.size).toBe(17);
  });

  it("listarCatalogoCulturas retorna array", async () => {
    const items = await listarCatalogoCulturas();
    expect(Array.isArray(items)).toBe(true);
  });

  it("countCatalogoCulturas é número >= 0 (17 após seed:agronomico)", async () => {
    const count = await countCatalogoCulturas();
    expect(typeof count).toBe("number");
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it("consultaAgronomica retorna null para id inexistente", async () => {
    const result = await consultaAgronomica(999999);
    expect(result).toBeNull();
  });
});
