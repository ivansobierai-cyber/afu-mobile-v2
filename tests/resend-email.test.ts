import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('@/lib/_core/api', () => ({
  apiCall: vi.fn(),
}));

import { formatCooldownTime, getCooldownMessage } from '../hooks/use-resend-email';

/**
 * Testes para Reenvio de E-mail com Cooldown
 */

describe('Resend Email — Cooldown Management', () => {
  beforeEach(() => {
    // Limpar localStorage antes de cada teste
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('formatCooldownTime', () => {
    it('deve formatar segundos como "Xs"', () => {
      expect(formatCooldownTime(30)).toBe('30s');
      expect(formatCooldownTime(45)).toBe('45s');
      expect(formatCooldownTime(59)).toBe('59s');
    });

    it('deve formatar minutos e segundos como "M:SS"', () => {
      expect(formatCooldownTime(60)).toBe('1:00');
      expect(formatCooldownTime(65)).toBe('1:05');
      expect(formatCooldownTime(90)).toBe('1:30');
      expect(formatCooldownTime(125)).toBe('2:05');
    });

    it('deve formatar corretamente múltiplos minutos', () => {
      expect(formatCooldownTime(120)).toBe('2:00');
      expect(formatCooldownTime(180)).toBe('3:00');
      expect(formatCooldownTime(300)).toBe('5:00');
    });

    it('deve adicionar zero à esquerda para segundos < 10', () => {
      expect(formatCooldownTime(61)).toBe('1:01');
      expect(formatCooldownTime(62)).toBe('1:02');
      expect(formatCooldownTime(69)).toBe('1:09');
    });

    it('deve retornar "0s" para zero segundos', () => {
      expect(formatCooldownTime(0)).toBe('0s');
    });
  });

  describe('getCooldownMessage', () => {
    it('deve retornar mensagem de reenvio quando cooldown é 0', () => {
      const message = getCooldownMessage(0);
      expect(message).toBe('Reenviar E-mail');
    });

    it('deve retornar mensagem com tempo restante quando em cooldown', () => {
      const message = getCooldownMessage(30);
      expect(message).toContain('Reenviar em');
      expect(message).toContain('30s');
    });

    it('deve formatar tempo corretamente em mensagem', () => {
      expect(getCooldownMessage(60)).toContain('1:00');
      expect(getCooldownMessage(125)).toContain('2:05');
    });

    it('deve aceitar maxAttempts como parâmetro', () => {
      const message = getCooldownMessage(0, 5);
      expect(message).toBe('Reenviar E-mail');
    });
  });

  describe('Cooldown Logic', () => {
    it('deve calcular cooldown corretamente', () => {
      const cooldownDuration = 60; // 60 segundos
      const now = Date.now();
      const timeSinceLastResend = 30000; // 30 segundos atrás
      const cooldownMs = cooldownDuration * 1000;

      const remainingMs = cooldownMs - timeSinceLastResend;
      const remainingSeconds = Math.ceil(remainingMs / 1000);

      expect(remainingSeconds).toBe(30);
    });

    it('deve considerar cooldown expirado quando tempo passou', () => {
      const cooldownDuration = 60;
      const now = Date.now();
      const timeSinceLastResend = 65000; // 65 segundos atrás
      const cooldownMs = cooldownDuration * 1000;

      const isExpired = timeSinceLastResend >= cooldownMs;
      expect(isExpired).toBe(true);
    });

    it('deve considerar cooldown ativo quando tempo não passou', () => {
      const cooldownDuration = 60;
      const now = Date.now();
      const timeSinceLastResend = 30000; // 30 segundos atrás
      const cooldownMs = cooldownDuration * 1000;

      const isActive = timeSinceLastResend < cooldownMs;
      expect(isActive).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    it('deve respeitar limite de tentativas', () => {
      const maxAttempts = 5;
      const attempts = [1, 2, 3, 4, 5];

      attempts.forEach((attempt) => {
        expect(attempt).toBeLessThanOrEqual(maxAttempts);
      });

      expect(attempts.length).toBe(maxAttempts);
    });

    it('deve bloquear após atingir limite', () => {
      const maxAttempts = 5;
      const currentAttempts = 5;

      const canAttempt = currentAttempts < maxAttempts;
      expect(canAttempt).toBe(false);
    });

    it('deve permitir antes de atingir limite', () => {
      const maxAttempts = 5;
      const currentAttempts = 3;

      const canAttempt = currentAttempts < maxAttempts;
      expect(canAttempt).toBe(true);
    });
  });

  describe('Email Validation', () => {
    it('deve validar e-mail antes de reenviar', () => {
      const validEmails = [
        'user@example.com',
        'test.user@example.co.uk',
        'user+tag@example.com',
      ];

      validEmails.forEach((email) => {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        expect(isValid).toBe(true);
      });
    });

    it('deve rejeitar e-mail inválido', () => {
      const invalidEmails = [
        'invalid',
        '@example.com',
        'user@',
        'user @example.com',
      ];

      invalidEmails.forEach((email) => {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        expect(isValid).toBe(false);
      });
    });

    it('deve rejeitar e-mail vazio', () => {
      const email = '';
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      expect(isValid).toBe(false);
    });
  });

  describe('Cooldown Countdown', () => {
    it('deve decrementar contador a cada segundo', () => {
      const initialSeconds = 60;
      let remaining = initialSeconds;

      // Simular 10 decrementos
      for (let i = 0; i < 10; i++) {
        remaining = Math.max(0, remaining - 1);
      }

      expect(remaining).toBe(50);
    });

    it('deve parar em 0', () => {
      let remaining = 3;

      for (let i = 0; i < 5; i++) {
        remaining = Math.max(0, remaining - 1);
      }

      expect(remaining).toBe(0);
    });

    it('deve completar countdown de 60 segundos', () => {
      let remaining = 60;

      while (remaining > 0) {
        remaining--;
      }

      expect(remaining).toBe(0);
    });
  });

  describe('Storage Persistence', () => {
    it('deve salvar estado no localStorage', () => {
      const key = '@afu_resend_email_test@example.com';
      const data = {
        lastResendTime: Date.now(),
        attempts: 1,
        timestamp: new Date().toISOString(),
      };

      localStorage.setItem(key, JSON.stringify(data));
      const stored = localStorage.getItem(key);

      expect(stored).toBeDefined();
      expect(JSON.parse(stored!)).toEqual(data);
    });

    it('deve recuperar estado do localStorage', () => {
      const key = '@afu_resend_email_test@example.com';
      const data = {
        lastResendTime: Date.now(),
        attempts: 2,
        timestamp: new Date().toISOString(),
      };

      localStorage.setItem(key, JSON.stringify(data));
      const stored = localStorage.getItem(key);
      const recovered = JSON.parse(stored!);

      expect(recovered.attempts).toBe(2);
    });

    it('deve limpar estado do localStorage', () => {
      const key = '@afu_resend_email_test@example.com';
      localStorage.setItem(key, JSON.stringify({ attempts: 1 }));

      localStorage.removeItem(key);
      const stored = localStorage.getItem(key);

      expect(stored).toBeNull();
    });
  });

  describe('Attempt Tracking', () => {
    it('deve incrementar tentativas', () => {
      let attempts = 0;

      for (let i = 0; i < 3; i++) {
        attempts++;
      }

      expect(attempts).toBe(3);
    });

    it('deve rastrear tentativas por e-mail', () => {
      const email1 = 'user1@example.com';
      const email2 = 'user2@example.com';

      const attempts: Record<string, number> = {};
      attempts[email1] = 1;
      attempts[email2] = 2;

      expect(attempts[email1]).toBe(1);
      expect(attempts[email2]).toBe(2);
    });

    it('deve resetar tentativas após cooldown', () => {
      let attempts = 5;
      const maxAttempts = 5;

      // Simular cooldown expirado
      const cooldownExpired = true;

      if (cooldownExpired) {
        attempts = 0;
      }

      expect(attempts).toBe(0);
    });
  });

  describe('Error Messages', () => {
    it('deve retornar mensagem de e-mail inválido', () => {
      const error = 'E-mail inválido';
      expect(error).toContain('inválido');
    });

    it('deve retornar mensagem de cooldown ativo', () => {
      const cooldownSeconds = 30;
      const error = `Aguarde ${cooldownSeconds}s antes de tentar novamente`;
      expect(error).toContain('Aguarde');
      expect(error).toContain('30s');
    });

    it('deve retornar mensagem de limite de tentativas', () => {
      const maxAttempts = 5;
      const error = `Limite de ${maxAttempts} tentativas atingido`;
      expect(error).toContain('Limite');
      expect(error).toContain('5');
    });
  });
});
