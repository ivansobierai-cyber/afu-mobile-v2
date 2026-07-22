/**
 * Aplica migração 0022 (responsável de tarefa) de forma idempotente.
 * Uso: npx tsx scripts/apply-0022-tarefas-responsavel.ts
 */
import "dotenv/config";
import mysql from "mysql2/promise";

async function columnExists(
  conn: mysql.Connection,
  table: string,
  column: string,
): Promise<boolean> {
  const [rows] = await conn.query<any[]>(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [table, column],
  );
  return rows.length > 0;
}

async function indexExists(conn: mysql.Connection, name: string): Promise<boolean> {
  const [rows] = await conn.query<any[]>(
    `SELECT 1 FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND INDEX_NAME = ? LIMIT 1`,
    [name],
  );
  return rows.length > 0;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required");
  const conn = await mysql.createConnection(url);
  try {
    if (!(await columnExists(conn, "tarefas_operacionais", "responsavelUserId"))) {
      await conn.query(
        "ALTER TABLE tarefas_operacionais ADD COLUMN responsavelUserId int NULL",
      );
      console.log("+ tarefas_operacionais.responsavelUserId");
    }
    if (!(await indexExists(conn, "tarefas_responsavel_idx"))) {
      await conn.query(
        "CREATE INDEX tarefas_responsavel_idx ON tarefas_operacionais (responsavelUserId)",
      );
      console.log("+ tarefas_responsavel_idx");
    }
    console.log("0022 tarefas responsavel OK");
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
