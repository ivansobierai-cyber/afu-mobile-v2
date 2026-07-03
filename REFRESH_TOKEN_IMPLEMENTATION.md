# Implementação de Refresh Token

**Data:** 22 de Junho de 2026  
**Status:** ✅ Completo e Testado

## Visão Geral

Sistema robusto de renovação automática de tokens que permite que usuários permaneçam autenticados sem interrupção, mesmo quando o access token expira.

## Arquitetura

### Tokens

| Token | Duração | Armazenamento | Uso |
|-------|---------|---------------|-----|
| **Access Token** | 15 minutos | Header `Authorization: Bearer` | Requisições autenticadas |
| **Refresh Token** | 30 dias | SecureStore (nativo) / localStorage (web) | Renovar access token |

### Fluxo

```
1. Login/Signup
   ├─ Criar access token (15 min)
   ├─ Criar refresh token (30 dias)
   ├─ Armazenar refresh token no banco
   └─ Retornar ambos ao cliente

2. Requisições Autenticadas
   ├─ Enviar access token em header Authorization
   ├─ Se token válido → resposta normal
   └─ Se token inválido → erro 401

3. Renovação Automática
   ├─ Verificar a cada 1 minuto se token está próximo de expirar
   ├─ Se faltam < 2 minutos → renovar
   ├─ Usar refresh token para obter novo access token
   ├─ Armazenar novo access token
   ├─ Fila de requisições durante renovação (sem interrupção)
   └─ Retry automático após renovação

4. Logout
   ├─ Revogar refresh token no banco
   ├─ Limpar access token do cliente
   ├─ Limpar refresh token do cliente
   └─ Redirecionar para login
```

## Componentes

### Backend

#### `server/token-service.ts` — Serviço de Gerenciamento de Tokens

**Funções Principais:**
- `createAccessToken(openId, name)` — Gerar JWT de curta duração
- `createRefreshToken(openId, tokenVersion)` — Gerar JWT de longa duração
- `verifyAccessToken(token)` — Validar access token
- `verifyRefreshToken(token)` — Validar refresh token
- `storeRefreshToken(userId, token)` — Armazenar no banco
- `renewTokens(refreshToken)` — Renovar ambos os tokens
- `revokeRefreshToken(userId)` — Revogar token (logout)
- `isAccessTokenExpiringSoon(token)` — Verificar se próximo de expirar

#### `server/routers/auth-router.ts` — Endpoints de Autenticação

**Endpoints Atualizados:**
- `POST /api/auth/login` — Retorna `{ accessToken, refreshToken, user }`
- `POST /api/auth/signup` — Retorna `{ accessToken, refreshToken, user }`
- `POST /api/auth/refresh` — Renova tokens usando refresh token
- `POST /api/auth/logout` — Revoga refresh token

**Exemplo de Resposta:**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name",
    "openId": "email_uuid",
    "role": "user"
  }
}
```

### Frontend

#### `lib/_core/auth.ts` — Armazenamento de Tokens

**Funções Adicionadas:**
- `getRefreshToken()` — Recuperar refresh token
- `setRefreshToken(token)` — Armazenar refresh token
- `removeRefreshToken()` — Remover refresh token

#### `lib/token-refresh-interceptor.ts` — Renovação Automática

**Funções Principais:**
- `getValidAccessToken()` — Obter token válido, renovando se necessário
- `startTokenRefreshCheck()` — Iniciar verificação periódica (a cada 1 min)
- `stopTokenRefreshCheck()` — Parar verificação
- `getTimeUntilTokenExpiry()` — Tempo até expiração (em segundos)
- `isTokenValid()` — Verificar se token é válido

**Lógica:**
1. Verifica a cada 1 minuto se access token está próximo de expirar
2. Se faltam < 2 minutos → chama endpoint `/api/auth/refresh`
3. Aguarda resposta e armazena novo access token
4. Se múltiplas requisições chegam durante renovação → fila automática
5. Após renovação → retry automático de requisições

#### `hooks/use-token-refresh.ts` — Hook de Integração

**Uso em App:**
```typescript
import { useTokenRefresh } from '@/hooks/use-token-refresh';

export default function App() {
  const { getValidAccessToken, getTimeUntilTokenExpiry } = useTokenRefresh();

  // useTokenRefresh inicia verificação periódica ao montar
  // e para ao desmontar automaticamente
}
```

#### `hooks/use-auth-api.ts` — Atualizado

**Mudanças:**
- Login/Signup agora retornam `{ accessToken, refreshToken, user }`
- Ambos os tokens são armazenados após autenticação
- Logout revoga refresh token

### Schema do Banco

#### `drizzle/schema.ts` — Campos Adicionados

```typescript
users table:
  refreshToken: varchar(512)           // Refresh token armazenado
  refreshTokenExpiry: timestamp        // Expiração do refresh token
