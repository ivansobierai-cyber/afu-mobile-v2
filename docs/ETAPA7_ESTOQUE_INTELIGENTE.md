# Etapa 7 — Estoque Agrícola Inteligente (plano auxiliar)

**Branch:** `cursor/etapa7-estoque-inteligente-fd64`  
**Plano:** upload `AFU Agro — Plano Auxiliar das Etapa.md` (Etapas 7, 8, 10)

## Progresso

| Passo | Nome | Status |
|-------|------|--------|
| 1 | Estrutura do banco | **concluído** |
| 2 | Cadastro de insumos | **concluído** |
| 3 | Movimentações (saldo só via movimentos) | **concluído** |
| 4 | Integração com operações (reserva→consumo) | pendente |
| 5 | Alertas | pendente |
| 6 | Dashboard | pendente |

## Passo 1 — entregue

- Tabelas: `estoque_depositos`, `estoque_lotes`, `estoque_reservas`
- Extensão: `estoque_itens` (categorias, fabricante, observações, depositoId, createdByUserId)
- Extensão: `estoque_movimentos` (organizationId, propriedadeId, loteId, depositoId, transferencia, updatedAt)
- Apply idempotente `scripts/apply-0024-estoque-inteligente.ts` + boot Railway
- Listagem de itens filtrada por `organizationId` + `propriedadeId`
- `createEstoqueItem` exige `organizationId` via `requireOrgId`

## Critérios de aceite Passo 1

- [x] Nenhum item sem organização (create + requireOrgId)
- [x] Nenhum item de outra propriedade na listagem do tenant
- [x] Testes `tests/estoque-passo1-estrutura.test.ts`

## Passo 2 — entregue

- UI `PropriedadeEstoquePanel`: categorias do plano, unidade padrão, mínimo, fabricante, observações
- API `createItem`: unidade obrigatória no servidor (default `kg`; rejeita vazia)
- Testes `tests/estoque-passo2-cadastro.test.ts`

## Critérios de aceite Passo 2

- [x] Cadastro das categorias agrícolas do plano
- [x] Campos mínimos (nome, categoria, unidade, mínimo, fabricante, observações)
- [x] Todo item com unidade padrão

## Passo 3 — entregue

- Saldo reconstruído pelos movimentos (`calcularSaldoPorMovimentos` / `registrarMovimentoEstoque`)
- Tipos: entrada, saída, reserva, consumo, ajuste, perda, transferência
- API `estoque.historico` + auditoria (`createdByUserId`, org/prop) + feed `atividade_propriedade`
- Bloqueio de saldo insuficiente no servidor
- Testes `tests/estoque-passo3-movimentos.test.ts`

## Critérios de aceite Passo 3

- [x] Histórico completo
- [x] Auditoria automática
- [x] Saldo nunca alterado fora de movimentos
