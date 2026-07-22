/**
 * Aplica 0018/0019 de forma idempotente (MySQL 8).
 * Uso: npx tsx scripts/apply-0018-0019-sync-ai.ts
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

async function tableExists(conn: mysql.Connection, table: string): Promise<boolean> {
  const [rows] = await conn.query<any[]>(
    `SELECT 1 FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? LIMIT 1`,
    [table],
  );
  return rows.length > 0;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required");
  const conn = await mysql.createConnection(url);
  try {
    if (!(await tableExists(conn, "sync_conflicts"))) {
      await conn.query(`
CREATE TABLE sync_conflicts (
  id int AUTO_INCREMENT NOT NULL,
  organizationId int NOT NULL,
  actorUserId int,
  deviceId varchar(80),
  clientMutationId varchar(64),
  entity varchar(60) NOT NULL,
  action varchar(40) NOT NULL,
  resourceType varchar(60),
  resourceId varchar(64),
  reason varchar(80) NOT NULL,
  message text,
  payload text,
  syncConflictStatus enum('aberto','resolvido','descartado') NOT NULL DEFAULT 'aberto',
  resolvedByUserId int,
  resolvedAt timestamp NULL,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
      console.log("+ sync_conflicts");
    } else {
      console.log("[skip] sync_conflicts");
    }

    const idxs: Array<[string, string]> = [
      [
        "sync_conflicts_organization_idx",
        "CREATE INDEX sync_conflicts_organization_idx ON sync_conflicts (organizationId)",
      ],
      [
        "sync_conflicts_status_idx",
        "CREATE INDEX sync_conflicts_status_idx ON sync_conflicts (organizationId, syncConflictStatus)",
      ],
      [
        "sync_conflicts_client_mutation_idx",
        "CREATE INDEX sync_conflicts_client_mutation_idx ON sync_conflicts (clientMutationId)",
      ],
    ];
    for (const [name, ddl] of idxs) {
      if (await indexExists(conn, name)) {
        console.log(`[skip idx] ${name}`);
      } else {
        await conn.query(ddl);
        console.log(`[idx] ${name}`);
      }
    }

    if (!(await columnExists(conn, "terrenos", "geometriaVersao"))) {
      await conn.query("ALTER TABLE terrenos ADD COLUMN geometriaVersao int DEFAULT 1");
      console.log("+ terrenos.geometriaVersao");
    } else {
      console.log("[skip] terrenos.geometriaVersao");
    }

    if (!(await columnExists(conn, "organizations", "aiAllowModelImprovement"))) {
      await conn.query(
        "ALTER TABLE organizations ADD COLUMN aiAllowModelImprovement tinyint(1) NOT NULL DEFAULT 0",
      );
      console.log("+ organizations.aiAllowModelImprovement");
    } else {
      console.log("[skip] organizations.aiAllowModelImprovement");
    }

    if (!(await columnExists(conn, "organizations", "aiShareAggregatedInsights"))) {
      await conn.query(
        "ALTER TABLE organizations ADD COLUMN aiShareAggregatedInsights tinyint(1) NOT NULL DEFAULT 0",
      );
      console.log("+ organizations.aiShareAggregatedInsights");
    } else {
      console.log("[skip] organizations.aiShareAggregatedInsights");
    }

    console.log("0018/0019 sync+ai OK");
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
