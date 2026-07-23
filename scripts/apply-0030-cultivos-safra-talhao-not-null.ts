/**
 * Aplica migração 0030 — endurece safraId/terrenoId em culturas (NOT NULL)
 * somente após backfill. Idempotente.
 */
import "dotenv/config";
import mysql from "mysql2/promise";

async function columnNullable(
  conn: mysql.Connection,
  table: string,
  column: string,
): Promise<boolean> {
  const [rows] = await conn.query<any[]>(
    `SELECT IS_NULLABLE AS n FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [table, column],
  );
  return String(rows[0]?.n ?? "YES").toUpperCase() === "YES";
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required");
  const conn = await mysql.createConnection(url);
  try {
    const [nulls] = await conn.query<any[]>(
      `SELECT
         SUM(safraId IS NULL) AS semSafra,
         SUM(terrenoId IS NULL) AS semTerreno
       FROM culturas`,
    );
    const semSafra = Number(nulls[0]?.semSafra ?? 0);
    const semTerreno = Number(nulls[0]?.semTerreno ?? 0);
    if (semSafra > 0 || semTerreno > 0) {
      throw new Error(
        `Refuse NOT NULL: ainda há cultivos sem safra (${semSafra}) ou talhão (${semTerreno}). Rode npm run db:cultivos:backfill`,
      );
    }

    if (await columnNullable(conn, "culturas", "safraId")) {
      await conn.query(
        `ALTER TABLE culturas MODIFY COLUMN safraId int NOT NULL`,
      );
      console.log("+ culturas.safraId NOT NULL");
    } else {
      console.log("= culturas.safraId already NOT NULL");
    }

    if (await columnNullable(conn, "culturas", "terrenoId")) {
      await conn.query(
        `ALTER TABLE culturas MODIFY COLUMN terrenoId int NOT NULL`,
      );
      console.log("+ culturas.terrenoId NOT NULL");
    } else {
      console.log("= culturas.terrenoId already NOT NULL");
    }

    console.log("0030 cultivos safra/talhao NOT NULL OK");
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
