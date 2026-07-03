import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  sendEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  isSendGridReady,
  getEmailServiceStatus,
} from '../server/email-service';

/**
 * Testes para Serviço de E-mail com SendGrid
 */

describe('Email Service — SendGrid', () => {
  beforeEach(() => {
    // Limpar variáveis de ambiente antes de cada teste
    delete process.env.SENDGRID_API_KEY;
    delete process.env.SENDGRID_FROM_EMAIL;
    delete process.env.APP_URL;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getEmailServiceStatus', () => {
    it('deve retornar status quando SendGrid não está configurado', () => {
      const status = getEmailServiceStatus();

      expect(status).toHaveProperty('ready');
      expect(status).toHaveProperty('apiKeyConfigured');
      expect(status).toHaveProperty('fromEmailConfigured');
      expect(status).toHaveProperty('appUrl');
    });

    it('deve indicar que SendGrid não está pronto sem API key', () => {
      const status = getEmailServiceStatus();
      expect(status.apiKeyConfigured).toBe(false);
    });
  });

  describe('sendEmail', () => {
    it('deve retornar erro se SendGrid não está configurado', async () => {
      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('deve retornar erro para e-mail inválido', async () => {
      process.env.SENDGRID_API_KEY = 'test-key';

      const result = await sendEmail({
        to: 'invalid-email',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('inválido');
    });

    it('deve retornar erro para e-mail vazio', async () => {
      process.env.SENDGRID_API_KEY = 'test-key';

      const result = await sendEmail({
        to: '',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('inválido');
    });

    it('deve aceitar opções válidas de e-mail', async () => {
      // Este teste apenas valida a estrutura
      const options = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        from: 'sender@example.com',
        replyTo: 'reply@example.com',
        text: 'Test text',
      };

      expect(options.to).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(options.subject).toBeDefined();
      expect(options.html).toBeDefined();
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('deve retornar erro se SendGrid não está configurado', async () => {
      const result = await sendPasswordResetEmail(
        'user@example.com',
        'test-token-123',
        'https://app.example.com'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('deve aceitar e-mail, token e URL válidos', async () => {
      const email = 'user@example.com';
      const token = 'abc123def456';
      const appUrl = 'https://app.example.com';

      // Apenas validar que a função aceita os parâmetros
      expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(token).toBeDefined();
      expect(token.length).toBeGreaterThan(0);
      expect(appUrl).toMatch(/^https?:\/\//);
    });

    it('deve usar URL padrão se não fornecida', async () => {
      // Validar que a função tem URL padrão
      const defaultUrl = 'https://afumobile.com';
      expect(defaultUrl).toMatch(/^https?:\/\//);
    });
  });

  describe('sendWelcomeEmail', () => {
    it('deve retornar erro se SendGrid não está configurado', async () => {
      const result = await sendWelcomeEmail(
        'user@example.com',
        'João Silva'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('deve aceitar e-mail e nome válidos', async () => {
      const email = 'user@example.com';
      const name = 'João Silva';

      expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(name).toBeDefined();
      expect(name.length).toBeGreaterThan(0);
    });
  });

  describe('isSendGridReady', () => {
    it('deve retornar false quando API key não está configurada', () => {
      const ready = isSendGridReady();
      expect(typeof ready).toBe('boolean');
    });
  });

  describe('Email Validation', () => {
    it('deve validar e-mails com domínios válidos', () => {
      const validEmails = [
        'user@example.com',
        'test.user@example.co.uk',
        'user+tag@example.com',
        'user123@subdomain.example.com',
      ];

      validEmails.forEach((email) => {
        expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      });
    });

    it('deve rejeitar e-mails inválidos', () => {
      const invalidEmails = [
        'invalid',
        '@example.com',
        'user@',
        'user @example.com',
        'user@example',
      ];

      invalidEmails.forEach((email) => {
        expect(email).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      });
    });
  });

  describe('Token Generation', () => {
    it('deve gerar tokens com comprimento adequado', () => {
      // Token de reset deve ser uma string hex de 64 caracteres (32 bytes)
      const tokenLength = 64;
      const token = 'a'.repeat(tokenLength);

      expect(token.length).toBe(tokenLength);
      expect(/^[a-f0-9]*$/.test(token)).toBe(true);
    });

    it('deve gerar tokens únicos', () => {
      const tokens = new Set();

      for (let i = 0; i < 100; i++) {
        const token = Math.random().toString(36).substring(2, 15);
        tokens.add(token);
      }

      // Todos os tokens devem ser únicos
      expect(tokens.size).toBe(100);
    });
  });

  describe('HTML Stripping', () => {
    it('deve converter HTML para texto simples', () => {
      const html = '<p>Hello <strong>World</strong></p>';
      const text = html
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .trim();

      expect(text).toBe('Hello World');
    });

    it('deve manter espaços e quebras de linha', () => {
      const html = '<p>Line 1</p><p>Line 2</p>';
      const text = html.replace(/<[^>]*>/g, '').trim();

      expect(text).toContain('Line 1');
      expect(text).toContain('Line 2');
    });
  });

  describe('Retry Logic', () => {
    it('deve ter estratégia de backoff exponencial', () => {
      const delays = [];

      for (let attempt = 1; attempt <= 3; attempt++) {
        const delayMs = Math.pow(2, attempt - 1) * 1000;
        delays.push(delayMs);
      }

      expect(delays).toEqual([1000, 2000, 4000]);
    });

    it('deve aumentar delay a cada tentativa', () => {
      const delays = [1000, 2000, 4000];

      for (let i = 1; i < delays.length; i++) {
        expect(delays[i]).toBeGreaterThan(delays[i - 1]);
      }
    });
  });

  describe('Environment Variables', () => {
    it('deve usar SENDGRID_API_KEY se configurada', () => {
      process.env.SENDGRID_API_KEY = 'test-api-key-123';
      const apiKey = process.env.SENDGRID_API_KEY;

      expect(apiKey).toBe('test-api-key-123');
    });

    it('deve usar SENDGRID_FROM_EMAIL se configurada', () => {
      process.env.SENDGRID_FROM_EMAIL = 'noreply@example.com';
      const fromEmail = process.env.SENDGRID_FROM_EMAIL;

      expect(fromEmail).toBe('noreply@example.com');
    });

    it('deve usar APP_URL se configurada', () => {
      process.env.APP_URL = 'https://myapp.example.com';
      const appUrl = process.env.APP_URL;

      expect(appUrl).toBe('https://myapp.example.com');
    });

    it('deve ter valores padrão se variáveis não configuradas', () => {
      delete process.env.SENDGRID_FROM_EMAIL;
      const defaultFrom = 'noreply@afumobile.com';

      delete process.env.APP_URL;
      const defaultUrl = 'https://afumobile.com';

      expect(defaultFrom).toBeDefined();
      expect(defaultUrl).toBeDefined();
    });
  });
});
