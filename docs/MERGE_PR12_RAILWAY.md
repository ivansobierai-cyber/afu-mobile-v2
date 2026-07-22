# Merge + Railway — PR #12 (multi-tenant / painel propriedades)

**Branch:** `cursor/security-multitenant-audit-fd64`  
**PR:** https://github.com/ivansobierai-cyber/afu-mobile-v2/pull/12  
**API staging:** `https://afu-mobile-v2-production.up.railway.app`

O agente de cloud **não tem** token/MCP Railway neste ambiente. Deploy da API é passo humano (ou merge em `main` se o serviço Docker estiver ligado ao repositório).

---

## Pré-merge (já ok)

- [x] CI `validate` verde
- [x] Vercel web preview verde
- [x] Smoke local **AVANÇAR** (`docs/ETAPA10_SMOKE_HOMOLOGACAO.md`)
- [x] Smoke preview + `tenantReady` — lista/detalhe PASS; Registrar/safras bloqueados pela API antiga
- [x] Boot Docker aplica `db:safras:apply` + `db:archive:apply` em `scripts/start-api-production.sh`

---

## B1. Deploy API (escolher um)

### Opção A — merge em `main` (se Railway auto-deploy)

1. Merge do PR #12
2. Aguardar rebuild do serviço Docker
3. Logs devem mostrar:
   - `Running database migrations...`
   - `Applying safras + property archive schema`
   - `Starting server on port...`

### Opção B — redeploy manual da branch

```bash
# no projeto Railway do serviço API
railway up   # ou Redeploy no dashboard apontando para este branch/commit
```

### Variáveis

| Variável | Notas |
|----------|--------|
| `DATABASE_URL` | `${{MySQL.MYSQL_URL}}` — nunca localhost |
| `JWT_SECRET` | estável entre deploys |
| `NODE_ENV` | `production` |
| `SEED_ON_START` | `1` **só** no deploy que precisa re-seed/backfill; depois `0` |

---

## B2. Pós-deploy (se `SEED_ON_START=0`)

```bash
railway run npm run db:migrate
railway run npm run db:safras:apply
railway run npm run db:archive:apply
railway run npm run seed
railway run npm run db:safras:backfill
```

---

## B3. Smoke API nova

```bash
TOKEN=$(curl -sS -X POST 'https://afu-mobile-v2-production.up.railway.app/api/trpc/auth.login?batch=1' \
  -H 'content-type: application/json' \
  -d '{"0":{"json":{"email":"demo@afuagro.com.br","password":"Demo@1234"}}}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['result']['data']['json']['accessToken'])")

# Deve retornar organizations / activeOrganizationId
curl -sS "https://afu-mobile-v2-production.up.railway.app/api/trpc/auth.session?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%7D%7D" \
  -H "Authorization: Bearer $TOKEN" | head -c 800; echo

# Deve existir (não NOT_FOUND)
curl -sS "https://afu-mobile-v2-production.up.railway.app/api/trpc/coreData.expansao.safras.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22propriedadeId%22%3A1%7D%7D%7D" \
  -H "Authorization: Bearer $TOKEN" | head -c 400; echo

curl -sS "https://afu-mobile-v2-production.up.railway.app/api/trpc/coreData.dashboard.stats?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%7D%7D%7D" \
  -H "Authorization: Bearer $TOKEN" | head -c 400; echo
```

---

## B4. Re-smoke web

Preview do PR ou `https://afu-mobile-web.vercel.app` após rebuild:

1. Login Demo → lista Santa Clara / Atra  
2. Detalhe → chip safra real + `+ Registrar` abre tarefa/ocorrência/cultivo/talhão  
3. Admin → Exportar / Arquivar (papel adequado)  
4. Sem banner mentiroso “Modo histórico” se completeness parcial  

---

## Critério de pronto

| Check | Esperado |
|-------|----------|
| `auth.session` | campo `organizations` + `activeOrganizationId` |
| `coreData.expansao.safras.list` | 200 com ≥1 safra demo |
| `coreData.dashboard.stats` | 200 (não NOT_FOUND) |
| Preview Registrar | menu funcional |
| `SEED_ON_START` | voltar para `0` após smoke |
