# Homologação smoke — painel propriedades (Etapa 10)

**Data:** 2026-07-21  
**Ambiente:** local (`http://localhost:8081` + API `:3000` + MySQL nativo)  
**Login:** `demo@afuagro.com.br` / Demo Produtor  
**Propriedade:** Fazenda Santa Clara · Safra 2025/26 (`safraId=1`)  
**Decisão:** **AVANÇAR** (smoke local completo)

---

## Resultado

| # | Item | Resultado |
|---|------|----------|
| 1 | Login → dashboard | PASS |
| 2 | Lista mostra Fazenda Santa Clara | PASS |
| 3 | Painel com chip safra + URL `?safraId=&tab=` | PASS |
| 4 | `+ Registrar` → tarefa/ocorrência/talhão/cultivo; modal tarefa abre e fecha | PASS |
| 5 | Admin → Exportar / Arquivar / Excluir | PASS |
| 6 | Cultivos → detalhe → Voltar preserva contexto | PASS |
| 7 | Modal Nova Propriedade abre e Cancelar funciona | PASS |

Screenshots: `docs/evidencias/smoke-preview/` e `/opt/cursor/artifacts/smoke-etapa10/`.

---

## Plano auxiliar — custo médio + produtividade (2026-07-23)

**Branch:** `cursor/etapa7-estoque-inteligente-fd64`  
**API smoke:** `npm run smoke:plano-auxiliar` → `docs/evidencias/smoke-plano-auxiliar-latest.json`  
**UI:** `localhost:8081` + API local  
**Decisão:** **AVANÇAR**

| # | Item | Resultado |
|---|------|-----------|
| 1 | Login demo → dashboard | PASS |
| 2 | Estoque: item com custo → `Valor R$` no dashboard | PASS |
| 3 | Cultivo → Custos → Registrar colheita real | PASS |
| 4 | Produtividade `/ha (colheita real)` nos indicadores | PASS |
| 5 | API: `valorDisponivel` + `produtividadeFonte=real` | PASS (8/8) |

Screenshots: `docs/evidencias/smoke-plano-auxiliar/`.

### Probe Railway (mesmo dia)

`EXPO_PUBLIC_API_BASE_URL=https://afu-mobile-v2-production.up.railway.app npm run smoke:plano-auxiliar`

| Momento | Resultado |
|---------|-----------|
| Pré-merge | **BLOQUEADO** (`estoque.dashboard` NOT_FOUND) |
| Pós-merge + redeploy (`557921f`) | **AVANÇAR** (read-only e `SMOKE_WRITE=1`) |

Evidência: `docs/evidencias/smoke-plano-auxiliar-railway-probe-latest.json`  
Runbook: `docs/MERGE_PR20_RAILWAY.md`.

### Smoke UI produção web (2026-07-23)

**URL:** https://afu-mobile-web.vercel.app  
**Decisão:** **AVANÇAR**

| # | Item | Resultado |
|---|------|-----------|
| 1 | Login Demo Produtor | PASS |
| 2 | Dashboard com propriedades | PASS |
| 3 | Estoque com `Valor R$` | PASS |
| 4 | Cultivo → Custos → colheita real | PASS |
| 5 | Sem crash/tela em branco | PASS |

Screenshots: `docs/evidencias/smoke-prod-ui/`.  
Release: `docs/RELEASE_PLANO_AUXILIAR_2026-07-23.md`.

---

## Preview Vercel vs API Railway

### Re-smoke pós-deploy Railway (2026-07-22)

**API:** `https://afu-mobile-v2-production.up.railway.app` — multi-tenant **OK**  
**Evidências:** `docs/evidencias/railway-api-post-deploy-latest.json` + `smoke-etapa10-pos-railway-latest.json`  
**Decisão:** **AVANÇAR**

| # | Item | Resultado |
|---|------|-----------|
| 1 | Health / login demo | PASS |
| 2 | Session com `organizations` + `activeOrganizationId` | PASS |
| 3 | `safras.list` → Safra 2026/27 | PASS |
| 4 | `dashboard.stats` / `listArchived` | PASS |
| 5 | UI PR: chip Safra + `+ Registrar` + admin Exportar/Arquivar/Excluir | PASS (smoke `localhost:8081` = branch PR + API Railway) |
| 6 | `afu-mobile-web.vercel.app` (main) | API nova OK; UI sem `+ Registrar` até merge do PR |

`SEED_ON_START=0` no Railway após seed.

### Re-smoke `tenantReady` (2026-07-21, commit `19af667`)

**URL:** `https://afu-mobile-o8asm2ep2-ivansobierai-8642s-projects.vercel.app/?_vercel_share=…`  
**Evidências:** `docs/evidencias/smoke-preview-tenantready/` + `smoke-preview-tenantready-latest.json`  
**Decisão preview:** **AVANÇAR com ressalva de API**

| # | Item | Resultado |
|---|------|-----------|
| 1 | Login Demo Produtor | PASS |
| 2 | Lista Fazenda Santa Clara + Fazenda Atra | PASS (`tenantReady`) |
| 3 | Detalhe + chip Safra + `+ Registrar` visível | PASS |
| 4 | Banner safra = “Filtro financeiro por período” (sem “Modo histórico”) | PASS |
| 5 | Menu `+ Registrar` completo (tarefa/ocorrência/…) | BLOCKED — API sem `expansao.safras.*` |
| 6 | Admin export/arquivar/excluir | PARTIAL — API sem archive/export; menu vazio por papel |
| 7 | `coreData.dashboard.stats` / `startData` | 404 na API Railway antiga |

**Causa histórica do smoke vazio:** o front exigia `session.activeOrganizationId`, mas a API Railway omite `organizations` → queries `enabled: false`.

**Mitigação no cliente (este PR):** `resolveTenantReady` / `isLegacySessionWithoutOrgs` — se a sessão não traz o campo `organizations`, libera listagens para usuário autenticado (modo legado). Confirmado no preview: lista e detalhe carregam.

**Ops para fechar 100% multi-tenant no preview/prod:** ver checklist completo em `docs/MERGE_PR12_RAILWAY.md`.

1. Deploy da API deste branch no Railway (merge em `main` se auto-deploy, ou `railway up`)
2. Boot já roda `db:safras:apply` + `db:archive:apply`; com `SEED_ON_START=1` também seed + `db:safras:backfill`
3. Re-smoke: menu Registrar + safras + archive/export + dashboard.stats

---

## CI

PR #12 — job `validate` **SUCCESS** (inclui aceite `test:propriedades:etapa2`). Vercel `afu-mobile-web` deploy **SUCCESS** em `19af667`.
