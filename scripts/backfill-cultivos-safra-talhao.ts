/**
 * Backfill aditivo Cultivos V2:
 * - cultivos sem safraId → safra default da propriedade
 * - cultivos sem terrenoId → primeiro talhão; se não houver, cria "Talhão padrão"
 */
import "dotenv/config";
import { eq, isNull, and, asc } from "drizzle-orm";
import { getDb } from "../server/db";
import { culturas, terrenos } from "../drizzle/schema";
import { ensureDefaultSafra } from "../server/db-safras";

async function ensureFirstTerreno(opts: {
  organizationId: number | null;
  propriedadeId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db
    .select()
    .from(terrenos)
    .where(eq(terrenos.propriedadeId, opts.propriedadeId))
    .orderBy(asc(terrenos.id))
    .limit(1);
  if (existing[0]) return { terreno: existing[0], created: false };
  const result = await db.insert(terrenos).values({
    propriedadeId: opts.propriedadeId,
    organizationId: opts.organizationId,
    nome: "Talhão padrão",
  });
  const id = result[0].insertId;
  const rows = await db.select().from(terrenos).where(eq(terrenos.id, id)).limit(1);
  return { terreno: rows[0]!, created: true };
}

async function main() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const semSafra = await db.select().from(culturas).where(isNull(culturas.safraId));
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

  const semTerreno = await db.select().from(culturas).where(isNull(culturas.terrenoId));
  let terrenoFixed = 0;
  let talhaoCriado = 0;
  for (const c of semTerreno) {
    const { terreno, created } = await ensureFirstTerreno({
      organizationId: c.organizationId,
      propriedadeId: c.propriedadeId,
    });
    if (created) talhaoCriado++;
    await db
      .update(culturas)
      .set({ terrenoId: terreno.id })
      .where(and(eq(culturas.id, c.id), isNull(culturas.terrenoId)));
    terrenoFixed++;
  }

  const remainingSemSafra = (
    await db.select().from(culturas).where(isNull(culturas.safraId))
  ).length;
  const remainingSemTerreno = (
    await db.select().from(culturas).where(isNull(culturas.terrenoId))
  ).length;

  console.log(
    JSON.stringify(
      { safraFixed, terrenoFixed, talhaoCriado, remainingSemSafra, remainingSemTerreno },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
