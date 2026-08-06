# FASE 2G — Ciclo de estados das operações agrícolas

## Matriz de transições (servidor = autoridade)

| De | Para permitido |
|---|---|
| `planejada` | `liberada`, `bloqueada`, `cancelada` |
| `liberada` | `em_execucao`, `bloqueada`, `cancelada` |
| `em_execucao` | `pausada`, `concluida`, `bloqueada`, `cancelada` |
| `pausada` | `em_execucao`, `bloqueada`, `cancelada` |
| `concluida` | `aprovada`, `reaberta` |
| `reaberta` | `liberada`, `cancelada` |
| `bloqueada` | `cancelada` ou retorno ao `statusBeforeBlocked` persistido |
| `aprovada` | terminal |
| `cancelada` | terminal |

Implementação: `lib/operacoes/operacao-agricola-status.ts` + `server/db-operacoes-transition.ts`.

## RBAC por transição

| Permissão | Transições |
|---|---|
| `operations.read` | consulta operação e histórico |
| `operations.write` | liberar, iniciar, pausar, retomar, concluir, bloquear, cancelar, desbloquear |
| `operations.approve` | `→ aprovada`, `→ reaberta` (revisão) |

Papéis existentes (`lib/security/org-roles.ts`): proprietário/gestor têm `approve`; operador não.

Safra encerrada/arquivada: negação server-side (`SAFRA_READ_ONLY`) independente do papel.

## Concorrência / idempotência

- `statusRevision` em `operacoes_agricolas` — compare-and-set na transação.
- `expectedStatus` / `expectedRevision` opcionais no cliente.
- `clientMutationId` opcional — replay retorna resultado sem duplicar histórico (índice único).

## Auditoria

Tabela `operacoes_agricolas_status_historico` (append-only). Insert do histórico e update do status na mesma transação DB.

## Migration

`drizzle/0038_operacoes_status_ciclo.sql` — expande enum `status`, adiciona `statusRevision` / `statusBeforeBlocked`, cria histórico. Valores 2F preservados sem conversão automática.

## API

- `coreData.operacoes.transitionStatus`
- `coreData.operacoes.listStatusHistorico`

## UI

Detalhe da operação (`OperacaoAgricolaDetailModal`): ações permitidas + linha do tempo. Lista/Kanban 2F com novos estados (sem DnD).
