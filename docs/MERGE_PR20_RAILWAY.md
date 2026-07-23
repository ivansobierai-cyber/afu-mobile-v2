# Merge + Railway — PR #20 (plano auxiliar + Cultivos V2)

**Branch:** `cursor/etapa7-estoque-inteligente-fd64`  
**PR:** https://github.com/ivansobierai-cyber/afu-mobile-v2/pull/20  
**API:** `https://afu-mobile-v2-production.up.railway.app`

O agente de cloud **não faz merge** nem redeploy Railway sozinho. Este runbook é o passo humano pós-aprovação.

## Pré-merge (já ok — 2026-07-23)

- [x] CI `validate` verde
- [x] Vercel previews verdes (`afu-mobile`, `afu-mobile-web`, `dist`)
- [x] PR **MERGEABLE**
- [x] Smoke local API+UI **AVANÇAR** (`npm run smoke:plano-auxiliar`)
- [x] E2E `tests/etapa10-fluxo-plano-auxiliar.test.ts` (CMP + produtividade)
- [x] Boot produção aplica `db:cultivo-fase`, `db:estoque-custo`, `db:producao-real`

## Gap atual em produção (probe 2026-07-23)

Railway ainda serve API **sem** o código deste PR:

| Check | Resultado |
|-------|-----------|
| Health / login demo | OK |
| `coreData.expansao.estoque.dashboard` | **NOT_FOUND** |
| Custo médio / `valorDisponivel` | ausente até deploy |
| `producaoReal` / produtividade nos indicadores | ausente até deploy |

Conclusão: **merge + redeploy** é o próximo passo operacional.

## Após merge

### 1. Deploy API

- Se Railway auto-deploy em `main`: aguardar rebuild
- Senão: `railway up` / Redeploy apontando para `main` (commit do merge)

Logs esperados no boot:

```
Applying sync/ai + safras + archive schema...
db:cultivo-fase:apply
db:estoque-custo:apply
db:producao-real:apply
Starting server on port...
```

Variáveis: manter `SEED_ON_START=0` (já seedado). `DATABASE_URL` e `JWT_SECRET` intactos.

### 2. Re-smoke produção

```bash
EXPO_PUBLIC_API_BASE_URL=https://afu-mobile-v2-production.up.railway.app \
  npm run smoke:plano-auxiliar
```

Critério: `decision: AVANCAR` em `docs/evidencias/smoke-plano-auxiliar-latest.json`.

Checklist manual UI (preview Vercel `main` ou app):

1. Login demo
2. Propriedade → Mais → Recursos e estoque → item com custo → `Valor R$`
3. Cultivo → Custos → Registrar colheita real → produtividade `/ha (colheita real)`

### 3. Cultivos V2 em bancos antigos (se necessário)

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
