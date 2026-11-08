import { describe, expect, it, vi } from "vitest";
import { appRouter } from "../server/routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "../server/_core/context";

type CookieCall = {
  name: string;
  options: Record<string, unknown>;
};

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(hostname = "localhost"): {
  ctx: TrpcContext;
  clearedCookies: CookieCall[];
} {
  const clearedCookies: CookieCall[] = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    passwordHash: null,
    loginMethod: "manus",
    role: "user",
    emailVerified: true,
    resetToken: null,
    resetTokenExpiry: null,
    refreshToken: null,
    refreshTokenExpiry: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "http",
      hostname,
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

vi.mock("../server/token-service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../server/token-service")>();
  return {
    ...actual,
    revokeRefreshToken: vi.fn(async () => undefined),
  };
});

describe("auth.logout", () => {
  it("limpa cookies de sessão e revoga refresh (sem maxAge/expires no clearCookie)", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies.length).toBe(3);
    expect(clearedCookies.every((c) => c.name === COOKIE_NAME)).toBe(true);
    for (const { options } of clearedCookies) {
      expect(options).not.toHaveProperty("maxAge");
      expect(options).not.toHaveProperty("expires");
      expect(options.path).toBe("/");
    }
  });
});
