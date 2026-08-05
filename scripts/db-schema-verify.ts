#!/usr/bin/env node
/**
 * Verifica invariantes e registros obrigatórios sem aplicar migrations.
 * Uso: npm run db:schema:verify
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { verifySchemaInvariants } from "./lib/schema-prepare-core";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL é obrigatório");
  const conn = await mysql.createConnection(url);
  try {
    await verifySchemaInvariants(conn);
    console.log("[schema-verify] OK — migrations obrigatórias presentes");
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error("[schema-verify] FALHA:", e instanceof Error ? e.message : e);
  process.exit(1);
});
