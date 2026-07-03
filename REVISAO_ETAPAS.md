# Revisão Completa das Etapas — Sistema de Autenticação AFU Mobile

**Data:** 26 de Junho de 2026  
**Projeto:** AFU Mobile (Analisador Fitotécnico Universal)  
**Checkpoints:** `3ace8eec` → `c7d10516`

---

## 1. MAPA DO SISTEMA (Estado Atual)

### Fontes de Autenticação Ativas Simultaneamente

O app possui **duas fontes independentes** de estado de autenticação rodando em paralelo:

| Fonte | Hook | Endpoint | Plataforma |
|-------|------|----------|-----------|
| **Fonte A** | `useAuth()` | `GET /api/auth/me` (Express REST) | Web: chama API; Nativo: usa cache |
| **Fonte B** | `useSession()` | `trpc.auth.session` (tRPC público) | Todas |

Ambas são montadas em `app/_layout.tsx`:
- `AuthGuard` usa `useSession()` + `useAuthMiddleware()` (que usa `useAuth()`)
- Resultado: dois ciclos de autenticação concorrentes no startup

---

## 2. ETAPAS IMPLEMENTADAS

### Etapa 1 — Autenticação Básica (Checkpoint `3ace8eec`)

**O que foi feito:**
- Schema `users` com `openId`, `password_hash`, `email`
- `auth-router.ts` com endpoints `login`, `signup`, `logout`, `me`
- `useAuthAPI.ts` para chamar endpoints via tRPC
- `lib/_core/auth.ts` para armazenar tokens em SecureStore

**Problema corrigido nesta etapa:**
- Endpoints `me` e `logout` estavam como `publicProcedure` → alterados para `protectedProcedure`

**Resultado:** Testes passaram (13/13), mas aplicação real continuou falhando.

---

### Etapa 2 — Refresh Token (Checkpoint `c7d10516`)

**O que foi feito:**
- `token-service.ts` com `createAccessToken()` (15 min) e `createRefreshToken()` (30 dias)
- Schema atualizado com `refreshToken` e `refreshTokenExpiry`
- `token-refresh-interceptor.ts` com verificação periódica a cada 1 min
- `hooks/use-token-refresh.ts` para integração
- `lib/_core/auth.ts` com `getRefreshToken()`, `setRefreshToken()`, `removeRefreshToken()`
- `auth-router.ts` atualizado: login/signup retornam `{ accessToken, refreshToken, user }`
- 9 testes de refresh token passando

**Resultado:** Testes passaram (9/9), mas aplicação real continuou falhando.

---

## 3. DIAGNÓSTICO DEFINITIVO

### Teste de Compatibilidade de Tokens (Executado Agora)

```
JWT_SECRET: SIM (22 chars)
VITE_APP_ID: SIM

Token de createAccessToken → sdk.verifySession: VÁLIDO ✅
Token de sdk.createSessionToken → sdk.verifySession: VÁLIDO ✅
```

**Conclusão:** O problema **NÃO está na geração ou validação de tokens**. Os tokens são compatíveis.

---

### Causa Raiz Real: Plataforma Web vs. Nativo

O erro observado é:
```
[Auth] /api/auth/me failed: HttpError: Invalid session cookie
```

Este erro vem de `useAuth()` → `Api.getMe()` → `GET /api/auth/me`.

**Em plataforma web** (`Platform.OS === "web"`):

1. `lib/_core/auth.ts` → `getSessionToken()` retorna **`null`** explicitamente:
   ```typescript
   if (Platform.OS === "web") {
     console.log("[Auth] Web platform uses cookie-based auth, skipping token retrieval");
     return null;  // ← TOKEN NUNCA É RETORNADO NO WEB
   }
   ```

2. `lib/trpc.ts` → `headers()` não inclui `Authorization`:
   ```typescript
   async headers() {
     const token = await Auth.getSessionToken();
     return token ? { Authorization: `Bearer ${token}` } : {};
     // ↑ No web, token = null → headers vazios → sem Authorization
   }
   ```

3. `lib/_core/api.ts` → `apiCall()` não inclui `Authorization` no web:
   ```typescript
   if (Platform.OS !== "web") {
     // Só adiciona header em nativo
     headers["Authorization"] = `Bearer ${sessionToken}`;
   }
   ```

