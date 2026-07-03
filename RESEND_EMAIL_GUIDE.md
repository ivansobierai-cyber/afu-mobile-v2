# Guia de Reenvio de E-mail com Cooldown

## Visão Geral

Este guia descreve o sistema de reenvio de e-mail com proteção contra spam implementado na tela de recuperação de senha.

---

## Funcionalidades

### 1. Cooldown de Reenvio

Após enviar o primeiro e-mail de recuperação, o usuário deve aguardar um tempo determinado antes de poder reenviar.

**Configuração padrão:** 60 segundos

**Benefícios:**
- Previne spam de e-mails
- Reduz carga no servidor
- Melhora experiência do usuário

### 2. Limite de Tentativas

Cada usuário tem um limite máximo de tentativas de reenvio dentro de um período.

**Configuração padrão:** 5 tentativas

**Comportamento:**
- Após 5 tentativas, o usuário é bloqueado
- Mensagem clara informando o limite atingido
- Sugestão para tentar novamente mais tarde

### 3. Contador Visual

O botão de reenvio exibe um contador visual mostrando o tempo restante.

**Exemplos:**
- "Reenviar em 1:05" (1 minuto e 5 segundos)
- "Reenviar em 30s" (30 segundos)
- "Reenviar E-mail" (pronto para reenviar)

### 4. Persistência de Estado

O estado do cooldown é salvo no localStorage do navegador/dispositivo.

**Dados armazenados:**
- Último horário de envio
- Número de tentativas
- Timestamp do evento

---

## Arquitetura

### Hook: `useResendEmail`

Gerencia toda a lógica de reenvio com cooldown.

**Localização:** `hooks/use-resend-email.ts`

**Funcionalidades:**
- Rastreia último envio
- Gerencia countdown
- Valida e-mail
- Controla limite de tentativas
- Persiste estado em localStorage

**Uso:**

```typescript
import { useResendEmail } from '@/hooks/use-resend-email';

const resendEmail = useResendEmail(email, {
  cooldownDuration: 60,    // Segundos
  maxAttempts: 5,          // Máximo de tentativas
  storageKey: '@afu_resend_email_',
});

// Reenviar e-mail
await resendEmail.resendEmail();

// Verificar estado
console.log(resendEmail.canResend);        // boolean
console.log(resendEmail.cooldownSeconds);  // número
console.log(resendEmail.loading);          // boolean
console.log(resendEmail.error);            // string | null
console.log(resendEmail.success);          // boolean
```

### Endpoint: `auth.resendPasswordReset`

Endpoint tRPC para reenvio de e-mail.

**Localização:** `server/routers/auth-router.ts`

**Requisição:**

```typescript
POST /api/trpc/auth.resendPasswordReset
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Resposta:**

```typescript
{
  "success": true,
  "message": "Se o e-mail existe em nossa base de dados, você receberá um link de recuperação.",
  "token": "abc123..." // Apenas em desenvolvimento
}
```

### Tela: `forgot-password.tsx`

Tela de recuperação de senha com botão de reenvio integrado.

**Localização:** `app/auth/forgot-password.tsx`

**Componentes:**
- Campo de e-mail
- Botão de envio inicial
- Botão de reenvio com contador (após sucesso)
- Mensagens de erro/sucesso

---

## Fluxo de Uso

### 1. Usuário Solicita Reset

```
Usuário digita e-mail → Clica "Enviar Link" → E-mail enviado
```

### 2. Botão de Reenvio Aparece

Após sucesso, o botão de reenvio fica visível com contador:

```
"Reenviar em 1:00" (desabilitado)
↓ (após 1 segundo)
"Reenviar em 0:59" (desabilitado)
↓ (após 59 segundos)
"Reenviar E-mail" (habilitado)
```

### 3. Usuário Clica Reenviar

```
Clica "Reenviar E-mail" → E-mail reenviado → Contador reinicia
```

---

## Configuração

### Alterar Duração do Cooldown

**Padrão:** 60 segundos

**Arquivo:** `app/auth/forgot-password.tsx`

```typescript
const resendEmail = useResendEmail(email, {
  cooldownDuration: 120, // 2 minutos
});
```

### Alterar Limite de Tentativas

**Padrão:** 5 tentativas

**Arquivo:** `app/auth/forgot-password.tsx`

```typescript
const resendEmail = useResendEmail(email, {
  maxAttempts: 10, // 10 tentativas
});
```

### Alterar Chave de Armazenamento

**Padrão:** `@afu_resend_email_`

**Arquivo:** `app/auth/forgot-password.tsx`

```typescript
const resendEmail = useResendEmail(email, {
  storageKey: '@custom_resend_key_',
});
```

---

## Tratamento de Erros

### Erro: "E-mail inválido"

**Causa:** Formato de e-mail incorreto

**Solução:** Validar e-mail antes de reenviar

### Erro: "Aguarde Xs antes de tentar novamente"

**Causa:** Cooldown ainda ativo

**Solução:** Aguardar o tempo indicado

### Erro: "Limite de 5 tentativas atingido"

**Causa:** Usuário excedeu limite de tentativas

**Solução:** Tentar novamente mais tarde ou contatar suporte

### Erro: "Erro ao reenviar e-mail"

**Causa:** Falha na API ou SendGrid

**Solução:** Verificar logs do servidor e status do SendGrid

---

## Boas Práticas

### 1. Cooldown Apropriado

```typescript
// ❌ Muito curto (spam)
cooldownDuration: 5

