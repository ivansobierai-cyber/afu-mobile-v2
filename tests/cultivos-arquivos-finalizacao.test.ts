import { beforeAll, describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { createIsolatedTenantPair, type TenantFixture } from "./helpers/tenant-fixture";
import { createDiagnostico } from "../server/db";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("cultivos arquivos + domínio NOT NULL (finalização V2)", () => {
  let a: TenantFixture;
  let b: TenantFixture;

  beforeAll(async () => {
    if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test_jwt_cultivos_fin";
    ({ a, b } = await createIsolatedTenantPair());
  }, 120_000);

  it("arquivos lista imagem de diagnóstico do cultivo", async () => {
    await createDiagnostico({
      usuarioId: a.perfilId,
      organizationId: a.organizationId,
      propriedadeId: a.propriedadeId,
      culturaId: a.cultivoId,
      imagemUrl: "org/1/diagnostico/foto-teste.jpg",
      pragaProvavel: "Lagarta",
      recomendacao: "Monitorar",
    } as any);

    const arquivos = await a.caller.coreData.cultivos.arquivos({ id: a.cultivoId });
    expect(arquivos.total).toBeGreaterThanOrEqual(1);
    expect(arquivos.items.some((i) => i.titulo.includes("Lagarta") || i.url?.includes("foto-teste"))).toBe(
      true,
    );
  });

  it("B não lê arquivos de A", async () => {
    await expect(
      b.caller.coreData.cultivos.arquivos({ id: a.cultivoId }),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it("create exige terreno e persiste safra/talhão", async () => {
    const id = await a.caller.coreData.cultivos.create({
      propriedadeId: a.propriedadeId,
      terrenoId: a.terrenoId,
      nomeCultura: "Final Soja",
      status: "em_andamento",
    });
    const list = await a.caller.coreData.cultivos.listByPropriedade({
      propriedadeId: a.propriedadeId,
    });
    const row = list.find((c) => c.id === id)!;
    expect(row.safraId).toBeTruthy();
    expect(row.terrenoId).toBe(a.terrenoId);
  });
});
