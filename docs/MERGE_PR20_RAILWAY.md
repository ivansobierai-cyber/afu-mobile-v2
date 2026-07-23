# Merge + Railway — PR #20 (plano auxiliar + Cultivos V2)

**Branch:** `cursor/etapa7-estoque-inteligente-fd64`  
**PR:** https://github.com/ivansobierai-cyber/afu-mobile-v2/pull/20  
**API:** `https://afu-mobile-v2-production.up.railway.app`  
**Merge:** `557921f` em `main` — **2026-07-23T20:37:49Z**

## Pré-merge (já ok — 2026-07-23)

- [x] CI `validate` verde
- [x] Vercel previews verdes (`afu-mobile`, `afu-mobile-web`, `dist`)
- [x] PR **MERGEABLE** (saiu de draft → ready → merged)
- [x] Smoke local API+UI **AVANÇAR** (`npm run smoke:plano-auxiliar`)
- [x] E2E `tests/etapa10-fluxo-plano-auxiliar.test.ts` (CMP + produtividade)
- [x] Boot produção aplica `db:cultivo-fase`, `db:estoque-custo`, `db:producao-real`

## Pós-merge — produção (2026-07-23)

- [x] Merge em `main` (`557921f`)
- [x] Redeploy Railway automático (serviço `afu-mobile-v2` Online)
- [x] Smoke read-only **AVANÇAR** (endpoints novos presentes)
- [x] Smoke write **AVANÇAR** (`SMOKE_WRITE=1`) — CMP + produtividade real

Evidência: `docs/evidencias/smoke-plano-auxiliar-railway-probe-latest.json`

| Check | Resultado |
|-------|-----------|
| Health / login demo | PASS |
| `estoque.dashboard` + `valorDisponivel` | PASS |
| `valorTotalEstoque` após entrada com custo | PASS (> 0) |
| `cultivos.indicadores` + `produtividadeFonte=real` | PASS |
| Indicadores da propriedade (fonte real) | PASS |

```bash
# read-only (padrão remoto)
EXPO_PUBLIC_API_BASE_URL=https://afu-mobile-v2-production.up.railway.app \
  npm run smoke:plano-auxiliar

# write completo (opcional)
SMOKE_WRITE=1 EXPO_PUBLIC_API_BASE_URL=https://afu-mobile-v2-production.up.railway.app \
  npm run smoke:plano-auxiliar
```

## Cultivos V2 em bancos antigos (se necessário)

Se ainda existirem cultivos sem talhão/safra:

```bash
npm run db:cultivo-fase:apply
npm run db:cultivos:backfill
# só depois de 0 NULLs:
npm run db:cultivos-not-null:apply
```

**Não** rodar `db:cultivos-not-null:apply` no boot automático sem backfill.

## Rollback

1. Redeploy do commit anterior em Railway
2. Colunas `custoMedio` / `custoUnitario` / `producaoReal` são aditivas (nullable) — não exigem down migration para voltar a servir a API antiga
3. Suite: `tests/etapa10-rollback-rehearsal.test.ts`
