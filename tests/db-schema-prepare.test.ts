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

const hasDb = Boolean(process.env.DATABASE_URL);

function databaseUrlWithName(baseUrl: string, database: string): string {
  const q = baseUrl.indexOf("?");
  const withoutQuery = q >= 0 ? baseUrl.slice(0, q) : baseUrl;
  const query = q >= 0 ? baseUrl.slice(q) : "";
  const slash = withoutQuery.lastIndexOf("/");
  if (slash < 0) throw new Error("DATABASE_URL inválida");
  return `${withoutQuery.slice(0, slash + 1)}${database}${query}`;
}

describe.skipIf(!hasDb)("db:schema:prepare (integração MySQL)", () => {
  const baseUrl = process.env.DATABASE_URL!;
  const testDb = `afu_schema_prepare_${Date.now()}`;
  const testUrl = databaseUrlWithName(baseUrl, testDb);
  let adminConn: mysql.Connection | undefined;
  let suiteReady = false;

  beforeAll(async () => {
    try {
      adminConn = await mysql.createConnection(baseUrl);
      await adminConn.ping();
      await adminConn.query(`CREATE DATABASE \`${testDb}\``);
      process.env.DATABASE_URL = testUrl;
      suiteReady = true;
    } catch {
      suiteReady = false;
    }
  }, 120_000);

  afterAll(async () => {
    process.env.DATABASE_URL = baseUrl;
    if (adminConn) {
      try {
        await adminConn.query(`DROP DATABASE IF EXISTS \`${testDb}\``);
      } finally {
        await adminConn.end();
      }
    }
  });

  it("banco vazio recebe safras e arquivamento via prepare", async (ctx) => {
    if (!suiteReady) ctx.skip();
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

  it("reaplicação prepare não falha", async (ctx) => {
    if (!suiteReady) ctx.skip();
    await expect(runSchemaPrepare()).resolves.toBeUndefined();
  }, 300_000);

  it("banco legado (schema sem registro) continua válido após backfill", async (ctx) => {
    if (!suiteReady) ctx.skip();
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

  it("verify falha se registro obrigatório ausente", async (ctx) => {
    if (!suiteReady) ctx.skip();
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
});
