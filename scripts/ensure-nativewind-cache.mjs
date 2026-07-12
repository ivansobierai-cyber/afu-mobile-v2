import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cacheDir = join(root, "node_modules/react-native-css-interop/.cache");
const webCssPath = join(cacheDir, "web.css");
const globalCssPath = join(root, "global.css");

mkdirSync(cacheDir, { recursive: true });

try {
  execSync(
    `npx tailwindcss -i "${globalCssPath}" -o "${webCssPath}" --minify`,
    { cwd: root, stdio: "inherit" },
  );
  console.log("NativeWind cache gerado com Tailwind:", webCssPath);
} catch (error) {
  writeFileSync(webCssPath, "/* nativewind placeholder */\n", "utf8");
  console.warn(
    "Tailwind prebuild falhou; usando placeholder para o Metro (será sobrescrito no export).",
    error instanceof Error ? error.message : error,
  );
}
