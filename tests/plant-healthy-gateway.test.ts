import { describe, expect, it, vi, beforeEach } from "vitest";
import express from "express";
import type { AddressInfo } from "net";
import {
  mapAlertasToAgi,
  mapAnalyzeToAgiResponse,
  registerPlantHealthyGateway,
} from "../server/plant-healthy-gateway";

describe("plant-healthy-gateway mappers", () => {
  it("mapAnalyzeToAgiResponse normaliza confiança 0–100 → 0–1", () => {
    const mapped = mapAnalyzeToAgiResponse({
      problema: "Ferrugem asiática",
      confianca: 92,
      recomendacoes: ["Monitorar talhão"],
      severidade: "moderada",
      descricao: "Lesões nas folhas",
      organizationId: 7,
      propriedadeId: 3,
    });
    expect(mapped.diagnosis).toBe("Ferrugem asiática");
    expect(mapped.confidence).toBeCloseTo(0.92);
    expect(mapped.recommendations).toEqual(["Monitorar talhão"]);
    expect((mapped.afu as { organizationId: number }).organizationId).toBe(7);
  });

  it("mapAlertasToAgi preserva gravidade e timestamps", () => {
    const mapped = mapAlertasToAgi(
      [
        {
          id: "a1",
          titulo: "Estoque baixo",
          motivo: "Item X abaixo do mínimo",
          gravidade: "alto",
          createdAt: "2026-01-02T00:00:00.000Z",
        },
      ],
      "soja",
      "G3",
    );
    expect(mapped.status).toBe("ok");
    expect(mapped.alerts).toHaveLength(1);
    expect(mapped.alerts[0].severity).toBe("alto");
    expect(mapped.alerts[0].crop_type).toBe("soja");
    expect(mapped.alerts[0].timestamp).toBe(Date.parse("2026-01-02T00:00:00.000Z"));
  });
});

describe("plant-healthy-gateway HTTP auth", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("rejeita analyze_image sem Bearer JWT", async () => {
    const app = express();
    app.use(express.json({ limit: "2mb" }));
    registerPlantHealthyGateway(app);

    const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
      const s = app.listen(0, "127.0.0.1", () => resolve(s));
    });
    const { port } = server.address() as AddressInfo;

    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/plant_healthy/analyze_image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crop_type: "soja",
          generation: "G3",
          image_base64: "aaaa",
        }),
      });
      expect(res.status).toBe(401);
      const body = (await res.json()) as { error?: string };
      expect(body.error).toMatch(/Unauthorized/i);
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      );
    }
  });

  it("rejeita telemetry sem Bearer JWT", async () => {
    const app = express();
    app.use(express.json());
    registerPlantHealthyGateway(app);

    const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
      const s = app.listen(0, "127.0.0.1", () => resolve(s));
    });
    const { port } = server.address() as AddressInfo;

    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/plant_healthy/telemetry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crop_type: "soja", generation: "G2" }),
      });
      expect(res.status).toBe(401);
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      );
    }
  });

  it("login AFU via /api/agi/auth/login valida payload", async () => {
    const app = express();
    app.use(express.json());
    registerPlantHealthyGateway(app);

    const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
      const s = app.listen(0, "127.0.0.1", () => resolve(s));
    });
    const { port } = server.address() as AddressInfo;

    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/agi/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "not-an-email", password: "" }),
      });
      expect(res.status).toBe(400);
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      );
    }
  });
});

describe("plant-healthy-gateway tenant isolation (DB)", () => {
  it("alerts com JWT de tenant A não vazam propriedade de tenant B", async () => {
    if (!process.env.DATABASE_URL) {
      return;
    }

    const { createIsolatedTenantPair } = await import("./helpers/tenant-fixture");
    const { createAccessToken } = await import("../server/token-service");
    const { registerPlantHealthyGateway: register } = await import(
      "../server/plant-healthy-gateway"
    );

    const { a, b } = await createIsolatedTenantPair();
    const tokenA = await createAccessToken(a.openId, a.user.name || "A");

    const app = express();
    app.use(express.json());
    register(app);

    const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
      const s = app.listen(0, "127.0.0.1", () => resolve(s));
    });
    const { port } = server.address() as AddressInfo;

    try {
      const denied = await fetch(
        `http://127.0.0.1:${port}/api/plant_healthy/alerts?propriedade_id=${b.propriedadeId}`,
        { headers: { Authorization: `Bearer ${tokenA}` } },
      );
      expect([403, 404]).toContain(denied.status);

      const ok = await fetch(
        `http://127.0.0.1:${port}/api/plant_healthy/alerts?propriedade_id=${a.propriedadeId}`,
        { headers: { Authorization: `Bearer ${tokenA}` } },
      );
      expect(ok.status).toBe(200);
      const body = (await ok.json()) as { status?: string; alerts?: unknown[] };
      expect(body.status).toBe("ok");
      expect(Array.isArray(body.alerts)).toBe(true);
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      );
    }
  }, 60_000);
});
