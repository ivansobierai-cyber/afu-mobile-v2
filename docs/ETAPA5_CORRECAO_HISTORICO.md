# Etapa 5 — Correção modo histórico (plano auxiliar)

**Branch:** `cursor/security-multitenant-audit-fd64` · **PR:** #12

## Bloqueadores resolvidos nesta entrega

| Item | Status |
|------|--------|
| Transitions de tarefa em safra encerrada (API) | **Feito** — `requireWritableSafraId` + `SAFRA_READ_ONLY` + conflito offline |
| Empty state “Nova tarefa” / botões de transição em readOnly | **Feito** |
| Close/reopen transacionais + próxima corrente | **Feito** — `nextDefaultSafraId` / `allowNoDefault` |
| Leitor sem safra (sem write-on-read no cliente) | **Feito** — `safras.list` repara no servidor |
| CI com MySQL + `DATABASE_URL` | **Feito** — workflow com service MySQL 8 |

## Critérios ainda abertos (próximos)

- ~~Formulários completos do `+ Registrar` (Etapa 6)~~ — **feito**
- ~~Exportação auditada + exclusão com digitação do nome na UI + lista de arquivadas (Etapa 7)~~ — **núcleo feito**
- ~~Escritas em propriedade arquivada / custos em safra histórica~~ — **feito** (`requireWritablePropertyInTenant` + `requireWritableSafra` em custos/estoque/cultivo/talhão/máquinas)
- E2E multitenant + homologação preview autenticada (residual)
- Export com artefato temporário / rate limit (P2)

## Como validar

```bash
npm run db:safras:apply && npm run db:archive:apply
npx vitest run tests/safras-entity.test.ts
```
