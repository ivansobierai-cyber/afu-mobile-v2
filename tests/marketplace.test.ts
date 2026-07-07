import { describe, expect, it } from "vitest";
import {
  encodeMarketplaceObservacoes,
  generateDemoPixCode,
  parseMarketplaceObservacoes,
} from "../shared/marketplace";

describe("marketplace observacoes encoding", () => {
  it("encodes and parses pix metodo", () => {
    const raw = encodeMarketplaceObservacoes("pix", "Entregar de manhã");
    const parsed = parseMarketplaceObservacoes(raw);
    expect(parsed.metodo).toBe("pix");
    expect(parsed.observacoes).toBe("Entregar de manhã");
  });

  it("encodes na_entrega without extra text", () => {
    const raw = encodeMarketplaceObservacoes("na_entrega");
    const parsed = parseMarketplaceObservacoes(raw);
    expect(parsed.metodo).toBe("na_entrega");
    expect(parsed.observacoes).toBe("");
  });

  it("returns null metodo for legacy observacoes", () => {
    const parsed = parseMarketplaceObservacoes("Só observação antiga");
    expect(parsed.metodo).toBeNull();
    expect(parsed.observacoes).toBe("Só observação antiga");
  });
});

describe("generateDemoPixCode", () => {
  it("includes pedido id in demo code", () => {
    const code = generateDemoPixCode(42, 150.5);
    expect(code.startsWith("00020126")).toBe(true);
    expect(code).toContain("0042");
  });
});
