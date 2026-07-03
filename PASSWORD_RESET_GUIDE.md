# Guia de Recuperação de Senha

## Visão Geral

O sistema de recuperação de senha oferece um fluxo seguro e intuitivo para usuários redefinir suas senhas quando as esquecem.

---

## Arquitetura

### 1. **Schema do Banco de Dados**

Campos adicionados à tabela `users`:

```sql
ALTER TABLE `users` ADD `resetToken` varchar(255);
ALTER TABLE `users` ADD `resetTokenExpiry` timestamp;
ALTER TABLE `users` ADD CONSTRAINT `users_resetToken_unique` UNIQUE(`resetToken`);
```

### 2. **Funções de Backend** (`server/password-reset.ts`)

#### `generateResetToken()`
- Gera token aleatório de 64 caracteres (hex)
- Token válido por **1 hora**
- Retorna: `{ token, expiresAt }`

#### `requestPasswordReset(email: string)`
- Verifica se e-mail existe no banco
- Gera token e salva no banco
- **Não revela** se e-mail existe (segurança)
- Retorna: `{ success, message, token? }`

#### `validateResetToken(token: string)`
- Busca usuário com token
- Verifica expiração
- Limpa tokens expirados
- Retorna: `{ valid, userId?, message }`

#### `resetPasswordWithToken(token: string, newPassword: string)`
- Valida token
- Valida nova senha (mín. 6 caracteres)
- Hash da nova senha com PBKDF2
- Limpa token após reset
- Retorna: `{ success, message }`

### 3. **Endpoints tRPC** (`server/routers/auth-router.ts`)

#### `POST /api/trpc/auth.forgotPassword`

**Input:**
```typescript
{
  email: string; // E-mail do usuário
}
```

**Output:**
```typescript
{
  success: boolean;
  message: string;
  token?: string; // Apenas em desenvolvimento
}
```

**Exemplo:**
```bash
curl -X POST http://localhost:3000/api/trpc/auth.forgotPassword \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

#### `GET /api/trpc/auth.validateResetToken`

**Input:**
```typescript
{
  token: string; // Token de reset
}
```

**Output:**
```typescript
{
  valid: boolean;
  userId?: number;
  message: string;
}
```

#### `POST /api/trpc/auth.resetPassword`

**Input:**
```typescript
{
  token: string;
  newPassword: string;
  confirmPassword: string;
}
```

**Output:**
```typescript
{
  success: boolean;
  message: string;
}
```

---

## Fluxo de Usuário

### 1. **Solicitação de Reset**

```
Usuário clica "Esqueceu a senha?" no login
         ↓
Tela forgot-password.tsx
         ↓
Usuário digita e-mail
         ↓
POST /api/trpc/auth.forgotPassword
         ↓
Sistema envia e-mail com link de reset
         ↓
Usuário recebe e-mail
```

### 2. **Redefinição de Senha**

```
Usuário clica link no e-mail
         ↓
Tela reset-password.tsx com token na URL
         ↓
GET /api/trpc/auth.validateResetToken (valida token)
         ↓
Se válido: Usuário digita nova senha
         ↓
POST /api/trpc/auth.resetPassword
         ↓
Senha redefinida com sucesso
         ↓
Redireciona para login
```

---

## Telas

### `app/auth/forgot-password.tsx`

**Componentes:**
- Input de e-mail
- Validação de e-mail
- Botão "Enviar Link de Recuperação"
- Link para voltar ao login
- Mensagens de sucesso/erro

**Comportamento:**
- Valida e-mail antes de enviar
- Exibe mensagem de sucesso após envio
- Oferece opção de ir para tela de reset (desenvolvimento)
- Em produção, usuário clica no link do e-mail

### `app/auth/reset-password.tsx`

**Componentes:**
- Validação de token ao carregar
- Inputs de nova senha e confirmação
- Botão "Redefinir Senha"
- Link para voltar ao login
- Mensagens de erro/sucesso

**Comportamento:**
- Valida token automaticamente ao carregar
- Exibe mensagem se token expirou
- Oferece opção de solicitar novo link
- Valida senhas antes de enviar
- Redireciona para login após sucesso

---

## Segurança

### 1. **Geração de Token**
- Token aleatório de 64 caracteres (256 bits)
- Gerado com `crypto.randomBytes(32).toString('hex')`
- Único por usuário (constraint UNIQUE no banco)

### 2. **Expiração**
- Token válido por **1 hora**
- Verificado em cada validação
- Tokens expirados são automaticamente limpos

### 3. **Hash de Senha**
- Novo hash gerado com PBKDF2
- Salt aleatório por usuário
- Nunca armazenar senhas em plain text

### 4. **Privacidade**
- Não revelar se e-mail existe no banco
- Mensagem genérica para ambos os casos
- Previne enumeração de usuários

### 5. **HTTPS**
- Todos os endpoints devem usar HTTPS em produção
- Tokens nunca devem ser transmitidos em plain text
- Cookies devem ter flag `Secure`

---

## Implementação de E-mail

### TODO: Integração com Serviço de E-mail

Atualmente, o sistema **não envia e-mails**. Para ativar:

1. **Escolher provedor:**
   - SendGrid
   - AWS SES
   - Mailgun
   - Resend

2. **Implementar função `sendEmail()`:**

```typescript
// server/email.ts
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  // Implementar com provedor escolhido
}
```

3. **Usar em `requestPasswordReset()`:**

```typescript
const resetLink = `${process.env.APP_URL}/auth/reset-password?token=${token}`;
await sendEmail(
  email,
  'Recuperar Senha — AFU Mobile',
  `
    <p>Clique no link abaixo para recuperar sua senha:</p>
    <a href="${resetLink}">Redefinir Senha</a>
    <p>Link válido por 1 hora.</p>
  `
);
```

---

## Testes

### Teste Manual

1. **Solicitar reset:**
   ```bash
   curl -X POST http://localhost:3000/api/trpc/auth.forgotPassword \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   ```

2. **Copiar token da resposta**

3. **Validar token:**
   ```bash
   curl "http://localhost:3000/api/trpc/auth.validateResetToken?input=%7B%22token%22:%22<TOKEN>%22%7D"
   ```

4. **Resetar senha:**
   ```bash
   curl -X POST http://localhost:3000/api/trpc/auth.resetPassword \
     -H "Content-Type: application/json" \
     -d '{
       "token":"<TOKEN>",
       "newPassword":"newpass123",
       "confirmPassword":"newpass123"
     }'
   ```

### Testes Automatizados

Veja `tests/password-reset.test.ts` para suite completa de testes.

---

## Troubleshooting

### "Token inválido ou expirado"
- Verificar se token foi copiado corretamente
- Verificar se 1 hora já passou desde geração
- Solicitar novo link

### "Banco de dados não disponível"
- Verificar conexão com banco de dados
- Verificar se migrations foram aplicadas
- Verificar variáveis de ambiente

### "Senhas não conferem"
- Verificar se ambas as senhas foram digitadas corretamente
- Verificar se não há espaços extras
- Tentar novamente

---

## Próximas Melhorias

1. **Envio de E-mail Real** — Integrar com SendGrid/AWS SES
2. **Rate Limiting** — Limitar tentativas de reset por IP
3. **Auditoria** — Registrar tentativas de reset no banco
4. **2FA** — Adicionar autenticação de dois fatores
5. **Biometria** — Permitir login com Face ID/Touch ID após reset
