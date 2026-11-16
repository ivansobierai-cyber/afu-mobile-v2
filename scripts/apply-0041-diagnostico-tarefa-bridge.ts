/**
 * WP-03 — schema aditivo: safraId em diagnosticos_ia + legadoDiagnosticoId / origem=diagnostico.
 * Idempotente; não apaga dados.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { columnExists, indexExists } from "./lib/mysql-ddl-helpers";

async function enumHasValue(
  conn: mysql.Connection,
  table: string,
  column: string,
  value: string,
): Promise<boolean> {
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT COLUMN_TYPE AS ct
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
     LIMIT 1`,
    [table, column],
  );
  const ct = String(rows[0]?.ct ?? "");
  return ct.includes(`'${value}'`);
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required");
  const conn = await mysql.createConnection(url);
  try {
    if (!(await columnExists(conn, "diagnosticos_ia", "safraId"))) {
      await conn.query(
        `ALTER TABLE diagnosticos_ia ADD COLUMN safraId int NULL AFTER culturaId`,
      );
      console.log("+ diagnosticos_ia.safraId");
    }

    if (!(await indexExists(conn, "diagnosticos_org_prop_safra_idx"))) {
      try {
        await conn.query(
          `CREATE INDEX diagnosticos_org_prop_safra_idx
           ON diagnosticos_ia (organizationId, propriedadeId, safraId)`,
        );
        console.log("+ diagnosticos_org_prop_safra_idx");
      } catch (e: any) {
        if (e?.code !== "ER_DUP_KEYNAME" && e?.errno !== 1061) throw e;
      }
    }

    if (!(await enumHasValue(conn, "tarefas_operacionais", "origem", "diagnostico"))) {
      await conn.query(`
        ALTER TABLE tarefas_operacionais
        MODIFY COLUMN origem ENUM(
          'manual',
          'calendario_legado',
          'template',
          'diagnostico'
        ) NOT NULL DEFAULT 'manual'
      `);
      console.log("+ tarefas_operacionais.origem inclui diagnostico");
    }

    if (!(await columnExists(conn, "tarefas_operacionais", "legadoDiagnosticoId"))) {
      await conn.query(
        `ALTER TABLE tarefas_operacionais
         ADD COLUMN legadoDiagnosticoId int NULL AFTER legadoEventoId`,
      );
      console.log("+ tarefas_operacionais.legadoDiagnosticoId");
    }

    if (!(await indexExists(conn, "tarefas_operacionais_legadoDiagnosticoId_unique"))) {
      try {
        await conn.query(
          `ALTER TABLE tarefas_operacionais
           ADD UNIQUE INDEX tarefas_operacionais_legadoDiagnosticoId_unique (legadoDiagnosticoId)`,
        );
        console.log("+ unique legadoDiagnosticoId");
      } catch (e: any) {
        if (e?.code !== "ER_DUP_KEYNAME" && e?.errno !== 1061) throw e;
      }
    }

    console.log("0041 diagnostico tarefa bridge OK");
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
