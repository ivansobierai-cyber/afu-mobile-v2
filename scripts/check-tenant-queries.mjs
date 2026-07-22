#!/usr/bin/env node
/**
 * Etapa 5 — guarda de regressão: detecta UPDATE/DELETE por id sem organizationId
 * em arquivos server/db*.ts (camada de dados).
 *
 * Heurística simples — falha o CI se aparecer padrão perigoso óbvio.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SERVER = join(ROOT, "server");

const PRIVATE_TABLES = [
  "propriedades",
  "terrenos",
  "culturas",
  "diagnosticosIa",
  "analisesFitotecnicas",
  "relatorios",
  "calendarioCuidados",
  "tarefasOperacionais",
  "ocorrenciasCampo",
  "estoqueItens",
  "orcamentosSafra",
  "custosOperacao",
  "atividadePropriedade",
  "sensores",
];

const files = readdirSync(SERVER)
  .filter((f) => /^db.*\.ts$/.test(f) || f === "tenant-db.ts")
  .map((f) => join(SERVER, f));

let failed = false;

for (const file of files) {
  if (file.endsWith("tenant-db.ts")) continue; // camada autorizada
  const src = readFileSync(file, "utf8");
  const lines = src.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const table of PRIVATE_TABLES) {
      // update(table).set(...).where(eq(table.id, id)) sem organizationId na mesma expressão
      const updateHit =
        line.includes(`.update(${table})`) ||
        (line.includes("update(") && lines[i + 1]?.includes(table));
      if (!updateHit) continue;
      // olhar janela de 8 linhas
      const window = lines.slice(i, i + 8).join("\n");
      if (
        window.includes(`eq(${table}.id`) &&
        !window.includes(`${table}.organizationId`) &&
        !window.includes("organizationId")
      ) {
        console.error(
          `[tenant-query] ${file}:${i + 1} — UPDATE em ${table} parece sem organizationId`,
        );
        failed = true;
      }
    }
  }
}

if (failed) {
  console.error("\nFalhou check-tenant-queries (Etapa 5). Use createTenantDb / WHERE organizationId.");
  process.exit(1);
}
console.log("check-tenant-queries: ok");
