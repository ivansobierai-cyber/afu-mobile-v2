import { describe, it, expect } from "vitest";
import { TODAS_CULTURAS, PRAGAS, DOENCAS } from "@/lib/mock-data";
import { AFU_ETAPAS_31_34, etapas31a34ProgressPercent } from "@/constants/afu-etapas";
import {
  listarCatalogoCulturas,
  consultaAgronomica,
  countCatalogoCulturas,
  countBancoAgronomicoStats,
} from "@/server/db-banco-agronomico";

describe("Banco Agronômico (Etapa 30)", () => {
  it("TODAS_CULTURAS tem 17 fichas (meta catálogo)", () => {
    expect(TODAS_CULTURAS.length).toBe(17);
    const slugs = new Set(TODAS_CULTURAS.map((c) => c.id));
    expect(slugs.size).toBe(17);
  });

  it("listarCatalogoCulturas retorna array", async () => {
    const items = await listarCatalogoCulturas();
    expect(Array.isArray(items)).toBe(true);
  });

  it("countCatalogoCulturas é número >= 0 (17 após seed:agronomico)", async () => {
    const count = await countCatalogoCulturas();
    expect(typeof count).toBe("number");
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it("consultaAgronomica retorna null para id inexistente", async () => {
    const result = await consultaAgronomica(999999);
    expect(result).toBeNull();
  });
});

describe("Etapas 31–34 — expansão banco", () => {
  it("etapas 31–34 estão done e progresso 100%", () => {
    expect(AFU_ETAPAS_31_34).toHaveLength(4);
    expect(AFU_ETAPAS_31_34.every((e) => e.status === "done")).toBe(true);
    expect(etapas31a34ProgressPercent()).toBe(100);
  });

  it("seed fonte tem ≥ 8 pragas e ≥ 8 doenças", () => {
    expect(PRAGAS.length).toBeGreaterThanOrEqual(8);
    expect(DOENCAS.length).toBeGreaterThanOrEqual(8);
  });

  it("countBancoAgronomicoStats retorna shape completo", async () => {
    const stats = await countBancoAgronomicoStats();
    expect(stats).toMatchObject({
      totalCulturas: expect.any(Number),
      totalClima: expect.any(Number),
      totalIrrigacao: expect.any(Number),
      totalNutrientes: expect.any(Number),
      totalGenetica: expect.any(Number),
      totalPragas: expect.any(Number),
      totalDoencas: expect.any(Number),
      totalControles: expect.any(Number),
    });
  });
});

describe("Etapas 35–38 — GeoClima / Solos / Genoma / Calendário", () => {
  it("etapas 35–38 estão done e progresso 100%", async () => {
    const { AFU_ETAPAS_35_38, etapas35a38ProgressPercent } = await import("@/constants/afu-etapas");
    expect(AFU_ETAPAS_35_38).toHaveLength(4);
    expect(AFU_ETAPAS_35_38.every((e) => e.status === "done")).toBe(true);
    expect(etapas35a38ProgressPercent()).toBe(100);
  });

  it("countExpansaoStats retorna shape", async () => {
    const { countExpansaoStats } = await import("@/server/db-banco-agronomico");
    const stats = await countExpansaoStats();
    expect(stats).toMatchObject({
      totalZonas: expect.any(Number),
      totalSolos: expect.any(Number),
      totalGenetica: expect.any(Number),
      totalCulturasComEpoca: expect.any(Number),
    });
  });
});

describe("Etapas 39–41 — Lab / Economia / IA", () => {
  it("etapas 39–41 estão done e progresso 100%", async () => {
    const { AFU_ETAPAS_39_41, etapas39a41ProgressPercent } = await import("@/constants/afu-etapas");
    expect(AFU_ETAPAS_39_41).toHaveLength(3);
    expect(AFU_ETAPAS_39_41.every((e) => e.status === "done")).toBe(true);
    expect(etapas39a41ProgressPercent()).toBe(100);
  });

  it("stats incluem lab, economia e IA", async () => {
    const { countExpansaoStats } = await import("@/server/db-banco-agronomico");
    const stats = await countExpansaoStats();
    expect(stats).toMatchObject({
      totalLabModulos: expect.any(Number),
      totalEconomia: expect.any(Number),
      totalAnalises: expect.any(Number),
      totalDiagnosticos: expect.any(Number),
      mediaConfiancaIa: expect.any(Number),
    });
  });
});

describe("Etapas 42–44 — Geo / IoT / Marketplace", () => {
  it("etapas 42–44 estão done e progresso 100%", async () => {
    const { AFU_ETAPAS_42_44, etapas42a44ProgressPercent } = await import("@/constants/afu-etapas");
    expect(AFU_ETAPAS_42_44).toHaveLength(3);
    expect(AFU_ETAPAS_42_44.every((e) => e.status === "done")).toBe(true);
    expect(etapas42a44ProgressPercent()).toBe(100);
  });

  it("countGeoIotMarketStats retorna shape", async () => {
    const { countGeoIotMarketStats } = await import("@/server/db-geo-iot");
    const stats = await countGeoIotMarketStats();
    expect(stats).toMatchObject({
      totalCamadasGeo: expect.any(Number),
      propriedadesComGps: expect.any(Number),
      areaHaMonitorada: expect.any(Number),
      totalSensores: expect.any(Number),
      sensoresAtivos: expect.any(Number),
      totalLeiturasSensores: expect.any(Number),
      alertasIot: expect.any(Number),
      totalProdutosMarketplace: expect.any(Number),
      produtosDisponiveis: expect.any(Number),
      totalPedidosMarketplace: expect.any(Number),
    });
  });
});

describe("Etapas 45–46 — NOC / Arquitetura Final", () => {
  it("etapas 45–46 estão done e progresso 100%", async () => {
    const { AFU_ETAPAS_45_46, etapas45a46ProgressPercent, AFU_ETAPAS_31_46 } = await import(
      "@/constants/afu-etapas"
    );
    expect(AFU_ETAPAS_45_46).toHaveLength(2);
    expect(AFU_ETAPAS_45_46.every((e) => e.status === "done")).toBe(true);
    expect(etapas45a46ProgressPercent()).toBe(100);
    expect(AFU_ETAPAS_31_46.every((e) => e.status === "done")).toBe(true);
  });

  it("countNocArquiteturaStats retorna shape", async () => {
    const { countNocArquiteturaStats } = await import("@/server/db-noc-arquitetura");
    const stats = await countNocArquiteturaStats();
    expect(stats).toMatchObject({
      totalNocAlertas: expect.any(Number),
      nocAlertasAbertos: expect.any(Number),
      nocCriticos: expect.any(Number),
      totalArquiteturaComponentes: expect.any(Number),
      arquiteturaOperacionais: expect.any(Number),
    });
  });
});

describe("Mínimos pós seed:banco-expansao (quando DB populado)", () => {
  it("respeita contagens mínimas das ondas 30–46", async () => {
    const { countBancoAgronomicoStats, countExpansaoStats } = await import(
      "@/server/db-banco-agronomico"
    );
    const { countGeoIotMarketStats } = await import("@/server/db-geo-iot");
    const { countNocArquiteturaStats } = await import("@/server/db-noc-arquitetura");

    const [core, expansao, geo, noc] = await Promise.all([
      countBancoAgronomicoStats(),
      countExpansaoStats(),
      countGeoIotMarketStats(),
      countNocArquiteturaStats(),
    ]);

    const anySeeded =
      core.totalCulturas > 0 ||
      expansao.totalZonas > 0 ||
      geo.totalCamadasGeo > 0 ||
      noc.totalNocAlertas > 0;

    if (!anySeeded) {
      console.warn(
        "[banco-agronomico] DB vazio — rode npm run seed && npm run seed:banco-expansao para validar mínimos",
      );
      return;
    }

    if (core.totalCulturas > 0) {
      expect(core.totalCulturas).toBeGreaterThanOrEqual(17);
      expect(core.totalPragas).toBeGreaterThanOrEqual(8);
      expect(core.totalDoencas).toBeGreaterThanOrEqual(8);
    }
    if (expansao.totalZonas > 0) {
      expect(expansao.totalZonas).toBeGreaterThanOrEqual(9);
      expect(expansao.totalSolos).toBeGreaterThanOrEqual(8);
    }
    if (expansao.totalLabModulos > 0) {
      expect(expansao.totalLabModulos).toBeGreaterThanOrEqual(7);
      expect(expansao.totalEconomia).toBeGreaterThanOrEqual(17);
    }
    if (geo.totalCamadasGeo > 0) {
      expect(geo.totalCamadasGeo).toBeGreaterThanOrEqual(6);
      expect(geo.produtosDisponiveis).toBeGreaterThanOrEqual(8);
    }
    if (geo.totalSensores > 0) {
      expect(geo.totalSensores).toBeGreaterThanOrEqual(6);
      expect(geo.totalLeiturasSensores).toBeGreaterThanOrEqual(6);
    }
    if (noc.totalNocAlertas > 0) {
      expect(noc.totalNocAlertas).toBeGreaterThanOrEqual(8);
      expect(noc.totalArquiteturaComponentes).toBeGreaterThanOrEqual(12);
      expect(noc.arquiteturaOperacionais).toBeGreaterThanOrEqual(8);
    }
  });
});
