import { eq, like, or, and } from "drizzle-orm";
import { getDb } from "./db";
import {
  culturasCatalogo,
  climaCultura,
  irrigacaoCultura,
  nutrientesCultura,
  geneticaCultura,
  pragasCatalogo,
  doencasCatalogo,
  controlePragasCultura,
  zonasClimaticas,
  tiposSolo,
  labModulos,
  economiaCultura,
  analisesFitotecnicas,
  diagnosticosIa,
} from "../drizzle/schema";

export async function listarCatalogoCulturas(busca?: string) {
  const db = await getDb();
  if (!db) return [];

  if (busca?.trim()) {
    const term = `%${busca.trim()}%`;
    return db
      .select()
      .from(culturasCatalogo)
      .where(
        or(
          like(culturasCatalogo.nomePopular, term),
          like(culturasCatalogo.nomeCientifico, term),
          like(culturasCatalogo.familiaBotanica, term),
        ),
      );
  }

  return db.select().from(culturasCatalogo);
}

export async function getCatalogoCulturaById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(culturasCatalogo).where(eq(culturasCatalogo.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getCatalogoCulturaBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(culturasCatalogo).where(eq(culturasCatalogo.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function getClimaByCatalogoId(culturaCatalogoId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(climaCultura)
    .where(eq(climaCultura.culturaCatalogoId, culturaCatalogoId))
    .limit(1);
  return rows[0] ?? null;
}

export async function getIrrigacaoByCatalogoId(culturaCatalogoId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(irrigacaoCultura)
    .where(eq(irrigacaoCultura.culturaCatalogoId, culturaCatalogoId))
    .limit(1);
  return rows[0] ?? null;
}

export async function listNutrientesByCatalogoId(culturaCatalogoId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(nutrientesCultura)
    .where(eq(nutrientesCultura.culturaCatalogoId, culturaCatalogoId));
}

export async function listGeneticaByCatalogoId(culturaCatalogoId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(geneticaCultura)
    .where(eq(geneticaCultura.culturaCatalogoId, culturaCatalogoId));
}

export async function listPragasDoencasByCatalogoId(culturaCatalogoId: number) {
  const db = await getDb();
  if (!db) return { pragas: [], doencas: [] };

  const links = await db
    .select()
    .from(controlePragasCultura)
    .where(eq(controlePragasCultura.culturaCatalogoId, culturaCatalogoId));

  const pragaIds = links.map((l) => l.pragaCatalogoId).filter((id): id is number => id != null);
  const doencaIds = links.map((l) => l.doencaCatalogoId).filter((id): id is number => id != null);

  const pragas =
    pragaIds.length > 0
      ? await db.select().from(pragasCatalogo).where(or(...pragaIds.map((id) => eq(pragasCatalogo.id, id))))
      : [];

  const doencas =
    doencaIds.length > 0
      ? await db.select().from(doencasCatalogo).where(or(...doencaIds.map((id) => eq(doencasCatalogo.id, id))))
      : [];

  return { pragas, doencas };
}

export async function consultaAgronomica(culturaCatalogoId: number) {
  const cultura = await getCatalogoCulturaById(culturaCatalogoId);
  if (!cultura) return null;

  const [clima, irrigacao, nutrientes, genetica, fitossanitario] = await Promise.all([
    getClimaByCatalogoId(culturaCatalogoId),
    getIrrigacaoByCatalogoId(culturaCatalogoId),
    listNutrientesByCatalogoId(culturaCatalogoId),
    listGeneticaByCatalogoId(culturaCatalogoId),
    listPragasDoencasByCatalogoId(culturaCatalogoId),
  ]);

  return {
    cultura,
    clima,
    irrigacao,
    nutrientes,
    genetica,
    pragas: fitossanitario.pragas,
    doencas: fitossanitario.doencas,
    resumo: [
      clima ? `Clima: ${clima.temperaturaMin}–${clima.temperaturaMax}°C` : null,
      irrigacao ? `Irrigação: ${irrigacao.metodoRecomendado}` : null,
      nutrientes.length > 0 ? `${nutrientes.length} nutrientes cadastrados` : null,
      fitossanitario.pragas.length + fitossanitario.doencas.length > 0
        ? `${fitossanitario.pragas.length} pragas · ${fitossanitario.doencas.length} doenças`
        : null,
    ].filter(Boolean),
  };
}

export async function countCatalogoCulturas() {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select().from(culturasCatalogo);
  return rows.length;
}

export async function listarPragasCatalogo() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pragasCatalogo);
}

export async function listarDoencasCatalogo() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(doencasCatalogo);
}

export async function countBancoAgronomicoStats() {
  const db = await getDb();
  if (!db) {
    return {
      totalCulturas: 0,
      totalClima: 0,
      totalIrrigacao: 0,
      totalNutrientes: 0,
      totalGenetica: 0,
      totalPragas: 0,
      totalDoencas: 0,
      totalControles: 0,
    };
  }

  const [culturas, clima, irrigacao, nutrientes, genetica, pragas, doencas, controles] =
    await Promise.all([
      db.select().from(culturasCatalogo),
      db.select().from(climaCultura),
      db.select().from(irrigacaoCultura),
      db.select().from(nutrientesCultura),
      db.select().from(geneticaCultura),
      db.select().from(pragasCatalogo),
      db.select().from(doencasCatalogo),
      db.select().from(controlePragasCultura),
    ]);

  return {
    totalCulturas: culturas.length,
    totalClima: clima.length,
    totalIrrigacao: irrigacao.length,
    totalNutrientes: nutrientes.length,
    totalGenetica: genetica.length,
    totalPragas: pragas.length,
    totalDoencas: doencas.length,
    totalControles: controles.length,
  };
}

export async function listarZonasClimaticas() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(zonasClimaticas);
}

