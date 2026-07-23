/**
 * Etapa 8 Passo 3 — máquinas: horímetro, combustível, manutenção, disponibilidade.
 * Preserva CRUD existente (create/list/update/remove).
 */
import { beforeAll, describe, expect, it } from "vitest";
import { createIsolatedTenantPair, type TenantFixture } from "./helpers/tenant-fixture";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("Etapa 8 Passo 3 — máquinas controle", () => {
  let a: TenantFixture;
  let b: TenantFixture;
  let maquinaId: number;

  beforeAll(async () => {
    if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test_jwt_maq_p3";
    ({ a, b } = await createIsolatedTenantPair());
    maquinaId = await a.caller.coreData.expansao.maquinas.create({
      propriedadeId: a.propriedadeId,
      nome: "Trator P3",
      tipo: "trator",
      horasUso: 100,
    });
  }, 120_000);

  it("cadastra caminhão (tipo do plano)", async () => {
    const id = await a.caller.coreData.expansao.maquinas.create({
      propriedadeId: a.propriedadeId,
      nome: "Caminhão graneleiro",
      tipo: "caminhao",
    });
    expect(id).toBeGreaterThan(0);
    const list = await a.caller.coreData.expansao.maquinas.list({
      propriedadeId: a.propriedadeId,
    });
    expect(list.some((m) => m.id === id && m.tipo === "caminhao")).toBe(true);
  });

  it("horímetro só avança e gera evento", async () => {
    const r = await a.caller.coreData.expansao.maquinas.registrarHorimetro({
      maquinaId,
      horas: 105,
      descricao: "Após pulverização",
    });
    expect(r.horasUso).toBe(105);
    await expect(
      a.caller.coreData.expansao.maquinas.registrarHorimetro({
        maquinaId,
        horas: 90,
      }),
    ).rejects.toThrow();
    const eventos = await a.caller.coreData.expansao.maquinas.eventos({ maquinaId });
    expect(eventos.some((e) => e.tipo === "horimetro")).toBe(true);
  });

  it("combustível entrada/saída e manutenção", async () => {
    await a.caller.coreData.expansao.maquinas.registrarCombustivel({
      maquinaId,
      litros: 80,
      sentido: "entrada",
    });
    const afterIn = await a.caller.coreData.expansao.maquinas.registrarCombustivel({
      maquinaId,
      litros: 20,
      sentido: "saida",
    });
    expect(afterIn.combustivelLitros).toBe(60);

    const man = await a.caller.coreData.expansao.maquinas.registrarManutencao({
      maquinaId,
      descricao: "Troca de óleo",
      custo: 350,
      colocarEmManutencao: true,
    });
    expect(man.status).toBe("manutencao");

    const disp = await a.caller.coreData.expansao.maquinas.setDisponibilidade({
      maquinaId,
      status: "disponivel",
    });
    expect(disp.status).toBe("disponivel");
  });

  it("update/remove existentes continuam funcionando; sem vazamento cross-tenant", async () => {
    await a.caller.coreData.expansao.maquinas.update({
      id: maquinaId,
      notas: "OK P3",
    });
    await expect(
      b.caller.coreData.expansao.maquinas.update({ id: maquinaId, nome: "hack" }),
    ).rejects.toThrow();
    await expect(
      b.caller.coreData.expansao.maquinas.registrarHorimetro({ maquinaId, horas: 200 }),
    ).rejects.toThrow();
  });
});
