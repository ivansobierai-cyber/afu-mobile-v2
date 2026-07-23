import { beforeAll, describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { createIsolatedTenantPair, type TenantFixture } from "./helpers/tenant-fixture";
import { __testComputeSaude } from "../server/db-cultivo-dashboard";

const hasDb = Boolean(process.env.DATABASE_URL);

describe("cultivo dashboard saúde (unit)", () => {
  it("sem alertas = 100%", () => {
    expect(__testComputeSaude(0, 0, 0).percent).toBe(100);
  });

  it("ocorrências críticas reduzem score", () => {
    const s = __testComputeSaude(1, 1, 0);
    expect(s.percent).toBeLessThan(100);
    expect(s.motivo).toContain("crítica");
  });
});

describe.skipIf(!hasDb)("cultivos dashboard V2 (Etapa 3)", () => {
  let a: TenantFixture;
  let b: TenantFixture;

  beforeAll(async () => {
    if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test_jwt_cultivos_dash";
    ({ a, b } = await createIsolatedTenantPair());
  }, 120_000);

  it("dashboard retorna campos operacionais do cultivo", async () => {
    const dash = await a.caller.coreData.cultivos.dashboard({ id: a.cultivoId });
    expect(dash.cultivo.id).toBe(a.cultivoId);
    expect(dash.cultivo.propriedadeId).toBe(a.propriedadeId);
    expect(dash.cultivo.terrenoId).toBe(a.terrenoId);
    expect(typeof dash.saudePercent).toBe("number");
    expect(dash.saudePercent).toBeGreaterThanOrEqual(0);
    expect(dash.saudePercent).toBeLessThanOrEqual(100);
    expect(Array.isArray(dash.alertas)).toBe(true);
    expect(dash.clima).toBeTruthy();
  });

  it("B não acessa dashboard de A", async () => {
    await expect(
      b.caller.coreData.cultivos.dashboard({ id: a.cultivoId }),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it("próxima tarefa aparece quando criada para o cultivo", async () => {
    await a.caller.coreData.tarefas.create({
      propriedadeId: a.propriedadeId,
      terrenoId: a.terrenoId,
      culturaId: a.cultivoId,
      tipoOperacao: "monitoramento",
      titulo: "Vistoria dashboard",
      // data no passado → fica como próxima (mais antiga entre abertas)
      dataPrevista: new Date(Date.now() - 3600_000).toISOString(),
    });
    const dash = await a.caller.coreData.cultivos.dashboard({ id: a.cultivoId });
    expect(dash.proximaTarefa?.titulo).toBe("Vistoria dashboard");
  });
});
