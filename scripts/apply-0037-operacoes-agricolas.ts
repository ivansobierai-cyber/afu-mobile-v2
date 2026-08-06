/**
 * Aplica migração 0037 — tabela operacoes_agricolas (FASE 2E).
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { readFileSync } from "node:fs";
import { join } from "node:path";

async function tableExists(conn: mysql.Connection, table: string) {
  const [rows] = await conn.query<any[]>(
    `SELECT 1 FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? LIMIT 1`,
    [table],
  );
  return rows.length > 0;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required");
  const conn = await mysql.createConnection(url);
  try {
    if (await tableExists(conn, "operacoes_agricolas")) {
      console.log("operacoes_agricolas já existe");
      return;
    }
    const sql = readFileSync(
      join(__dirname, "..", "drizzle", "0037_operacoes_agricolas.sql"),
      "utf8",
    );
    await conn.query(sql);
    console.log("+ operacoes_agricolas");
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
