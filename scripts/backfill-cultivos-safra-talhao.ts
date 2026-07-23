/**
 * Backfill aditivo Cultivos V2 Etapa 1:
 * - cultivos sem safraId → safra default da propriedade
 * - cultivos sem terrenoId → primeiro talhão da propriedade (se existir)
 *
 * Não falha se propriedade não tiver talhão; apenas reporta.
 */
import "dotenv/config";
import { eq, isNull, and, asc } from "drizzle-orm";
import { getDb } from "../server/db";
import { culturas, terrenos } from "../drizzle/schema";
import { ensureDefaultSafra } from "../server/db-safras";

async function main() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const semSafra = await db
    .select()
    .from(culturas)
    .where(isNull(culturas.safraId));

  let safraFixed = 0;
  for (const c of semSafra) {
    if (c.organizationId == null) {
      console.warn(`skip cultura ${c.id}: sem organizationId`);
      continue;
    }
    const safra = await ensureDefaultSafra({
      organizationId: c.organizationId,
      propriedadeId: c.propriedadeId,
    });
    await db
      .update(culturas)
      .set({ safraId: safra.id })
      .where(and(eq(culturas.id, c.id), isNull(culturas.safraId)));
    safraFixed++;
  }

  const semTerreno = await db
    .select()
    .from(culturas)
    .where(isNull(culturas.terrenoId));

  let terrenoFixed = 0;
  let terrenoMissing = 0;
  for (const c of semTerreno) {
    const talhoes = await db
      .select()
      .from(terrenos)
      .where(eq(terrenos.propriedadeId, c.propriedadeId))
      .orderBy(asc(terrenos.id))
      .limit(1);
    const primeiro = talhoes[0];
    if (!primeiro) {
      terrenoMissing++;
      console.warn(
        `cultura ${c.id} (prop ${c.propriedadeId}): sem talhão para backfill`,
      );
      continue;
    }
    await db
      .update(culturas)
      .set({ terrenoId: primeiro.id })
      .where(and(eq(culturas.id, c.id), isNull(culturas.terrenoId)));
    terrenoFixed++;
  }

  console.log(
    JSON.stringify(
      {
        safraFixed,
        terrenoFixed,
        terrenoMissing,
        remainingSemSafra: Math.max(0, semSafra.length - safraFixed),
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
