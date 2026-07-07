# Staging — API + APK fora da rede local

## Status atual

- **APK staging:** profile `preview` no EAS → `https://api-staging.afuagro.com.br`
- **API staging:** deve responder em `GET /api/health` com `{ "ok": true }`

Se `/api/health` retornar 503, a API ainda não está no ar — siga o deploy abaixo.

## 1. Subir a API (Railway recomendado)

1. Crie um projeto em [Railway](https://railway.app)
2. Adicione **MySQL** ao projeto e copie a `DATABASE_URL`
3. Adicione um serviço **Docker** apontando para este repositório (ou `railway up` com o `Dockerfile` na raiz)
4. Variáveis de ambiente no serviço da API:

| Variável | Valor |
|----------|--------|
| `DATABASE_URL` | **Reference:** `DATABASE_URL=${{MySQL.MYSQL_URL}}` (troque `MySQL` pelo nome do seu serviço de banco) |
| `JWT_SECRET` | string longa aleatória |
| `NODE_ENV` | `production` |
| `SEED_ON_START` | `1` (só no primeiro deploy) |

5. Gere o domínio público do Railway e teste: `https://SEU-DOMINIO.up.railway.app/api/health`
6. (Opcional) Aponte `api-staging.afuagro.com.br` como CNAME para esse domínio

### Seeds manuais (se não usou `SEED_ON_START`)

```bash
railway run npm run seed
railway run npm run seed:marketplace
railway run npm run seed:comprador
```

Contas demo: `demo@afuagro.com.br` e `comprador@afuagro.com.br` — senha `Demo@1234`.

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
| `preview` | `https://api-staging.afuagro.com.br` | Testadores externos |
| `production` | `https://api.afuagro.com.br` | Loja / produção |

## Erros comuns (Railway)

| Erro | Causa | Correção |
|------|--------|----------|
| `ER_TABLE_EXISTS_ERROR` | Migration duplicada / deploy parcial | Redeploy após atualizar o repo; ou no MySQL Console: `SHOW TABLES;` e confira se `push_tokens` existe |
| `ECONNREFUSED 127.0.0.1:3306` | URL aponta para localhost | Apague e recrie com reference `MYSQL_URL` |
