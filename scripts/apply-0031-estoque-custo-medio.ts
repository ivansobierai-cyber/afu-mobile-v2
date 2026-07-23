/**
 * Aplica migração 0031 — custo médio de estoque (idempotente).
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

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required");
  const conn = await mysql.createConnection(url);
  try {
    if (!(await columnExists(conn, "estoque_itens", "custoMedio"))) {
      await conn.query(
        `ALTER TABLE estoque_itens ADD COLUMN custoMedio decimal(14,4) NULL AFTER saldo`,
      );
      console.log("+ estoque_itens.custoMedio");
    }
    if (!(await columnExists(conn, "estoque_movimentos", "custoUnitario"))) {
      await conn.query(
        `ALTER TABLE estoque_movimentos ADD COLUMN custoUnitario decimal(14,4) NULL AFTER quantidade`,
      );
      console.log("+ estoque_movimentos.custoUnitario");
    }
    console.log("0031 estoque custo medio OK");
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
