# Owner checklist — DB / login / e-mail (produção)

**Deploy canônico do site:** [SITE_AFUAGRO_DEPLOY.md](./SITE_AFUAGRO_DEPLOY.md) (Hostinger SPA + Railway API; `API_UPSTREAM_URL` opcional).

Evidência da auditoria (2026-11-16):

| Host | `/api/health` | Login demo | Signup | Forgot password |
|------|---------------|------------|--------|-----------------|
| `afu-mobile-v2-production.up.railway.app` | OK (`storageReady`) | **PASS** | PASS | PASS (token gerado; e-mail depende SendGrid) |
| `afuagro.tech` / `api.afuagro.tech` (Hostinger) | OK liveness, DB **ausente** | **FAIL** “E-mail ou senha invalidos” (na verdade sem MySQL) | FAIL 500 | FAIL “Banco de dados não disponível” |
| `api.afuagro.com.br` | DNS não resolve | — | — | — |

DNS de `afuagro.tech` e `api.afuagro.tech` aponta para IPs Hostinger; o projeto Vercel tem os domínios verificados, mas o tráfego atual **não** passa pelo rewrite Vercel → Railway.

---

## 1. Hostinger (site canônico) — escolher UMA opção

### Opção A — API local na Hostinger (same-origin)

No painel Node da Hostinger, definir:

| Variável | Valor |
|----------|--------|
| `DATABASE_URL` | URL MySQL alcançável (Railway MySQL público **ou** MySQL Hostinger). Ex.: a mesma do Railway. |
| `JWT_SECRET` | **O mesmo** do Railway (senão tokens/cookies não batem se misturar hosts) |
| `APP_URL` | `https://afuagro.tech` |
| `SENDGRID_API_KEY` | chave SendGrid |
| `SENDGRID_FROM_EMAIL` | remetente verificado, ex. `noreply@afuagro.tech` |
| `NODE_ENV` | `production` |
| `SEED_ON_START` | `0` em produção contínua (só `1` no 1º boot se DB vazio) |

Depois: redeploy / restart do app Node → `GET https://afuagro.tech/api/health` deve mostrar `"ready":true` e `"database":{"configured":true,"reachable":true}`.

Se o DB for novo: aplicar schema (`db:push` / migrate) e `npm run seed` (contas demo).

### Opção B — Web Hostinger → API Railway (recomendado / padrão)

Ver procedimento completo em [SITE_AFUAGRO_DEPLOY.md](./SITE_AFUAGRO_DEPLOY.md).

No build Hostinger:

```bash
HOSTINGER_API_BASE_URL=https://afu-mobile-v2-production.up.railway.app \
EXPO_PUBLIC_SHOW_DEMO_LOGIN=0 \
npm run build:hostinger
```

(`HOSTINGER_SITE_URL` é ignorado para API base — ver `scripts/build-hostinger.mjs`.)

Opcional no painel Node Hostinger: `API_UPSTREAM_URL=https://afu-mobile-v2-production.up.railway.app` para proxy de `/api` → Railway.

CORS na API Railway allowlist `afuagro.tech`. Confirme login demo no browser após o deploy.

### Opção C — Devolver DNS ao Vercel

1. No DNS do domínio, apontar `afuagro.tech` / `www` / `api` para os registros que a Vercel indicar (não A-records Hostinger).
2. Manter `vercel.json` rewrite de `api.afuagro.tech` → Railway.
3. Redeploy `afu-mobile-web`.

---

## 2. Railway (API) — e-mail

Sem `SENDGRID_API_KEY`, recuperação de senha **não envia e-mail**. Após este PR o token **não** volta mais no JSON em produção.

No serviço Railway:

| Variável | Valor |
|----------|--------|
| `SENDGRID_API_KEY` | chave |
| `SENDGRID_FROM_EMAIL` | `noreply@afuagro.tech` (ou domínio verificado) |
| `APP_URL` | `https://afuagro.tech` |

No SendGrid: autenticar domínio `afuagro.tech` (SPF + DKIM). Sem isso, e-mails caem em spam ou são rejeitados.

---

## 3. Vercel (build web)

| Variável | Valor sugerido |
|----------|----------------|
| `EXPO_PUBLIC_API_BASE_URL` | `https://afu-mobile-v2-production.up.railway.app` (seguro) **ou** `https://api.afuagro.tech` **depois** do DNS apontar para Vercel/Railway |
| `EXPO_PUBLIC_SHOW_DEMO_LOGIN` | `0` |

---

## 4. Smoke após correção

```bash
curl -sS https://afuagro.tech/api/health
# ready:true, database.reachable:true, email.ready:true

curl -sS -X POST https://afuagro.tech/api/trpc/auth.login \
  -H 'Content-Type: application/json' \
  -d '{"json":{"email":"demo@afuagro.com.br","password":"Demo@1234"}}'
# success:true

curl -sS -X POST https://afuagro.tech/api/trpc/auth.forgotPassword \
  -H 'Content-Type: application/json' \
  -d '{"json":{"email":"demo@afuagro.com.br"}}'
# success:true e SEM campo "token"; e-mail chega na caixa
```

Contas seed: `demo@afuagro.com.br` / `Demo@1234` e `comprador@afuagro.com.br` / `Demo@1234`.
