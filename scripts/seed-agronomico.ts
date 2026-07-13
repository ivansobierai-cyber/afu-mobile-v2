/**
 * Seed idempotente do Banco Agronômico Avançado (Etapa 30).
 * Migra dados de lib/mock-data.ts para MySQL/Drizzle.
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { CULTURAS, PRAGAS, DOENCAS } from "../lib/mock-data";
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

const NUTRIENTES_MACRO = ["N", "P", "K", "Ca", "Mg", "S"];
const NUTRIENTES_MICRO = ["Fe", "Mn", "Zn", "Cu", "B", "Mo"];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não configurada");

  const connection = await mysql.createConnection(url);
  const db = drizzle(connection);

  console.log("[seed-agronomico] Iniciando...");

  for (const cultura of CULTURAS) {
    const existing = await db
      .select()
      .from(culturasCatalogo)
      .where(eq(culturasCatalogo.slug, cultura.id))
      .limit(1);

    let catalogoId: number;

    if (existing[0]) {
      catalogoId = existing[0].id;
      await db
        .update(culturasCatalogo)
        .set({
          nomePopular: cultura.nomePopular,
          nomeCientifico: cultura.nomeCientifico,
          familiaBotanica: cultura.familiaBotanica,
          categoria: cultura.categoria,
          descricao: cultura.descricao,
          cicloProdutivoMin: cultura.cicloProdutivoMin,
          cicloProdutivoMax: cultura.cicloProdutivoMax,
          fasesFenologicas: JSON.stringify(cultura.fasesFenologicas),
          tipoSolo: cultura.tipoSolo,
          epocasPlantio: JSON.stringify(cultura.epocasPlantio),
          produtividadeMedia: cultura.produtividadeMedia,
        })
        .where(eq(culturasCatalogo.id, catalogoId));
    } else {
      const inserted = await db.insert(culturasCatalogo).values({
        slug: cultura.id,
        nomePopular: cultura.nomePopular,
        nomeCientifico: cultura.nomeCientifico,
        familiaBotanica: cultura.familiaBotanica,
        categoria: cultura.categoria,
        descricao: cultura.descricao,
        cicloProdutivoMin: cultura.cicloProdutivoMin,
        cicloProdutivoMax: cultura.cicloProdutivoMax,
        fasesFenologicas: JSON.stringify(cultura.fasesFenologicas),
        tipoSolo: cultura.tipoSolo,
        epocasPlantio: JSON.stringify(cultura.epocasPlantio),
        produtividadeMedia: cultura.produtividadeMedia,
      });
      catalogoId = Number(inserted[0].insertId);
    }

    const climaRows = await db
      .select()
      .from(climaCultura)
      .where(eq(climaCultura.culturaCatalogoId, catalogoId))
      .limit(1);

    const climaData = {
      culturaCatalogoId: catalogoId,
      temperaturaMin: String(cultura.temperaturaMin),
      temperaturaMax: String(cultura.temperaturaMax),
      precipitacaoMin: cultura.precipitacaoMin,
      precipitacaoMax: cultura.precipitacaoMax,
      necessidadeLuz: cultura.necessidadeLuz,
    };

    if (climaRows[0]) {
      await db.update(climaCultura).set(climaData).where(eq(climaCultura.id, climaRows[0].id));
    } else {
      await db.insert(climaCultura).values(climaData);
    }

    const irrigRows = await db
      .select()
      .from(irrigacaoCultura)
      .where(eq(irrigacaoCultura.culturaCatalogoId, catalogoId))
      .limit(1);

    const irrigData = {
      culturaCatalogoId: catalogoId,
      metodoRecomendado: (cultura.precipitacaoMax ?? 800) > 1000 ? "Aspersão" : "Gotejamento",
      laminaAgua: `${Math.round((cultura.precipitacaoMin ?? 400) / 10)}–${Math.round((cultura.precipitacaoMax ?? 800) / 10)} mm/ciclo`,
      frequencia: "Conforme déficit hídrico e fase fenológica",
    };

    if (irrigRows[0]) {
      await db.update(irrigacaoCultura).set(irrigData).where(eq(irrigacaoCultura.id, irrigRows[0].id));
    } else {
      await db.insert(irrigacaoCultura).values(irrigData);
    }

    for (const n of NUTRIENTES_MACRO) {
      const exists = await db
        .select()
        .from(nutrientesCultura)
        .where(eq(nutrientesCultura.culturaCatalogoId, catalogoId));
      if (!exists.some((e) => e.nutriente === n)) {
        await db.insert(nutrientesCultura).values({
          culturaCatalogoId: catalogoId,
          nutriente: n,
          tipo: "macro",
          exigencia: "média",
        });
      }
    }

    for (const n of NUTRIENTES_MICRO) {
      const exists = await db
        .select()
        .from(nutrientesCultura)
        .where(eq(nutrientesCultura.culturaCatalogoId, catalogoId));
      if (!exists.some((e) => e.nutriente === n)) {
        await db.insert(nutrientesCultura).values({
          culturaCatalogoId: catalogoId,
          nutriente: n,
          tipo: "micro",
          exigencia: "baixa",
        });
      }
    }

    for (const g of ["G1", "G2", "G3", "G4", "G5"] as const) {
      const exists = await db
        .select()
        .from(geneticaCultura)
        .where(eq(geneticaCultura.culturaCatalogoId, catalogoId));
      if (!exists.some((e) => e.geracao === g)) {
        await db.insert(geneticaCultura).values({
          culturaCatalogoId: catalogoId,
          geracao: g,
          descricao: `Material ${g} — ${cultura.nomePopular}`,
        });
      }
    }
  }

  const pragaSlugToId = new Map<string, number>();
  for (const praga of PRAGAS) {
    const existing = await db
      .select()
      .from(pragasCatalogo)
      .where(eq(pragasCatalogo.slug, praga.id))
      .limit(1);

    if (existing[0]) {
      pragaSlugToId.set(praga.id, existing[0].id);
    } else {
      const inserted = await db.insert(pragasCatalogo).values({
        slug: praga.id,
        nome: praga.nome,
        nomeCientifico: praga.nomeCientifico,
        nivelRisco: praga.nivelRisco,
        sintomas: praga.sintomas,
        controle: praga.metodoControle,
      });
      pragaSlugToId.set(praga.id, Number(inserted[0].insertId));
    }
  }

  const doencaSlugToId = new Map<string, number>();
  for (const doenca of DOENCAS) {
    const existing = await db
      .select()
      .from(doencasCatalogo)
      .where(eq(doencasCatalogo.slug, doenca.id))
      .limit(1);

    if (existing[0]) {
      doencaSlugToId.set(doenca.id, existing[0].id);
    } else {
      const inserted = await db.insert(doencasCatalogo).values({
        slug: doenca.id,
        nome: doenca.nome,
        nomeCientifico: doenca.agenteCausal,
        nivelRisco: doenca.nivelRisco ?? "medio",
        sintomas: doenca.sintomas,
        controle: doenca.controle,
      });
      doencaSlugToId.set(doenca.id, Number(inserted[0].insertId));
    }
  }

  for (const praga of PRAGAS) {
    for (const culturaSlug of praga.culturas) {
      const culturaRow = await db
        .select()
        .from(culturasCatalogo)
        .where(eq(culturasCatalogo.slug, culturaSlug))
        .limit(1);
      if (!culturaRow[0]) continue;

      const pragaId = pragaSlugToId.get(praga.id);
      if (!pragaId) continue;

      const links = await db
        .select()
        .from(controlePragasCultura)
        .where(eq(controlePragasCultura.culturaCatalogoId, culturaRow[0].id));

      if (!links.some((l) => l.pragaCatalogoId === pragaId)) {
        await db.insert(controlePragasCultura).values({
          culturaCatalogoId: culturaRow[0].id,
          pragaCatalogoId: pragaId,
        });
      }
    }
  }

  for (const doenca of DOENCAS) {
    for (const culturaSlug of doenca.culturas) {
      const culturaRow = await db
        .select()
        .from(culturasCatalogo)
        .where(eq(culturasCatalogo.slug, culturaSlug))
        .limit(1);
      if (!culturaRow[0]) continue;

      const doencaId = doencaSlugToId.get(doenca.id);
      if (!doencaId) continue;

      const links = await db
        .select()
        .from(controlePragasCultura)
        .where(eq(controlePragasCultura.culturaCatalogoId, culturaRow[0].id));

      if (!links.some((l) => l.doencaCatalogoId === doencaId)) {
        await db.insert(controlePragasCultura).values({
          culturaCatalogoId: culturaRow[0].id,
          doencaCatalogoId: doencaId,
        });
      }
    }
  }

  const total = await db.select().from(culturasCatalogo);
  console.log(`[seed-agronomico] Concluído: ${total.length} culturas no catálogo`);
  await connection.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
