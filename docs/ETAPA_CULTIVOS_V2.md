# Cultivos V2 — Workspace Operacional

## Objetivo

Transformar o detalhe do cultivo em centro operacional (Propriedade → Safra →
Talhão → Cultivo → … → Resultado) **sem remover** CRUD, estoque, financeiro ou
admin existentes.

## Entregas por etapa

| Etapa | Status | Entrega principal |
|-------|--------|-------------------|
| 1 Domínio | OK | `cultivo_fase_eventos`, talhão obrigatório no create, backfill |
| 2 Workspace | OK | Header + abas em `app/cultivos/[id].tsx` |
| 3 Dashboard | OK | `coreData.cultivos.dashboard` + cards |
| 4 Timeline | OK | `coreData.cultivos.timeline` + aba Histórico |
| 5 Monitoramento | OK | filtro `culturaId`, abas Monitoramento/Diagnósticos |
| 6 Mapa | OK | `coreData.cultivos.mapa` + PropertyMap |
| 7 IA | OK | `coreData.cultivos.iaResumo` (heurístico explicável) |
| 8 Operações | OK | painel com `culturaId` fixo |
| 9 Indicadores | OK | `coreData.cultivos.indicadores` |
| 10 Homologação | OK | E2E `tests/cultivos-v2-workspace.test.ts` |

## APIs novas (tRPC)

- `coreData.cultivos.faseEventos`
- `coreData.cultivos.dashboard`
- `coreData.cultivos.timeline`
- `coreData.cultivos.monitoramento`
- `coreData.cultivos.diagnosticos`
- `coreData.cultivos.mapa`
- `coreData.cultivos.iaResumo`
- `coreData.cultivos.indicadores`

## Migração

```bash
npm run db:cultivo-fase:apply
npm run db:cultivos:backfill
```

## Testes

```bash
npx vitest run tests/cultivos-dominio-v2.test.ts \
  tests/cultivo-workspace.test.ts \
  tests/cultivos-dashboard-v2.test.ts \
  tests/cultivos-timeline-v2.test.ts \
  tests/cultivos-monitoramento-v2.test.ts \
  tests/cultivos-mapa-v2.test.ts \
  tests/cultivos-ia-ops-indicadores-v2.test.ts \
  tests/cultivos-v2-workspace.test.ts
```

## Checklist de aceite

- [x] Workspace com abas sem perda do detalhe fenológico anterior
- [x] Nenhum cultivo novo sem talhão (API)
- [x] Histórico de fases preservado
- [x] Fluxo integrado dashboard → timeline → ops → indicadores
- [x] Isolamento multitenant nas procedures novas
- [x] Código legado (admin culturasPragas, estoque, financeiro) intacto
