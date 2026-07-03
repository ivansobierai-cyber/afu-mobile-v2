# Guia de Integração de Autenticação — AFU Mobile

## 📋 Visão Geral

Este guia documenta a integração completa de autenticação com OAuth, proteção de rotas e cadastro de usuários no AFU Mobile.

---

## 🏗️ Arquitetura

### Componentes

| Componente | Localização | Responsabilidade |
|-----------|------------|-----------------|
| **AuthTextInput** | `components/auth-text-input.tsx` | Input com validação, ícone e toggle de senha |
| **AuthButton** | `components/auth-button.tsx` | Botão com variantes (primary/secondary/outline) |
| **AuthCard** | `components/auth-card.tsx` | Container para formulários de auth |
| **welcome.tsx** | `app/auth/welcome.tsx` | Tela de boas-vindas com features |
| **login-new.tsx** | `app/auth/login-new.tsx` | Tela de login com OAuth e e-mail/senha |
| **cadastro-new.tsx** | `app/auth/cadastro-new.tsx` | Tela de cadastro com seleção de perfil |

### Hooks

| Hook | Localização | Responsabilidade |
|------|------------|-----------------|
| **useAuth** | `hooks/use-auth.ts` | Gerencia estado de autenticação |
| **useSignUp** | `hooks/use-sign-up.ts` | Integra cadastro com API |
| **useAuthMiddleware** | `lib/auth-middleware.ts` | Protege rotas baseado em autenticação |

### Middleware

| Middleware | Localização | Responsabilidade |
|-----------|------------|-----------------|
| **AuthMiddleware** | `lib/auth-middleware.ts` | Redireciona baseado em estado de auth |
| **AuthGuard** | `app/_layout.tsx` | Monitora sessão e redireciona |

---

## 🔐 Fluxo de Autenticação

### 1. Login com OAuth

```
Usuário clica "Entrar com OAuth"
    ↓
startOAuthLogin() abre browser
    ↓
Usuário faz login no OAuth provider
    ↓
Callback retorna para app via deep link
    ↓
/oauth/callback troca código por token
    ↓
Token armazenado em SecureStore (native) ou cookie (web)
    ↓
Usuário redirecionado para dashboard
```

**Arquivos envolvidos:**
- `constants/oauth.ts` — Configuração OAuth
- `app/oauth/callback.tsx` — Handler de callback
- `lib/_core/auth.ts` — Gerenciamento de token

### 2. Login com E-mail/Senha

```
Usuário preenche e-mail e senha
    ↓
Validação local (formato de e-mail, comprimento de senha)
    ↓
POST /api/auth/login com credenciais
    ↓
API retorna token e informações do usuário
    ↓
Token armazenado em SecureStore (native) ou cookie (web)
    ↓
Usuário redirecionado para dashboard
```

**Status:** Em desenvolvimento (TODO)

### 3. Cadastro de Novo Usuário

```
Usuário clica "Criar Conta"
    ↓
Passo 1: Seleciona perfil (produtor/técnico/administrador)
    ↓
Passo 2: Preenche formulário (nome, e-mail, telefone, senha)
    ↓
Validação local completa
    ↓
POST /api/auth/signup com dados
    ↓
API cria usuário e retorna token
    ↓
Token armazenado em SecureStore (native) ou cookie (web)
    ↓
Usuário redirecionado para dashboard
```

**Arquivos envolvidos:**
- `app/auth/cadastro-new.tsx` — Tela de cadastro
- `hooks/use-sign-up.ts` — Hook de integração
- `lib/_core/api.ts` — Cliente de API

---

## 🛡️ Proteção de Rotas

### Rotas Públicas

Acessíveis sem autenticação:
- `/auth/welcome` — Tela de boas-vindas
- `/auth/login-new` — Tela de login
- `/auth/cadastro-new` — Tela de cadastro
- `/oauth/callback` — Callback OAuth

### Rotas Protegidas

Requerem autenticação:
- `/(tabs)/*` — Dashboard e abas
- `/admin/*` — Painel administrativo
- `/propriedades/*` — Gerenciamento de propriedades
- `/cultivos/*` — Gerenciamento de cultivos

### Middleware

O middleware `useAuthMiddleware()` implementa a lógica de proteção:

```typescript
// Se não autenticado e tenta acessar rota protegida
if (!isAuthenticated && inTabsGroup) {
  router.replace('/auth/welcome');
}

// Se autenticado e tenta acessar rota de auth
if (isAuthenticated && inAuthGroup) {
  router.replace('/(tabs)');
}
```

