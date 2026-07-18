import { describe, expect, it } from "vitest";

/**
 * Contratos de isolamento — garante que helpers de filtro existem
 * e que a regra de ownership está documentada nos exports de db.
 *
 * Testes de integração com MySQL real ficam no smoke staging;
 * aqui validamos a superfície exportada e a lógica de safra UI.
 */

import { currentSafraLabel } from "@/lib/propriedades/safra-label";

describe("safra label (Etapa 2)", () => {
  it("usa ano cruzado a partir de julho", () => {
    expect(currentSafraLabel(new Date("2026-08-01T12:00:00Z"))).toBe("Safra 2026/27");
  });

  it("antes de julho usa safra do ano anterior", () => {
    expect(currentSafraLabel(new Date("2026-03-01T12:00:00Z"))).toBe("Safra 2025/26");
  });
});

describe("ownership contracts", () => {
  it("db exports ownership helpers", async () => {
    const db = await import("../server/db");
    expect(typeof db.getPropriedades).toBe("function");
    expect(typeof db.getCulturas).toBe("function");
    expect(typeof db.propriedadeBelongsToProdutor).toBe("function");
    expect(typeof db.getTerrenoById).toBe("function");
  });
});
