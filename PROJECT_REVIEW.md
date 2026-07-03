# Revisão do Projeto AFU Mobile — MVP 1.0 "Planta Saudável"

Data: 03 de julho de 2026

---

## Resumo Executivo

MVP 1.0 concluído e funcional. Stack: **Expo Router + React Native + tRPC + Drizzle ORM + MySQL**.

| Métrica | Status |
|---------|--------|
| **TypeScript** | 0 erros (`npm run check`) |
| **Testes** | 252 passando (Vitest) |
| **Auth** | Email/senha + OAuth, JWT + refresh token |
| **Dados** | tRPC end-to-end (nenhum AsyncStorage para dados core) |
| **Dev Server** | Metro :8081 + API :3000 |

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
| Dashboard | OK | tRPC (6 queries: propriedades, cultivos, eventos, relatórios, análises, diagnósticos) |
| Propriedades | OK | tRPC CRUD + detalhe com terrenos |
| Cultivos | OK | tRPC CRUD + validação de área plantada ≤ terreno |
| Diagnóstico IA | OK | Foto → análise IA → salvar → laudo PDF → histórico |
| Mais | OK | Menu hub com ~80 submodules + logout |

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
| Login email/senha | OK |
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

## Pendente (v3 / roadmap)

- [ ] Marketplace rural — fluxo completo comprador/parceiro
- [ ] Geolocalização — mapa de propriedades
- [ ] Integração clima — API meteorológica por propriedade
- [ ] Push remoto (FCM/APNs)
- [ ] Integrar `queueMutation` em todos os formulários CRUD

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
API: `http://localhost:3000`
