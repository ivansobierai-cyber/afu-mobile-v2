# Guia de Configuração — SendGrid para Recuperação de Senha

## Visão Geral

Este guia descreve como configurar o SendGrid para enviar e-mails de recuperação de senha automaticamente.

---

## 1. Criar Conta SendGrid

### Passo 1: Registrar-se

1. Acesse [sendgrid.com](https://sendgrid.com)
2. Clique em **"Sign Up"**
3. Preencha o formulário com seus dados
4. Confirme seu e-mail

### Passo 2: Configurar Sender

1. No dashboard, vá para **Settings → Sender Authentication**
2. Clique em **"Create New Sender"**
3. Preencha com seus dados:
   - **From Email Address**: `noreply@seudominio.com`
   - **From Name**: `AFU Mobile`
   - **Reply To Email**: `suporte@seudominio.com`
4. Clique em **"Create"**
5. Confirme o e-mail de verificação

---

## 2. Obter API Key

### Passo 1: Gerar API Key

1. No dashboard, vá para **Settings → API Keys**
2. Clique em **"Create API Key"**
3. Selecione **"Full Access"** (ou customize permissões)
4. Dê um nome: `AFU Mobile Production`
5. Clique em **"Create & View"**
6. **Copie a chave** (aparece apenas uma vez)

### Passo 2: Guardar em Local Seguro

Nunca compartilhe sua API key. Armazene em:
- Arquivo `.env.local` (desenvolvimento)
- Variáveis de ambiente do servidor (produção)
- Secrets do Manus (recomendado)

---

## 3. Configurar Variáveis de Ambiente

### Desenvolvimento

Crie arquivo `.env.local` na raiz do projeto:

```bash
# SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@seudominio.com

# Aplicação
APP_URL=https://localhost:3000
```

### Produção

Configure no seu servidor/plataforma:

```bash
# Manus Secrets
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@seudominio.com
APP_URL=https://afumobile.com
```

---

## 4. Testar Integração

### Teste 1: Verificar Configuração

```bash
# No servidor
node -e "console.log(process.env.SENDGRID_API_KEY ? 'OK' : 'NÃO CONFIGURADO')"
```

### Teste 2: Solicitar Reset de Senha

1. Acesse a tela de login
2. Clique em **"Esqueceu a senha?"**
3. Digite seu e-mail
4. Clique em **"Enviar Link de Recuperação"**
5. Verifique seu e-mail (pode levar 1-2 minutos)

### Teste 3: Verificar Logs

```bash
# Verificar logs do servidor
tail -f .manus-logs/devserver.log | grep -i email
```

Procure por mensagens como:
```
[Email] E-mail enviado com sucesso. ID: ...
[PasswordReset] E-mail enviado com sucesso para: ...
```

---

## 5. Troubleshooting

### "SendGrid não configurado"

**Problema:** Mensagem "SendGrid não configurado. E-mails não serão enviados."

**Solução:**
1. Verifique se `SENDGRID_API_KEY` está definida
2. Reinicie o servidor: `pnpm dev`
3. Verifique `.env.local` ou variáveis de ambiente

### "E-mail inválido"

**Problema:** Erro "E-mail inválido" ao solicitar reset

**Solução:**
1. Verifique o formato do e-mail
2. Certifique-se de que o e-mail existe no banco de dados
3. Tente com outro e-mail

### "Falha ao enviar e-mail"

**Problema:** E-mail não chega ao usuário

**Solução:**
1. Verifique a API key do SendGrid
2. Verifique se o sender foi autenticado
3. Verifique a pasta de spam
4. Consulte logs do SendGrid: **Activity → Email Activity**

### "Erro 401: Unauthorized"

**Problema:** SendGrid retorna erro de autenticação

**Solução:**
1. Verifique se a API key está correta
2. Verifique se a API key não expirou
3. Gere uma nova API key

### "Erro 403: Forbidden"

**Problema:** SendGrid retorna erro de permissão

**Solução:**
1. Verifique se a API key tem permissão de envio
2. Verifique se o sender foi autenticado
3. Verifique se o domínio está verificado

---

## 6. Monitorar Envios

### Dashboard SendGrid

1. Acesse **Activity → Email Activity**
2. Veja todos os e-mails enviados
3. Verifique status (Delivered, Bounced, etc)

### Métricas Importantes

| Métrica | Descrição |
|---------|-----------|
| **Delivered** | E-mail entregue com sucesso |
| **Opened** | Usuário abriu o e-mail |
| **Clicked** | Usuário clicou em um link |
| **Bounced** | E-mail não foi entregue |
| **Dropped** | E-mail foi descartado |
| **Spam Report** | Usuário marcou como spam |

---

## 7. Melhores Práticas

### 1. Usar Domínio Próprio

```bash
# ❌ Evite
SENDGRID_FROM_EMAIL=noreply@sendgrid.net

# ✅ Use
SENDGRID_FROM_EMAIL=noreply@seudominio.com
```

### 2. Autenticar Domínio

1. Vá para **Settings → Sender Authentication**
2. Clique em **"Authenticate Your Domain"**
3. Siga as instruções para adicionar registros DNS
4. Verifique após 24-48 horas

### 3. Monitorar Taxa de Rejeição

```bash
# Manter abaixo de 5%
Bounced / Total Sent < 0.05
```

### 4. Implementar Unsubscribe

Adicionar link de unsubscribe em todos os e-mails (legal requirement):

```html
<a href="https://app.example.com/unsubscribe?token=xxx">
  Desinscrever-se
</a>
```

### 5. Testar Antes de Produção

Sempre testar em desenvolvimento com e-mail de teste:

```bash
SENDGRID_API_KEY=test-key
# Usar e-mail de teste: test@example.com
```

---

## 8. Limites e Quotas

### Plano Gratuito

- **Limite**: 100 e-mails/dia
- **Duração**: Permanente
- **Ideal para**: Desenvolvimento e testes

### Plano Pago

- **Limite**: Conforme plano contratado
- **Escalável**: Aumenta conforme necessário
- **Ideal para**: Produção

---

## 9. Integração com Código

### Usar Serviço de E-mail

```typescript
import { sendPasswordResetEmail } from '@/server/email-service';

// Enviar e-mail de reset
const result = await sendPasswordResetEmail(
  'user@example.com',
  'token-abc123',
  'https://app.example.com'
);

if (result.success) {
  console.log('E-mail enviado:', result.messageId);
} else {
  console.error('Erro:', result.error);
}
```

### Verificar Status

```typescript
import { isSendGridReady, getEmailServiceStatus } from '@/server/email-service';

// Verificar se SendGrid está pronto
if (isSendGridReady()) {
  console.log('SendGrid está configurado e pronto');
} else {
  console.log('SendGrid não está configurado');
}

// Obter status completo
const status = getEmailServiceStatus();
console.log(status);
// {
//   ready: true,
//   apiKeyConfigured: true,
//   fromEmailConfigured: true,
//   appUrl: 'https://app.example.com'
// }
```

---

## 10. Próximas Melhorias

1. **Templates Dinâmicos** — Usar SendGrid Dynamic Templates
2. **Webhooks** — Receber eventos de entrega/abertura
3. **Unsubscribe Management** — Gerenciar preferências de e-mail
4. **A/B Testing** — Testar diferentes versões de e-mail
5. **Analytics** — Integrar com Google Analytics

---

## Referências

- [SendGrid Documentation](https://docs.sendgrid.com)
- [SendGrid API Reference](https://docs.sendgrid.com/api-reference)
- [Node.js SendGrid Library](https://github.com/sendgrid/sendgrid-nodejs)
- [Email Best Practices](https://docs.sendgrid.com/ui/sending-email/email-best-practices)
