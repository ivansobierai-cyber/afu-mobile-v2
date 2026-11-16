# TESTE: integração #58–#62 (não fazer merge)

Branch: `cursor/integration-test-58-62`  
Base: `main` @ `606a44d`  
Data: 2026-11-16  
Objetivo: validar merge conjunto dos PRs abertos **sem** mergear em `main` e **sem** fechar PRs.

## Ordem de merge testada

1. **#61** `cursor/fix-db-email-login-434a` — DB/email/login
2. **#59** `cursor/wp-02-modelo-operacional-0750` — ponte evento→tarefa + `drizzle/0040`
3. **#60** `cursor/playstore-android-release-5ce6` — Play Store / EAS AAB
4. **#62** `cursor/agi-mobile-integration-cd10` — AFU AGI Kotlin + `/api/agi` + `/api/plant_healthy`
5. **#58** `cursor/plano-conclusao-afu-da22` — docs only

## Conflitos

| PR após | Arquivo | Natureza | Resolução |
|---------|---------|----------|-----------|
| #60 | `docs/STAGING.md` | content — secção **Status atual**: #61 traz notas Hostinger/Railway/`ready`+`email`; #60 traz APK via `api.afuagro.tech` + AAB Play | **Ambos preservados** numa lista única (Hostinger DNS caveat + health Railway + rewrite Vercel + AAB Play) |

Restantes merges: limpos (ort / fast-forward).

## Consistência Drizzle

- `0040_evento_tarefa_bridge.sql` (#59) é único; aplicado via `npm run db:schema:prepare` (fora do journal, como 0020/0021/0029–0039).
- Duplicata histórica **pré-existente** `0007_push_tokens` + `0007_talented_deathbird` (documentada em `drizzle/README.md`) — **não** introduzida por estes PRs.
- Gap histórico `0006` — pré-existente.
- **Atenção operacional:** `npm run db:push` = `drizzle-kit generate && migrate`. Num ambiente já migrado, `generate` pode criar SQL espúrio (ex. `0027_rare_junta`) colidindo com `0027_maquinas_controle`. Para cloud/staging usar `db:migrate` + `db:schema:prepare`, não `db:push` cegamente. Artefacto de generate desta sessão foi **descartado** (não commitado).

## Deep links #60 vs #62

| App | applicationId | Schemes |
|-----|---------------|---------|
| Expo AFU Agro (#60) | `br.com.afuagro.app` | `afuagro://` (intentFilters host `*`) |
| AFU AGI (#62) | `tech.afuagro.agi` | `afuagi://` + `afuagro://agi/...` |

Sem conflito de ficheiros `app.config.ts` / `eas.json` vs Manifest AGI. Coexistência no mesmo device: links `afuagro://agi/...` destinam-se ao AGI; outros `afuagro://` ao Expo. Ambos instalados podem pedir desambiguação Android em alguns paths — comportamento intencional documentado em `docs/agi/AFU_AGI_INTEGRATION.md` / `lib/agi-deep-link.ts`.

## Resultados dos testes

### `npm run check` (tsc)

**PASS** (exit 0) — erros pré-existentes em `app/_layout.tsx` / `app/auth/welcome.tsx` deixam de falhar com #60 no stack.

### `npm run test:ci` (Vitest)

| Métrica | Resultado |
|---------|-----------|
| Test files | **103 passed**, 1 skipped (104) |
| Tests | **780 passed**, 4 skipped (784) |
| Exit | **0** |

Suites novas relevantes: `auth-db-email-hardening`, `evento-tarefa-bridge-wp02`, `evento-tarefa-status-wp02`, `playstore-android-config`, `agi-deep-link`, `plant-healthy-gateway`, `safe-image-url` — todas verdes com MySQL local.

### Android AGI Gradle (#62)

| Task | Resultado |
|------|-----------|
| `testDebugUnitTest` | **PASS** — 24 tests, 0 failures (8 suites) |
| `assembleDebug` | **PASS** — APK debug ~23 MB (keystore debug gerado no ambiente) |

Nota ambiente: `ANDROID_HOME` não vinha no VM; SDK instalado sob `~/android-sdk` (API 35). CI AGI usa `/usr/local/lib/android/sdk`.

## Smoke API local

Servidor: `npm run dev:server` @ `:3000`  
DB: MySQL 8 + `npm run db:schema:prepare` + `npm run seed`

| Check | Resultado |
|-------|-----------|
| `GET /api/health` | `ok:true`, `ready:true`, `database.reachable:true` (email SendGrid `ready:false` esperado) |
| `auth.signup` | PASS |
| `auth.login` (demo) | PASS |
| `auth.refresh` | PASS |
| `coreData.propriedades.list` | PASS |
| `coreData.calendario.create` → bridge | PASS — evento `19` → tarefa `legadoEventoId=19`, `origem=calendario_legado` |
| `coreData.tarefas.getByEvento` | PASS |
| `POST /api/agi/auth/login` | PASS |
| `GET /api/agi/context` | PASS (org + propriedade demo) |
| `POST /api/agi/auth/refresh` | PASS |

Logs: `/opt/cursor/artifacts/smoke-test.log`, `npm-test-ci-rerun.log`, `agi-unit-tests.log`, `agi-assemble.log`.

## Bugs encontrados / corrigidos em branches de PR

**Nenhum bug de produto** a exigir patch nas branches `#61/#59/#60/#62/#58`.

Observações (não bloqueantes / não patchadas):

1. `npm run seed` pode ficar com handle aberto após “Seed concluído” (processo não sai) — pré-existente / ambiente; não atribuído a um PR deste lote.
2. `db:push` = generate+migrate é armadilha operacional (acima).
3. Primeiro smoke de `propriedades.list` falhou só por input `null` no curl — não é regressão.

## Recomendação de ordem de merge em `main`

Manter a ordem testada:

1. **#61** primeiro (auth/health/DB readiness — base estável)
2. **#59** (migração 0040 + bridge; depende de schema operacional já em main)
3. **#60** (Play/EAS/legal; conflito docs só com #61 — trivial)
4. **#62** (AGI + gateway; auto-merge limpo sobre o stack)
5. **#58** por último (docs; zero risco de runtime)

**Não fazer merge desta branch de teste.** Usar apenas como evidência; mergear cada PR individualmente na ordem acima.
