/**
 * Headless smoke: Hostinger web build (local or URL) + Railway API.
 * Does NOT call paid AI diagnosis APIs.
 *
 * Usage:
 *   SMOKE_BASE_URL=http://127.0.0.1:3010 node scripts/smoke-site-afuagro.mjs
 */
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";

const base = (process.env.SMOKE_BASE_URL || "http://127.0.0.1:3010").replace(
  /\/$/,
  "",
);
const email = process.env.SMOKE_EMAIL || "demo@afuagro.com.br";
const password = process.env.SMOKE_PASSWORD || "Demo@1234";
const outPath =
  process.env.SMOKE_OUT || "/opt/cursor/artifacts/smoke-site-afuagro.json";

const require = createRequire(import.meta.url);

async function loadPuppeteer() {
  try {
    return require("puppeteer-core");
  } catch {
    const { execSync } = await import("node:child_process");
    execSync("npm install --no-save puppeteer-core@24", {
      stdio: "inherit",
      cwd: new URL("..", import.meta.url).pathname,
    });
    return require("puppeteer-core");
  }
}

const results = { base, at: new Date().toISOString(), routes: {}, flows: {} };

async function checkHttp(path) {
  const url = `${base}${path}`;
  const started = Date.now();
  try {
    const res = await fetch(url, { redirect: "follow" });
    results.routes[path] = {
      status: res.status,
      ms: Date.now() - started,
      ok: res.status >= 200 && res.status < 400,
    };
  } catch (err) {
    results.routes[path] = {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function main() {
  for (const path of [
    "/",
    "/login",
    "/auth/login",
    "/auth/cadastro",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/privacidade",
    "/termos",
    "/legal/privacidade",
    "/legal/termos",
    "/api/health",
  ]) {
    await checkHttp(path);
  }

  // API login via same-origin (proxy) or note failure
  try {
    const loginRes = await fetch(`${base}/api/trpc/auth.login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://afuagro.tech",
      },
      body: JSON.stringify({ json: { email, password } }),
    });
    const body = await loginRes.json();
    const success = Boolean(body?.result?.data?.json?.success);
    results.flows.apiLoginProxy = {
      ok: success,
      status: loginRes.status,
      mfaRequired: body?.result?.data?.json?.mfaRequired ?? null,
    };
  } catch (err) {
    results.flows.apiLoginProxy = {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // Direct Railway login (web build target)
  try {
    const railway =
      "https://afu-mobile-v2-production.up.railway.app/api/trpc/auth.login";
    const loginRes = await fetch(railway, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://afuagro.tech",
      },
      body: JSON.stringify({ json: { email, password } }),
    });
    const body = await loginRes.json();
    results.flows.apiLoginRailway = {
      ok: Boolean(body?.result?.data?.json?.success),
      status: loginRes.status,
    };
  } catch (err) {
    results.flows.apiLoginRailway = {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  const puppeteer = await loadPuppeteer();
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH || "/usr/local/bin/google-chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1280,900"],
  });

  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(45000);

    // Home → login screen
    await page.goto(`${base}/`, { waitUntil: "networkidle2" });
    const homeText = await page.evaluate(() => document.body?.innerText || "");
    results.flows.homeLoaded = {
      ok: homeText.length > 20,
      snippet: homeText.slice(0, 120),
    };

    await page.goto(`${base}/auth/login`, { waitUntil: "networkidle2" });
    await page.waitForSelector("input", { timeout: 20000 });

    // Fill email/password — Expo web often uses placeholder or order of inputs
    const filled = await page.evaluate(
      ({ email, password }) => {
        const inputs = Array.from(document.querySelectorAll("input"));
        const emailInput =
          inputs.find((i) => /email/i.test(i.type) || /email/i.test(i.placeholder || "") || /email/i.test(i.name || "")) ||
          inputs[0];
        const passInput =
          inputs.find((i) => i.type === "password") || inputs[1];
        if (!emailInput || !passInput) return false;
        const set = (el, value) => {
          const proto = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value",
          );
          proto?.set?.call(el, value);
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
        };
        set(emailInput, email);
        set(passInput, password);
        return true;
      },
      { email, password },
    );
    results.flows.loginFormFilled = { ok: filled };

    // Click Entrar / Login button
    await page.evaluate(() => {
      const nodes = Array.from(
        document.querySelectorAll("button, [role='button'], a"),
      );
      const btn = nodes.find((n) =>
        /entrar|login|acessar/i.test(n.textContent || ""),
      );
      btn?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    // Wait for dashboard-ish content or URL change
    await new Promise((r) => setTimeout(r, 5000));
    const afterLogin = await page.evaluate(() => ({
      url: location.href,
      text: (document.body?.innerText || "").slice(0, 400),
    }));
    const dashboardOk =
      /propriedad|cultivo|diagn[oó]stico|dashboard|painel|in[ií]cio/i.test(
        afterLogin.text,
      ) || /\/(tabs)?\/?$|propriedades|cultivos/i.test(afterLogin.url);
    results.flows.browserLoginDashboard = {
      ok: dashboardOk,
      url: afterLogin.url,
      snippet: afterLogin.text.slice(0, 200),
    };

    // Legal pages render content
    await page.goto(`${base}/termos`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1500));
    const termosText = await page.evaluate(
      () => document.body?.innerText || "",
    );
    results.flows.termosContent = {
      ok: /termo|uso|AFU/i.test(termosText) && termosText.length > 80,
      len: termosText.length,
    };

    await page.goto(`${base}/privacidade`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1500));
    const privText = await page.evaluate(() => document.body?.innerText || "");
    results.flows.privacidadeContent = {
      ok: /privacidade|LGPD|dados/i.test(privText) && privText.length > 80,
      len: privText.length,
    };

    await page.goto(`${base}/auth/cadastro`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 1500));
    const cadastroText = await page.evaluate(
      () => document.body?.innerText || "",
    );
    results.flows.cadastroScreen = {
      ok: /cadastro|registrar|criar|conta|e-?mail/i.test(cadastroText),
      snippet: cadastroText.slice(0, 120),
    };

    await page.goto(`${base}/auth/forgot-password`, {
      waitUntil: "networkidle2",
    });
    await new Promise((r) => setTimeout(r, 1500));
    const forgotText = await page.evaluate(
      () => document.body?.innerText || "",
    );
    results.flows.forgotPasswordScreen = {
      ok: /senha|recuper|esqueci|e-?mail/i.test(forgotText),
      snippet: forgotText.slice(0, 120),
    };

    await page.screenshot({
      path: "/opt/cursor/artifacts/smoke-dashboard-or-login.png",
      fullPage: false,
    });
  } finally {
    await browser.close();
  }

  const routeFail = Object.values(results.routes).some((r) => !r.ok);
  const flowFail = Object.values(results.flows).some((r) => r && r.ok === false);
  results.ok = !routeFail && !flowFail;
  writeFileSync(outPath, JSON.stringify(results, null, 2) + "\n");
  console.log(JSON.stringify(results, null, 2));
  if (!results.ok) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  writeFileSync(
    outPath,
    JSON.stringify({ ok: false, error: String(err) }, null, 2) + "\n",
  );
  process.exit(1);
});
