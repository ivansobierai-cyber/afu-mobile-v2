/**
 * Funções para recuperação de senha
 * - Gerar token de reset com expiração
 * - Validar token de reset
 * - Enviar e-mail com link de reset
 */

import { randomBytes } from 'crypto';
import { getDb } from './db';
import { users } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { sendPasswordResetEmail, isSendGridReady } from './email-service';

/**
 * Gerar token de reset de senha
 * Token válido por 1 hora
 */
export function generateResetToken(): { token: string; expiresAt: Date } {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  return { token, expiresAt };
}

/**
 * Solicitar reset de senha
 * Gera token, salva no banco e retorna sucesso
 */
export async function requestPasswordReset(email: string): Promise<{
  success: boolean;
  message: string;
  token?: string;
}> {
  try {
    // Verificar se usuário existe
    const db = await getDb();
    if (!db) {
      return {
        success: false,
        message: 'Banco de dados não disponível.',
      };
    }

    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = result.length > 0 ? result[0] : null;

    if (!user) {
      // Não revelar se e-mail existe ou não (segurança)
      return {
        success: true,
        message: 'Se o e-mail existe em nossa base de dados, você receberá um link de recuperação.',
      };
    }

    // Gerar token
    const { token, expiresAt } = generateResetToken();

    // Salvar token no banco
    await db.update(users).set({
      resetToken: token,
      resetTokenExpiry: expiresAt,
    }).where(eq(users.id, user.id));

    // Enviar e-mail com link de reset
    const appUrl = process.env.APP_URL || 'https://afumobile.com';
    const emailResult = await sendPasswordResetEmail(email, token, appUrl);

    const { safeLogger } = await import("./_core/safe-logger");
    if (emailResult.success) {
      safeLogger.info("[PasswordReset] E-mail de recuperação enviado", {
        emailDomain: email.split("@")[1] ?? "unknown",
      });
    } else {
      safeLogger.warn("[PasswordReset] Falha ao enviar e-mail", {
        error: emailResult.error,
      });
    }

    // Etapa 9 — nunca logar o token/senha em claro
    safeLogger.info("[PasswordReset] Token gerado", {
      expiresAt: expiresAt.toISOString(),
      sendGridReady: isSendGridReady(),
    });

    return {
      success: true,
      message: 'Se o e-mail existe em nossa base de dados, você receberá um link de recuperação.',
      token: isSendGridReady() ? undefined : token, // Retornar token apenas em desenvolvimento
    };
  } catch (error) {
    const { safeLogger } = await import("./_core/safe-logger");
    safeLogger.error("[PasswordReset] Erro ao solicitar reset", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return {
      success: false,
      message: 'Erro ao processar solicitação de recuperação de senha.',
    };
  }
}

/**
 * Validar token de reset
 */
export async function validateResetToken(token: string): Promise<{
  valid: boolean;
  userId?: number;
  message: string;
}> {
  try {
    // Buscar usuário com token
    const db = await getDb();
    if (!db) {
      return {
        valid: false,
        message: 'Banco de dados não disponível.',
      };
    }

    const result = await db.select().from(users).where(eq(users.resetToken, token)).limit(1);
    const user = result.length > 0 ? result[0] : null;

    if (!user) {
      return {
        valid: false,
        message: 'Token inválido ou expirado.',
      };
    }

    // Verificar expiração
    if (!user.resetTokenExpiry || new Date() > user.resetTokenExpiry) {
      // Limpar token expirado
      await db.update(users).set({
        resetToken: null,
        resetTokenExpiry: null,
      }).where(eq(users.id, user.id));

      return {
        valid: false,
        message: 'Token expirado. Solicite um novo link de recuperação.',
      };
    }

    return {
      valid: true,
      userId: user.id,
      message: 'Token válido.',
    };
  } catch (error) {
    console.error('[PasswordReset] Erro ao validar token:', error);
    return {
      valid: false,
      message: 'Erro ao validar token.',
    };
  }
}

/**
 * Resetar senha com token válido
 */
export async function resetPasswordWithToken(
  token: string,
  newPassword: string,
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // Validar token
    const validation = await validateResetToken(token);
    if (!validation.valid || !validation.userId) {
      return {
        success: false,
        message: validation.message,
      };
    }

    // Validar nova senha
    if (!newPassword || newPassword.length < 6) {
      return {
        success: false,
        message: 'Senha deve ter no mínimo 6 caracteres.',
      };
    }

    // Hash da nova senha
    const { hashPassword } = await import('./db-auth');
    const passwordHash = await hashPassword(newPassword);

    // Obter db
    const db = await getDb();
    if (!db) {
      return {
        success: false,
        message: 'Banco de dados não disponível.',
      };
    }

    // Atualizar senha e limpar token
    await db.update(users).set({
      passwordHash,
      resetToken: null,
      resetTokenExpiry: null,
    }).where(eq(users.id, validation.userId));

    console.log('[PasswordReset] Senha resetada para usuário:', validation.userId);

    return {
      success: true,
      message: 'Senha alterada com sucesso.',
    };
  } catch (error) {
    console.error('[PasswordReset] Erro ao resetar senha:', error);
    return {
      success: false,
      message: 'Erro ao resetar senha.',
    };
  }
}
