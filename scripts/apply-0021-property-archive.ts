/**
 * Aplica migração 0021 (soft-archive propriedades) de forma idempotente.
 * Uso: npx tsx scripts/apply-0021-property-archive.ts
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
    if (!(await columnExists(conn, "propriedades", "archivedAt"))) {
      await conn.query(
        "ALTER TABLE propriedades ADD COLUMN archivedAt timestamp NULL DEFAULT NULL",
      );
      console.log("+ archivedAt");
    }
    if (!(await columnExists(conn, "propriedades", "archivedByUserId"))) {
      await conn.query(
        "ALTER TABLE propriedades ADD COLUMN archivedByUserId int NULL DEFAULT NULL",
      );
      console.log("+ archivedByUserId");
    }
    if (!(await columnExists(conn, "propriedades", "archiveMotivo"))) {
      await conn.query(
        "ALTER TABLE propriedades ADD COLUMN archiveMotivo varchar(255) NULL DEFAULT NULL",
      );
      console.log("+ archiveMotivo");
    }
    if (!(await indexExists(conn, "propriedades_org_archived_idx"))) {
      await conn.query(
        "CREATE INDEX propriedades_org_archived_idx ON propriedades (organizationId, archivedAt)",
      );
      console.log("+ propriedades_org_archived_idx");
    }
    console.log("0021 property archive OK");
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
