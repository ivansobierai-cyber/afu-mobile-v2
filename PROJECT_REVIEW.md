# Revisão do Projeto AFU Mobile — MVP 1.0 "Planta Saudável"

Data: 08 de julho de 2026 (revisão de progresso v3 + staging)

---

## Resumo Executivo

MVP 1.0 concluído. **P3 (geo, clima, push, offline)** e **P4.1 (marketplace comprador)** implementados no código. **API staging no Railway** no ar e login validado em 4G.

| Métrica | Status |
|---------|--------|
| **TypeScript** | 0 erros (`npm run check`) |
| **Testes** | 220 passando · 2 suites com falha de import (`auth-flow`, `resend-email`) |
| **Auth** | Email/senha + OAuth, JWT + refresh token, Bearer em staging |
| **Dados** | tRPC end-to-end (dados core via API, não AsyncStorage) |
| **API staging** | `https://afu-mobile-v2-production.up.railway.app` — health OK |
| **APK staging** | Profile EAS `preview` — login demo validado em 4G |

---

## Stack Técnica (Real)

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Expo SDK 54, React Native, NativeWind, Expo Router |
| State | TanStack Query (via tRPC react-query) |
| Backend | Express + tRPC (publicProcedure / protectedProcedure / adminProcedure) |
| Banco | MySQL + Drizzle ORM (não Prisma, não PostgreSQL) |
| Auth | JWT HS256 + bcrypt + refresh token rotativo |
| Testes | Vitest |

---

## Autenticação — Fluxo Canônico

```
welcome → login / cadastro → useAuthAPI (tRPC)
  → useSession (tRPC auth.session) → AuthGuard
  → onboarding (se sem perfil AFU) → (tabs)
  → logout (useAuthAPI) → welcome
```

| Componente | Arquivo |
|------------|---------|
| Hook de login/signup/logout | `hooks/use-auth-api.ts` |
| Hook de sessão | `hooks/use-session.ts` |
| Refresh token (nativo) | `lib/token-refresh-interceptor.ts` + `TokenRefreshManager` em `_layout.tsx` |
| Guard de rota (layout) | `app/_layout.tsx` → `AuthGuard` |
| Guard de componente | `components/route-guard.tsx` |
| Login | `app/auth/login.tsx` |
| Cadastro | `app/auth/cadastro.tsx` |
| Onboarding | `app/auth/onboarding.tsx` |
| Recuperação | `app/auth/forgot-password.tsx` + `reset-password.tsx` |

Rotas legadas (`login-new`, `cadastro-new`) redirecionam para `login` / `cadastro`.

### Dev sem login (opcional)
```bash
EXPO_PUBLIC_DEV_SKIP_AUTH=1 DEV_SKIP_AUTH=1 npm run dev
```

---

## Telas e Funcionalidades — Status

### Tabs Principais

| Tela | Status | Dados |
|------|--------|-------|
| Dashboard | OK | 7 stat cards + 9 ações rápidas + WeatherCard (clima na fazenda) |
| Propriedades | OK | tRPC CRUD + GPS + mapa (`propriedades/mapa.tsx`) |
| Cultivos | OK | tRPC CRUD + validação de área plantada ≤ terreno |
| Diagnóstico IA | OK | Foto → análise IA → salvar → laudo PDF → histórico |
| Mais | OK | Menu hub com ~80 submodules + marketplace + logout |

### Módulos (via tRPC)

| Módulo | Router |
|--------|--------|
| Terrenos | `coreData.terrenos` |
| Calendário | `coreData.calendario` |
| Relatórios/Laudos PDF | `secondaryData.relatorios` |
| Análise Fitotécnica | `secondaryData.analises` |
| Marketplace | `secondaryData.marketplace` |
| Suporte Técnico | `secondaryData.suporte` (tickets + chat) |
| Materiais Didáticos | `secondaryData.materiais` |
| Culturas/Pragas/Doenças | `culturasPragas.*` + `materiaisParceiros.*` |

### Auth e Perfil

| Funcionalidade | Status |
|----------------|--------|
| Login email/senha | OK (staging 4G validado jul/2026) |
| Login layout Android | OK (ScrollView único, sem autofill quebrando toque) |
| Cadastro com seleção de perfil | OK |
| OAuth (Google/Apple) | OK (callback dedicado) |
| Recuperação de senha | OK (SendGrid + token) |
| Perfil — editar e salvar | OK (tRPC `auth.perfil.upsert`) |
| Logout | OK (limpa tokens + cache tRPC) |
| Admin — gestão de usuários | OK (tRPC `auth.admin.usuarios`) |

---

## Navegação

```
app/_layout.tsx (Root Stack + AuthGuard)
├── (tabs)/_layout.tsx              5 tabs
│   ├── index.tsx                   Dashboard
│   ├── propriedades.tsx            Lista propriedades
│   ├── cultivos.tsx                Lista cultivos
│   ├── diagnostico.tsx             Diagnóstico IA
│   └── mais.tsx                    Menu + logout
├── auth/_layout.tsx                welcome, login, cadastro, etc.
├── oauth/callback.tsx              OAuth redirect
├── propriedades/[id].tsx           Detalhe propriedade
├── cultivos/[id].tsx               Detalhe cultivo
├── mais/_layout.tsx                ~80 telas de módulos/docs
└── admin/_layout.tsx               Conteúdos offline
```

