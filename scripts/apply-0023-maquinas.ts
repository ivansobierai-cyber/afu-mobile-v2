/**
 * Aplica migração 0023 (máquinas operacionais) de forma idempotente.
 * Uso: npx tsx scripts/apply-0023-maquinas.ts
 *
 * Colunas enum usam nomes únicos no schema Drizzle:
 * `tipoMaquinaOperacional` / `statusMaquinaOperacional` (não `tipo`/`status`).
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
  name: string,
): Promise<boolean> {
  const [rows] = await conn.query<any[]>(
    `SELECT 1 FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'maquinas_operacionais'
       AND INDEX_NAME = ? LIMIT 1`,
    [name],
  );
  return rows.length > 0;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required");
  const conn = await mysql.createConnection(url);
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS maquinas_operacionais (
        id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
        organizationId int NULL,
        propriedadeId int NOT NULL,
        nome varchar(120) NOT NULL,
        tipoMaquinaOperacional enum('trator','pulverizador','colheitadeira','implemento','irrigacao','outro')
          NOT NULL DEFAULT 'outro',
        identificador varchar(80) NULL,
        statusMaquinaOperacional enum('disponivel','em_uso','manutencao','inativa') NOT NULL DEFAULT 'disponivel',
        horasUso decimal(12,1) NULL,
        notas text NULL,
        createdByUserId int NULL,
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("+ maquinas_operacionais");

    // Hotfix: builds antigos criaram `tipo`/`status` — alinhar ao schema Drizzle
    if (
      (await columnExists(conn, "maquinas_operacionais", "tipo")) &&
      !(await columnExists(conn, "maquinas_operacionais", "tipoMaquinaOperacional"))
    ) {
      await conn.query(`
        ALTER TABLE maquinas_operacionais
        CHANGE COLUMN tipo tipoMaquinaOperacional
          enum('trator','pulverizador','colheitadeira','implemento','irrigacao','outro')
          NOT NULL DEFAULT 'outro'
      `);
      console.log("~ tipo -> tipoMaquinaOperacional");
    }
    if (
      (await columnExists(conn, "maquinas_operacionais", "status")) &&
      !(await columnExists(conn, "maquinas_operacionais", "statusMaquinaOperacional"))
    ) {
      await conn.query(`
        ALTER TABLE maquinas_operacionais
        CHANGE COLUMN status statusMaquinaOperacional
          enum('disponivel','em_uso','manutencao','inativa')
          NOT NULL DEFAULT 'disponivel'
      `);
      console.log("~ status -> statusMaquinaOperacional");
    }

    if (!(await indexExists(conn, "maquinas_operacionais_org_idx"))) {
      await conn.query(
        "CREATE INDEX maquinas_operacionais_org_idx ON maquinas_operacionais (organizationId)",
      );
      console.log("+ maquinas_operacionais_org_idx");
    }
    if (!(await indexExists(conn, "maquinas_operacionais_org_prop_idx"))) {
      await conn.query(
        "CREATE INDEX maquinas_operacionais_org_prop_idx ON maquinas_operacionais (organizationId, propriedadeId)",
      );
      console.log("+ maquinas_operacionais_org_prop_idx");
    }
    console.log("0023 maquinas operacionais OK");
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
