/**
 * Aplica migração 0027 (controle máquinas: caminhão, combustível, eventos).
 * Idempotente — não remove dados/colunas existentes.
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
    // Coluna real no MySQL = tipoMaquinaOperacional (após 0023)
    const tipoCol = (await columnExists(conn, "maquinas_operacionais", "tipoMaquinaOperacional"))
      ? "tipoMaquinaOperacional"
      : "tipo";
    await conn.query(`
      ALTER TABLE maquinas_operacionais
      MODIFY COLUMN \`${tipoCol}\` enum(
        'trator','pulverizador','colheitadeira','caminhao','implemento','irrigacao','outro'
      ) NOT NULL DEFAULT 'outro'
    `);
    console.log(`~ maquinas_operacionais.${tipoCol} +caminhao`);

    if (!(await columnExists(conn, "maquinas_operacionais", "combustivelLitros"))) {
      await conn.query(
        `ALTER TABLE maquinas_operacionais ADD COLUMN combustivelLitros decimal(12,2) NULL`,
      );
      console.log("+ combustivelLitros");
    }
    if (!(await columnExists(conn, "maquinas_operacionais", "ultimaManutencaoAt"))) {
      await conn.query(
        `ALTER TABLE maquinas_operacionais ADD COLUMN ultimaManutencaoAt timestamp NULL`,
      );
      console.log("+ ultimaManutencaoAt");
    }

    await conn.query(`
      CREATE TABLE IF NOT EXISTS maquina_eventos (
        id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
        organizationId int NOT NULL,
        propriedadeId int NOT NULL,
        maquinaId int NOT NULL,
        tipoEventoMaquina enum('horimetro','combustivel','manutencao','disponibilidade') NOT NULL,
        valor decimal(14,3) NULL,
        sentido varchar(20) NULL,
        descricao varchar(255) NULL,
        tarefaId int NULL,
        createdByUserId int NULL,
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("+ maquina_eventos");

    for (const [name, ddl] of [
      [
        "maquina_eventos_org_idx",
        "CREATE INDEX maquina_eventos_org_idx ON maquina_eventos (organizationId)",
      ],
      [
        "maquina_eventos_maquina_idx",
        "CREATE INDEX maquina_eventos_maquina_idx ON maquina_eventos (maquinaId)",
      ],
      [
        "maquina_eventos_org_prop_idx",
        "CREATE INDEX maquina_eventos_org_prop_idx ON maquina_eventos (organizationId, propriedadeId)",
      ],
    ] as const) {
      if (!(await indexExists(conn, "maquina_eventos", name))) {
        await conn.query(ddl);
        console.log(`+ ${name}`);
      }
    }

    console.log("0027 maquinas controle OK");
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
