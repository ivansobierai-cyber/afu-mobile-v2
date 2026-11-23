# Site afuagro.tech — deploy Hostinger (produção)

**Owner:** Ivan (AFU Agro)  
**Date:** 2026-11-23

Canonical production layout for the public website. Older checklists still exist; this file is the **single deploy runbook**. Pointers:

| Previous doc | Status |
|--------------|--------|
| [API_ROUTING.md](./API_ROUTING.md) | Keep — architecture / CORS / DNS detail |
| [OWNER_AUTH_DB_EMAIL_CHECKLIST.md](./OWNER_AUTH_DB_EMAIL_CHECKLIST.md) | Keep — auth/DB/email diagnostics; prefer **Opção B** below |
| [STAGING.md](./STAGING.md) | Keep — staging/APK notes; web section defers here |

---

## Architecture (decision)

| Piece | Where | Role |
|-------|--------|------|
| Web UI (Expo export) | **Hostinger** Node (`afuagro.tech`) | Serves `dist/public` + SPA fallback |
| API (Express + tRPC + MySQL) | **Railway** `https://afu-mobile-v2-production.up.railway.app` | Login, data, storage |
| Browser → API | Direct to Railway **or** same-origin `/api` proxied via `API_UPSTREAM_URL` | CORS allowlists `https://afuagro.tech` |

**Do not** rely on Hostinger MySQL for the public site. Hostinger’s Node often has a malformed `DATABASE_URL` (`Invalid URL`) and a corrupted `STORAGE_S3_ENDPOINT`; that only breaks **local** `/api` on the apex (or can TLS-reset under load). The web build must call Railway.

Preferred: **SPA on Hostinger + API on Railway** (`build:hostinger` defaults to Railway).

Optional: set `API_UPSTREAM_URL` on Hostinger so apex `/api/*` proxies to Railway (health checks and accidental same-origin calls work even when Hostinger DB is broken).

---

## Hostinger app settings (already configured)

| Setting | Value |
|---------|--------|
| Domain | `afuagro.tech` |
| Type | Node.js / Express |
| Git | `ivansobierai-cyber/afu-mobile-v2` branch **`main`** (auto-deploy on push) |
| Node | **24** |
| Build script | `build:hostinger` |
| Entry file | `dist/index.js` |
| Output directory | `dist` (`index.js` + `public/`) |

Build command equivalent:

```bash
HOSTINGER_API_BASE_URL=https://afu-mobile-v2-production.up.railway.app \
EXPO_PUBLIC_SHOW_DEMO_LOGIN=0 \
npm run build:hostinger
```

(`HOSTINGER_API_BASE_URL` is optional — script defaults to Railway. Never set demo login to `1` in production.)

Artifact: `dist/index.js` + `dist/public/` (includes `.htaccess` SPA fallback).

---

## Owner steps after this PR merges

1. **Merge PR → `main`** (Hostinger auto-deploys from `main`).
2. Hostinger → Node.js → **Environment variables** — add/fix (names only; paste your own values):

| Name | Required? | Notes |
|------|-----------|--------|
| `API_UPSTREAM_URL` | **Recommended** | `https://afu-mobile-v2-production.up.railway.app` — proxies `/api` → Railway |
| `NODE_ENV` | yes | `production` |
| `JWT_SECRET` | only if Hostinger runs local API | Must match Railway if mixing hosts |
| `DATABASE_URL` | only if **not** using `API_UPSTREAM_URL` | See format below |
| `APP_URL` | optional | `https://afuagro.tech` |
| `SENDGRID_API_KEY` / `SENDGRID_FROM_EMAIL` | Railway | Prefer set on **Railway** |
| `STORAGE_S3_*` | Railway | Prefer Railway; Hostinger copies are often malformed |

3. Wait for Git deploy to finish, then smoke:

```bash
curl -sS https://afu-mobile-v2-production.up.railway.app/api/health
# ready:true, database.reachable:true

curl -sS https://afuagro.tech/api/health
# With API_UPSTREAM_URL: same shape as Railway
# Without it: local Node may show ready:false — web app still OK if JS → Railway

curl -sS -o /dev/null -w "%{http_code}\n" https://afuagro.tech/
curl -sS -o /dev/null -w "%{http_code}\n" https://afuagro.tech/login
curl -sS -o /dev/null -w "%{http_code}\n" https://afuagro.tech/auth/login
curl -sS -o /dev/null -w "%{http_code}\n" https://afuagro.tech/privacidade
curl -sS -o /dev/null -w "%{http_code}\n" https://afuagro.tech/termos
```

4. Browser: https://afuagro.tech → Entrar → `demo@afuagro.com.br` / `Demo@1234` → dashboard. Do **not** call paid AI diagnosis in smoke.

---

## `DATABASE_URL` format (only if Hostinger runs its own API)

```text
mysql://USER:PASSWORD@HOST:PORT/DATABASE
```

- **No** wrapping quotes (`"..."` / `'...'`)
- **No** line breaks
- Prefer Railway **public** MySQL URL if Hostinger cannot reach private TCP

If Hostinger DB stays broken, set `API_UPSTREAM_URL` and ignore local DB.

`STORAGE_S3_ENDPOINT` must be clean, e.g. `https://xxxx.r2.cloudflarestorage.com` — no embedded quotes.

---

## `.htaccess` (static / Apache)

`npm run build:hostinger` writes `dist/public/.htaccess` (SPA → `index.html`, skip files and `/api/`). Current Node deploy uses Express SPA fallback; keep the file for static sync.

---

## CORS (Railway)

Hardcoded: `https://afuagro.tech`, `https://www.afuagro.tech`, `https://app.afuagro.tech`. See [API_ROUTING.md](./API_ROUTING.md).

---

## Manual upload (only if Git deploy unavailable)

1. Run the build command above locally.
2. Publish `dist/` so entry is `dist/index.js` and web is `dist/public/`.
3. Do **not** upload `.env` / secrets. Restart Node.

---

## Open owner actions (not code)

1. Add `API_UPSTREAM_URL` on Hostinger (recommended).
2. Fix or remove malformed Hostinger `DATABASE_URL` / `STORAGE_S3_ENDPOINT` if not proxying.
3. Set SendGrid on **Railway** for forgot-password email.
4. Optional: DNS `api.afuagro.tech` → Railway ([API_ROUTING.md](./API_ROUTING.md)).
