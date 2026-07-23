import { describe, expect, it } from "vitest";
import {
  CULTIVO_WORKSPACE_TABS,
  cultivoFaseProgress,
  nextCultivoFase,
  resolveCultivoTab,
} from "../lib/cultivos/cultivo-workspace";

describe("cultivo-workspace helpers (Etapa 2)", () => {
  it("resolveCultivoTab default e deep-link", () => {
    expect(resolveCultivoTab(undefined)).toBe("visao");
    expect(resolveCultivoTab("invalid")).toBe("visao");
    expect(resolveCultivoTab("historico")).toBe("historico");
    expect(CULTIVO_WORKSPACE_TABS).toHaveLength(8);
  });

  it("nextCultivoFase avança e respeita última fase", () => {
    expect(nextCultivoFase("plantio")).toBe("germinacao");
    expect(nextCultivoFase("colheita")).toBe("colheita");
    expect(nextCultivoFase(null)).toBe("germinacao");
  });

  it("cultivoFaseProgress calcula índice", () => {
    const p = cultivoFaseProgress("floracao");
    expect(p.index).toBeGreaterThan(0);
    expect(p.progress).toBeGreaterThan(0);
    expect(p.progress).toBeLessThanOrEqual(1);
  });
});
