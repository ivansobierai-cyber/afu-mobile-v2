# Etapa 2 — Painel da propriedade (correção em andamento)

**Status:** correção em andamento (plano `AFU_Agro_Plano_Correcao_Etapa_2_PR12`)  
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
| 5 | Modo histórico seguro (close/reopen + audit) | **Quase** — transitions bloqueadas, close transacional, CI MySQL; falta homologação preview |
| 6 | `+ Registrar` contextual | **Feito** — abre formulários com propriedade+safra; talhão preserva returnTab/safraId |

| 7 | RBAC + arquivamento soft | **Parcial** — archive/restore API ok; falta UI arquivadas + export auditado + digitar nome |
| 8 | Navegação/estado de retorno | **Parcial** (`tab` + `safraId`) |
| 9 | Loading/erro/vazio/offline/parcial | Parcial (empty histórico corrigido) |
| 10 | Testes/evidências/CI/entrega | CI com MySQL; falta E2E + merge |

---

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

Auditoria (`audit_logs`): `safra.close`, `safra.reopen`, `property.archive`, `property.restore`, `property.delete`.

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
npx vitest run tests/overview-counts.test.ts tests/property-workspace.test.ts tests/safras-entity.test.ts tests/org-roles.test.ts tests/registrar-flow.test.ts
```
