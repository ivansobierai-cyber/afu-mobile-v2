import { beforeAll, describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { createIsolatedTenantPair, type TenantFixture } from "./helpers/tenant-fixture";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("cultivos mapa V2 (Etapa 6)", () => {
  let a: TenantFixture;
  let b: TenantFixture;

  beforeAll(async () => {
    if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test_jwt_cultivos_map";
    ({ a, b } = await createIsolatedTenantPair());
  }, 120_000);

  it("mapa retorna payload com terreno e markers de ocorrências com GPS", async () => {
    await a.caller.coreData.expansao.ocorrencias.create({
      propriedadeId: a.propriedadeId,
      terrenoId: a.terrenoId,
      culturaId: a.cultivoId,
      titulo: "Pin mapa",
      categoria: "praga",
      latitude: -23.55,
      longitude: -46.63,
    });

    const mapa = await a.caller.coreData.cultivos.mapa({ id: a.cultivoId });
    expect(mapa.culturaId).toBe(a.cultivoId);
    expect(mapa.terrenoId).toBe(a.terrenoId);
    expect(mapa.markers.some((m) => m.title === "Pin mapa")).toBe(true);
    expect(Array.isArray(mapa.polygons)).toBe(true);
  });

  it("B não acessa mapa de A", async () => {
    await expect(
      b.caller.coreData.cultivos.mapa({ id: a.cultivoId }),
    ).rejects.toBeInstanceOf(TRPCError);
  });
});