---

## 📱 Componentes de UI

### AuthTextInput

```tsx
<AuthTextInput
  label="E-mail"
  placeholder="seu@email.com"
  value={email}
  onChangeText={setEmail}
  keyboardType="email-address"
  icon="✉️"
  error={errors.email}
/>
```

**Props:**
- `label` — Rótulo do input
- `placeholder` — Placeholder
- `value` — Valor atual
- `onChangeText` — Callback de mudança
- `keyboardType` — Tipo de teclado
- `icon` — Emoji ou ícone
- `error` — Mensagem de erro
- `secureTextEntry` — Ocultar texto (senha)

### AuthButton

```tsx
<AuthButton
  label="Entrar"
  onPress={handleLogin}
  variant="primary"
  size="large"
  icon="👤"
  loading={loading}
  disabled={disabled}
/>
```

**Props:**
- `label` — Texto do botão
- `onPress` — Callback de clique
- `variant` — primary | secondary | outline
- `size` — small | medium | large
- `icon` — Emoji ou ícone
- `loading` — Mostrar loading spinner
- `disabled` — Desabilitar botão

### AuthCard

```tsx
<AuthCard
  title="Faça login"
  subtitle="Use suas credenciais"
  icon="🔐"
>
  {/* Conteúdo */}
</AuthCard>
```

**Props:**
- `title` — Título do card
- `subtitle` — Subtítulo
- `icon` — Emoji ou ícone
- `children` — Conteúdo

---

## 🔌 Integração com API

### Endpoints Necessários

| Endpoint | Método | Responsabilidade |
|----------|--------|-----------------|
| `/api/auth/signup` | POST | Criar novo usuário |
| `/api/auth/login` | POST | Autenticar com e-mail/senha |
| `/api/auth/logout` | POST | Fazer logout |
| `/api/auth/me` | GET | Obter usuário autenticado |
| `/api/oauth/mobile` | GET | Trocar código OAuth por token |
| `/api/oauth/callback` | GET | Callback OAuth (web) |

### Exemplo de Requisição

```typescript
// Cadastro
POST /api/auth/signup
{
  "name": "João Silva",
  "email": "joao@example.com",
  "phone": "11999999999",
  "password": "senha123",
  "profile": "produtor"
}

// Resposta
{
  "sessionToken": "token-abc123",
  "user": {
    "id": 1,
    "email": "joao@example.com",
    "name": "João Silva",
    "openId": "oauth-id",
    "loginMethod": "email",
    "lastSignedIn": "2026-06-21T15:45:00Z"
  }
}
```

---

## 🧪 Testes

Suite de testes em `tests/auth-flow.test.ts`:

- ✅ Validação de e-mail
- ✅ Validação de senha
- ✅ Validação de nome
- ✅ Validação de telefone
- ✅ Validação de perfil
- ✅ Validação de termos
- ✅ Fluxo de OAuth
- ✅ Middleware de proteção de rotas

**Executar testes:**

```bash
pnpm test
```

---

## 🚀 Próximos Passos

### Fase 1: Implementação Atual ✅
- [x] Telas de autenticação (welcome, login, cadastro)
- [x] Componentes reutilizáveis (AuthTextInput, AuthButton, AuthCard)
- [x] Integração com OAuth
- [x] Proteção de rotas
- [x] Hook useSignUp para cadastro
- [x] Testes de autenticação

### Fase 2: Melhorias Futuras
- [ ] Login com e-mail/senha (backend)
- [ ] Recuperação de senha
- [ ] Autenticação biométrica (Face ID/Touch ID)
- [ ] Autenticação de dois fatores (2FA)
- [ ] Integração com Google/GitHub/Apple

### Fase 3: Segurança
- [ ] Rate limiting em endpoints de auth
- [ ] CSRF protection
- [ ] Session timeout
- [ ] Refresh token rotation
- [ ] Audit logging

---

## 📚 Referências

- [Expo Router Documentation](https://docs.expo.dev/routing/introduction/)
- [React Native Authentication](https://reactnative.dev/docs/security)
- [OAuth 2.0 Flow](https://tools.ietf.org/html/rfc6749)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

## 🤝 Suporte

Para dúvidas ou problemas com autenticação, consulte:
- Logs de desenvolvimento em `.manus-logs/devserver.log`
- Console do navegador (web)
- Xcode debugger (iOS)
- Android Studio debugger (Android)
