import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { clearSessionCookie, getSessionCookieOptions } from "@/server/_core/cookies";
import { COOKIE_NAME } from "@/shared/const";

type ClearCall = { name: string; options: Record<string, unknown> };

function mockRes(): { res: Response; calls: ClearCall[] } {
  const calls: ClearCall[] = [];
  const res = {
    clearCookie: vi.fn((name: string, options?: Record<string, unknown>) => {
      calls.push({ name, options: options ?? {} });
    }),
  } as unknown as Response;
  return { res, calls };
}

function mockReq(partial: Partial<Request> & { hostname: string }): Request {
  return {
    protocol: "https",
    headers: {},
    ...partial,
  } as Request;
}

describe("clearSessionCookie (Express 5)", () => {
  it("remove o cookie de sessão sem maxAge nem expires em nenhuma chamada", () => {
    const { res, calls } = mockRes();
    const req = mockReq({ hostname: "3000-xxx.example.com" });
    clearSessionCookie(res, req);

    expect(calls.length).toBeGreaterThanOrEqual(3);
    expect(calls.every((c) => c.name === COOKIE_NAME)).toBe(true);
    for (const { options } of calls) {
      expect(options).not.toHaveProperty("maxAge");
      expect(options).not.toHaveProperty("expires");
    }
  });

  it("emite quatro clearCookie quando há domain (produção/subdomínio)", () => {
    const { res, calls } = mockRes();
    const req = mockReq({ hostname: "app.example.com" });
    clearSessionCookie(res, req);

    expect(calls).toHaveLength(4);
    const opts = getSessionCookieOptions(req);
    expect(opts.domain).toBeDefined();
    expect(calls[0]?.options).toMatchObject({
      path: "/",
      httpOnly: true,
      domain: opts.domain,
    });
  });

  it("emite três clearCookie em localhost (sem domain)", () => {
    const { res, calls } = mockRes();
    const req = mockReq({ protocol: "http", hostname: "localhost" });
    clearSessionCookie(res, req);

    expect(calls).toHaveLength(3);
    expect(calls.some((c) => Boolean(c.options.domain))).toBe(false);
  });

  it("getSessionCookieOptions permanece utilizável para set cookie com maxAge", () => {
    const req = mockReq({ protocol: "http", hostname: "localhost" });
    const opts = getSessionCookieOptions(req);
    const setOpts = { ...opts, maxAge: 900_000 };
    expect(setOpts.maxAge).toBe(900_000);
    expect(opts.path).toBe("/");
    expect(opts.httpOnly).toBe(true);
  });
});
