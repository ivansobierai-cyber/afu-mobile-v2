import { beforeAll, describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { createIsolatedTenantPair, type TenantFixture } from "./helpers/tenant-fixture";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("cultivos monitoramento V2 (Etapa 5)", () => {
  let a: TenantFixture;
  let b: TenantFixture;

  beforeAll(async () => {
    if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test_jwt_cultivos_mon";
    ({ a, b } = await createIsolatedTenantPair());
  }, 120_000);

  it("ocorrencia com culturaId aparece no monitoramento e no filtro de list", async () => {
    await a.caller.coreData.expansao.ocorrencias.create({
      propriedadeId: a.propriedadeId,
      terrenoId: a.terrenoId,
      culturaId: a.cultivoId,
      titulo: "Mancha foliar cultivo",
      categoria: "doenca",
      severidade: "media",
    });

    const mon = await a.caller.coreData.cultivos.monitoramento({ id: a.cultivoId });
    expect(mon.ocorrencias.some((o) => o.titulo === "Mancha foliar cultivo")).toBe(true);
    expect(mon.abertas).toBeGreaterThanOrEqual(1);

    const filtered = await a.caller.coreData.expansao.ocorrencias.list({
      propriedadeId: a.propriedadeId,
      culturaId: a.cultivoId,
    });
    expect(filtered.every((o) => o.culturaId === a.cultivoId)).toBe(true);
    expect(filtered.some((o) => o.titulo === "Mancha foliar cultivo")).toBe(true);
  });

  it("diagnosticos do cultivo inicia vazio e isola tenant", async () => {
    const list = await a.caller.coreData.cultivos.diagnosticos({ id: a.cultivoId });
    expect(Array.isArray(list)).toBe(true);
    await expect(
      b.caller.coreData.cultivos.monitoramento({ id: a.cultivoId }),
    ).rejects.toBeInstanceOf(TRPCError);
  });
});
