# API routing — who serves what

**Owner:** Ivan (AFU Agro)  
**Verified:** 2026-11-16  

**Deploy runbook (Hostinger site):** [SITE_AFUAGRO_DEPLOY.md](./SITE_AFUAGRO_DEPLOY.md)

## Canonical hosts

| Host | Role today | Has MySQL? | Notes |
|------|------------|------------|-------|
| `https://afu-mobile-v2-production.up.railway.app` | **API canônica** (Express + tRPC) | **Yes** | Source of truth for login, data, S3/R2. |
| `https://afuagro.tech` | Web app (Hostinger Node or Vercel) | N/A (static/web) | Browser clients must call the Railway API (CORS allowed). |
| `https://www.afuagro.tech` | Redirect → apex | N/A | Same as apex for API base. |
| `https://api.afuagro.tech` | **Intended** custom domain for Railway API | Depends on DNS | Today DNS often hits **Hostinger Node without DB** → login/storage broken. Keep the name; cut over DNS when ready. |
| `https://api.afuagro.com.br` | Legacy name in older docs | — | Prefer `.tech` + Railway URL. |

## What points where (app builds)

| Client | Config | API base |
|--------|--------|----------|
| EAS `preview` / `production` | `eas.json` → `EXPO_PUBLIC_API_BASE_URL` | Railway |
| Hostinger web embed (`npm run build:hostinger`) | `HOSTINGER_API_BASE_URL` **>** `EXPO_PUBLIC_API_BASE_URL` **>** default Railway | Railway unless overridden. **`HOSTINGER_SITE_URL` is ignored** for API base (warns at build); it used to force same-origin Hostinger Node (often no MySQL). |
| Vercel web (`npm run build:web:preview`) | `EXPO_PUBLIC_API_BASE_URL` or default Railway | Railway |
| Runtime web on `afuagro.tech` without bake-in | `getApiBaseUrl()` host rule | Railway (never same-origin Hostinger API) |

**Do not** ship Play Store / production mobile builds against Hostinger’s Node API while it has no `DATABASE_URL`.

## CORS (Railway)

Production **default is an allowlist** (not reflect-any), because session cookies use `SameSite=None` + `credentials: include`:

- **Hardcoded always** (no Railway env required): `https://afuagro.tech`, `https://www.afuagro.tech`, `https://app.afuagro.tech`
- Optional `WEB_APP_ORIGINS` CSV merges **extras** — never replaces the hardcoded defaults
- Vercel previews: `^https://afu-mobile[-\w]*\.vercel\.app$`
- Extras: `CORS_ALLOWED_ORIGINS` (CSV)
- Localhost / `127.0.0.1` only when `NODE_ENV !== production`
- Escape hatch: `CORS_REFLECT_ORIGIN=1` restores reflect-any (avoid in production)

Native apps send **no** `Origin` — CORS does not apply. Web auth uses **Bearer** from storage; do not call `establishSession` on web for cross-site Railway.

## S3 / R2 endpoint

`server/storage-s3.ts` normalizes `STORAGE_S3_ENDPOINT` / `AWS_ENDPOINT_URL` / `S3_ENDPOINT` / `R2_ENDPOINT`:

1. trim  
2. prepend `https://` if scheme missing  
3. strip trailing `/`  
4. validate; `/api/health` `storageHint` explains invalid values (avoids opaque `Invalid URL`)

Example: `xxxx.r2.cloudflarestorage.com` → `https://xxxx.r2.cloudflarestorage.com`.

## Optional DNS — `api.afuagro.tech` → Railway

Keep the hostname; when ready:

1. Railway → API service → **Settings → Networking → Custom Domain** → add `api.afuagro.tech`.
2. DNS (registrar / Hostinger DNS):
   - Prefer **CNAME** `api` → `afu-mobile-v2-production.up.railway.app` (or the target Railway shows), **or**
   - Use the **A/AAAA** records Railway displays for the custom domain.
3. Wait for TLS on Railway; then:
   ```bash
   curl -sS https://api.afuagro.tech/api/health
   ```
   Expect `ok: true` and the same shape as the Railway URL (including `storage.storageReady` when R2 is set).
4. Optionally set EAS / Hostinger `EXPO_PUBLIC_API_BASE_URL` / `HOSTINGER_API_BASE_URL` to `https://api.afuagro.tech` **after** health is green on that host.

Until then, leave builds on `https://afu-mobile-v2-production.up.railway.app`.

## Owner checklist (short)

1. Redeploy Railway after merging S3 normalize (if Hostinger/Railway env still has scheme-less R2 host).  
2. Redeploy Hostinger `build:hostinger` (or set `HOSTINGER_API_BASE_URL` → Railway) so `afuagro.tech` web calls Railway.  
3. Rebuild EAS `production` so Play Store points at Railway.  
4. Optional: custom domain step above for `api.afuagro.tech`.  
5. Do **not** delete Hostinger site or DNS records until the cutover is verified — move traffic via env/DNS, keep the names documented.

## Related

- [SITE_AFUAGRO_DEPLOY.md](./SITE_AFUAGRO_DEPLOY.md) — Hostinger build/env/`API_UPSTREAM_URL`  
- [STAGING.md](./STAGING.md)  
- [RAILWAY_STORAGE_EVENTOS.md](./RAILWAY_STORAGE_EVENTOS.md)  
- `constants/api-hosts.ts`  
- `eas.json`  
- `scripts/build-hostinger.mjs` / `scripts/build-web-preview.mjs`
