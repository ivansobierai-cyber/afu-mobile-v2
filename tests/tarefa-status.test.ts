import { describe, expect, it } from "vitest";
import {
  canTransition,
  assertTransition,
  STATUS_ABERTOS,
} from "@/lib/propriedades/tarefa-status";

describe("tarefa status machine", () => {
  it("permite planejada → em_execucao", () => {
    expect(canTransition("planejada", "em_execucao")).toBe(true);
  });

  it("permite em_execucao → pausada → concluida → aprovada", () => {
    expect(canTransition("em_execucao", "pausada")).toBe(true);
    expect(canTransition("pausada", "concluida")).toBe(true);
    expect(canTransition("concluida", "aprovada")).toBe(true);
  });

  it("bloqueia aprovada → qualquer outro", () => {
    expect(canTransition("aprovada", "planejada")).toBe(false);
    expect(canTransition("aprovada", "em_execucao")).toBe(false);
  });

  it("exige motivo via assert em cancelamento inválido de aprovada", () => {
    expect(() => assertTransition("aprovada", "cancelada")).toThrow(/Transição inválida/);
  });

  it("lista status abertos", () => {
    expect(STATUS_ABERTOS).toContain("planejada");
    expect(STATUS_ABERTOS).toContain("em_execucao");
    expect(STATUS_ABERTOS).not.toContain("aprovada");
  });
});
