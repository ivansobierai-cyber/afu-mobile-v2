/**
 * Aplica migração 0029 (cultivo_fase_eventos + índices em culturas) de forma idempotente.
 */
import "dotenv/config";
import mysql from "mysql2/promise";

async function indexExists(conn: mysql.Connection, table: string, name: string) {
  const [rows] = await conn.query<any[]>(
    `SELECT 1 FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1`,
    [table, name],
  );
  return rows.length > 0;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required");
  const conn = await mysql.createConnection(url);
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS cultivo_fase_eventos (
        id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
        organizationId int NOT NULL,
        propriedadeId int NOT NULL,
        culturaId int NOT NULL,
        faseAnterior varchar(100) NULL,
        faseNova varchar(100) NOT NULL,
        dataEvento timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        origemFaseCultivo enum('manual','api','backfill','sistema') NOT NULL DEFAULT 'manual',
        userId int NULL,
        observacao text NULL,
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("+ cultivo_fase_eventos");

    for (const [table, name, ddl] of [
      [
        "cultivo_fase_eventos",
        "cultivo_fase_org_idx",
        "CREATE INDEX cultivo_fase_org_idx ON cultivo_fase_eventos (organizationId)",
      ],
      [
        "cultivo_fase_eventos",
        "cultivo_fase_cultura_idx",
        "CREATE INDEX cultivo_fase_cultura_idx ON cultivo_fase_eventos (culturaId)",
      ],
      [
        "cultivo_fase_eventos",
        "cultivo_fase_org_prop_idx",
        "CREATE INDEX cultivo_fase_org_prop_idx ON cultivo_fase_eventos (organizationId, propriedadeId)",
      ],
      [
        "cultivo_fase_eventos",
        "cultivo_fase_cultura_data_idx",
        "CREATE INDEX cultivo_fase_cultura_data_idx ON cultivo_fase_eventos (culturaId, dataEvento)",
      ],
      [
        "culturas",
        "culturas_terreno_idx",
        "CREATE INDEX culturas_terreno_idx ON culturas (terrenoId)",
      ],
      [
        "culturas",
        "culturas_catalogo_idx",
        "CREATE INDEX culturas_catalogo_idx ON culturas (culturaCatalogoId)",
      ],
    ] as const) {
      if (!(await indexExists(conn, table, name))) {
        await conn.query(ddl);
        console.log(`+ ${name}`);
      }
    }
    console.log("0029 cultivo_fase_eventos OK");
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
