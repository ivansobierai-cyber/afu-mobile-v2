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
| 1 | Inconsistências imediatas (contagens, mensagens, editar, RBAC UI, arquivar) | **Feito** |
| 2 | Entidade `safras` + migration/backfill | **Feito** |
| 3 | PropertyWorkspaceContext + URL `?tab=&safraId=` | **Feito** |
| 4 | Overview/painéis filtrados por `safraId` | **Feito** (completeness dinâmica) |
| 5 | Modo histórico seguro (somente leitura) | **Parcial** (UI + create bloqueados; reopen/audit pendente) |
| 6 | `+ Registrar` contextual | **Parcial** (contexto safra; formulários dedicados pendentes) |
| 7 | RBAC completo + arquivamento soft | Parcial (UI); backend archive pendente |
| 8 | Navegação/estado de retorno | **Parcial** (`tab` + `safraId` na URL) |
| 9 | Loading/erro/vazio/offline/parcial | Parcial (`completeness` + safra inválida) |
| 10 | Testes/evidências/CI/entrega | Em progresso |

---

## URL canônica

```text
/propriedades/:id?tab=operacoes&safraId=8
```

- `safraId` da URL tem prioridade quando válido no tenant/propriedade.
- Ausência → safra padrão/ativa (persistida na URL).
- ID inválido → erro específico com ação “Ir para safra atual”.

---

## Como aplicar migração de safras

```bash
npm run db:safras:apply
npm run db:safras:backfill   # relatório em docs/evidencias/safras-backfill-latest.json
```

Backfill:
1. Garante safra padrão por propriedade;
2. Relaciona orçamentos por `nomeSafra`;
3. Atribui registros operacionais sem `safraId` à safra padrão (único candidato);
4. Reporta órfãos remanescentes.

---

## Testes

```bash
npx vitest run tests/overview-counts.test.ts tests/property-workspace.test.ts tests/safras-entity.test.ts
npm run test:security:etapa10
```

---

## Decisão

Modo histórico completo depende de `completeness.complete`.  
Etapas 5–10 restantes: reopen/audit, arquivamento soft, fluxos de registro dedicados, CI/evidências.
