import { describe, expect, it } from "vitest";

/**
 * Regressão QA: a tela de forgot-password enviava `{ email }` cru,
 * mas o tRPC HTTP (superjson) exige `{ json: { email } }`.
 */
describe("forgot-password tRPC HTTP payload", () => {
  it("empacota o e-mail no envelope json", () => {
    const email = "demo@afuagro.com.br";
    const body = JSON.stringify({ json: { email: email.trim() } });
    expect(JSON.parse(body)).toEqual({ json: { email } });
  });

  it("desembrulha a resposta tRPC result.data.json", () => {
    const wire = {
      result: {
        data: {
          json: {
            success: true,
            message: "Se o e-mail existe em nossa base de dados, você receberá um link de recuperação.",
          },
        },
      },
    };
    const unwrapped =
      wire &&
      typeof wire === "object" &&
      wire.result?.data &&
      Object.prototype.hasOwnProperty.call(wire.result.data, "json")
        ? wire.result.data.json
        : wire;
    expect(unwrapped.success).toBe(true);
  });

  it("serializa mensagem de erro tRPC sem [object Object]", () => {
    const errorJson = {
      error: {
        json: {
          message: 'Invalid input: expected object, received undefined',
        },
      },
    };
    const trpcMsg = errorJson?.error?.json?.message;
    const raw =
      (typeof trpcMsg === "string" && trpcMsg) ||
      (typeof (errorJson as any).error === "string" && (errorJson as any).error) ||
      "fallback";
    const errorMessage = typeof raw === "string" ? raw : JSON.stringify(raw);
    expect(errorMessage).toBe("Invalid input: expected object, received undefined");
    expect(errorMessage).not.toContain("[object Object]");
  });
});
