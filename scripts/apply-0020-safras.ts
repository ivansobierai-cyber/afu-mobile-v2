/**
 * Aplica migração 0020 de forma idempotente (MySQL 8).
 * Uso: npx tsx scripts/apply-0020-safras.ts
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
    await conn.query(`
CREATE TABLE IF NOT EXISTS safras (
  id int NOT NULL AUTO_INCREMENT,
  organizationId int NOT NULL,
  propriedadeId int NOT NULL,
  nome varchar(80) NOT NULL,
  anoInicio int,
  anoFim int,
  dataInicio date,
  dataFim date,
  status enum('planejada','ativa','encerrada','arquivada') NOT NULL DEFAULT 'ativa',
  isDefault tinyint(1) NOT NULL DEFAULT 0,
  createdByUserId int,
  closedAt timestamp NULL DEFAULT NULL,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY safras_organization_idx (organizationId),
  KEY safras_org_prop_idx (organizationId, propriedadeId),
  KEY safras_org_prop_status_idx (organizationId, propriedadeId, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    const addCol = async (table: string, column: string, ddl: string) => {
      if (await columnExists(conn, table, column)) {
        console.log(`[skip] ${table}.${column}`);
        return;
      }
      await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN ${ddl}`);
      console.log(`[add] ${table}.${column}`);
    };

    await addCol("culturas", "safraId", "safraId int NULL");
    await addCol("tarefas_operacionais", "safraId", "safraId int NULL");
    await addCol("ocorrencias_campo", "safraId", "safraId int NULL");
    await addCol("orcamentos_safra", "safraId", "safraId int NULL");
    await addCol("custos_operacao", "safraId", "safraId int NULL");
    await addCol("atividade_propriedade", "safraId", "safraId int NULL");

    const addIdx = async (name: string, ddl: string) => {
      if (await indexExists(conn, name)) {
        console.log(`[skip idx] ${name}`);
        return;
      }
      await conn.query(ddl);
      console.log(`[idx] ${name}`);
    };

    await addIdx(
      "culturas_org_prop_safra_idx",
      "CREATE INDEX culturas_org_prop_safra_idx ON culturas (organizationId, propriedadeId, safraId)",
    );
    await addIdx(
      "tarefas_org_prop_safra_idx",
      "CREATE INDEX tarefas_org_prop_safra_idx ON tarefas_operacionais (organizationId, propriedadeId, safraId)",
    );
    await addIdx(
      "ocorrencias_org_prop_safra_idx",
      "CREATE INDEX ocorrencias_org_prop_safra_idx ON ocorrencias_campo (organizationId, propriedadeId, safraId)",
    );
    await addIdx(
      "orcamentos_org_prop_safra_idx",
      "CREATE INDEX orcamentos_org_prop_safra_idx ON orcamentos_safra (organizationId, propriedadeId, safraId)",
    );

    console.log("[ok] 0020_safras applied");
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
