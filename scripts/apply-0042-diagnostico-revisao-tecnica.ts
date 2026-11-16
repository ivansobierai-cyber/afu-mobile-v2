/**
 * WP-04 — schema aditivo: auditoria de revisão técnica em diagnosticos_ia.
 * Idempotente; não apaga dados.
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { columnExists, indexExists } from "./lib/mysql-ddl-helpers";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required");
  const conn = await mysql.createConnection(url);
  try {
    if (!(await columnExists(conn, "diagnosticos_ia", "revisadoPorUserId"))) {
      await conn.query(
        `ALTER TABLE diagnosticos_ia
         ADD COLUMN revisadoPorUserId int NULL AFTER statusRevisao`,
      );
      console.log("+ diagnosticos_ia.revisadoPorUserId");
    }

    if (!(await columnExists(conn, "diagnosticos_ia", "revisadoPorPerfilId"))) {
      await conn.query(
        `ALTER TABLE diagnosticos_ia
         ADD COLUMN revisadoPorPerfilId int NULL AFTER revisadoPorUserId`,
      );
      console.log("+ diagnosticos_ia.revisadoPorPerfilId");
    }

    if (!(await columnExists(conn, "diagnosticos_ia", "revisadoEm"))) {
      await conn.query(
        `ALTER TABLE diagnosticos_ia
         ADD COLUMN revisadoEm timestamp NULL AFTER revisadoPorPerfilId`,
      );
      console.log("+ diagnosticos_ia.revisadoEm");
    }

    if (!(await columnExists(conn, "diagnosticos_ia", "parecerTecnico"))) {
      await conn.query(
        `ALTER TABLE diagnosticos_ia
         ADD COLUMN parecerTecnico text NULL AFTER revisadoEm`,
      );
      console.log("+ diagnosticos_ia.parecerTecnico");
    }

    if (!(await columnExists(conn, "diagnosticos_ia", "recomendacaoCorrigida"))) {
      await conn.query(
        `ALTER TABLE diagnosticos_ia
         ADD COLUMN recomendacaoCorrigida text NULL AFTER parecerTecnico`,
      );
      console.log("+ diagnosticos_ia.recomendacaoCorrigida");
    }

    if (!(await indexExists(conn, "diagnosticos_org_status_revisao_idx"))) {
      try {
        await conn.query(
          `CREATE INDEX diagnosticos_org_status_revisao_idx
           ON diagnosticos_ia (organizationId, statusRevisao)`,
        );
        console.log("+ diagnosticos_org_status_revisao_idx");
      } catch (e: any) {
        if (e?.code !== "ER_DUP_KEYNAME" && e?.errno !== 1061) throw e;
      }
    }

    console.log("0042 diagnostico revisao tecnica OK");
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
