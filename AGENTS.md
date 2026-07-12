# AGENTS.md

## Cursor Cloud specific instructions

Single product: AFU Agro "Planta Saudável" — Expo (React Native + web) frontend and Express/tRPC/Drizzle backend in one repo. Standard commands (dev, test, lint, check, seed) are in `package.json` scripts and documented in `README.md`.

### Services

| Service | How to run | Port |
|---------|-----------|------|
| MySQL 8 | `sudo service mysql start` (see caveat below) | 3306 |
| API (Express + tRPC) | `npm run dev:server` | 3000 |
| Web (Expo/Metro) | `npm run dev:metro` | 8081 |

`npm run dev` starts API + web together.

### Non-obvious caveats

- **Docker is NOT available in this VM.** MySQL 8 is installed directly via apt instead. `npm run db:up` / `db:down` / `db:reset` (docker compose) will NOT work here. Start the DB with `sudo service mysql start` (it is not auto-started on boot). The database `afu_mobile` and user `afu`/`afu_local_dev` already exist, matching `DATABASE_URL` in `.env.example`; root password is `root`.
- `.env` at the repo root is required by the API and drizzle-kit but is gitignored. If missing, `cp .env.example .env` works as-is (defaults match the local MySQL). Set a real `JWT_SECRET` value (any long random string).
- After changing `drizzle/schema.ts`, run `npm run db:push`. Seeds (`npm run seed`, `seed:marketplace`, `seed:comprador`) are idempotent.
- Demo accounts (after seeding): `demo@afuagro.com.br` / `Demo@1234` (producer) and `comprador@afuagro.com.br` / `Demo@1234` (marketplace buyer). The login screen also has "Entrar com Demo Produtor/Comprador" quick-access buttons.
- tRPC endpoints use superjson: manual POSTs must wrap the input as `{"json": {...}}`, e.g. `curl -X POST localhost:3000/api/trpc/auth.login -H 'Content-Type: application/json' -d '{"json":{"email":"...","password":"..."}}'`.
- Pre-existing failures on `main` (not environment issues): `npm run check` reports 2 TS errors (`app/_layout.tsx`, `app/auth/welcome.tsx`); `npm run lint` reports ~64 errors (mostly `react/no-unescaped-entities`); 2 vitest suites (`tests/auth-flow.test.ts`, `tests/resend-email.test.ts`) fail on an `expo-modules-core` mocking issue. The remaining 220 tests pass.
- Optional external services (Forge LLM for AI diagnosis, SendGrid, Manus OAuth, Expo push) are not configured; the app degrades gracefully without them. Weather uses the public Open-Meteo API (no key).
