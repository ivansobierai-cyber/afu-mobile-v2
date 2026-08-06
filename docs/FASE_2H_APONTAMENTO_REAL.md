# FASE 2H — Apontamento real de execução

## Modelo

| Entidade | Tabela |
|---|---|
| Apontamento | `operacoes_agricolas_apontamentos` |
| Insumos realizados | `operacoes_agricolas_apontamento_insumos` |
| Evidências | `operacoes_agricolas_apontamento_evidencias` |

Relação: **1 operação → N apontamentos**. Planejamento permanece em `operacoes_agricolas` (e tarefa/evento). Apontamento não sobrescreve campos planejados.

`apontamentos_operacao` (legado de **tarefa**) permanece intacto e separado.

## Regra absoluta

Salvar insumo realizado **não** movimenta estoque, **não** reserva saldo e **não** calcula custo.

## Status 2G × apontamento

| Status | Criar | Editar |
|---|---|---|
| `planejada` / `liberada` | não | não |
| `em_execucao` / `pausada` / `reaberta` | sim | sim |
| `concluida` | não | sim (antes da aprovação) |
| `aprovada` / `cancelada` / `bloqueada` | não | não |

## Conclusão protegida

Nova transição `→ concluida` exige pelo menos um apontamento com `inicioReal` válido e `createdByUserId`. Operações já concluídas sem apontamento **não** recebem backfill.

## API (`coreData.operacoes`)

- `listApontamentos` / `getApontamento`
- `createApontamento` / `updateApontamento`
- `addApontamentoEvidencia`
- `planejadoRealizado`

## Concorrência / idempotência

- `revision` no apontamento (compare-and-set)
- `clientMutationId` na criação (replay / CONFLICT se payload divergente)

## Migration

`drizzle/0039_operacoes_apontamentos.sql` — sem backfill.
