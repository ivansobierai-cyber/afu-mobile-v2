/**
 * Aplica migração 0036 — produtividade Eventos (tags/checklist/comentários/anexos).
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

async function tableExists(conn: mysql.Connection, table: string) {
  const [rows] = await conn.query<any[]>(
    `SELECT 1 FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? LIMIT 1`,
    [table],
  );
  return rows.length > 0;
}

async function indexExists(conn: mysql.Connection, table: string, indexName: string) {
  const [rows] = await conn.query<any[]>(
    `SELECT 1 FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1`,
    [table, indexName],
  );
  return rows.length > 0;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required");
  const conn = await mysql.createConnection(url);
  try {
    if (!(await columnExists(conn, "calendario_cuidados", "etiquetas"))) {
      await conn.query(`ALTER TABLE calendario_cuidados ADD COLUMN etiquetas text NULL`);
      console.log("+ etiquetas");
    }
    if (!(await columnExists(conn, "calendario_cuidados", "checklistJson"))) {
      await conn.query(`ALTER TABLE calendario_cuidados ADD COLUMN checklistJson text NULL`);
      console.log("+ checklistJson");
    }
    if (!(await tableExists(conn, "evento_comentarios"))) {
      await conn.query(`
        CREATE TABLE evento_comentarios (
          id int NOT NULL AUTO_INCREMENT,
          organizationId int NOT NULL,
          eventoId int NOT NULL,
          autorUserId int NOT NULL,
          autorNome varchar(120) NULL,
          texto text NOT NULL,
          createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          KEY evento_comentarios_org_idx (organizationId),
          KEY evento_comentarios_evento_idx (eventoId)
        )
      `);
      console.log("+ evento_comentarios");
    }
    if (!(await tableExists(conn, "evento_anexos"))) {
      await conn.query(`
        CREATE TABLE evento_anexos (
          id int NOT NULL AUTO_INCREMENT,
          organizationId int NOT NULL,
          eventoId int NOT NULL,
          nome varchar(200) NOT NULL,
          contentType varchar(120) NULL,
          url text NULL,
          storageKey varchar(512) NULL,
          privateFileId int NULL,
          sizeBytes int NULL,
          createdByUserId int NULL,
          createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          KEY evento_anexos_org_idx (organizationId),
          KEY evento_anexos_evento_idx (eventoId)
        )
      `);
      console.log("+ evento_anexos");
    }
    if (!(await columnExists(conn, "private_files", "calendarioCuidadoId"))) {
      await conn.query(
        `ALTER TABLE private_files ADD COLUMN calendarioCuidadoId int NULL`,
      );
      console.log("+ private_files.calendarioCuidadoId");
    }
    if (!(await indexExists(conn, "private_files", "private_files_evento_idx"))) {
      await conn.query(
        `CREATE INDEX private_files_evento_idx ON private_files (calendarioCuidadoId)`,
      );
    }
    console.log("0036 calendario produtividade OK");
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
