/**
 * Aplica migração 0045 — MFA TOTP (user_mfa).
 * WP-08. Idempotente.
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
    if (await tableExists(conn, "user_mfa")) {
      console.log("0045 user_mfa já existe");
      return;
    }
    const sql = readFileSync(
      join(__dirname, "..", "drizzle", "0045_mfa_totp.sql"),
      "utf8",
    );
    // Strip line comments before splitting on ';' (comments may contain ';')
    const withoutComments = sql
      .split("\n")
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n");
    for (const stmt of withoutComments.split(";").map((s) => s.trim()).filter(Boolean)) {
      await conn.query(stmt);
    }
    console.log("+ 0045 mfa totp (user_mfa)");
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
