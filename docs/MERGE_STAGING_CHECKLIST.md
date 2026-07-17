# Merge + Staging Checklist — PR #8 (expansão 31–46)

**Branch:** `cursor/cloud-agent-1783868046560-i7f1q`  
**PR:** https://github.com/ivansobierai-cyber/afu-mobile-v2/pull/8  
**Base:** `main`  
**Último commit de referência:** `93f0eec` (+ follow-ups se houver)  
**Merge em main:** `83383e8` (PR #8)

Escopo: MVP etapas 1–30 (infra) + expansão banco 31–46 + fixes de review (migrations, seeds, auth NOC/piloto, banners).

---

## Smoke staging (2026-07-17)

API: `https://afu-mobile-v2-production.up.railway.app` · Web: `https://afu-mobile-web.vercel.app`

| Check | Resultado |
|-------|-----------|
| `GET /api/health` | ✅ 200 `{"ok":true}` |
| Web Vercel | ✅ 200 |
| Login `demo@afuagro.com.br` | ✅ JWT accessToken |
| `noc.painel` sem token | ✅ 401 UNAUTHORIZED |
| `piloto.participantes.create` sem token | ✅ 401 UNAUTHORIZED |
| `noc.painel` com token | ✅ painel (produtores/props ok) |
| Marketplace stats | ✅ 9 produtos / 2 pedidos |
| Expansão 30–46 (culturas, zonas, lab, geo, IoT, NOC, arch) | ❌ **contagens = 0** — falta `seed:banco-expansao` |

### Ação pendente (Railway)

Sem CLI Railway neste ambiente. No dashboard ou CLI local:

```bash
railway run npm run db:migrate
railway run npm run seed:banco-expansao
# se demo/marketplace faltarem:
railway run npm run seed
railway run npm run seed:marketplace
railway run npm run seed:comprador
```

Ou setar `SEED_ON_START=1`, redeploy uma vez, depois voltar para `0`.

Revalidar depois:

```bash
curl -sS "$API/api/trpc/bancoAgronomico.stats" | jq
# totalCulturas≥17, totalCamadasGeo≥6, totalNocAlertas≥8, …
```

---

## A. Pré-merge (GitHub)

- [x] CI verde em `CI / validate` (`npm run check` + `build:web:preview` + `test:ci`)
- [x] Preview Vercel ok (web) — sem erro de bundle
- [x] Review humana rápida: sem secrets no diff; migrations `0008`–`0012` presentes
- [x] Confirmar que **não** há conflitos com `main`
- [x] Merge concluído (`83383e8`)

### O que entra no merge (resumo)

| Área | Entrega |
|------|---------|
| Schema | `camadas_geo`, `noc_alertas`, `arquitetura_componentes`, lab/economia, zonas/solos, unique economia |
| Seeds | `seed:banco-expansao` (+ start API com `SEED_ON_START`) |
| API | `bancoAgronomico.*` live; `noc.*` e `piloto.*` autenticados |
| UI | Telas Mais 31–46 live + banners de stack |
| Docs | `drizzle/README.md`, `STAGING.md`, este checklist |

### Fora de escopo / não bloquear merge

- Etapa **29** continua `partial` (piloto de campo real)
- Etapas **1–6** permanecem docs de negócio
- Suites Vitest conhecidas: `auth-flow` / `resend-email` (mock expo) — pré-existentes

---

## B. Pós-merge — API staging (Railway)

URLs atuais (confirmar no dashboard):

- API: `https://afu-mobile-v2-production.up.railway.app`
- Health: `GET /api/health`

### B1. Deploy

- [ ] Merge em `main` dispara/atualiza serviço Docker Railway (ou `railway up`)
- [ ] Variáveis mínimas:

| Variável | Notas |
|----------|--------|
| `DATABASE_URL` | Reference `${{MySQL.MYSQL_URL}}` — **nunca** localhost |
| `JWT_SECRET` | Longo, estável entre deploys |
| `NODE_ENV` | `production` |
| `SEED_ON_START` | `1` só neste deploy de expansão; depois `0` |

- [ ] Logs mostram: `Running database migrations...` (drizzle até `0012_*`)
- [ ] Se `SEED_ON_START=1`: seeds demo + `seed:banco-expansao` no log
- [ ] `curl -sS https://SEU-DOMINIO/api/health` → **200** (não 503)

### B2. Seeds manuais (se `SEED_ON_START=0`)

```bash
railway run npm run db:migrate
railway run npm run seed
railway run npm run seed:marketplace
railway run npm run seed:comprador
railway run npm run seed:banco-expansao
```

Ordem importa: `seed` antes de `seed:geo-iot` / marketplace (precisa propriedade + usuário demo).

### B3. Verificação rápida de dados (MySQL Console / railway)

```sql
SELECT COUNT(*) AS culturas FROM culturas_catalogo;          -- ≥ 17
SELECT COUNT(*) AS zonas FROM zonas_climaticas;              -- ≥ 9
SELECT COUNT(*) AS lab FROM lab_modulos;                     -- ≥ 7
SELECT COUNT(*) AS camadas FROM camadas_geo;                 -- ≥ 6
SELECT COUNT(*) AS sensores FROM sensores;                   -- ≥ 6
SELECT COUNT(*) AS produtos FROM produtos_marketplace;       -- ≥ 8
SELECT COUNT(*) AS noc FROM noc_alertas;                     -- ≥ 8
SELECT COUNT(*) AS arch FROM arquitetura_componentes;        -- ≥ 12
SHOW INDEX FROM economia_cultura WHERE Key_name LIKE '%culturaCatalogoId%';
```

---

## C. Smoke test funcional (staging)

Login: `demo@afuagro.com.br` / `Demo@1234`  
Web: https://afu-mobile-web.vercel.app (após deploy de `main`)

### Auth / shell

- [ ] Login demo produtor
- [ ] Dashboard carrega
- [ ] Tab **Mais** abre

### Expansão (autenticado)

| # | Rota | Expectativa |
|---|------|-------------|
| 31–34 | `/mais/culturas-iniciais`, `seed-culturas`, `seed-tecnico`, `banco-fitossanitario` | Catálogo / stats live |
| 35–38 | `/mais/geoclima`, `afu-solos`, `genoma-vegetal`, `calendario-agricola` | Listas seed |
| 39–41 | `/mais/laboratorio-digital`, `economia-agricola`, `ia-agronomo` | Módulos + simulador com seletor |
| 42–44 | `/mais/geointeligencia`, `iot-automacao`, `marketplace-agricola` | Camadas / sensores / catálogo |
| 45–46 | `/mais/noc-agricola`, `arquitetura-final` | Painel NOC **requer login**; tickets → suporte |

### Auth API (regressão P1)

- [ ] Sem token: `bancoAgronomico.noc.painel` → **UNAUTHORIZED**
- [ ] Sem token: `piloto.participantes.create` → **UNAUTHORIZED**
- [ ] Com token demo: NOC e Testes de Campo funcionam

### Marketplace

- [ ] Login comprador `comprador@afuagro.com.br` / `Demo@1234`
- [ ] Listar produtos / fluxo pedido básico (se já existia em staging)

---

## D. Web + mobile staging

- [ ] Vercel `afu-mobile-web` rebuild a partir de `main`
- [ ] (Opcional) `npm run eas:android:preview` se quiser APK com o mesmo backend
- [ ] Desligar `SEED_ON_START` no Railway após smoke OK

---

## E. Rollback rápido

1. Railway → redeploy do commit anterior de `main`
2. Migrations Drizzle **não** fazem down automático; unique `0012` é aditiva e segura
3. Seeds são idempotentes — reexecutar não apaga dados de produtores reais (cuidado só com ambiente que misturou demo e real)

---

## F. Depois do staging verde

1. Comunicar: expansão 31–46 em staging
2. Backlog: **etapa 29** piloto real; aprofundar GEO/IoT/NOC além do demo
3. Manter `SEED_ON_START=0` em qualquer ambiente com dados reais

Guia operacional contínuo: [STAGING.md](./STAGING.md) · migrations: [../drizzle/README.md](../drizzle/README.md)
