# Etapa 2 — Painel da propriedade (correção em andamento)

**Status:** etapas 1–9 feitas · Etapa 10 aceite automatizado pronto · falta smoke preview + merge  
**Branch:** `cursor/security-multitenant-audit-fd64`  
**PR:** #12

---

## Regra central

**Não apresentar “Modo histórico”** enquanto tarefas, cultivos, ocorrências, alertas e métricas ainda misturarem ciclos.  

A UI só mostra **“Modo histórico”** quando `overview.completeness.status === "complete"` **e** a safra tem `status` `encerrada`/`arquivada`.  
Caso contrário, usa **“Filtro financeiro por período”** / filtro parcial.

---

## Progresso do plano de correção (10 etapas)

| # | Etapa | Status |
|---|--------|--------|
| 1 | Inconsistências imediatas | **Feito** |
| 2 | Entidade `safras` + migration/backfill | **Feito** |
| 3 | PropertyWorkspaceContext + URL `?tab=&safraId=` | **Feito** |
| 4 | Overview/painéis filtrados por `safraId` | **Feito** |
| 5 | Modo histórico seguro (close/reopen + audit) | **Feito** — transitions bloqueadas; homologação preview na Etapa 10 |
| 6 | `+ Registrar` contextual | **Feito** — abre formulários com propriedade+safra; talhão preserva returnTab/safraId |
| 7 | RBAC + arquivamento soft | **Feito** — listArchived/restore UI, exclusão tipando nome, exportResumo auditado |
| 8 | Navegação/estado de retorno | **Feito** — edit/cultivo/talhão preservam `tab` + `safraId` |
| 9 | Loading/erro/vazio/offline/parcial | **Feito** — ScreenState `partial`, banner offline, UI status helper |
| 10 | Testes/evidências/CI/entrega | **Feito** (local) — aceite + smoke AVANÇAR; preview Vercel precisa seed na API prod |

Ver: `docs/ETAPA10_PROPRIEDADES_ACEITE.md` · `docs/ETAPA10_SMOKE_HOMOLOGACAO.md`.

---

## Etapa 8 — Navegação / retorno

Deep links canônicos:

- Editar: `/(tabs)/propriedades?editId=&returnTo=propriedade&returnTab=&safraId=`
- Cultivo: `/cultivos/:id?propriedadeId=&returnTab=cultivos&safraId=`
- Talhão: já via `buildTerrenosManageHref`

Após salvar/voltar, `buildPropertyReturnHref` restaura o painel.

## Etapa 9 — Estados de UI

- `ScreenState` inclui `partial`
- Painel mostra chip **Offline** + pendentes da fila
- `resolvePanelQueryUiStatus` padroniza prioridade offline > loading > error > empty

## Etapa 6 — `+ Registrar` contextual

O menu `+ Registrar` **abre o formulário**, não só a lista/aba:

| Ação | Destino |
|------|---------|
| Nova tarefa | Aba Operações + modal de criação (`safraId` pré-preenchido) |
| Nova ocorrência | Mais → Monitoramento + foco no formulário |
| Novo cultivo | Aba Cultivos + modal no painel (`propriedadeId` + `safraId`) |
| Novo talhão | `/propriedades/terrenos?…&openCreate=1&returnTab=talhoes&safraId=` |

Bloqueado quando `canRegister=false` (safra histórica / sem permissão).  
Após salvar, invalida listas + `expansao.overview`.

Helpers: `lib/propriedades/registrar-flow.ts`.


```text
property.archive   — arquivar/restaurar propriedade
property.delete    — exclusão definitiva (confirmNome)
safra.close        — encerrar ciclo
safra.reopen       — reabrir com auditoria
```

Auditoria (`audit_logs`): `safra.close`, `safra.reopen`, `property.archive`, `property.restore`, `property.delete`, `property.export`.

## Etapa 7 — Arquivo / exclusão / export

- `propriedades.listArchived` + aba **Arquivadas** com restaurar
- Exclusão definitiva exige digitar o nome (`ConfirmNameModal` + `confirmNome`)
- `propriedades.exportResumo` grava `property.export` em `audit_logs`

---

## Migrações

```bash
npm run db:safras:apply
npm run db:safras:backfill
npm run db:archive:apply
```

---

## Testes

```bash
npm run test:propriedades:etapa2
# ou:
npx vitest run tests/propriedades-etapa2-aceitacao.test.ts tests/overview-counts.test.ts tests/property-workspace.test.ts tests/safras-entity.test.ts tests/org-roles.test.ts tests/registrar-flow.test.ts
```

Evidência: `docs/evidencias/propriedades-etapa2-aceitacao-latest.json`
