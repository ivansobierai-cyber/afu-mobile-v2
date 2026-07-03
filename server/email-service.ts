import sgMail from '@sendgrid/mail';

/**
 * Serviço de Envio de E-mails com SendGrid
 *
 * Oferece:
 * - Envio de e-mails com templates HTML
 * - Retry automático com backoff exponencial
 * - Tratamento de erros
 * - Logging de eventos
 */

// Inicializar SendGrid
const initializeSendGrid = () => {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.warn('[SendGrid] SENDGRID_API_KEY não configurada. E-mails não serão enviados.');
    return false;
  }
  sgMail.setApiKey(apiKey);
  return true;
};

const sendGridReady = initializeSendGrid();

/**
 * Interface para envio de e-mail
 */
interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  text?: string;
}

/**
 * Resultado do envio de e-mail
 */
interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Enviar e-mail com retry automático
 *
 * @param options - Opções de envio
 * @param maxRetries - Número máximo de tentativas (padrão: 3)
 * @returns Resultado do envio
 */
export async function sendEmail(
  options: EmailOptions,
  maxRetries: number = 3
): Promise<EmailResult> {
  const { to, subject, html, from, replyTo, text } = options;

  // Validar e-mail antes de checar SendGrid
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    console.error('[Email] E-mail inválido:', to);
    return {
      success: false,
      error: 'E-mail inválido',
    };
  }

  // Se SendGrid não está configurado, retornar erro
  if (!sendGridReady) {
    console.warn('[Email] SendGrid não configurado. E-mail não foi enviado.');
    return {
      success: false,
      error: 'SendGrid não configurado',
    };
  }

  const fromEmail = from || process.env.SENDGRID_FROM_EMAIL || 'noreply@afumobile.com';

  // Tentar enviar com retry
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Email] Tentativa ${attempt}/${maxRetries} — Enviando para ${to}`);

      const response = await sgMail.send({
        to,
        from: fromEmail,
        subject,
        html,
        text: text || stripHtml(html), // Fallback para texto simples
        replyTo: replyTo || fromEmail,
      });

      const messageId = response[0]?.headers?.['x-message-id'];
      console.log(`[Email] E-mail enviado com sucesso. ID: ${messageId}`);

      return {
        success: true,
        messageId,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Erro desconhecido';
      console.error(`[Email] Erro na tentativa ${attempt}/${maxRetries}:`, errorMessage);

      // Se for última tentativa, retornar erro
      if (attempt === maxRetries) {
        return {
          success: false,
          error: errorMessage,
        };
      }

      // Aguardar antes de tentar novamente (backoff exponencial)
      const delayMs = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
      console.log(`[Email] Aguardando ${delayMs}ms antes de tentar novamente...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return {
    success: false,
    error: 'Falha ao enviar e-mail após múltiplas tentativas',
  };
}

