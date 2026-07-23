/**
 * Aplica migração 0032 — producaoReal em culturas (idempotente).
 */
import "dotenv/config";
import mysql from "mysql2/promise";

async function columnExists(conn: mysql.Connection, table: string, column: string) {
  const [rows] = await conn.query<any[]>(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [table, column],
  );
  return rows.length > 0;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required");
  const conn = await mysql.createConnection(url);
  try {
    if (!(await columnExists(conn, "culturas", "producaoReal"))) {
      await conn.query(
        `ALTER TABLE culturas ADD COLUMN producaoReal decimal(12,2) NULL AFTER producaoEstimada`,
      );
      console.log("+ culturas.producaoReal");
    }
    console.log("0032 culturas producaoReal OK");
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
