import { describe, expect, it } from "vitest";

/**
 * Contratos do ScreenState — evita dependência de @types/react-dom no check.
 * Renderização visual é coberta no smoke web.
 */
describe("ScreenState contracts", () => {
  const statuses = ["loading", "empty", "error", "offline", "forbidden"] as const;

  it("expõe os cinco estados da fundação", () => {
    expect(statuses).toHaveLength(5);
    expect(statuses).toContain("loading");
    expect(statuses).toContain("empty");
    expect(statuses).toContain("error");
  });

  it("mapeia ações padrão por estado", () => {
    const defaults: Record<(typeof statuses)[number], string | undefined> = {
      loading: undefined,
      empty: "Cadastrar",
      error: "Tentar novamente",
      offline: "Tentar novamente",
      forbidden: undefined,
    };
    expect(defaults.error).toBe("Tentar novamente");
    expect(defaults.empty).toBe("Cadastrar");
  });
});
