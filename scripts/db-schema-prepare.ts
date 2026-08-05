#!/usr/bin/env node
/**
 * Entrada única para preparar schema MySQL (dev, CI, boot API).
 * Uso: npm run db:schema:prepare
 */
import "dotenv/config";
import { runSchemaPrepare } from "./lib/schema-prepare-core";

runSchemaPrepare()
  .then(() => {
    console.log("[schema-prepare] concluído com sucesso");
  })
  .catch((e) => {
    console.error("[schema-prepare] FALHA:", e instanceof Error ? e.message : e);
    process.exit(1);
  });
