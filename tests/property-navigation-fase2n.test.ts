import { describe, expect, it } from "vitest";
import {
  buildPropertyTabParams,
  moduleLabel,
  normalizePropertyTabParam,
  resolveMobilePrimaryHighlight,
  safraContextLabel,
} from "@/lib/propriedades/property-navigation";

describe("property-navigation (FASE 2N)", () => {
  it("normaliza tab ausente para visão geral", () => {
    expect(normalizePropertyTabParam(undefined)).toBe("visao");
  });

  it("preserva módulos canônicos", () => {
    expect(normalizePropertyTabParam("operacoes")).toBe("operacoes");
    expect(normalizePropertyTabParam("tarefas")).toBe("tarefas");
    expect(normalizePropertyTabParam("monitoramento")).toBe("monitoramento");
  });

  it("mapeia tab=mais + section para módulo secundário (deep link)", () => {
    expect(normalizePropertyTabParam("mais", "custos")).toBe("custos");
    expect(normalizePropertyTabParam("mais", "talhoes")).toBe("talhoes");
  });

  it("tab=mais sem section permanece hub mobile", () => {
    expect(normalizePropertyTabParam("mais")).toBe("mais");
  });

  it("mantém legado tab=talhoes e tab=cultivos", () => {
    expect(normalizePropertyTabParam("talhoes")).toBe("talhoes");
    expect(normalizePropertyTabParam("cultivos")).toBe("cultivos");
  });

  it("destaca barra mobile corretamente", () => {
    expect(resolveMobilePrimaryHighlight("operacoes")).toBe("operacoes");
    expect(resolveMobilePrimaryHighlight("custos")).toBe("mais");
    expect(resolveMobilePrimaryHighlight("configuracoes")).toBe("mais");
    expect(resolveMobilePrimaryHighlight("mais")).toBe("mais");
  });

  it("buildPropertyTabParams não remove safraId (só tab)", () => {
    expect(buildPropertyTabParams("operacoes")).toEqual({ tab: "operacoes" });
    expect(buildPropertyTabParams("mais")).toEqual({ tab: "mais" });
  });

  it("rótulos de módulo e contexto de safra", () => {
    expect(moduleLabel("operacoes")).toBe("Operações");
    expect(safraContextLabel({ safraNome: "2026/27", isHistorical: false })).toContain("Atual");
    expect(safraContextLabel({ safraNome: "2024/25", isHistorical: true })).toContain("Histórica");
  });
});
