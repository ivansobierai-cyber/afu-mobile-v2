/**
 * Aplica migração 0043 — LGPD (consentimento + solicitação de exclusão).
 * WP-07. Idempotente. Não hard-delete.
 * Também garante coluna `previousStatusPerfil` em bancos que já tinham 0043.
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

async function columnExists(conn: mysql.Connection, table: string, column: string) {
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
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
    const hasConsent = await tableExists(conn, "lgpd_consent_records");
    const hasDeletion = await tableExists(conn, "lgpd_deletion_requests");
    if (!hasConsent || !hasDeletion) {
      const sql = readFileSync(
        join(__dirname, "..", "drizzle", "0043_lgpd_compliance.sql"),
        "utf8",
      );
      for (const stmt of sql.split(";").map((s) => s.trim()).filter(Boolean)) {
        await conn.query(stmt);
      }
      console.log("+ 0043 lgpd compliance");
    } else {
      console.log("0043 lgpd compliance tabelas já existem");
    }

    if (
      (await tableExists(conn, "lgpd_deletion_requests")) &&
      !(await columnExists(conn, "lgpd_deletion_requests", "previousStatusPerfil"))
    ) {
      await conn.query(`
        ALTER TABLE \`lgpd_deletion_requests\`
          ADD COLUMN \`previousStatusPerfil\` enum('ativo','inativo','suspenso') NULL
          AFTER \`reason\`
      `);
      console.log("+ 0043 previousStatusPerfil");
    }
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
