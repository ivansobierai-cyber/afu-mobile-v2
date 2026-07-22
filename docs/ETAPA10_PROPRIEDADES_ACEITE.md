# Etapa 10 — Aceite e evidências (painel propriedades / PR #12)

**Status:** suíte de aceite OK · smoke local AVANÇAR · smoke preview parcial (tenantReady) · **API Railway pendente** · merge pendente  
**Branch:** `cursor/security-multitenant-audit-fd64`  
**PR:** https://github.com/ivansobierai-cyber/afu-mobile-v2/pull/12

Ops pós-merge: `docs/MERGE_PR12_RAILWAY.md`

---

## 1. O que está coberto automaticamente

```bash
npm run test:propriedades:etapa2
# grava docs/evidencias/propriedades-etapa2-aceitacao-latest.json
```

| Área | Arquivos |
|------|----------|
| Regra histórico vs filtro parcial | `property-workspace` + aceite |
| Filtro `safraId` / completeness | `safra-filter` via aceite |
| `+ Registrar` contextual | `registrar-flow` |
| Retorno `tab`+`safraId` | `registrar-flow` Etapa 8 |
| RBAC archive/delete/export | `org-roles` + `overview-counts` |
| ConfirmNome | `confirmNameMatches` |
| Estados UI | `resolvePanelQueryUiStatus` + `screen-state` |
| Safras/archive/export API | `safras-entity` (requer MySQL) |

CI (`validate`) já aplica schema + `db:safras:apply` + `db:archive:apply` e roda `npm run test:ci`.

---

## 2. Smoke autenticado (preview / local)

Login demo: `demo@afuagro.com.br` / `Demo@1234`

1. Abrir propriedade → URL com `?tab=visao&safraId=`
2. Trocar safra encerrada **sem** completeness → banner **Filtro financeiro**, não “Modo histórico”
3. Safra ativa → `+ Registrar` → tarefa abre modal; ocorrência foca form; cultivo abre modal; talhão abre form com retorno
4. Encerrar safra (com filtragem completa) → histórico + `+ Registrar` bloqueado; transitions falham
5. Admin → Exportar → share com texto; audit `property.export` (DB)
6. Arquivar → some da lista Ativas → aba Arquivadas → Restaurar
7. Excluir → digitar nome exato; nome errado falha
8. Editar cadastro → após salvar volta `?tab=&safraId=`
9. Abrir cultivo do painel → Voltar restaura aba Cultivos + safra
10. Offline (DevTools) → chip Offline no cabeçalho

---

## 3. Critérios de merge

- [x] Etapas 1–9 implementadas no branch
- [x] Suíte `test:propriedades:etapa2` verde (unit)
- [x] Smoke autenticado local (ver `docs/ETAPA10_SMOKE_HOMOLOGACAO.md`)
- [x] CI `validate` verde no PR
- [x] Smoke preview lista/detalhe + banner parcial (`tenantReady`) — evidências em `docs/evidencias/smoke-preview-tenantready/`
- [ ] Deploy API deste branch no Railway + safras/archive/seed (`docs/MERGE_PR12_RAILWAY.md`)
- [ ] Re-smoke preview com Registrar/safras/admin completos
- [ ] Aprovação / merge em `main`

---

## 4. Decisão

Rodar `npm run test:propriedades:etapa2` e consultar `docs/evidencias/propriedades-etapa2-aceitacao-latest.json` → `decision: AVANCAR|BLOQUEAR`.
