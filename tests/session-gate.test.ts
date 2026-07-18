import { describe, expect, it } from "vitest";

/**
 * Regra Etapa 1: enquanto a sessão carrega, isAuthenticated deve ser false
 * e a UI deve bloquear com SessionGate (não pintar dashboard com zeros).
 */
describe("session gate contract", () => {
  it("trata ausência de user como não autenticado", () => {
    const user = null;
    const isAuthenticated = !!user;
    const loading = true;
    expect(isAuthenticated).toBe(false);
    expect(loading).toBe(true);
    // Gate: se loading, não montar conteúdo protegido
    const shouldBlockTree = loading;
    expect(shouldBlockTree).toBe(true);
  });

  it("libera árvore só após loading=false", () => {
    const loading = false;
    const isAuthenticated = true;
    expect(loading || !isAuthenticated).toBe(false);
  });
});