```

**Migração:**
```sql
ALTER TABLE `users` ADD `refreshToken` varchar(512);
ALTER TABLE `users` ADD `refreshTokenExpiry` timestamp;
```

## Fluxo Completo

### 1. Login

```
Frontend:
  POST /api/auth/login { email, password }

Backend:
  ├─ Validar credenciais
  ├─ Gerar access token (15 min)
  ├─ Gerar refresh token (30 dias)
  ├─ Armazenar refresh token no banco
  └─ Retornar { accessToken, refreshToken, user }

Frontend:
  ├─ Armazenar accessToken em SecureStore
  ├─ Armazenar refreshToken em SecureStore
  ├─ Armazenar user info
  └─ Iniciar verificação periódica de expiração
```

### 2. Requisição Autenticada

```
Frontend:
  GET /api/auth/me
  Header: Authorization: Bearer ${accessToken}

Backend:
  ├─ Extrair token do header
  ├─ Validar JWT com jwtVerify()
  ├─ Se válido → retornar dados
  └─ Se inválido → erro 401

Frontend (se 401):
  ├─ Detectar erro de autenticação
  ├─ Usar refresh token para renovar
  ├─ Retry automático com novo token
  └─ Se refresh falhar → redirecionar para login
```

### 3. Renovação Automática

```
Frontend (a cada 1 minuto):
  ├─ Verificar se access token expira em < 2 minutos
  ├─ Se sim → chamar POST /api/auth/refresh

POST /api/auth/refresh { refreshToken }

Backend:
  ├─ Validar refresh token
  ├─ Verificar se está armazenado no banco
  ├─ Verificar se não expirou
  ├─ Gerar novo access token
  ├─ Gerar novo refresh token (rotação)
  ├─ Armazenar novo refresh token no banco
  └─ Retornar { accessToken, refreshToken }

Frontend:
  ├─ Armazenar novo access token
  ├─ Armazenar novo refresh token
  ├─ Continuar navegação sem interrupção
  └─ Próxima verificação em 1 minuto
```

### 4. Logout

```
Frontend:
  POST /api/auth/logout

Backend:
  ├─ Revogar refresh token (set to null)
  ├─ Limpar cookie de sessão
  └─ Retornar { success: true }

Frontend:
  ├─ Remover access token
  ├─ Remover refresh token
  ├─ Limpar user info
  ├─ Parar verificação periódica
  └─ Redirecionar para login
```

## Segurança

### Proteções Implementadas

1. **Tokens Assinados com HS256** — Impossível falsificar sem chave secreta
2. **Expiração de Tokens** — Access token expira em 15 min, refresh em 30 dias
3. **Armazenamento Seguro** — Refresh token em SecureStore (nativo) ou localStorage (web)
4. **Rotação de Tokens** — Novo refresh token gerado a cada renovação
5. **Validação de Versão** — Tokens antigos são rejeitados após rotação
6. **Revogação** — Logout revoga refresh token imediatamente
7. **HTTPS Obrigatório** — Cookies com flag `Secure` em produção
8. **HttpOnly** — Cookies não acessíveis via JavaScript (web)
9. **SameSite=Lax** — Proteção contra CSRF

### Boas Práticas

- ✅ Nunca expor refresh token em logs
- ✅ Usar HTTPS em produção
- ✅ Renovar tokens antes de expirar (não esperar expiração)
- ✅ Revogar tokens em logout
- ✅ Validar tokens no servidor antes de usar
- ✅ Usar JWT com assinatura (não apenas encoding)
- ✅ Implementar rate limiting em endpoint de refresh

## Testes

### Testes Implementados

**`tests/refresh-token.test.ts`** — 9 testes passando ✅

1. ✅ Criar access token de curta duração
2. ✅ Criar refresh token de longa duração
3. ✅ Verificar access token é válido
4. ✅ Verificar refresh token é válido
5. ✅ Simular detecção de expiração
6. ✅ Simular renovação de tokens
7. ✅ Verificar rotação previne reuso
8. ✅ Verificar expiração é validada
9. ✅ Fluxo completo: access → refresh → novo access

## Próximas Etapas

1. **Testar em Dispositivo Físico** — Gerar APK e testar renovação automática
2. **Implementar Retry com Backoff** — Para falhas de rede durante renovação
3. **Adicionar Logging de Auditoria** — Registrar renovações e revogações
4. **Implementar Rate Limiting** — Limitar requisições de refresh
5. **Adicionar Biometria** — Usar biometria para confirmar renovação
6. **Implementar 2FA** — Para segurança adicional

## Referências

- `server/token-service.ts` — Serviço de tokens
- `server/routers/auth-router.ts` — Endpoints de autenticação
- `lib/_core/auth.ts` — Armazenamento de tokens
- `lib/token-refresh-interceptor.ts` — Renovação automática
- `hooks/use-token-refresh.ts` — Hook de integração
- `hooks/use-auth-api.ts` — Hook de API de autenticação
- `tests/refresh-token.test.ts` — Testes de refresh token
- `drizzle/schema.ts` — Schema do banco
