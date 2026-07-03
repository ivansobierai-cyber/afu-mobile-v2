# Correções Críticas de Autenticação JWT

**Data:** 22 de Junho de 2026  
**Status:** ✅ Completo e Testado

## Problema Raiz Identificado

O backend estava retornando **strings cruas** em vez de **JWT assinados** no endpoint de login/signup. Isso causava falha "Invalid session cookie" quando o middleware tentava validar o token.

### Fluxo Quebrado (Antes)
```
1. Frontend: POST /api/auth/login
2. Backend: Retorna sessionToken = "123:1718900000" (string crua)
3. Frontend: Armazena token em SecureStore
4. Frontend: Envia header Authorization: Bearer 123:1718900000
5. Backend: Tenta jwtVerify("123:1718900000") → FALHA ❌
6. Erro: "Invalid session cookie"
```

### Fluxo Correto (Depois)
```
1. Frontend: POST /api/auth/login
2. Backend: Retorna sessionToken = JWT_ASSINADO (HS256)
3. Frontend: Armazena token em SecureStore
4. Frontend: Envia header Authorization: Bearer JWT_ASSINADO
5. Backend: Valida jwtVerify(JWT_ASSINADO, secret) → SUCESSO ✅
6. Backend: Retorna usuário autenticado
```

## Correções Aplicadas

### 1. **auth-router.ts** - Usar `sdk.createSessionToken()`

**Antes:**
```typescript
const sessionToken = `${user.id}:${Date.now()}`;  // ❌ String crua
```

**Depois:**
```typescript
if (!user.openId) {
  throw new Error('User openId is missing');
}
const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name || '' });  // ✅ JWT assinado
```

**Endpoints Atualizados:**
- `login` (linha 170-197)
- `signup` (linha 199-236)

### 2. **auth-router.ts** - Proteger endpoints autenticados

**Antes:**
```typescript
me: publicProcedure.query((opts) => opts.ctx.user ?? null),  // ❌ Público
logout: publicProcedure.mutation(({ ctx }) => { ... }),      // ❌ Público
```

**Depois:**
```typescript
me: protectedProcedure.query((opts) => opts.ctx.user ?? null),  // ✅ Protegido
logout: protectedProcedure.mutation(({ ctx }) => { ... }),      // ✅ Protegido
```

### 3. **db-auth.ts** - Garantir openId sempre existe

**Função `loginWithEmail()`:**
```typescript
// Se usuário não tem openId (criado antes da correção), gerar um
let openId = user.openId;
if (!openId) {
  openId = `email_${crypto.randomUUID()}`;
  await db.update(users).set({
    openId,
    lastSignedIn: new Date(),
  }).where(eq(users.id, user.id));
}
```

**Função `createUserWithEmail()`:**
```typescript
// Gerar openId único para usuários de e-mail
const openId = `email_${crypto.randomUUID()}`;
```

## Testes Adicionados

### 1. **tests/jwt-validation.test.ts** (4 testes)
- ✅ JWT gerado corretamente
- ✅ JWT validado com secret correto
- ✅ JWT falha com secret errado
- ✅ JWT falha se campos obrigatórios faltam

### 2. **tests/auth-integration.test.ts** (9 testes)
- ✅ Signup cria usuário com openId
- ✅ Backend cria JWT assinado
- ✅ Frontend armazena JWT
- ✅ Frontend envia JWT em header
- ✅ Backend valida JWT
- ✅ Backend retorna usuário autenticado
- ✅ Frontend recebe usuário
- ✅ Token inválido rejeitado
- ✅ Token com campos faltando rejeitado

**Resultado:** 13/13 testes passando ✅

## Fluxo de Autenticação Completo

### Signup
```
1. Frontend: POST /api/auth/signup { email, password, name, profile }
2. Backend:
   - Valida email não duplicado
   - Hash senha com PBKDF2
   - Gera openId = email_${UUID}
   - Cria usuário e perfil AFU
   - Cria JWT com openId
   - Retorna { sessionToken, user }
3. Frontend:
   - Armazena token em SecureStore
   - Armazena user info
   - Redireciona para dashboard
```

### Login
```
1. Frontend: POST /api/auth/login { email, password }
2. Backend:
   - Busca usuário por email
   - Valida senha com PBKDF2
   - Se sem openId, gera um
   - Cria JWT com openId
   - Retorna { sessionToken, user }
3. Frontend:
   - Armazena token em SecureStore
   - Armazena user info
   - Redireciona para dashboard
```

### Requisições Autenticadas
```
1. Frontend: GET /api/auth/me
   Header: Authorization: Bearer ${JWT}
2. Backend:
   - Extrai token de Authorization header
   - Valida JWT com jwtVerify()
   - Retorna ctx.user
3. Frontend:
   - Recebe usuário autenticado
   - Atualiza estado local
```

## Variáveis de Ambiente Necessárias

```bash
JWT_SECRET=TYLxVRr2EaBE8jVoLDqKQX          # Chave secreta para assinar JWT
VITE_APP_ID=RiSprfgpLu2V46urERiwsY        # ID da aplicação
DATABASE_URL=mysql://...                   # Conexão com banco
```

## Próximas Etapas

1. **Testar em dispositivo físico** — Gerar novo APK e testar login/signup
2. **Verificar cookies em web** — Garantir que Set-Cookie está funcionando
3. **Implementar refresh token** — Para sessões de longa duração
4. **Adicionar 2FA** — Para segurança adicional

## Referências

- `server/routers/auth-router.ts` — Endpoints de autenticação
- `server/db-auth.ts` — Funções de banco de dados
- `server/_core/sdk.ts` — Geração e validação de JWT
- `lib/_core/auth.ts` — Armazenamento de token no cliente
- `lib/trpc.ts` — Cliente tRPC com header Authorization
- `tests/jwt-validation.test.ts` — Testes de JWT
- `tests/auth-integration.test.ts` — Testes de integração