/**
 * Remover tags HTML de uma string
 *
 * @param html - String com HTML
 * @returns String sem HTML
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '') // Remove tags HTML
    .replace(/&nbsp;/g, ' ') // Substitui &nbsp; por espaço
    .replace(/&lt;/g, '<') // Substitui &lt; por <
    .replace(/&gt;/g, '>') // Substitui &gt; por >
    .replace(/&amp;/g, '&') // Substitui &amp; por &
    .trim();
}

/**
 * Enviar e-mail de recuperação de senha
 *
 * @param email - E-mail do usuário
 * @param resetToken - Token de reset
 * @param appUrl - URL da aplicação (ex: https://app.example.com)
 * @returns Resultado do envio
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  appUrl: string = process.env.APP_URL || 'https://afumobile.com'
): Promise<EmailResult> {
  const resetLink = `${appUrl}/auth/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2d5016 0%, #3d7a1f 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #2d5016; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
        .button:hover { background: #1f3810; }
        .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
        .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .code { background: #f0f0f0; padding: 10px; border-radius: 4px; font-family: monospace; word-break: break-all; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌱 AFU Mobile</h1>
          <p>Recuperação de Senha</p>
        </div>

        <div class="content">
          <p>Olá,</p>

          <p>Recebemos uma solicitação para recuperar a senha da sua conta. Se você não fez essa solicitação, ignore este e-mail.</p>

          <p>Para redefinir sua senha, clique no botão abaixo:</p>

          <div style="text-align: center;">
            <a href="${resetLink}" class="button">Redefinir Senha</a>
          </div>

          <p>Ou copie e cole este link no seu navegador:</p>
          <div class="code">${resetLink}</div>

          <div class="warning">
            <strong>⚠️ Importante:</strong> Este link é válido por <strong>1 hora</strong>. Após esse período, você precisará solicitar um novo link de recuperação.
          </div>

          <p>Se você tiver dúvidas ou problemas, entre em contato com nosso suporte técnico.</p>

          <p>Atenciosamente,<br><strong>Equipe AFU Mobile</strong></p>
        </div>

        <div class="footer">
          <p>Este é um e-mail automático. Por favor, não responda diretamente.</p>
          <p>&copy; 2026 AFU Mobile. Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: '🔐 Recuperar Senha — AFU Mobile',
    html,
    text: `
Olá,

Recebemos uma solicitação para recuperar a senha da sua conta.

Para redefinir sua senha, clique no link abaixo:
${resetLink}

Este link é válido por 1 hora.

Atenciosamente,
Equipe AFU Mobile
    `.trim(),
  });
}

/**
 * Enviar e-mail de boas-vindas
 *
 * @param email - E-mail do usuário
 * @param name - Nome do usuário
 * @returns Resultado do envio
 */
export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<EmailResult> {
  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2d5016 0%, #3d7a1f 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .feature { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #2d5016; }
        .feature strong { color: #2d5016; }
        .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌱 Bem-vindo ao AFU Mobile!</h1>
        </div>

        <div class="content">
          <p>Olá <strong>${name}</strong>,</p>

          <p>Sua conta foi criada com sucesso! Você agora tem acesso a todas as funcionalidades do AFU Mobile.</p>

          <h3>O que você pode fazer:</h3>

          <div class="feature">
            <strong>📸 Análise por Foto</strong><br>
            Tire uma foto de suas plantas e receba diagnóstico instantâneo de doenças, pragas e deficiências nutricionais.
          </div>

          <div class="feature">
            <strong>🌾 Gerenciar Cultivos</strong><br>
            Organize suas propriedades e cultivos com informações detalhadas sobre cada um.
          </div>

          <div class="feature">
            <strong>📚 Materiais Didáticos</strong><br>
            Acesse guias completos sobre culturas, pragas, doenças e técnicas agrícolas.
          </div>

          <div class="feature">
            <strong>📅 Calendário Agrícola</strong><br>
            Planeje suas atividades com base no calendário agrícola personalizado.
          </div>

          <p>Se você tiver dúvidas ou precisar de ajuda, não hesite em entrar em contato com nosso suporte.</p>

          <p>Atenciosamente,<br><strong>Equipe AFU Mobile</strong></p>
        </div>

        <div class="footer">
          <p>Este é um e-mail automático. Por favor, não responda diretamente.</p>
          <p>&copy; 2026 AFU Mobile. Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: '👋 Bem-vindo ao AFU Mobile!',
    html,
    text: `
Olá ${name},

Sua conta foi criada com sucesso! Você agora tem acesso a todas as funcionalidades do AFU Mobile.

Funcionalidades disponíveis:
- Análise por Foto: Diagnóstico instantâneo de doenças, pragas e deficiências
- Gerenciar Cultivos: Organize suas propriedades e cultivos
- Materiais Didáticos: Guias completos sobre culturas e técnicas
- Calendário Agrícola: Planeje suas atividades

Atenciosamente,
Equipe AFU Mobile
    `.trim(),
  });
}

/**
 * Verificar se SendGrid está configurado
 *
 * @returns true se SendGrid está pronto para usar
 */
export function isSendGridReady(): boolean {
  return sendGridReady;
}

/**
 * Obter status do serviço de e-mail
 *
 * @returns Objeto com status
 */
export function getEmailServiceStatus() {
  return {
    ready: sendGridReady,
    apiKeyConfigured: !!process.env.SENDGRID_API_KEY,
    fromEmailConfigured: !!process.env.SENDGRID_FROM_EMAIL,
    appUrl: process.env.APP_URL || 'não configurada',
  };
}
