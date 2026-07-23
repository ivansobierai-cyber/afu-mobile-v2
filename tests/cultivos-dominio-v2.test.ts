/**
 * Cultivos V2 Etapa 1 — domínio: talhão obrigatório, safra, histórico de fases.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { createIsolatedTenantPair, type TenantFixture } from "./helpers/tenant-fixture";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("cultivos domínio V2 (Etapa 1)", () => {
  let a: TenantFixture;
  let b: TenantFixture;

  beforeAll(async () => {
    if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test_jwt_cultivos_v2";
    ({ a, b } = await createIsolatedTenantPair());
  }, 120_000);

  it("create sem terrenoId falha na validação Zod", async () => {
    await expect(
      a.caller.coreData.cultivos.create({
        propriedadeId: a.propriedadeId,
        nomeCultura: "Sem talhão",
        status: "em_andamento",
      } as any),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it("create com talhão auto-atribui safra default e registra fase inicial", async () => {
    const id = await a.caller.coreData.cultivos.create({
      propriedadeId: a.propriedadeId,
      terrenoId: a.terrenoId,
      nomeCultura: "Soja V2",
      faseAtual: "plantio",
      status: "em_andamento",
    });
    expect(typeof id).toBe("number");

    const list = await a.caller.coreData.cultivos.listByPropriedade({
      propriedadeId: a.propriedadeId,
    });
    const created = list.find((c) => c.id === id);
    expect(created).toBeTruthy();
    expect(created!.terrenoId).toBe(a.terrenoId);
    expect(created!.safraId).toBeTruthy();
    expect(created!.faseAtual).toBe("plantio");

    const eventos = await a.caller.coreData.cultivos.faseEventos({ id });
    expect(eventos.length).toBeGreaterThanOrEqual(1);
    expect(eventos[0].faseNova).toBe("plantio");
    expect(eventos[0].faseAnterior).toBeNull();
  });

  it("avançar fase gera evento no histórico", async () => {
    const id = await a.caller.coreData.cultivos.create({
      propriedadeId: a.propriedadeId,
      terrenoId: a.terrenoId,
      nomeCultura: "Milho fases",
      faseAtual: "plantio",
      status: "em_andamento",
    });
    await a.caller.coreData.cultivos.update({
      id,
      data: { faseAtual: "emergencia" },
    });
    const eventos = await a.caller.coreData.cultivos.faseEventos({ id });
    const avancos = eventos.filter((e) => e.faseNova === "emergencia");
    expect(avancos.length).toBe(1);
    expect(avancos[0].faseAnterior).toBe("plantio");
  });

  it("update com mesma fase não duplica evento", async () => {
    const id = await a.caller.coreData.cultivos.create({
      propriedadeId: a.propriedadeId,
      terrenoId: a.terrenoId,
      nomeCultura: "Feijão estável",
      faseAtual: "vegetativo",
      status: "em_andamento",
    });
    const before = await a.caller.coreData.cultivos.faseEventos({ id });
    await a.caller.coreData.cultivos.update({
      id,
      data: { faseAtual: "vegetativo", observacoes: "sem mudança de fase" },
    });
    const after = await a.caller.coreData.cultivos.faseEventos({ id });
    expect(after.length).toBe(before.length);
  });

  it("B não lê faseEventos do cultivo de A (tenant isolation)", async () => {
    await expect(
      b.caller.coreData.cultivos.faseEventos({ id: a.cultivoId }),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it("create com terreno de outra propriedade é negado", async () => {
    await expect(
      a.caller.coreData.cultivos.create({
        propriedadeId: a.propriedadeId,
        terrenoId: b.terrenoId,
        nomeCultura: "Hack talhão",
        status: "em_andamento",
      }),
    ).rejects.toBeInstanceOf(TRPCError);
  });
});