// ✅ Apropriado
cooldownDuration: 60

// ✅ Conservador
cooldownDuration: 120
```

### 2. Limite de Tentativas

```typescript
// ❌ Muito alto (spam)
maxAttempts: 100

// ✅ Apropriado
maxAttempts: 5

// ✅ Conservador
maxAttempts: 3
```

### 3. Mensagens Claras

```typescript
// ❌ Confuso
"Reenviar em 1:05"

// ✅ Claro
"Reenviar em 1:05"

// ✅ Muito claro
"Reenviar E-mail em 1:05"
```

### 4. Feedback Visual

```typescript
// ❌ Sem feedback
<Button disabled={!canResend} />

// ✅ Com feedback
<Button
  disabled={!canResend}
  icon={canResend ? '🔄' : '⏳'}
  label={getCooldownMessage(cooldownSeconds)}
/>
```

---

## Testes

### Testar Cooldown

```typescript
import { useResendEmail } from '@/hooks/use-resend-email';

// Criar hook com cooldown curto para testes
const resendEmail = useResendEmail('test@example.com', {
  cooldownDuration: 5, // 5 segundos
});

// Reenviar e-mail
await resendEmail.resendEmail();

// Verificar que cooldown está ativo
expect(resendEmail.canResend).toBe(false);
expect(resendEmail.cooldownSeconds).toBeGreaterThan(0);

// Aguardar 5 segundos
await new Promise(resolve => setTimeout(resolve, 5000));

// Verificar que cooldown expirou
expect(resendEmail.canResend).toBe(true);
expect(resendEmail.cooldownSeconds).toBe(0);
```

### Testar Limite de Tentativas

```typescript
// Simular 5 tentativas
for (let i = 0; i < 5; i++) {
  await resendEmail.resendEmail();
}

// Verificar que está bloqueado
expect(resendEmail.error).toContain('Limite');
```

### Testar Validação de E-mail

```typescript
// E-mail inválido
const resendEmail = useResendEmail('invalid-email');
await resendEmail.resendEmail();

// Verificar erro
expect(resendEmail.error).toContain('inválido');
```

---

## Monitoramento

### Logs do Cliente

```typescript
[ResendEmail] E-mail reenviado com sucesso
[ResendEmail] Erro: Limite de tentativas atingido
[ResendEmail] Erro ao carregar estado
```

### Logs do Servidor

```typescript
[PasswordReset] Token gerado para: user@example.com
[PasswordReset] E-mail enviado com sucesso para: user@example.com
[PasswordReset] Erro ao enviar e-mail: ...
```

---

## Próximas Melhorias

1. **Backend Rate Limiting** — Implementar rate limiting no servidor
2. **IP-based Blocking** — Bloquear IPs com múltiplas tentativas
3. **CAPTCHA** — Adicionar CAPTCHA após 3 tentativas
4. **Email Verification** — Verificar se e-mail é válido antes de enviar
5. **Analytics** — Rastrear estatísticas de reenvio

---

## Referências

- [Hook useResendEmail](./hooks/use-resend-email.ts)
- [Tela forgot-password.tsx](./app/auth/forgot-password.tsx)
- [Endpoint auth.resendPasswordReset](./server/routers/auth-router.ts)
- [Testes resend-email.test.ts](./tests/resend-email.test.ts)
