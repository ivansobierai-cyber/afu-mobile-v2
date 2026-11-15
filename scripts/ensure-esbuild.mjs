/**
 * Hostinger (npm 11) pode pular o postinstall do esbuild via allowScripts.
 * Sem esse passo, `node_modules/.bin/esbuild` não existe e `npm run build` falha.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bin = join(root, "node_modules/esbuild/bin/esbuild");

if (!existsSync(bin)) {
  const result = spawnSync(process.execPath, [join(root, "node_modules/esbuild/install.js")], {
    cwd: root,
    stdio: "inherit",
  });
  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (!existsSync(bin)) {
  console.error("esbuild: binário ausente depois de install.js");
  process.exit(1);
}
