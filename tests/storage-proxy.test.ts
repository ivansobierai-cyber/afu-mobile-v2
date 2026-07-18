/**
 * Smoke HTTP do proxy /manus-storage (Etapa 10 / correção de riscos).
 * Cobre: sem auth, token expirado, chave ≠ token, cross-org, auth ok sem Forge → 503.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import express from "express";
import type { Server } from "node:http";
import { AddressInfo } from "node:net";
import { registerStorageProxy } from "../server/_core/storageProxy";
import { issueDownloadToken } from "../server/private-files";
import { createAccessToken } from "../server/token-service";
import { createIsolatedTenantPair, type TenantFixture } from "./helpers/tenant-fixture";

function listen(app: express.Express): Promise<{ server: Server; baseUrl: string }> {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const addr = server.address() as AddressInfo;
      resolve({ server, baseUrl: `http://127.0.0.1:${addr.port}` });
    });
    server.on("error", reject);
  });
}

describe("storage proxy HTTP (/manus-storage)", () => {
  let a: TenantFixture;
  let b: TenantFixture;
  let baseUrl: string;
  let server: Server;
  beforeAll(async () => {
    if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test_jwt_secret_storage_proxy";

    const pair = await createIsolatedTenantPair();
    a = pair.a;
    b = pair.b;

    const app = express();
    registerStorageProxy(app);
    const listening = await listen(app);
    server = listening.server;
    baseUrl = listening.baseUrl;
  }, 120_000);

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  /** Auth/ACL passou: proxy segue para Forge (503 sem config, 502 erro, 307 redirect). */
  function expectAuthPassed(status: number) {
    expect([401, 403, 404]).not.toContain(status);
    expect([503, 502, 307]).toContain(status);
  }

  it("sem autenticação → 401", async () => {
    const res = await fetch(`${baseUrl}/manus-storage/${a.storageKey}`, {
      redirect: "manual",
    });
    expect(res.status).toBe(401);
    expect(res.headers.get("cache-control")).toMatch(/no-store/i);
  });

  it("token expirado → 401", async () => {
    const { token } = await issueDownloadToken({
      userId: a.userId,
      organizationId: a.organizationId,
      storageKey: a.storageKey,
      ttlSec: -30,
    });
    const res = await fetch(
      `${baseUrl}/manus-storage/${a.storageKey}?token=${encodeURIComponent(token)}`,
      { redirect: "manual" },
    );
    expect(res.status).toBe(401);
  });

  it("token com storageKey diferente da URL → 403", async () => {
    const { token } = await issueDownloadToken({
      userId: a.userId,
      organizationId: a.organizationId,
      storageKey: a.storageKey,
    });
    const res = await fetch(
      `${baseUrl}/manus-storage/${b.storageKey}?token=${encodeURIComponent(token)}`,
      { redirect: "manual" },
    );
    expect(res.status).toBe(403);
  });

  it("token da org A apontando chave da org B → 403/404 (cross-tenant)", async () => {
    const { token } = await issueDownloadToken({
      userId: a.userId,
      organizationId: a.organizationId,
      storageKey: b.storageKey,
    });
    const res = await fetch(
      `${baseUrl}/manus-storage/${b.storageKey}?token=${encodeURIComponent(token)}`,
      { redirect: "manual" },
    );
    expect([403, 404]).toContain(res.status);
  });

  it("Bearer da org A pedindo chave B → 403/404", async () => {
    const access = await createAccessToken(a.openId, a.user.name || "A");
    const res = await fetch(`${baseUrl}/manus-storage/${b.storageKey}`, {
      redirect: "manual",
      headers: { Authorization: `Bearer ${access}` },
    });
    expect([403, 404]).toContain(res.status);
  });

  it("token válido da própria org passa ACL (não 401/403/404)", async () => {
    const { token } = await issueDownloadToken({
      userId: a.userId,
      organizationId: a.organizationId,
      storageKey: a.storageKey,
    });
    const res = await fetch(
      `${baseUrl}/manus-storage/${a.storageKey}?token=${encodeURIComponent(token)}`,
      { redirect: "manual" },
    );
    expectAuthPassed(res.status);
    expect(res.headers.get("cache-control")).toMatch(/no-store/i);
  });

  it("Bearer válido da própria org passa ACL (não 401/403/404)", async () => {
    const access = await createAccessToken(a.openId, a.user.name || "A");
    const res = await fetch(`${baseUrl}/manus-storage/${a.storageKey}`, {
      redirect: "manual",
      headers: { Authorization: `Bearer ${access}` },
    });
    expectAuthPassed(res.status);
  });
});
