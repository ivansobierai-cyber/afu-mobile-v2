# Release Notes — Plano Auxiliar 7/8/10 + Cultivos V2

**Versão de entrega:** AFU Mobile — ciclo 2026-07-23  
**Merge principal:** PR [#20](https://github.com/ivansobierai-cyber/afu-mobile-v2/pull/20) → `main` (`557921f`)  
**Homologação docs:** PR [#21](https://github.com/ivansobierai-cyber/afu-mobile-v2/pull/21) → `main` (`55bb070`)  
**API:** `https://afu-mobile-v2-production.up.railway.app`  
**Web:** `https://afu-mobile-web.vercel.app`

## Decisão

**AVANÇAR / ENCERRAR** o ciclo do plano auxiliar (Etapas 7, 8, 10) e Cultivos V2 nesta versão.

## O que entrou

### Etapa 7 — Estoque agrícola inteligente
- Cadastro, movimentos, reservas→consumo em operações, alertas, dashboard
- Custo médio ponderado (`custoMedio` / `custoUnitario`) e `valorDisponivel` no dashboard

### Etapa 8 — Custos, máquinas e financeiro
- Centros de custo, lançamentos, máquinas (horímetro/combustível/manutenção)
- Equipes via alocações, indicadores (custo/ha, lucro, margem, ROI)
- Produtividade kg/ha a partir de `producaoReal` (colheita)
- Dashboard financeiro planejado × resultado

### Etapa 10 — Homologação
- Suites unitárias/integração/E2E + smoke local e produção
- Runbook: `docs/MERGE_PR20_RAILWAY.md`

### Cultivos V2 — workspace operacional
- Header + abas (visão geral, histórico, monitoramento, diagnósticos, mapa, IA, operações, custos, arquivos)
- Domínio: talhão/safra, histórico de fases, indicadores por cultivo

## Homologação produção

| Camada | Resultado | Evidência |
|--------|-----------|-----------|
| API smoke write | **AVANÇAR** 8/8 | `docs/evidencias/smoke-plano-auxiliar-railway-probe-latest.json` |
| UI web produção | **AVANÇAR** 5/5 | `docs/evidencias/smoke-prod-ui/` |

Checks UI: login demo, dashboard, estoque com `Valor R$`, cultivo → Custos → colheita real.

## Applies em produção (boot)

Já no `scripts/start-api-production.sh`:

- `db:cultivo-fase:apply`
- `db:estoque-custo:apply`
- `db:producao-real:apply`

## Fora deste ciclo (próximos)

- Cultivos V2 Etapa 10 UX premium (skeletons, a11y, offline fino)
- Produtividade ligada a eventos de colheita/tarefa (além do campo `producaoReal`)
- Relatório PDF de resultado de safra/cultivo

## Como revalidar

```bash
# API (read-only remoto)
EXPO_PUBLIC_API_BASE_URL=https://afu-mobile-v2-production.up.railway.app \
  npm run smoke:plano-auxiliar

# API (write completo)
SMOKE_WRITE=1 EXPO_PUBLIC_API_BASE_URL=https://afu-mobile-v2-production.up.railway.app \
  npm run smoke:plano-auxiliar
```

Web: https://afu-mobile-web.vercel.app — Demo Produtor.
