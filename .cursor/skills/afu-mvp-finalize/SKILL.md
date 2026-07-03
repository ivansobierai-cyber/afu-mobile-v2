---
name: afu-mvp-finalize
description: Finalizes and verifies AFU Mobile MVP 1.0 Planta Saudável — dashboard, diagnóstico IA, CRUD propriedades/cultivos/terrenos, relatórios PDF, auth/navegação. Use when completing MVP delivery, smoke-testing core flows, or fixing auth/path/storage regressions in afu-mobile.
---

# AFU MVP 1.0 — Finalização

## Stack real

Expo SDK 54 · React Native · Expo Router · tRPC · Drizzle/MySQL · JWT + refresh token

## Fluxo auth canônico

```
welcome → login / cadastro → useAuthAPI → useSession → AuthGuard → onboarding? → (tabs) → logout → welcome
```

Arquivos: `hooks/use-auth-api.ts`, `hooks/use-session.ts`, `app/_layout.tsx` (AuthGuard + TokenRefreshManager)

## Checklist MVP (5 pilares)

### 1. Dashboard (`app/(tabs)/index.tsx`)

- 6 stat cards clicáveis (propriedades, cultivos, diagnósticos, análises, laudos, eventos)
- 8 ações rápidas (diagnóstico, propriedades, histórico, calendário, materiais, suporte, análise solo, relatórios)
- Dados via tRPC; pull-to-refresh invalida queries

### 2. Diagnóstico IA (`app/(tabs)/diagnostico.tsx`)

- Câmera/galeria → `diagnostico.analisar` → `diagnostico.salvar` → resultado
- Laudo PDF via `analise.gerarPDF` + `openLaudoHtml`
- Histórico com deep link `?historico=1`

### 3. CRUD + validação de área

- Propriedades: `app/(tabs)/propriedades.tsx` + `propriedades/[id].tsx`
- Terrenos: `propriedades/terrenos.tsx`
- Cultivos: `app/(tabs)/cultivos.tsx` + `AreaValidationInput` / `useAreaValidation`

### 4. Relatórios PDF (`app/mais/relatorios.tsx`)

- CRUD `secondaryData.relatorios`
- Visualização laudo HTML via `openLaudoHtml`

### 5. Auth e navegação

- Rotas canônicas `/auth/login`, `/auth/cadastro`
- AuthGuard protege `(tabs)`, `mais`, `propriedades`, `cultivos`, `admin`
- Dev sem auth: `EXPO_PUBLIC_DEV_SKIP_AUTH=1 DEV_SKIP_AUTH=1 npm run dev`

### 6. v2 extras

- Calendário: filtros status/prioridade/cultivo + lembretes locais
- Suporte: `secondaryData.suporte` (tickets + chat persistidos)
- Offline core: `useCoreOfflineSync` / `CoreOfflineSyncManager`
- Após schema novo: `npm run db:push`

## Verificação

```bash
npm run check
npm run test
npm run dev
```

Smoke: welcome → login → tabs → diagnóstico (foto) → propriedades CRUD → logout → welcome

## Referências

- [PROJECT_REVIEW.md](../../PROJECT_REVIEW.md) — status atual
- [todo.md](../../todo.md) — etapas concluídas
- [REVISAO_ETAPAS.md](../../REVISAO_ETAPAS.md) — histórico auth (26/06)
