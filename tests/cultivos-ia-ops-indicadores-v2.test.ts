import { beforeAll, describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { createIsolatedTenantPair, type TenantFixture } from "./helpers/tenant-fixture";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("cultivos IA / ops / indicadores V2 (Etapas 7–9)", () => {
  let a: TenantFixture;
  let b: TenantFixture;

  beforeAll(async () => {
    if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test_jwt_cultivos_789";
    ({ a, b } = await createIsolatedTenantPair());
  }, 120_000);

  it("iaResumo retorna saúde, risco e recomendações", async () => {
    const resumo = await a.caller.coreData.cultivos.iaResumo({ id: a.cultivoId });
    expect(typeof resumo.saudePercent).toBe("number");
    expect(["baixo", "moderado", "alto", "critico"]).toContain(resumo.riscoNivel);
    expect(resumo.recomendacoes.length).toBeGreaterThan(0);
    expect(resumo.recomendacoes[0].texto).toBeTruthy();
  });

  it("listByPropriedade filtra por culturaId", async () => {
    await a.caller.coreData.tarefas.create({
      propriedadeId: a.propriedadeId,
      terrenoId: a.terrenoId,
      culturaId: a.cultivoId,
      tipoOperacao: "pulverizacao",
      titulo: "Pulverização cultivo",
      dataPrevista: new Date().toISOString(),
    });
    const lista = await a.caller.coreData.tarefas.listByPropriedade({
      propriedadeId: a.propriedadeId,
      culturaId: a.cultivoId,
    });
    expect(lista.every((t) => t.culturaId === a.cultivoId)).toBe(true);
    expect(lista.some((t) => t.titulo === "Pulverização cultivo")).toBe(true);
  });

  it("indicadores do cultivo retornam KPIs escopados", async () => {
    const ind = await a.caller.coreData.cultivos.indicadores({ id: a.cultivoId });
    expect(ind.scope.culturaId).toBe(a.cultivoId);
    expect(typeof ind.custosOperacionais).toBe("number");
    expect(typeof ind.receita).toBe("number");
    expect(typeof ind.lucro).toBe("number");
  });

  it("tenant B não acessa iaResumo/indicadores de A", async () => {
    await expect(
      b.caller.coreData.cultivos.iaResumo({ id: a.cultivoId }),
    ).rejects.toBeInstanceOf(TRPCError);
    await expect(
      b.caller.coreData.cultivos.indicadores({ id: a.cultivoId }),
    ).rejects.toBeInstanceOf(TRPCError);
  });
});
