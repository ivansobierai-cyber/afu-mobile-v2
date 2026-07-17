/**
 * Orquestra seeds da expansão banco (etapas 30–46).
 * Pré-requisito: npm run db:push && npm run seed
 *
 * Uso: npm run seed:banco-expansao
 */
import { spawnSync } from "node:child_process";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");

const STEPS = [
  { script: "seed:agronomico", label: "30–34 catálogo agronômico" },
  { script: "seed:expansao", label: "35–38 GeoClima / Solos" },
  { script: "seed:lab-economia", label: "39–41 Lab / Economia" },
  { script: "seed:geo-iot", label: "42–43 GEO / IoT" },
  { script: "seed:marketplace", label: "44 Marketplace catálogo" },
  { script: "seed:noc-arquitetura", label: "45–46 NOC / Arquitetura" },
] as const;

function run(script: string, label: string) {
  console.log(`\n═══ ${label} (${script}) ═══`);
  const result = spawnSync("npm", ["run", script], {
    cwd: ROOT,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });
  if (result.status !== 0) {
    console.error(`FALHA em ${script} (exit ${result.status ?? "null"})`);
    process.exit(result.status ?? 1);
  }
}

console.log("seed:banco-expansao — cadeia etapas 30–46 (idempotente)");
for (const step of STEPS) {
  run(step.script, step.label);
}
console.log("\nOK seed:banco-expansao concluído.");
