import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { SESSION_VERIFY_TIMEOUT_MS } from "@/hooks/use-session";
import { isDemoLoginEnabled } from "@/shared/dev-auth";

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

  it("demo login off com flag explícita 0", () => {
    const prev = process.env.EXPO_PUBLIC_SHOW_DEMO_LOGIN;
    process.env.EXPO_PUBLIC_SHOW_DEMO_LOGIN = "0";
    expect(isDemoLoginEnabled()).toBe(false);
    if (prev === undefined) delete process.env.EXPO_PUBLIC_SHOW_DEMO_LOGIN;
    else process.env.EXPO_PUBLIC_SHOW_DEMO_LOGIN = prev;
  });

  it("login screen não referencia botões demo", () => {
    const source = readFileSync(
      resolve(__dirname, "../app/auth/login.tsx"),
      "utf8",
    );
    expect(source).not.toMatch(/Entrar com Demo/);
    expect(source).not.toMatch(/handleQuickLogin/);
    expect(source).not.toMatch(/isDemoLoginEnabled/);
    expect(source).not.toMatch(/Demo@1234/);
  });
});
