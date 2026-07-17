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
