/**
 * Aplica migração 0025 (centros de custo) de forma idempotente.
 * Etapa 8 Passo 1 — terrenoId / culturaId em custos_operacao.
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

async function indexExists(
  conn: mysql.Connection,
  table: string,
  name: string,
): Promise<boolean> {
  const [rows] = await conn.query<any[]>(
    `SELECT 1 FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1`,
    [table, name],
  );
  return rows.length > 0;
}

async function addColumnIfMissing(
  conn: mysql.Connection,
  table: string,
  column: string,
  ddl: string,
) {
  if (!(await columnExists(conn, table, column))) {
    await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN ${ddl}`);
    console.log(`+ ${table}.${column}`);
  }
}

async function addIndexIfMissing(
  conn: mysql.Connection,
  table: string,
  name: string,
  ddl: string,
) {
  if (!(await indexExists(conn, table, name))) {
    await conn.query(ddl);
    console.log(`+ ${name}`);
  }
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required");
  const conn = await mysql.createConnection(url);
  try {
    await addColumnIfMissing(conn, "custos_operacao", "terrenoId", "terrenoId int NULL");
    await addColumnIfMissing(conn, "custos_operacao", "culturaId", "culturaId int NULL");
    await addColumnIfMissing(conn, "custos_operacao", "createdByUserId", "createdByUserId int NULL");
    await addColumnIfMissing(
      conn,
      "custos_operacao",
      "updatedAt",
      "updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
    );

    await addIndexIfMissing(
      conn,
      "custos_operacao",
      "custos_org_prop_idx",
      "CREATE INDEX custos_org_prop_idx ON custos_operacao (organizationId, propriedadeId)",
    );
    await addIndexIfMissing(
      conn,
      "custos_operacao",
      "custos_safra_idx",
      "CREATE INDEX custos_safra_idx ON custos_operacao (safraId)",
    );
    await addIndexIfMissing(
      conn,
      "custos_operacao",
      "custos_terreno_idx",
      "CREATE INDEX custos_terreno_idx ON custos_operacao (terrenoId)",
    );
    await addIndexIfMissing(
      conn,
      "custos_operacao",
      "custos_cultura_idx",
      "CREATE INDEX custos_cultura_idx ON custos_operacao (culturaId)",
    );
    await addIndexIfMissing(
      conn,
      "custos_operacao",
      "custos_tarefa_idx",
      "CREATE INDEX custos_tarefa_idx ON custos_operacao (tarefaId)",
    );

    console.log("0025 centros de custo OK");
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
