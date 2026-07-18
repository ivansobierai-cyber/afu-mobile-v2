/**
 * Executa a suíte Etapa 10 e grava evidências em docs/evidencias/.
 *
 * Uso: npx tsx scripts/run-etapa10-security.ts
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const outDir = join(ROOT, "docs/evidencias");
mkdirSync(outDir, { recursive: true });

const tests = [
  "tests/cross-tenant-attack.test.ts",
  "tests/tenant-db.isolation.test.ts",
  "tests/private-files.test.ts",
  "tests/trpc-cache-scope.test.ts",
  "tests/offline-tenant-scope.test.ts",
  "tests/core-mutation-queue.test.ts",
  "tests/etapa10-offline-removed-member.test.ts",
  "tests/etapa10-rollback-rehearsal.test.ts",
  "tests/ai-governance.test.ts",
  "tests/tenant-access.test.ts",
  "tests/org-roles.test.ts",
];

const started = new Date().toISOString();
const result = spawnSync(
  "npx",
  ["vitest", "run", ...tests],
  { cwd: ROOT, encoding: "utf8", env: process.env },
);

const ended = new Date().toISOString();
const report = {
  etapa: 10,
  started,
  ended,
  exitCode: result.status,
  decision: result.status === 0 ? "AVANCAR" : "BLOQUEAR",
  stdoutTail: (result.stdout ?? "").slice(-8000),
  stderrTail: (result.stderr ?? "").slice(-4000),
  tests,
};

const stamp = started.replace(/[:.]/g, "-");
const outPath = join(outDir, `etapa10-security-${stamp}.json`);
writeFileSync(outPath, JSON.stringify(report, null, 2));
writeFileSync(
  join(outDir, "etapa10-security-latest.json"),
  JSON.stringify(report, null, 2),
);

console.log(`\n[Etapa10] evidência: ${outPath}`);
console.log(`[Etapa10] decisão: ${report.decision} (exit=${result.status})`);
process.exit(result.status ?? 1);
