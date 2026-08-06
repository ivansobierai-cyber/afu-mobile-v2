/**
 * Aplica migração 0039 — apontamentos reais de operações (FASE 2H).
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { readFileSync } from "node:fs";
import { join } from "node:path";

async function tableExists(conn: mysql.Connection, table: string) {
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
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
    if (
      (await tableExists(conn, "operacoes_agricolas_apontamentos")) &&
      (await tableExists(conn, "operacoes_agricolas_apontamento_insumos")) &&
      (await tableExists(conn, "operacoes_agricolas_apontamento_evidencias"))
    ) {
      console.log("0039 operacoes apontamentos já aplicado");
      return;
    }
    const sql = readFileSync(
      join(__dirname, "..", "drizzle", "0039_operacoes_apontamentos.sql"),
      "utf8",
    );
    for (const stmt of sql.split(";").map((s) => s.trim()).filter(Boolean)) {
      await conn.query(stmt);
    }
    console.log("+ 0039 operacoes apontamentos");
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