4. `auth-router.ts` → `login` seta cookie via `Set-Cookie` header, mas:
   - O preview roda em `iframe` (Manus Management UI)
   - Cookies `HttpOnly` de domínio diferente não são acessíveis via iframe
   - O cookie **não está sendo enviado** nas requisições subsequentes

**Resultado:** No preview web, nem cookie nem Bearer token chegam ao backend → `sdk.authenticateRequest()` não encontra token → lança `ForbiddenError("Invalid session cookie")`.

---

### Fluxo Correto para Web em Iframe

O template Manus tem um mecanismo específico para autenticação em iframe:

1. Backend retorna token no JSON (não apenas no cookie)
2. Frontend chama `POST /api/auth/session` com `Authorization: Bearer <token>`
3. Backend seta cookie no domínio correto (`3000-xxx.manus.computer`)
4. Requisições subsequentes usam o cookie

Este fluxo está implementado em `lib/_core/api.ts` → `establishSession()`, mas **não está sendo chamado** após o login via `useAuthAPI`.

---

### Fluxo Atual vs. Fluxo Correto

**Fluxo atual (quebrado):**
```
login() → backend retorna { accessToken, refreshToken }
        → frontend armazena em SecureStore (ignorado no web)
        → backend seta Set-Cookie (ignorado no iframe)
        → próxima requisição sem token → erro 401
```

**Fluxo correto para web/iframe:**
```
login() → backend retorna { accessToken, refreshToken }
        → frontend chama POST /api/auth/session com Bearer token
        → backend seta cookie no domínio correto
        → próximas requisições usam cookie → autenticação funciona
```

**Fluxo correto para nativo:**
```
login() → backend retorna { accessToken, refreshToken }
        → frontend armazena accessToken em SecureStore
        → tRPC client inclui Authorization: Bearer no header
        → backend valida JWT → autenticação funciona
```

---

## 4. PROBLEMAS IDENTIFICADOS EM ORDEM DE PRIORIDADE

### P1 — `useAuthAPI` não chama `establishSession()` após login (Web)

**Arquivo:** `hooks/use-auth-api.ts`  
**Impacto:** Autenticação web/preview completamente quebrada  
**Solução:** Após armazenar token, chamar `Api.establishSession(accessToken)` em web

```typescript
// Após Auth.setSessionToken(result.accessToken):
if (Platform.OS === 'web') {
  await Api.establishSession(result.accessToken);
}
```

---

### P2 — Dois sistemas de autenticação concorrentes causam conflito

**Arquivos:** `app/_layout.tsx`, `hooks/use-auth.ts`, `hooks/use-session.ts`  
**Impacto:** Redirecionamentos inconsistentes, estado de autenticação instável  
**Evidência:**
- `AuthGuard` usa `useSession()` (tRPC `auth.session` público)
- `useAuthMiddleware()` usa `useAuth()` (REST `/api/auth/me`)
- Ambos rodam simultaneamente com resultados potencialmente diferentes

**Solução:** Unificar em uma única fonte de verdade (preferencialmente `useSession()` via tRPC)

---

### P3 — `useAuth` em nativo não valida token contra servidor

**Arquivo:** `hooks/use-auth.ts` linhas 49-71  
**Impacto:** Token expirado/inválido passa despercebido em nativo  
**Evidência:**
```typescript
// Nativo: apenas verifica se token existe, não valida
const sessionToken = await Auth.getSessionToken();
if (!sessionToken) { setUser(null); return; }
const cachedUser = await Auth.getUserInfo(); // usa cache, não valida
```

**Solução:** Após login, validar token contra servidor pelo menos uma vez

---

### P4 — `auth.session` (tRPC público) retorna `null` antes do login

**Arquivo:** `server/routers/auth-router.ts` linhas 334-349  
**Impacto:** `useSession()` sempre retorna `isAuthenticated: false` antes do login  
**Evidência:**
```typescript
session: publicProcedure.query(async (opts) => {
  const user = opts.ctx.user;  // null se não autenticado
  if (!user) return { user: null, perfil: null, isAdmin: false };
  // ...
})
```

Isso é correto, mas como `useSession()` é chamado no startup antes do login, o `AuthGuard` redireciona para `/auth/welcome` imediatamente — o que é o comportamento esperado.

---

## 5. SOLUÇÃO DEFINITIVA

### Correção P1 (Crítica): Chamar `establishSession()` após login

