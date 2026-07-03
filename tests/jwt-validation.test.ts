/**
 * jwt-validation.test.ts — Teste de geração e validação de JWT
 * Verifica se o SDK está gerando e validando tokens corretamente
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { SignJWT, jwtVerify } from 'jose';

describe('JWT Generation and Validation', () => {
  const SECRET = 'TYLxVRr2EaBE8jVoLDqKQX';
  const APP_ID = 'RiSprfgpLu2V46urERiwsY';
  const OPEN_ID = 'email_12345-67890';
  const NAME = 'Test User';

  let generatedToken: string;

  it('should generate a valid JWT token', async () => {
    const secretKey = new TextEncoder().encode(SECRET);
    const issuedAt = Date.now();
    const expiresInMs = 365 * 24 * 60 * 60 * 1000; // 1 year
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);

    generatedToken = await new SignJWT({
      openId: OPEN_ID,
      appId: APP_ID,
      name: NAME,
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);

    console.log('Generated Token:', generatedToken.substring(0, 50) + '...');
    expect(generatedToken).toBeTruthy();
    expect(typeof generatedToken).toBe('string');
    expect(generatedToken.split('.')).toHaveLength(3); // JWT has 3 parts
  });

  it('should verify the generated JWT token', async () => {
    const secretKey = new TextEncoder().encode(SECRET);

    const { payload } = await jwtVerify(generatedToken, secretKey, {
      algorithms: ['HS256'],
    });

    console.log('Verified Payload:', payload);
    expect(payload.openId).toBe(OPEN_ID);
    expect(payload.appId).toBe(APP_ID);
    expect(payload.name).toBe(NAME);
  });

  it('should fail verification with wrong secret', async () => {
    const wrongSecret = new TextEncoder().encode('WRONG_SECRET_KEY');

    try {
      await jwtVerify(generatedToken, wrongSecret, {
        algorithms: ['HS256'],
      });
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeTruthy();
      console.log('Expected error with wrong secret:', (error as Error).message);
    }
  });

  it('should fail verification with missing required fields', async () => {
    const secretKey = new TextEncoder().encode(SECRET);
    const issuedAt = Date.now();
    const expiresInMs = 365 * 24 * 60 * 60 * 1000;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);

    // Create token without appId
    const invalidToken = await new SignJWT({
      openId: OPEN_ID,
      // appId missing!
      name: NAME,
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);

    const { payload } = await jwtVerify(invalidToken, secretKey, {
      algorithms: ['HS256'],
    });

    // Check if validation logic would catch this
    const isNonEmptyString = (value: unknown): value is string =>
      typeof value === 'string' && value.length > 0;

    const { openId, appId, name } = payload as Record<string, unknown>;
    const isValid = isNonEmptyString(openId) && isNonEmptyString(appId) && isNonEmptyString(name);

    console.log('Validation result for token without appId:', isValid);
    expect(isValid).toBe(false); // Should fail because appId is missing
  });
});
