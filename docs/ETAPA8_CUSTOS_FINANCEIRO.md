# Etapa 8 — Custos, Máquinas e Financeiro (plano auxiliar)

**Branch:** `cursor/etapa7-estoque-inteligente-fd64`  
**Plano:** upload `AFU Agro — Plano Auxiliar das Etapa.md`

## Progresso

| Passo | Nome | Status |
|-------|------|--------|
| 1 | Centros de custo | **concluído** |
| 2 | Cadastro financeiro | **concluído** |
| 3 | Máquinas | **concluído** |
| 4 | Equipes | **concluído** |
| 5 | Indicadores | **concluído** |
| 6 | Dashboard financeiro | **concluído** |

## Conclusão da Etapa 8

- [x] Indicadores consistentes (cálculo puro + API)
- [x] Custos com centros (sem remover dados)
- [x] Dupla contabilização evitada (custo operacional × lançamento tipo custo)
- [x] Dashboard reflete orçamento + lançamentos reais


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

## Passo 3 — entregue

- Tipo `caminhao` (mantém tipos existentes)
- Campos `combustivelLitros`, `ultimaManutencaoAt`
- Tabela `maquina_eventos` (horímetro/combustível/manutenção/disponibilidade)
- APIs novas sem remover CRUD: `registrarHorimetro`, `registrarCombustivel`, `registrarManutencao`, `setDisponibilidade`, `eventos`
- Apply `npm run db:maquinas-controle:apply` (0027)
- Testes `tests/maquinas-passo3-controle.test.ts`

## Passo 4 — entregue

- Reusa `organization_memberships` via `expansao.equipe.list` (papéis do plano)
- Tabela `tarefa_alocacoes` (N:N tarefa↔membro) sem remover `responsavelUserId`
- API `tarefas.alocacoes.list/upsert/remove`
- Apply `npm run db:equipe:apply` (0028)
- Testes `tests/equipe-passo4.test.ts`

## Passo 5 — entregue

- `calcularIndicadores` + API `expansao.indicadores` (custo/ha, safra, cultura, operação, lucro, margem, ROI)
- Evita dupla contagem custos_operacao × lançamentos tipo custo
- UI no painel de métricas (sem remover `metricas`)
- Testes `tests/indicadores-passo5.test.ts`
- **Produtividade:** `culturas.producaoReal` (colheita) → kg/ha no cultivo e na propriedade (`produtividadeFonte: real|estimada`); apply `npm run db:producao-real:apply`

## Passo 6 — entregue

- API `expansao.financeiro.dashboard` (planejado/executado/receita/despesas/custos/resultado + séries)
- UI no painel de custos
- Testes `tests/financeiro-passo6-dashboard.test.ts`
