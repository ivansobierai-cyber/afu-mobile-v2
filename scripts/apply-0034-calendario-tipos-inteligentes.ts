/**
 * Aplica migração 0034 — tipos Eventos inteligentes (inspecao, laboratorio).
 */
import "dotenv/config";
import mysql from "mysql2/promise";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required");
  const conn = await mysql.createConnection(url);
  try {
    await conn.query(`
      ALTER TABLE calendario_cuidados
      MODIFY COLUMN tipoAtividade ENUM(
        'plantio','irrigacao','adubacao','pulverizacao','monitoramento',
        'colheita','analise','manutencao','inspecao','laboratorio','outro'
      ) NOT NULL
    `);
    console.log("0034 calendario tipos inteligentes OK");
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
