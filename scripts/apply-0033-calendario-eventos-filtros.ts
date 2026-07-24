/**
 * Aplica migração 0033 — filtros Eventos (terreno/safra/responsável). Idempotente.
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

async function addColumnIfMissing(
  conn: mysql.Connection,
  table: string,
  column: string,
  ddl: string,
) {
  if (await columnExists(conn, table, column)) return;
  await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN ${ddl}`);
  console.log(`+ ${table}.${column}`);
}

async function addIndexIfMissing(
  conn: mysql.Connection,
  table: string,
  indexName: string,
  columns: string,
) {
  if (await indexExists(conn, table, indexName)) return;
  await conn.query(`CREATE INDEX \`${indexName}\` ON \`${table}\` (${columns})`);
  console.log(`+ index ${indexName}`);
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required");
  const conn = await mysql.createConnection(url);
  try {
    await addColumnIfMissing(
      conn,
      "calendario_cuidados",
      "terrenoId",
      "terrenoId int NULL AFTER culturaId",
    );
    await addColumnIfMissing(
      conn,
      "calendario_cuidados",
      "safraId",
      "safraId int NULL AFTER terrenoId",
    );
    await addColumnIfMissing(
      conn,
      "calendario_cuidados",
      "responsavelUserId",
      "responsavelUserId int NULL AFTER safraId",
    );
    await addIndexIfMissing(
      conn,
      "calendario_cuidados",
      "calendario_org_prop_idx",
      "`organizationId`, `propriedadeId`",
    );
    await addIndexIfMissing(
      conn,
      "calendario_cuidados",
      "calendario_org_safra_idx",
      "`organizationId`, `safraId`",
    );
    await addIndexIfMissing(
      conn,
      "calendario_cuidados",
      "calendario_org_terreno_idx",
      "`organizationId`, `terrenoId`",
    );
    await addIndexIfMissing(
      conn,
      "calendario_cuidados",
      "calendario_org_resp_idx",
      "`organizationId`, `responsavelUserId`",
    );
    console.log("0033 calendario eventos filtros OK");
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
