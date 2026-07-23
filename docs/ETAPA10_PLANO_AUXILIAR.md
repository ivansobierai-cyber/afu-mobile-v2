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

## Passo 5 — Performance (smoke local) ✅

`npm run smoke:plano-auxiliar` mede tempos de estoque CMP + produtividade no ambiente local (evidência `docs/evidencias/smoke-plano-auxiliar-latest.json`).

## Passo 6 — Deploy / homologação ✅ (local + preview)

- CI `validate` verde nesta branch
- Preview Vercel dos projetos afetados
- Smoke API+UI local das entregas finais (custo médio + produtividade)
- Deploy Railway/produção: aguarda merge em `main` (checklist em `ETAPA10_SMOKE_HOMOLOGACAO.md`)

## Passo 7 — Monitoramento (baseline) ✅

Auditoria de movimentos/atividades e logs de API já existentes; rollback rehearsal em `tests/etapa10-rollback-rehearsal.test.ts`. Backup/alertas de infra ficam no runbook de produção.

## Critérios

| Critério | Status |
|----------|--------|
| Testes unitários/cálculos | ✅ |
| Integração API/RBAC/multitenant | ✅ |
| Fluxo E2E operacional (+ CMP + produtividade) | ✅ |
| Sem remoção de funções legadas | ✅ |
| Smoke local custo médio + produtividade | ✅ |

## Pendências conhecidas (não bloqueantes do aceite local)

- ~~Valor monetário do estoque~~ **resolvido** — `custoMedio`/`custoUnitario` + `npm run db:estoque-custo:apply`
- ~~Produtividade (kg/ha)~~ **resolvido** — `producaoReal` no cultivo + agregação nos indicadores (`npm run db:producao-real:apply`)
- ~~Smoke local das entregas finais~~ **resolvido** — `npm run smoke:plano-auxiliar` + UI (`docs/evidencias/smoke-plano-auxiliar/`)
- ~~Deploy produção Railway~~ **resolvido** — PR #20 merged (`557921f`); smoke prod **AVANÇAR** (`docs/MERGE_PR20_RAILWAY.md`)
