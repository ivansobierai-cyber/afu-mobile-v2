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

## Preview Vercel (parcial)

| Item | Resultado |
|------|-----------|
| Login demo no preview | PASS |
| Lista de propriedades | FAIL — conta demo na API Railway sem propriedades seedadas |
| Cadastro via UI (antes do fix) | FAIL — botões do modal no fim do `ScrollView` não respondiam bem no web |

**Fix aplicado:** botões Salvar/Cancelar do modal de propriedade saíram do `ScrollView` (footer fixo), melhorando clique no web.

**Ação ops (produção/Railway):** rodar seed + backfill de org/safras na API apontada pelo preview (`afu-mobile-v2-production`) para o demo ter `Fazenda Santa Clara` (ou equivalente).

---

## CI

PR #12 — job `validate` **SUCCESS** (inclui aceite `test:propriedades:etapa2`).
