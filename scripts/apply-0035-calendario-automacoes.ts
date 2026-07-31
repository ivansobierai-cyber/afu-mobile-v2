/**
 * Aplica migração 0035 — automações Eventos (dependência/recorrência). Idempotente.
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

async function indexExists(conn: mysql.Connection, table: string, indexName: string) {
  const [rows] = await conn.query<any[]>(
    `SELECT 1 FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1`,
    [table, indexName],
  );
  return rows.length > 0;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required");
  const conn = await mysql.createConnection(url);
  try {
    if (!(await columnExists(conn, "calendario_cuidados", "dependsOnEventoId"))) {
      await conn.query(
        `ALTER TABLE calendario_cuidados ADD COLUMN dependsOnEventoId int NULL AFTER responsavelUserId`,
      );
      console.log("+ dependsOnEventoId");
    }
    if (!(await columnExists(conn, "calendario_cuidados", "recurrenceParentId"))) {
      await conn.query(
        `ALTER TABLE calendario_cuidados ADD COLUMN recurrenceParentId int NULL AFTER dependsOnEventoId`,
      );
      console.log("+ recurrenceParentId");
    }
    if (!(await indexExists(conn, "calendario_cuidados", "calendario_depends_idx"))) {
      await conn.query(
        `CREATE INDEX calendario_depends_idx ON calendario_cuidados (dependsOnEventoId)`,
      );
    }
    if (!(await indexExists(conn, "calendario_cuidados", "calendario_recurrence_idx"))) {
      await conn.query(
        `CREATE INDEX calendario_recurrence_idx ON calendario_cuidados (recurrenceParentId)`,
      );
    }
    console.log("0035 calendario automacoes OK");
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
