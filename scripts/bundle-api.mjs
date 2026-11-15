import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bin = join(root, "node_modules/esbuild/bin/esbuild");
const result = spawnSync(
  bin,
  [
    "server/_core/index.ts",
    "--platform=node",
    "--packages=external",
    "--bundle",
    "--format=esm",
    "--outdir=dist",
  ],
  { cwd: root, stdio: "inherit" },
);

process.exit(result.status ?? 1);
