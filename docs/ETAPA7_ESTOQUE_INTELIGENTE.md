# Etapa 7 — Estoque Agrícola Inteligente (plano auxiliar)

**Branch:** `cursor/etapa7-estoque-inteligente-fd64`  
**Plano:** upload `AFU Agro — Plano Auxiliar das Etapa.md` (Etapas 7, 8, 10)

## Progresso

| Passo | Nome | Status |
|-------|------|--------|
| 1 | Estrutura do banco | **concluído** |
| 2 | Cadastro de insumos | pendente |
| 3 | Movimentações (saldo só via movimentos) | pendente |
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
