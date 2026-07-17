# Staging — API + APK fora da rede local

Checklist de merge + smoke da expansão 31–46: **[MERGE_STAGING_CHECKLIST.md](./MERGE_STAGING_CHECKLIST.md)**.

## Status atual

- **Web staging (Vercel):** https://afu-mobile-web.vercel.app — build `npm run build:web:preview` (API Railway + login demo)
- **APK staging:** profile `preview` no EAS → `https://afu-mobile-v2-production.up.railway.app`
- **API staging:** `GET /api/health` em `https://afu-mobile-v2-production.up.railway.app/api/health`

Se `/api/health` retornar 503, a API ainda não está no ar — siga o deploy abaixo.

## Web (Vercel)

O deploy web usa `vercel.json` na raiz:

| Campo | Valor |
|-------|--------|
| `installCommand` | `npm ci` |
| `buildCommand` | `npm run build:web:preview && npm run prepare:web-dist` |
| `outputDirectory` | `dist` |

Projeto canônico: **afu-mobile-web** → https://afu-mobile-web.vercel.app

Variáveis embutidas no build preview: `EXPO_PUBLIC_API_BASE_URL` (Railway staging) e `EXPO_PUBLIC_SHOW_DEMO_LOGIN=1`.

Deploy manual (opcional):

```bash
npm run deploy:web
```

O CI em `.github/workflows/ci.yml` roda `npm run check` e o build web em cada PR/push em `main`, evitando regressões de typecheck/bundle (ex.: declaração duplicada em `app/_layout.tsx`).

## 1. Subir a API (Railway recomendado)

1. Crie um projeto em [Railway](https://railway.app)
2. Adicione **MySQL** ao projeto e copie a `DATABASE_URL`
3. Adicione um serviço **Docker** apontando para este repositório (ou `railway up` com o `Dockerfile` na raiz)
4. Variáveis de ambiente no serviço da API:

| Variável | Valor |
|----------|--------|
| `DATABASE_URL` | **Reference:** `DATABASE_URL=${{MySQL.MYSQL_URL}}` (troque `MySQL` pelo nome do seu serviço de banco) |
| `JWT_SECRET` | string longa aleatória |
| `VITE_APP_ID` | `afu-mobile` (opcional, recomendado) |
| `NODE_ENV` | `production` |
| `SEED_ON_START` | `1` (só no primeiro deploy) |

5. Gere o domínio público do Railway e teste: `https://SEU-DOMINIO.up.railway.app/api/health`
6. (Opcional) Aponte `api-staging.afuagro.com.br` como CNAME para esse domínio

### Seeds manuais (se não usou `SEED_ON_START`)

```bash
railway run npm run seed
railway run npm run seed:marketplace
railway run npm run seed:comprador
railway run npm run seed:banco-expansao   # etapas 30–46 (idempotente)
```

Contas demo: `demo@afuagro.com.br` e `comprador@afuagro.com.br` — senha `Demo@1234`.

> Com `SEED_ON_START=1`, o `scripts/start-api-production.sh` já roda migrate + seeds demo + `seed:banco-expansao`. Desligue depois do 1º deploy.

## 2. Gerar APK staging

```bash
npm run eas:android:preview
```

O profile `preview` em `eas.json` usa HTTPS (sem cleartext) e `EXPO_PUBLIC_SHOW_DEMO_LOGIN=1`.

## 3. Testar no celular

1. Instale o APK pelo link do EAS
2. Use **4G ou Wi‑Fi qualquer** (não precisa estar na mesma rede do PC)
3. Login demo → marketplace → pedido

## Profiles EAS

| Profile | API | Uso |
|---------|-----|-----|
| `apk` | `http://192.168.1.5:3000` | LAN / dev em casa |
| `preview` | `https://afu-mobile-v2-production.up.railway.app` | Testadores externos (4G) |
| `production` | `https://api.afuagro.com.br` | Loja / produção (API ainda não deployada) |

> Domínio customizado `api-staging.afuagro.com.br`: configurar CNAME no DNS apontando para o domínio Railway quando quiser URL de marca no APK.

## Erros comuns (Railway)

| Erro | Causa | Correção |
|------|--------|----------|
| `ER_TABLE_EXISTS_ERROR` | Migration duplicada / deploy parcial | Redeploy após atualizar o repo; ou no MySQL Console: `SHOW TABLES;` e confira se `push_tokens` existe |
| `ECONNREFUSED 127.0.0.1:3306` | URL aponta para localhost | Apague e recrie com reference `MYSQL_URL` |
