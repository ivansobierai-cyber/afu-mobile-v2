/**
 * Cultivos V2 Etapa 10 — fluxo E2E API: criar → dashboard → timeline → tarefa → indicadores.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { createIsolatedTenantPair, type TenantFixture } from "./helpers/tenant-fixture";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("cultivos V2 workspace E2E (Etapa 10)", () => {
  let a: TenantFixture;

  beforeAll(async () => {
    if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test_jwt_cultivos_e2e";
    ({ a } = await createIsolatedTenantPair());
  }, 120_000);

  it("fluxo integrado do workspace operacional", async () => {
    const cultivoId = await a.caller.coreData.cultivos.create({
      propriedadeId: a.propriedadeId,
      terrenoId: a.terrenoId,
      nomeCultura: "E2E Soja V2",
      faseAtual: "plantio",
      dataPlantio: new Date().toISOString().slice(0, 10),
      areaPlantada: 4,
      producaoEstimada: 200,
      unidadeProducao: "sc",
      status: "em_andamento",
    });

    await a.caller.coreData.cultivos.update({
      id: cultivoId,
      data: { faseAtual: "germinacao" },
    });

    await a.caller.coreData.tarefas.create({
      propriedadeId: a.propriedadeId,
      terrenoId: a.terrenoId,
      culturaId: cultivoId,
      tipoOperacao: "monitoramento",
      titulo: "E2E vistoria",
      dataPrevista: new Date(Date.now() - 1000).toISOString(),
    });

    await a.caller.coreData.expansao.ocorrencias.create({
      propriedadeId: a.propriedadeId,
      terrenoId: a.terrenoId,
      culturaId: cultivoId,
      titulo: "E2E ocorrência",
      categoria: "praga",
      latitude: -22.9,
      longitude: -47.0,
    });

    const dash = await a.caller.coreData.cultivos.dashboard({ id: cultivoId });
    expect(dash.cultivo.id).toBe(cultivoId);
    expect(dash.proximaTarefa?.titulo).toBe("E2E vistoria");
    expect(dash.saudePercent).toBeLessThanOrEqual(100);

    const timeline = await a.caller.coreData.cultivos.timeline({ id: cultivoId });
    expect(timeline.some((e) => e.tipo === "fase")).toBe(true);
    expect(timeline.some((e) => e.tipo === "tarefa")).toBe(true);
    expect(timeline.some((e) => e.tipo === "ocorrencia")).toBe(true);

    const mon = await a.caller.coreData.cultivos.monitoramento({ id: cultivoId });
    expect(mon.ocorrencias.some((o) => o.titulo === "E2E ocorrência")).toBe(true);

    const mapa = await a.caller.coreData.cultivos.mapa({ id: cultivoId });
    expect(mapa.markers.some((m) => m.title === "E2E ocorrência")).toBe(true);

    const ia = await a.caller.coreData.cultivos.iaResumo({ id: cultivoId });
    expect(ia.recomendacoes.length).toBeGreaterThan(0);

    const ind = await a.caller.coreData.cultivos.indicadores({ id: cultivoId });
    expect(ind.scope.culturaId).toBe(cultivoId);
    expect(ind.areaHa).toBe(4);

    const fases = await a.caller.coreData.cultivos.faseEventos({ id: cultivoId });
    expect(fases.some((f) => f.faseNova === "germinacao")).toBe(true);
  });
});