```typescript
// hooks/use-auth-api.ts — função login()
if (result.success && result.accessToken) {
  await Auth.setSessionToken(result.accessToken);
  if (result.refreshToken) {
    await Auth.setRefreshToken(result.refreshToken);
  }

  // CORREÇÃO: Estabelecer sessão no backend para web/iframe
  if (Platform.OS === 'web') {
    await Api.establishSession(result.accessToken);
  }

  // Armazenar user info e invalidar cache tRPC
  // ...
}
```

### Correção P2 (Importante): Unificar fontes de autenticação

Remover `useAuthMiddleware()` do `AuthGuard` ou garantir que ambos usem a mesma fonte:

```typescript
// app/_layout.tsx — AuthGuard
function AuthGuard() {
  const { isAuthenticated, onboardingPendente, contaSuspensa, loading } = useSession();
  // Remover: useAuthMiddleware() — causa conflito com useSession()
  // ...
}
```

### Correção P3 (Melhoria): Invalidar cache tRPC após login

```typescript
// hooks/use-auth-api.ts — após login bem-sucedido
import { useQueryClient } from '@tanstack/react-query';
const queryClient = useQueryClient();

// Após armazenar token:
queryClient.invalidateQueries({ queryKey: [['auth', 'session']] });
```

---

## 6. PROMPT PARA IMPLEMENTAÇÃO DEFINITIVA

```
CONTEXTO:
App React Native + Expo 54 com backend Node.js/tRPC.
Preview roda em iframe no Manus Management UI (web).
Autenticação: JWT via Bearer token (nativo) + cookie (web).

PROBLEMA CONFIRMADO:
Após login, requisições autenticadas falham com "Invalid session cookie".
Causa raiz: no preview web (iframe), nem cookie nem Bearer token chegam ao backend.

ARQUITETURA DO SISTEMA:
- lib/trpc.ts: cliente tRPC com headers() que retorna Bearer token (nativo) ou vazio (web)
- lib/_core/auth.ts: getSessionToken() retorna null em web explicitamente
- lib/_core/api.ts: apiCall() só adiciona Authorization header em nativo
- lib/_core/api.ts: establishSession(token) existe mas não é chamado após login
- hooks/use-auth-api.ts: login armazena token mas não chama establishSession()
- app/_layout.tsx: AuthGuard usa useSession() + useAuthMiddleware() (conflito)

CORREÇÕES NECESSÁRIAS:

1. hooks/use-auth-api.ts — Após login/signup:
   - Se Platform.OS === 'web': chamar Api.establishSession(accessToken)
   - Invalidar cache tRPC: queryClient.invalidateQueries(['auth', 'session'])

2. app/_layout.tsx — AuthGuard:
   - Remover useAuthMiddleware() para eliminar conflito de fontes
   - Usar apenas useSession() como fonte de verdade

3. hooks/use-auth.ts — Logout:
   - Adicionar removeRefreshToken() junto com removeSessionToken()

ARQUIVOS A EDITAR:
- hooks/use-auth-api.ts (linhas 56-84 e 119-147)
- app/_layout.tsx (linha 45: remover useAuthMiddleware())
- hooks/use-auth.ts (linha 91: adicionar removeRefreshToken)

RESULTADO ESPERADO:
- Login funciona em web (preview) e nativo
- Requisições autenticadas funcionam após login
- Logout limpa todos os tokens
- Estado de autenticação consistente
```

---

## 7. RESUMO EXECUTIVO

| Componente | Status | Problema |
|-----------|--------|---------|
| JWT generation (`createAccessToken`) | ✅ Correto | — |
| JWT validation (`sdk.verifySession`) | ✅ Correto | — |
| Backend endpoints (`login`, `signup`) | ✅ Correto | — |
| Middleware (`sdk.authenticateRequest`) | ✅ Correto | — |
| `lib/trpc.ts` headers | ✅ Correto para nativo | Retorna vazio em web |
| `lib/_core/auth.ts` | ✅ Correto para nativo | Retorna null em web |
| `hooks/use-auth-api.ts` | ❌ Incompleto | Não chama `establishSession()` |
| `app/_layout.tsx` AuthGuard | ❌ Conflito | Dois sistemas de auth paralelos |
| `hooks/use-auth.ts` nativo | ⚠️ Funcional | Não valida token contra servidor |

**Problema principal:** `establishSession()` não é chamado após login em web.  
**Problema secundário:** Dois sistemas de autenticação concorrentes no `AuthGuard`.  
**Tokens e backend:** Funcionando corretamente.
