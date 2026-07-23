# Etapa 8 — Custos, Máquinas e Financeiro (plano auxiliar)

**Branch:** `cursor/etapa7-estoque-inteligente-fd64`  
**Plano:** upload `AFU Agro — Plano Auxiliar das Etapa.md`

## Progresso

| Passo | Nome | Status |
|-------|------|--------|
| 1 | Centros de custo | **concluído** |
| 2 | Cadastro financeiro | **concluído** |
| 3 | Máquinas | pendente |
| 4 | Equipes | pendente |
| 5 | Indicadores | pendente |
| 6 | Dashboard financeiro | pendente |

## Passo 1 — entregue

- Dimensões reutilizadas: propriedade, safra, talhão (`terrenos`), cultura, operação (`tarefas`)
- `custos_operacao`: `terrenoId`, `culturaId`, `createdByUserId`, `updatedAt` + índices
- Apply `npm run db:centros-custo:apply` (0025)
- API `expansao.custos.centros` + `createCusto` com FKs validados no tenant
- Testes `tests/custos-passo1-centros.test.ts`

## Passo 2 — entregue

- Tabela `financeiro_lancamentos` (despesa/receita/custo/investimento)
- Classificação automática `classificarLancamentoFinanceiro`
- API `expansao.financeiro.list/create` + UI no painel de custos
- Apply `npm run db:financeiro:apply` (0026)
- Testes `tests/financeiro-passo2.test.ts`
