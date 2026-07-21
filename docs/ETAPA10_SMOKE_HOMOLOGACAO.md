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

## Preview Vercel vs API Railway

**Causa do smoke vazio no preview:** o front do PR exige `session.activeOrganizationId`, mas a API em `afu-mobile-v2-production.up.railway.app` ainda **não expõe** `organizations.*` (deploy antigo). Queries ficavam `enabled: false`.

**Mitigação no cliente (este PR):** `resolveTenantReady` / `isLegacySessionWithoutOrgs` — se a sessão não traz o campo `organizations`, libera listagens para usuário autenticado (modo legado).

**Ops para fechar 100% no preview multi-tenant:**
1. Deploy da API deste branch no Railway
2. `npm run db:safras:apply && npm run db:archive:apply && npm run seed` no banco de produção (seed agora repara org + propriedades órfãs)

---

## CI

PR #12 — job `validate` **SUCCESS** (inclui aceite `test:propriedades:etapa2`).
