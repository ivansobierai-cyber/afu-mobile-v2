/**
 * O npm da Hostinger bloqueia o postinstall do esbuild (allowScripts),
 * então `node_modules/esbuild/bin/esbuild` e `install.js` podem não existir.
 * O pacote da plataforma já traz o binário; este script só o copia para o lugar
 * que o CLI espera.
 */
import { spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { arch, platform } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dest = join(root, "node_modules/esbuild/bin/esbuild");

if (existsSync(dest)) {
  process.exit(0);
}

const esbuildPkgPath = join(root, "node_modules/esbuild/package.json");
if (!existsSync(esbuildPkgPath)) {
  console.error("esbuild não está em node_modules. Rode npm install.");
  process.exit(1);
}

const version = JSON.parse(readFileSync(esbuildPkgPath, "utf8")).version;
const platformPkg = `@esbuild/${platform()}-${arch()}`;
const platformBin = join(root, "node_modules", platformPkg, "bin/esbuild");

if (!existsSync(platformBin)) {
  const install = spawnSync(
    "npm",
    ["install", `${platformPkg}@${version}`, "--no-save", "--ignore-scripts"],
    { cwd: root, stdio: "inherit" },
  );
  if ((install.status ?? 1) !== 0) {
    process.exit(install.status ?? 1);
  }
}

if (!existsSync(platformBin)) {
  console.error(`Binário ausente: ${platformBin}`);
  process.exit(1);
}

mkdirSync(dirname(dest), { recursive: true });
copyFileSync(platformBin, dest);
chmodSync(dest, 0o755);
console.log(`[ensure-esbuild] ${platformPkg}@${version} -> bin/esbuild`);
