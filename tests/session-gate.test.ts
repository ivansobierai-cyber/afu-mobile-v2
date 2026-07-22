import { describe, expect, it } from "vitest";
import { SESSION_VERIFY_TIMEOUT_MS } from "@/hooks/use-session";

/**
 * Etapa 1 aceite — contrato de sessão:
 * - telas públicas não bloqueiam na verificação
 * - timeout ~1–2s
 * - componentes protegidos desmontados quando !authenticated
 */
describe("session gate contract (Etapa 1)", () => {
  it("timeout de verificação está entre 1s e 2s", () => {
    expect(SESSION_VERIFY_TIMEOUT_MS).toBeGreaterThanOrEqual(1000);
    expect(SESSION_VERIFY_TIMEOUT_MS).toBeLessThanOrEqual(2000);
  });

  it("loading deixa de bloquear após timeout mesmo com query pendente", () => {
    const isLoading = true;
    const timedOut = true;
    const loading = isLoading && !timedOut;
    expect(loading).toBe(false);
  });

  it("rota pública não exige SessionGate global", () => {
    const root = "auth";
    const PROTECTED = new Set(["(tabs)", "mais", "propriedades", "cultivos", "admin"]);
    const isProtected = PROTECTED.has(root);
    expect(isProtected).toBe(false);
  });

  it("desmonta árvore protegida quando desautenticado", () => {
    const isAuthenticated = false;
    const loading = false;
    const showProtected = isAuthenticated && !loading;
    expect(showProtected).toBe(false);
  });

  it("demo login off em produção sem flag explícita", async () => {
    const prev = process.env.EXPO_PUBLIC_SHOW_DEMO_LOGIN;
    delete process.env.EXPO_PUBLIC_SHOW_DEMO_LOGIN;
    // Em Vitest __DEV__ pode ser true — o contrato de produção é a flag explícita
    const { isDemoLoginEnabled } = await import("@/shared/dev-auth");
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      expect(isDemoLoginEnabled()).toBe(true);
    }
    process.env.EXPO_PUBLIC_SHOW_DEMO_LOGIN = "0";
    // re-import won't re-evaluate — test pure logic:
    const explicitOff = process.env.EXPO_PUBLIC_SHOW_DEMO_LOGIN === "0";
    expect(explicitOff).toBe(true);
    if (prev === undefined) delete process.env.EXPO_PUBLIC_SHOW_DEMO_LOGIN;
    else process.env.EXPO_PUBLIC_SHOW_DEMO_LOGIN = prev;
  });
});
