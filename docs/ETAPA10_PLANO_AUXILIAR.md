# Etapa 10 — Homologação (Plano Auxiliar Etapas 7/8/10)

**Branch:** `cursor/etapa7-estoque-inteligente-fd64`  
**Data:** 2026-07-23

## Escopo

Homologação das entregas do plano auxiliar **sem remover** dados/funções existentes.

## Passo 1 — Testes unitários ✅

- `calcularIndicadores` / classificação financeira
- `deltaSaldoMovimento` / alertas-engine
- `tenant-access` (permissões)

## Passo 2 — Integração ✅

Suites executadas (69 testes verdes), incluindo:

- multitenant / cross-tenant (`cross-tenant-attack`, `tenant-access`)
- estoque passos 1–6
- custos/centros, financeiro, máquinas, equipe, indicadores, dashboard

## Passo 3 — E2E API ✅

`tests/etapa10-fluxo-plano-auxiliar.test.ts`:

Login (fixture) → propriedade → tarefa com reserva → execução → consumo estoque → custo → receita → máquina/horímetro → indicadores → dashboard.

## Passo 4 — Segurança

Reuso das evidências/suites existentes de isolamento multitenant e RBAC (não reescritas; não removidas). Cross-tenant continua bloqueando leitura/escrita alheia.

## Critérios

| Critério | Status |
|----------|--------|
| Testes unitários/cálculos | ✅ |
| Integração API/RBAC/multitenant | ✅ |
| Fluxo E2E operacional | ✅ |
| Sem remoção de funções legadas | ✅ |

## Pendências conhecidas (não bloqueantes do aceite local)

- ~~Valor monetário do estoque~~ **resolvido** — `custoMedio`/`custoUnitario` + `npm run db:estoque-custo:apply`
- Produtividade (kg/ha) ainda não ligada a colheita real nos indicadores
- Deploy produção / smoke Railway-Vercel fica para o checklist operacional existente em `ETAPA10_SMOKE_HOMOLOGACAO.md`
