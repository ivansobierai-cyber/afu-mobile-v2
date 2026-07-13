import { useState, useEffect, useCallback } from 'react';
import { apiCall } from '@/lib/_core/api';

/**
 * Hook para reenvio de e-mail com cooldown
 *
 * Funcionalidades:
 * - Rastreia último envio para evitar spam
 * - Countdown visual até poder reenviar
 * - Persistência em AsyncStorage
 * - Validação de e-mail
 */

interface ResendEmailState {
  loading: boolean;
  error: string | null;
  success: boolean;
  lastResendTime: number | null;
  cooldownSeconds: number;
  canResend: boolean;
}

interface ResendEmailOptions {
  cooldownDuration?: number; // Duração do cooldown em segundos (padrão: 60)
  maxAttempts?: number; // Máximo de tentativas (padrão: 5)
  storageKey?: string; // Chave para AsyncStorage
}

const DEFAULT_COOLDOWN = 60; // 60 segundos
const DEFAULT_MAX_ATTEMPTS = 5;
const STORAGE_KEY = '@afu_resend_email_';

/**
 * Hook para gerenciar reenvio de e-mail com cooldown
 *
 * @param email - E-mail do usuário
 * @param options - Opções de configuração
 * @returns Estado e funções de controle
 */
export function useResendEmail(
  email: string,
  options: ResendEmailOptions = {}
) {
  const {
    cooldownDuration = DEFAULT_COOLDOWN,
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    storageKey = STORAGE_KEY,
  } = options;

  const [state, setState] = useState<ResendEmailState>({
    loading: false,
    error: null,
    success: false,
    lastResendTime: null,
    cooldownSeconds: 0,
    canResend: true,
  });

  // Carregar estado do AsyncStorage ao montar
  useEffect(() => {
    loadResendState();
  }, [email]);

  // Timer para countdown
  useEffect(() => {
    if (state.cooldownSeconds <= 0) return;

    const interval = setInterval(() => {
      setState((prev) => ({
        ...prev,
        cooldownSeconds: Math.max(0, prev.cooldownSeconds - 1),
        canResend: prev.cooldownSeconds - 1 <= 0,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [state.cooldownSeconds]);

  /**
   * Carregar estado do AsyncStorage
   */
  async function loadResendState() {
    try {
      const key = `${storageKey}${email}`;
      const stored = localStorage.getItem(key);

      if (!stored) {
        setState((prev) => ({ ...prev, canResend: true }));
        return;
      }

      const data = JSON.parse(stored);
      const now = Date.now();
      const timeSinceLastResend = now - data.lastResendTime;
      const cooldownMs = cooldownDuration * 1000;

      if (timeSinceLastResend >= cooldownMs) {
        // Cooldown expirou
        setState((prev) => ({ ...prev, canResend: true, cooldownSeconds: 0 }));
      } else {
        // Ainda em cooldown
        const remainingSeconds = Math.ceil(
          (cooldownMs - timeSinceLastResend) / 1000
        );
        setState((prev) => ({
          ...prev,
          canResend: false,
          cooldownSeconds: remainingSeconds,
          lastResendTime: data.lastResendTime,
        }));
      }
    } catch (error) {
      console.error('[ResendEmail] Erro ao carregar estado:', error);
    }
  }

  /**
   * Salvar estado no AsyncStorage
   */
  async function saveResendState(lastTime: number, attempts: number) {
    try {
      const key = `${storageKey}${email}`;
      localStorage.setItem(
        key,
        JSON.stringify({
          lastResendTime: lastTime,
          attempts,
          timestamp: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.error('[ResendEmail] Erro ao salvar estado:', error);
    }
  }

  /**
   * Obter número de tentativas
   */
  async function getAttempts(): Promise<number> {
    try {
      const key = `${storageKey}${email}`;
      const stored = localStorage.getItem(key);

      if (!stored) return 0;

      const data = JSON.parse(stored);
      return data.attempts || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Reenviar e-mail
   */
  const resendEmail = useCallback(async () => {
    // Validar e-mail
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setState((prev) => ({
        ...prev,
        error: 'E-mail inválido',
        success: false,
      }));
      return;
    }

    // Verificar se pode reenviar
    if (!state.canResend) {
      setState((prev) => ({
        ...prev,
        error: `Aguarde ${state.cooldownSeconds}s antes de tentar novamente`,
        success: false,
      }));
      return;
    }

    // Verificar limite de tentativas
    const attempts = await getAttempts();
    if (attempts >= maxAttempts) {
      setState((prev) => ({
        ...prev,
        error: `Limite de ${maxAttempts} tentativas atingido. Tente novamente mais tarde.`,
        success: false,
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
      success: false,
    }));

    try {
      // Chamar endpoint de reenvio
      const result = await apiCall<{ success: boolean; message: string }>
        ('/api/trpc/auth.resendPasswordReset', {
          method: 'POST',
          body: JSON.stringify({ email }),
        });

      if (result?.success) {
        const now = Date.now();
        await saveResendState(now, attempts + 1);

        setState((prev) => ({
          ...prev,
          loading: false,
          success: true,
          error: null,
          lastResendTime: now,
          canResend: false,
          cooldownSeconds: cooldownDuration,
        }));

        console.log('[ResendEmail] E-mail reenviado com sucesso');
      } else {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: result?.message || 'Erro ao reenviar e-mail',
          success: false,
        }));
      }
    } catch (error: any) {
      console.error('[ResendEmail] Erro:', error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || 'Erro ao reenviar e-mail',
        success: false,
      }));
    }
  }, [email, state.canResend, state.cooldownSeconds, maxAttempts, cooldownDuration]);

  /**
   * Limpar estado (para testes)
   */
  const clearState = useCallback(async () => {
    try {
      const key = `${storageKey}${email}`;
      localStorage.removeItem(key);
      setState({
        loading: false,
        error: null,
        success: false,
        lastResendTime: null,
        cooldownSeconds: 0,
        canResend: true,
      });
    } catch (error) {
      console.error('[ResendEmail] Erro ao limpar estado:', error);
    }
  }, [email, storageKey]);

  return {
    ...state,
    resendEmail,
    clearState,
  };
}

export { formatCooldownTime, getCooldownMessage } from '@/lib/auth/resend-cooldown';
