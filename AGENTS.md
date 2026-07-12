# AGENTS.md

## Cursor Cloud specific instructions

This is an Expo SDK 54 app (Expo Router + tRPC + Drizzle ORM) with an Express API and a
MySQL database. See `README.md` for the full setup/run reference and `server/README.md` for
backend details. Notes below are the non-obvious, environment-specific bits for cloud agents.

### Services

| Service | Command | Port | Notes |
|---------|---------|------|-------|
| MySQL 8 | `sudo service mysql start` | 3306 | Installed natively (not Docker). DB `afu_mobile`, user `afu`/`afu_local_dev`. |
| API (Express + tRPC) | `npm run dev:server` | 3000 | Hot-reloads via `tsx watch`. |
| Metro web | `npm run dev:metro` | 8081 | Web build; first bundle takes ~20-25s. |
| Both together | `npm run dev` | 3000 + 8081 | Runs API + Metro concurrently. |

### Startup caveats (non-obvious)

- **MySQL is native, not Docker.** The repo's `npm run db:up` uses Docker Compose, but Docker
  is not available in this environment. MySQL 8 is installed via apt and must be started with
  `sudo service mysql start` (it does not auto-start on VM boot). Do NOT run `npm run db:up`.
- **`.env` is required and gitignored.** Copy `cp .env.example .env` and set a `JWT_SECRET`.
  The default `DATABASE_URL` (`mysql://afu:afu_local_dev@127.0.0.1:3306/afu_mobile`) already
  matches the local MySQL user/db, so no edits are needed there.
- After starting a fresh DB, apply schema then seed: `npm run db:push` then `npm run seed`
  (optionally `npm run seed:marketplace`). Seeds are idempotent.
- **Demo login** (web at http://localhost:8081): `demo@afuagro.com.br` / `Demo@1234`.
  Auth is email/password (JWT), not OAuth. The `OAUTH_SERVER_URL is not configured` log on
  server start is expected and harmless for local dev.
  (optionally `npm run seed:marketplace` and `npm run seed:comprador`). Seeds are idempotent.
- **Demo logins** (web at http://localhost:8081): `demo@afuagro.com.br` / `Demo@1234` (producer)
  and `comprador@afuagro.com.br` / `Demo@1234` (marketplace buyer). The login screen also has
  "Entrar com Demo Produtor/Comprador" quick-access buttons.
  Auth is email/password (JWT), not OAuth. The `OAUTH_SERVER_URL is not configured` log on
  server start is expected and harmless for local dev.
- **Restart Metro after installing new npm dependencies.** A running `npm run dev:metro` does
  not pick up packages added by `npm install` (module resolution errors persist); stop and
  rerun `npm run dev` after dependency changes.
- tRPC endpoints use superjson: manual POSTs must wrap the input as `{"json": {...}}`, e.g.
  `curl -X POST localhost:3000/api/trpc/auth.login -H 'Content-Type: application/json' -d '{"json":{"email":"...","password":"..."}}'`.
- Optional external services (Forge LLM for AI diagnosis, SendGrid, Manus OAuth, Expo push) are
  not configured; the app degrades gracefully without them. Weather uses the public Open-Meteo
  API (no key).

### Lint / test / build / typecheck

- `npm run lint`, `npm run check` (tsc), `npm run test` (Vitest). These commands run fine, but
  the repo currently has pre-existing lint errors and 2 Vitest suites that fail on
  `expo-modules-core` mocking (`auth-flow.test.ts`, `resend-email.test.ts`). These are not
  environment issues.
  the repo currently has pre-existing lint errors, 2 `tsc` errors (`app/_layout.tsx`,
  `app/auth/welcome.tsx`), and 2 Vitest suites that fail on `expo-modules-core` mocking
  (`auth-flow.test.ts`, `resend-email.test.ts`). These are not environment issues.
- Native builds (`eas:*`, `expo run:android/ios`) require EAS/device and are out of scope in
  the cloud VM; use the web target for verification.
