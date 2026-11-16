/**
 * Aplica migração 0044 — coluna `plano` em produtores (WP-06).
 * Numeração: 0040=#59, 0041=#63, 0042=#68 WP-04, 0043=#69 WP-07 → WP-06 usa 0044.
 */
import "dotenv/config";
import mysql from "mysql2/promise";

async function columnExists(
  conn: mysql.Connection,
  table: string,
  column: string,
): Promise<boolean> {
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
     LIMIT 1`,
    [table, column],
  );
  return rows.length > 0;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required");
  const conn = await mysql.createConnection(url);
  try {
    if (await columnExists(conn, "produtores", "plano")) {
      console.log("0044 produtor_plano já aplicado");
      return;
    }
    await conn.query(`
      ALTER TABLE \`produtores\`
        ADD COLUMN \`plano\` ENUM('free', 'produtor', 'pro', 'enterprise')
          NOT NULL DEFAULT 'free'
          AFTER \`cadastroAtivo\`
    `);
    console.log("+ 0044 produtor_plano");
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
