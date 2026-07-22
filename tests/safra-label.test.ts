import { describe, expect, it } from "vitest";
import {
  buildSafraOptions,
  currentSafraLabel,
  isHistoricoSafra,
  previousSafraLabel,
  safraLabelsMatch,
} from "@/lib/propriedades/safra-label";

describe("safra-label (Etapa 2)", () => {
  it("current e previous não misturam rótulos", () => {
    const cur = currentSafraLabel(new Date("2026-07-18T12:00:00Z"));
    const prev = previousSafraLabel(new Date("2026-07-18T12:00:00Z"));
    expect(cur).toBe("Safra 2026/27");
    expect(prev).toBe("Safra 2025/26");
    expect(safraLabelsMatch(cur, prev)).toBe(false);
  });

  it("isHistoricoSafra marca apenas safras diferentes da atual", () => {
    const d = new Date("2026-07-18T12:00:00Z");
    expect(isHistoricoSafra(currentSafraLabel(d), d)).toBe(false);
    expect(isHistoricoSafra(previousSafraLabel(d), d)).toBe(true);
  });

  it("buildSafraOptions deduplica extras e prioriza atual", () => {
    const d = new Date("2026-07-18T12:00:00Z");
    const opts = buildSafraOptions(["Safra 2026/27", "  safra 2024/25 "], d);
    expect(opts[0]).toBe("Safra 2026/27");
    expect(opts).toContain("Safra 2025/26");
    expect(opts.filter((o) => safraLabelsMatch(o, "Safra 2026/27")).length).toBe(1);
    expect(opts.some((o) => safraLabelsMatch(o, "Safra 2024/25"))).toBe(true);
  });
});
