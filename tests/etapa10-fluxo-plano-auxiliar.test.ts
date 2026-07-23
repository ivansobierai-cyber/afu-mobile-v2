/**
 * Etapa 10 Passo 3 — fluxo E2E API (plano auxiliar):
 * propriedade → safra → tarefa → estoque → custo → indicadores.
 * Não remove dados; usa tenants isolados de teste.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { createIsolatedTenantPair, type TenantFixture } from "./helpers/tenant-fixture";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("Etapa 10 — fluxo E2E plano auxiliar", () => {
  let a: TenantFixture;

  beforeAll(async () => {
    if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test_jwt_etapa10_e2e";
    ({ a } = await createIsolatedTenantPair());
  }, 120_000);

  it("executa cadeia operacional completa", async () => {
    // Estoque com custo médio
    const itemId = await a.caller.coreData.expansao.estoque.createItem({
      propriedadeId: a.propriedadeId,
      nome: "Ureia E2E",
      categoria: "fertilizante",
      unidadeBase: "kg",
      saldoInicial: 100,
      estoqueMinimo: 10,
      custoMedio: 4.5,
    });

    // Tarefa com reserva → execução → consumo
    const tarefaId = await a.caller.coreData.tarefas.create({
      propriedadeId: a.propriedadeId,
      tipoOperacao: "adubacao",
      titulo: "Adubação E2E",
      dataPrevista: new Date().toISOString(),
      responsavelUserId: a.userId,
      reservas: [{ itemId, quantidade: 15 }],
    });
    await a.caller.coreData.tarefas.alocacoes.upsert({
      tarefaId,
      userId: a.userId,
      papelEquipe: "operador",
      horasPlanejadas: 2,
    });
    await a.caller.coreData.tarefas.transition({ id: tarefaId, status: "liberada" });
    await a.caller.coreData.tarefas.transition({ id: tarefaId, status: "em_execucao" });
    await a.caller.coreData.tarefas.transition({ id: tarefaId, status: "concluida" });

    // Custo + financeiro
    await a.caller.coreData.expansao.custos.createCusto({
      propriedadeId: a.propriedadeId,
      tarefaId,
      terrenoId: a.terrenoId,
      descricao: "Custo E2E ureia",
      valor: 300,
      categoria: "insumo",
    });
    await a.caller.coreData.expansao.financeiro.create({
      propriedadeId: a.propriedadeId,
      tipo: "receita",
      descricao: "Venda E2E",
      valor: 2000,
    });

    // Máquina
    const maqId = await a.caller.coreData.expansao.maquinas.create({
      propriedadeId: a.propriedadeId,
      nome: "Trator E2E",
      tipo: "trator",
      horasUso: 10,
    });
    await a.caller.coreData.expansao.maquinas.registrarHorimetro({
      maquinaId: maqId,
      horas: 12,
    });

    // Cultivo + colheita real → produtividade
    const cultivoId = await a.caller.coreData.cultivos.create({
      propriedadeId: a.propriedadeId,
      terrenoId: a.terrenoId,
      nomeCultura: "Soja E2E",
      areaPlantada: 10,
      producaoEstimada: 5000,
      unidadeProducao: "kg",
    });
    await a.caller.coreData.cultivos.update({
      id: cultivoId,
      data: { producaoReal: 4500, status: "colhido" },
    });

    // Indicadores + dashboard
    const ind = await a.caller.coreData.expansao.indicadores({
      propriedadeId: a.propriedadeId,
    });
    expect(ind.receita).toBeGreaterThanOrEqual(2000);
    expect(ind.custosOperacionais).toBeGreaterThanOrEqual(300);
    expect(ind.produtividadeFonte).toBe("real");
    expect(ind.produtividade).toBe(450);

    const dash = await a.caller.coreData.expansao.financeiro.dashboard({
      propriedadeId: a.propriedadeId,
    });
    expect(dash.resultado).toBeDefined();
    expect(dash.series.length).toBeGreaterThanOrEqual(6);

    const estoque = await a.caller.coreData.expansao.estoque.list({
      propriedadeId: a.propriedadeId,
    });
    const item = estoque.find((i) => i.id === itemId);
    expect(Number(item?.saldo)).toBe(85); // 100 - 15 consumo
    expect(Number(item?.custoMedio)).toBeCloseTo(4.5, 3);

    const estDash = await a.caller.coreData.expansao.estoque.dashboard({
      propriedadeId: a.propriedadeId,
    });
    expect(estDash.valorDisponivel).toBe(true);
    expect(estDash.valorTotalEstoque).toBeGreaterThan(0);

    const indCultivo = await a.caller.coreData.cultivos.indicadores({ id: cultivoId });
    expect(indCultivo.produtividadeFonte).toBe("real");
    expect(indCultivo.produtividade).toBe(450);
  });
});
