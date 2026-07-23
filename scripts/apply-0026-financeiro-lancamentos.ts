/**
 * Aplica migração 0026 (lançamentos financeiros) de forma idempotente.
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
      CREATE TABLE IF NOT EXISTS financeiro_lancamentos (
        id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
        organizationId int NOT NULL,
        propriedadeId int NOT NULL,
        safraId int NULL,
        terrenoId int NULL,
        culturaId int NULL,
        tarefaId int NULL,
        tipoLancamentoFinanceiro enum('despesa','receita','custo','investimento') NOT NULL,
        categoriaAuto varchar(60) NOT NULL,
        descricao varchar(200) NOT NULL,
        valor decimal(14,2) NOT NULL,
        dataLancamento timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        createdByUserId int NULL,
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("+ financeiro_lancamentos");

    const indexes: Array<[string, string]> = [
      ["fin_lanc_org_idx", "CREATE INDEX fin_lanc_org_idx ON financeiro_lancamentos (organizationId)"],
      [
        "fin_lanc_org_prop_idx",
        "CREATE INDEX fin_lanc_org_prop_idx ON financeiro_lancamentos (organizationId, propriedadeId)",
      ],
      [
        "fin_lanc_tipo_idx",
        "CREATE INDEX fin_lanc_tipo_idx ON financeiro_lancamentos (tipoLancamentoFinanceiro)",
      ],
      ["fin_lanc_safra_idx", "CREATE INDEX fin_lanc_safra_idx ON financeiro_lancamentos (safraId)"],
    ];
    for (const [name, ddl] of indexes) {
      if (!(await indexExists(conn, "financeiro_lancamentos", name))) {
        await conn.query(ddl);
        console.log(`+ ${name}`);
      }
    }
    console.log("0026 financeiro_lancamentos OK");
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
