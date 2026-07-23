/**
 * Aplica migração 0028 (tarefa_alocacoes) de forma idempotente.
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
      CREATE TABLE IF NOT EXISTS tarefa_alocacoes (
        id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
        organizationId int NOT NULL,
        propriedadeId int NOT NULL,
        tarefaId int NOT NULL,
        userId int NOT NULL,
        papelEquipe enum('funcionario','operador','tecnico','agronomo') NOT NULL DEFAULT 'operador',
        horasPlanejadas decimal(10,2) NULL,
        createdByUserId int NULL,
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("+ tarefa_alocacoes");

    for (const [name, ddl] of [
      ["tarefa_aloc_org_idx", "CREATE INDEX tarefa_aloc_org_idx ON tarefa_alocacoes (organizationId)"],
      ["tarefa_aloc_tarefa_idx", "CREATE INDEX tarefa_aloc_tarefa_idx ON tarefa_alocacoes (tarefaId)"],
      ["tarefa_aloc_user_idx", "CREATE INDEX tarefa_aloc_user_idx ON tarefa_alocacoes (userId)"],
      [
        "tarefa_aloc_org_prop_idx",
        "CREATE INDEX tarefa_aloc_org_prop_idx ON tarefa_alocacoes (organizationId, propriedadeId)",
      ],
      [
        "tarefa_aloc_tarefa_user_uidx",
        "CREATE UNIQUE INDEX tarefa_aloc_tarefa_user_uidx ON tarefa_alocacoes (tarefaId, userId)",
      ],
    ] as const) {
      if (!(await indexExists(conn, "tarefa_alocacoes", name))) {
        await conn.query(ddl);
        console.log(`+ ${name}`);
      }
    }
    console.log("0028 tarefa_alocacoes OK");
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
