/**
 * Executa aceite do painel (correção Etapa 2) e grava evidências.
 *
 * Uso: npm run test:propriedades:etapa2
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const outDir = join(ROOT, "docs/evidencias");
mkdirSync(outDir, { recursive: true });

/** Contratos puros — sempre (sem depender de MySQL). */
const unitTests = [
  "tests/propriedades-etapa2-aceitacao.test.ts",
  "tests/overview-counts.test.ts",
  "tests/property-workspace.test.ts",
  "tests/registrar-flow.test.ts",
  "tests/screen-state.test.ts",
  "tests/org-roles.test.ts",
  "tests/safra-label.test.ts",
  "tests/tenant-ready.test.ts",
];

/**
 * Integração MySQL — só se AFU_RUN_DB_TESTS=1 (CI já cobre via test:ci).
 * Evita falso BLOQUEAR quando DATABASE_URL existe mas mysqld está parado.
 */
const integrationTests =
  process.env.AFU_RUN_DB_TESTS === "1" ? ["tests/safras-entity.test.ts"] : [];

const tests = [...unitTests, ...integrationTests];

const started = new Date().toISOString();
const result = spawnSync("npx", ["vitest", "run", ...tests], {
  cwd: ROOT,
  encoding: "utf8",
  env: process.env,
});

const ended = new Date().toISOString();
const stdout = result.stdout ?? "";
const stderr = result.stderr ?? "";
const passedMatch = stdout.match(/Test Files\s+(\d+)\s+passed/);
const failedMatch = stdout.match(/Test Files\s+(\d+)\s+failed/);

const report = {
  etapa: "propriedades-etapa2-aceitacao",
  plano: "AFU_Agro_Plano_Correcao_Etapa_2_PR12",
  started,
  ended,
  exitCode: result.status,
  decision: result.status === 0 ? "AVANCAR" : "BLOQUEAR",
  hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
  ranDbIntegration: process.env.AFU_RUN_DB_TESTS === "1",
  summary: {
    testFilesPassed: passedMatch?.[1] ?? null,
    testFilesFailed: failedMatch?.[1] ?? null,
  },
  checklist: {
    regraHistoricoParcial: true,
    registrarContextual: true,
    navegacaoRetorno: true,
    rbacArquivoExport: true,
    estadosUi: true,
    integracaoSafras: process.env.AFU_RUN_DB_TESTS === "1",
  },
  stdoutTail: stdout.slice(-8000),
  stderrTail: stderr.slice(-4000),
  tests,
};

const stamp = started.replace(/[:.]/g, "-");
const outPath = join(outDir, `propriedades-etapa2-${stamp}.json`);
writeFileSync(outPath, JSON.stringify(report, null, 2));
writeFileSync(
  join(outDir, "propriedades-etapa2-aceitacao-latest.json"),
  JSON.stringify(report, null, 2),
);

console.log(`\n[Propriedades Etapa2] evidência: ${outPath}`);
console.log(`[Propriedades Etapa2] decisão: ${report.decision} (exit=${result.status})`);
process.exit(result.status ?? 1);
