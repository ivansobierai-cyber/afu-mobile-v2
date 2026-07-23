import { beforeAll, describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { createIsolatedTenantPair, type TenantFixture } from "./helpers/tenant-fixture";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("cultivos timeline V2 (Etapa 4)", () => {
  let a: TenantFixture;
  let b: TenantFixture;

  beforeAll(async () => {
    if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test_jwt_cultivos_tl";
    ({ a, b } = await createIsolatedTenantPair());
  }, 120_000);

  it("timeline inclui fase e tarefa do cultivo em ordem", async () => {
    const id = await a.caller.coreData.cultivos.create({
      propriedadeId: a.propriedadeId,
      terrenoId: a.terrenoId,
      nomeCultura: "Timeline Soja",
      faseAtual: "plantio",
      dataPlantio: new Date().toISOString().slice(0, 10),
      status: "em_andamento",
    });
    await a.caller.coreData.cultivos.update({
      id,
      data: { faseAtual: "germinacao" },
    });
    await a.caller.coreData.tarefas.create({
      propriedadeId: a.propriedadeId,
      terrenoId: a.terrenoId,
      culturaId: id,
      tipoOperacao: "adubacao",
      titulo: "Adubação timeline",
      dataPrevista: new Date().toISOString(),
    });

    const events = await a.caller.coreData.cultivos.timeline({ id });
    expect(events.some((e) => e.tipo === "plantio")).toBe(true);
    expect(events.some((e) => e.tipo === "fase" && e.titulo.includes("germinacao"))).toBe(
      true,
    );
    expect(events.some((e) => e.tipo === "tarefa" && e.titulo === "Adubação timeline")).toBe(
      true,
    );

    const times = events.map((e) => new Date(e.data).getTime());
    const sorted = [...times].sort((x, y) => x - y);
    expect(times).toEqual(sorted);
  });

  it("B não lê timeline de A", async () => {
    await expect(
      b.caller.coreData.cultivos.timeline({ id: a.cultivoId }),
    ).rejects.toBeInstanceOf(TRPCError);
  });
});
