# FASE 2H — Bloqueio de homologação (procedure NOT_FOUND no Preview)

## Sintoma

```
HTTP 404 — NOT_FOUND
path: coreData.operacoes.createApontamento
message: No procedure found on path "coreData.operacoes.createApontamento"
```

## Causa raiz (comprovada)

| Camada | Estado |
|--------|--------|
| **Implementação** | `server/db-operacoes-apontamentos.ts` → `createApontamento` |
| **Router** | `server/routers/operacoes-router.ts` → `createApontamento` mutation |
| **Composição** | `server/routers/core-data-router.ts` → `operacoes: operacoesRouter` |
| **App** | `server/routers.ts` → `coreData: coreDataRouter` |
| **Cliente** | `trpc.coreData.operacoes.createApontamento` em `operacao-agricola-detail-modal.tsx` |

O wiring no repositório (branch `feat/fase-2h-apontamento-real-execucao`) está **correto**.

O Preview Vercel da PR #42 usa `npm run build:web:preview`, que aponta o bundle para:

`EXPO_PUBLIC_API_BASE_URL` → **`https://afu-mobile-v2-production.up.railway.app`**

Essa API em produção foi implantada a partir de `main` **sem** as mutations 2H. Prova:

```bash
npm run probe:trpc:procedure
# → NOT_FOUND em createApontamento

# coreData.operacoes.listByPropriedade na mesma API → 401 (procedure existe)
```

Ou seja: **descompasso frontend (PR #42) × API Railway (main antiga)** — não é safra, `operacaoId` nem validação de formulário.

## Correção operacional (obrigatória para smoke)

1. No Railway, **Redeploy** do serviço Docker com o commit da PR #42 (`feat/fase-2h-apontamento-real-execucao`), ou `railway up` nesse branch.
2. Confirmar: `npm run probe:trpc:procedure` → `ok: true` (não pode mais retornar NOT_FOUND de path).
3. Rebuild do Preview Vercel da PR #42 (push ou redeploy).
4. Smoke: Operações → Em execução → Registrar execução → Salvar.

## Correção de configuração (repo)

- `scripts/build-web-preview.mjs` — não sobrescreve `EXPO_PUBLIC_API_BASE_URL` quando o Vercel Preview define outro host.
- `npm run probe:trpc:procedure` — verificação rápida pós-deploy.
- `tests/trpc-router-coredata-operacoes-fase2h.test.ts` — garante que o router **composto** expõe o path.

## Não fazer

- Não duplicar procedure em outro namespace.
- Não alterar regras de negócio 2H neste bloqueio.
