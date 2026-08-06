import { afterAll, beforeAll, describe, expect, it } from "vitest";
import mysql from "mysql2/promise";
import {
  backfillSupplementalRecordsFromSchema,
  runSchemaPrepare,
  verifySchemaInvariants,
  SUPPLEMENTAL_MIGRATIONS_TABLE,
  hasSupplementalMigrationRecord,
} from "../scripts/lib/schema-prepare-core";
import { columnExists, tableExists } from "../scripts/lib/mysql-ddl-helpers";

const appUrl = process.env.DATABASE_URL;
const adminUrl = process.env.SCHEMA_PREPARE_TEST_ADMIN_URL;
const canRunIntegration = Boolean(appUrl && adminUrl);

function databaseUrlWithName(baseUrl: string, database: string): string {
  const q = baseUrl.indexOf("?");
  const withoutQuery = q >= 0 ? baseUrl.slice(0, q) : baseUrl;
  const query = q >= 0 ? baseUrl.slice(q) : "";
  const slash = withoutQuery.lastIndexOf("/");
  if (slash < 0) throw new Error("DATABASE_URL inválida");
  return `${withoutQuery.slice(0, slash + 1)}${database}${query}`;
}

function parseMysqlUserFromUrl(url: string): string {
  const parsed = new URL(url);
  const user = decodeURIComponent(parsed.username);
  if (!user) throw new Error("DATABASE_URL sem usuário MySQL");
  return user;
}

function assertSafeEphemeralDatabaseName(name: string): void {
  if (!/^afu_schema_prepare_\d+$/.test(name)) {
    throw new Error(`nome de banco efêmero inválido: ${name}`);
  }
}

function quoteMysqlIdent(ident: string): string {
  return `\`${ident.replace(/`/g, "``")}\``;
}

async function resolveMysqlGranteeHost(
  adminConn: mysql.Connection,
  mysqlUser: string,
): Promise<string> {
  const [rows] = await adminConn.query<mysql.RowDataPacket[]>(
    `SELECT Host AS host FROM mysql.user WHERE User = ? ORDER BY (Host = '%') DESC, Host ASC LIMIT 1`,
    [mysqlUser],
  );
  const host = rows[0]?.host;
  if (host === undefined || host === null) {
    throw new Error(
      `usuário MySQL "${mysqlUser}" não encontrado (necessário para GRANT no banco efêmero)`,
    );
  }
  return host;
}

describe.skipIf(!canRunIntegration)(
  "db:schema:prepare (integração MySQL)",
  () => {
    const baseUrl = appUrl!;
    const testDb = `afu_schema_prepare_${Date.now()}`;
    assertSafeEphemeralDatabaseName(testDb);
    const testUrl = databaseUrlWithName(baseUrl, testDb);
    const appMysqlUser = parseMysqlUserFromUrl(baseUrl);
    let adminConn: mysql.Connection | undefined;

    beforeAll(async () => {
      if (!adminUrl) {
        throw new Error(
          "SCHEMA_PREPARE_TEST_ADMIN_URL é obrigatória para integração db:schema:prepare (CI ou MySQL local descartável com root)",
        );
      }
      adminConn = await mysql.createConnection(adminUrl);
      await adminConn.ping();
      await adminConn.query(`CREATE DATABASE ${quoteMysqlIdent(testDb)}`);
      const grantHost = await resolveMysqlGranteeHost(adminConn, appMysqlUser);
      await adminConn.query(
        `GRANT ALL PRIVILEGES ON ${quoteMysqlIdent(testDb)}.* TO ${quoteMysqlIdent(appMysqlUser)}@${quoteMysqlIdent(grantHost)}`,
      );
      await adminConn.query("FLUSH PRIVILEGES");
      process.env.DATABASE_URL = testUrl;
    }, 120_000);

    afterAll(async () => {
      process.env.DATABASE_URL = baseUrl;
      if (adminConn) {
        try {
          await adminConn.query(`DROP DATABASE IF EXISTS ${quoteMysqlIdent(testDb)}`);
        } finally {
          await adminConn.end();
          adminConn = undefined;
        }
      }
    });

    it("banco vazio recebe safras e arquivamento via prepare", async () => {
      await runSchemaPrepare({ skipDrizzleMigrate: false });
      const conn = await mysql.createConnection(testUrl);
      try {
        expect(await tableExists(conn, "safras")).toBe(true);
        expect(await columnExists(conn, "culturas", "safraId")).toBe(true);
        expect(await columnExists(conn, "propriedades", "archivedAt")).toBe(true);
        expect(await hasSupplementalMigrationRecord(conn, "0020_safras")).toBe(true);
        expect(await hasSupplementalMigrationRecord(conn, "0021_property_archive")).toBe(true);
      } finally {
        await conn.end();
      }
    }, 300_000);

    it("reaplicação prepare não falha", async () => {
      await expect(runSchemaPrepare()).resolves.toBeUndefined();
    }, 300_000);

    it("banco legado (schema sem registro) continua válido após backfill", async () => {
      const conn = await mysql.createConnection(testUrl);
      try {
        await conn.query(`DELETE FROM ${SUPPLEMENTAL_MIGRATIONS_TABLE} WHERE tag = ?`, [
          "0020_safras",
        ]);
        expect(await hasSupplementalMigrationRecord(conn, "0020_safras")).toBe(false);
        await backfillSupplementalRecordsFromSchema(conn);
        expect(await hasSupplementalMigrationRecord(conn, "0020_safras")).toBe(true);
        await verifySchemaInvariants(conn);
      } finally {
        await conn.end();
      }
    });

    it("verify falha se registro obrigatório ausente", async () => {
      const conn = await mysql.createConnection(testUrl);
      try {
        await conn.query(`DELETE FROM ${SUPPLEMENTAL_MIGRATIONS_TABLE} WHERE tag = ?`, [
          "0021_property_archive",
        ]);
        await expect(verifySchemaInvariants(conn)).rejects.toThrow(/0021_property_archive/);
        await runSchemaPrepare({ skipDrizzleMigrate: true });
        await verifySchemaInvariants(conn);
      } finally {
        await conn.end();
      }
    }, 300_000);
  },
);