export async function listarTiposSolo() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tiposSolo);
}

export async function calendarioPlantioCatalogo() {
  const db = await getDb();
  if (!db) return [];
  const culturas = await db.select().from(culturasCatalogo);
  return culturas.map((c) => ({
    id: c.id,
    slug: c.slug,
    nomePopular: c.nomePopular,
    categoria: c.categoria,
    cicloProdutivoMin: c.cicloProdutivoMin,
    cicloProdutivoMax: c.cicloProdutivoMax,
    epocasPlantio: c.epocasPlantio ? safeJsonArray(c.epocasPlantio) : [],
    tipoSolo: c.tipoSolo,
    produtividadeMedia: c.produtividadeMedia,
  }));
}

function safeJsonArray(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export async function countExpansaoStats() {
  const db = await getDb();
  if (!db) {
    return {
      totalZonas: 0,
      totalSolos: 0,
      totalGenetica: 0,
      totalCulturasComEpoca: 0,
      totalLabModulos: 0,
      totalEconomia: 0,
      totalAnalises: 0,
      totalDiagnosticos: 0,
      mediaConfiancaIa: 0,
    };
  }
  const [zonas, solos, genetica, culturas, labs, ecos, analises, diags] = await Promise.all([
    db.select().from(zonasClimaticas),
    db.select().from(tiposSolo),
    db.select().from(geneticaCultura),
    db.select().from(culturasCatalogo),
    db.select().from(labModulos),
    db.select().from(economiaCultura),
    db.select().from(analisesFitotecnicas),
    db.select().from(diagnosticosIa),
  ]);
  const comEpoca = culturas.filter((c) => {
    if (!c.epocasPlantio) return false;
    try {
      const arr = JSON.parse(c.epocasPlantio);
      return Array.isArray(arr) && arr.length > 0;
    } catch {
      return false;
    }
  }).length;

  const confiancas = diags
    .map((d) => d.confiancaIa)
    .filter((n): n is number => typeof n === "number");
  const mediaConfiancaIa =
    confiancas.length > 0
      ? Math.round(confiancas.reduce((a, b) => a + b, 0) / confiancas.length)
      : 0;

  return {
    totalZonas: zonas.length,
    totalSolos: solos.length,
    totalGenetica: genetica.length,
    totalCulturasComEpoca: comEpoca,
    totalLabModulos: labs.length,
    totalEconomia: ecos.length,
    totalAnalises: analises.length,
    totalDiagnosticos: diags.length,
    mediaConfiancaIa,
  };
}

export async function listarLabModulos() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(labModulos);
}

export async function listarEconomiaCulturas() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(economiaCultura);
  const culturas = await db.select().from(culturasCatalogo);
  const byId = new Map(culturas.map((c) => [c.id, c]));
  return rows.map((e) => {
    const c = byId.get(e.culturaCatalogoId);
    return {
      ...e,
      nomePopular: c?.nomePopular ?? `Cultura #${e.culturaCatalogoId}`,
      slug: c?.slug ?? "",
      categoria: c?.categoria ?? null,
    };
  });
}

export async function simularEconomia(input: {
  culturaCatalogoId: number;
  areaHa: number;
  produtividade?: number;
}) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(economiaCultura)
    .where(eq(economiaCultura.culturaCatalogoId, input.culturaCatalogoId))
    .limit(1);
  const eco = rows[0];
  if (!eco) return null;

  const prod =
    input.produtividade ??
    Number(eco.produtividadeMed ?? eco.produtividadeMin ?? 0);
  const custoHa = Number(eco.custoHaEstimado ?? 0);
  const preco = Number(eco.precoUnidade ?? 0);
  const area = input.areaHa;
  const receita = prod * preco * area;
  const custo = custoHa * area;
  const lucro = receita - custo;
  const margem = receita > 0 ? Math.round((lucro / receita) * 1000) / 10 : 0;

  return {
    culturaCatalogoId: input.culturaCatalogoId,
    areaHa: area,
    produtividadeUsada: prod,
    unidade: eco.unidadeProdutividade,
    custoTotal: Math.round(custo * 100) / 100,
    receitaTotal: Math.round(receita * 100) / 100,
    lucroEstimado: Math.round(lucro * 100) / 100,
    margemPercent: margem,
    moeda: eco.moeda ?? "BRL",
  };
}

export async function resumoIaAgronomo() {
  const db = await getDb();
  if (!db) {
    return {
      totalDiagnosticos: 0,
      mediaConfianca: 0,
      porGravidade: {} as Record<string, number>,
      fontes: [] as string[],
    };
  }
  const diags = await db.select().from(diagnosticosIa);
  const porGravidade: Record<string, number> = {};
  let somaConf = 0;
  let nConf = 0;
  for (const d of diags) {
    const g = d.gravidade || "saudavel";
    porGravidade[g] = (porGravidade[g] || 0) + 1;
    if (typeof d.confiancaIa === "number") {
      somaConf += d.confiancaIa;
      nConf += 1;
    }
  }
  return {
    totalDiagnosticos: diags.length,
    mediaConfianca: nConf > 0 ? Math.round(somaConf / nConf) : 0,
    porGravidade,
    fontes: [
      "culturas_catalogo",
      "clima_cultura",
      "tipos_solo",
      "zonas_climaticas",
      "genetica_cultura",
      "pragas_catalogo",
      "doencas_catalogo",
      "economia_cultura",
      "analises_fitotecnicas",
      "diagnosticos_ia",
    ],
  };
}