---

## Arquivos Removidos (limpeza)

| Arquivo | Motivo |
|---------|--------|
| `hooks/use-auth.ts` | Substituído por `use-session.ts` + `use-auth-api.ts` |
| `hooks/use-sign-up.ts` | Dead code (REST signup antigo) |
| `hooks/use-token-refresh.ts` | Nunca montado |
| `lib/auth-middleware.ts` | Substituído por AuthGuard |
| `lib/store.ts` | Dados migrados para tRPC; sem consumidores |
| `.npmrc` | `node-linker=hoisted` era pnpm-only; causava warning no npm |

---

## v2 — Concluído (03/07/2026)

- [x] Filtro de calendário por prioridade e cultivo (`mais/calendario.tsx`)
- [x] Suporte técnico com backend real (`secondaryData.suporte` + tabelas Drizzle)
- [x] Push notifications locais (`lib/notifications.ts` — lembretes de calendário)
- [x] Sync offline para dados core (`lib/offline/core-mutation-queue.ts`)
- [x] ADMIN_OFFLINE_GUIDE.md atualizado (conteúdos + core sync)

## v3 / P3 — Concluído no código (verificado 08/07/2026)

| Item | Status | Evidência |
|------|--------|-----------|
| Geolocalização + mapa | **Concluído** | `app/propriedades/mapa.tsx`, GPS em `propriedades.tsx`, `lib/geo/coordinates.ts` |
| Clima por propriedade | **Concluído** | `server/routers/weather-router.ts`, `components/weather-card.tsx`, alertas em `lib/weather/alerts.ts` |
| Push remoto FCM/APNs | **Concluído** | `server/routers/push-router.ts`, `components/push-notification-manager.tsx`, notif. marketplace em `server/services/marketplace-notifications.ts` |
| Offline `queueMutation` | **Parcial** | Integrado em propriedades, cultivos, terrenos, calendário via `useRunCoreMutation` — não em todos os formulários |
| Alertas climáticos automáticos | **Concluído** | `server/_core/scheduled-routes.ts`, `scripts/run-weather-alerts.ts` |

## P4 — Marketplace (verificado 08/07/2026)

| Item | Status | Evidência |
|------|--------|-----------|
| Catálogo + busca + categorias | **Concluído** | `app/mais/marketplace.tsx`, `secondaryData.marketplace.list` |
| Carrinho + checkout | **Concluído** | `hooks/use-marketplace-cart.ts`, `components/marketplace-checkout.tsx` |
| Pedidos + timeline | **Concluído** | `components/marketplace-pedido-detail.tsx`, `marketplace-pedido-timeline.tsx` |
| Painel vendedor | **Concluído** | `components/marketplace-vendedor-panel.tsx` |
| PIX / pagamento | **Parcial (demo)** | Botão "Pagar com PIX (demo)" — sem gateway real (Mercado Pago) |
| Card na home | **Concluído** | Stat card + ação rápida em `app/(tabs)/index.tsx` |

## Staging e deploy (jul/2026)

| Item | Status |
|------|--------|
| Dockerfile + Railway | Concluído — `Dockerfile`, `scripts/start-api-production.sh` |
| API staging online | Concluído — `afu-mobile-v2-production.up.railway.app` |
| Login staging 4G | Concluído — fix Bearer token em `server/_core/sdk.ts` |
| EAS profile `preview` | Concluído — aponta para API Railway |
| EAS profile `apk` | Concluído — LAN `192.168.1.5:3000` |
| Domínio `api-staging.afuagro.com.br` | Pendente — CNAME no DNS |
| API produção `api.afuagro.com.br` | Pendente |
| Play Store (AAB `production`) | Pendente |

## Pendente para liberação a usuários

1. **Homologação beta** — marketplace comprador/vendedor, cadastro real, diagnóstico IA no APK staging
2. **API produção** — deploy dedicado + MySQL prod (sem `SEED_ON_START`)
3. **Pagamento real** — Mercado Pago / PIX de produção no marketplace
4. **Credenciais prod** — FCM (Expo dashboard), SendGrid (recuperação de senha)
5. **Build produção** — `npm run eas:android:prod` + submit Play Store
6. **Offline completo** — `useRunCoreMutation` nos formulários restantes
7. **Testes** — corrigir 2 suites Vitest com falha de import
8. **Docs** — OAuth/SendGrid em staging (variáveis vazias no Railway hoje)

---

## Como Rodar

```bash
# Instalar (preferir pnpm, npm também funciona)
npm install

# Subir API + Metro
npm run dev

# Apenas TypeScript check
npm run check

# Testes
npm run test
```

App web: `http://localhost:8081`
API local: `http://localhost:3000`
API staging: `https://afu-mobile-v2-production.up.railway.app`

Guia staging: [docs/STAGING.md](docs/STAGING.md)
