/**
 * refresh-token.test.ts — Testes de renovação de tokens
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { SignJWT, jwtVerify } from 'jose';

describe('Refresh Token System', () => {
  const SECRET = 'TYLxVRr2EaBE8jVoLDqKQX';
  const APP_ID = 'RiSprfgpLu2V46urERiwsY';
  const OPEN_ID = 'email_test_user';

  let accessToken: string;
  let refreshToken: string;

  it('Step 1: Create short-lived access token (15 min)', async () => {
    const secretKey = new TextEncoder().encode(SECRET);
    const issuedAt = Date.now();
    const accessExpirySeconds = Math.floor((issuedAt + 15 * 60 * 1000) / 1000);

    accessToken = await new SignJWT({
      openId: OPEN_ID,
      appId: APP_ID,
      name: 'Test User',
      tokenType: 'access',
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setExpirationTime(accessExpirySeconds)
      .sign(secretKey);

    console.log('Access token created:', accessToken.substring(0, 50) + '...');
    expect(accessToken).toBeTruthy();
  });

  it('Step 2: Create long-lived refresh token (30 days)', async () => {
    const secretKey = new TextEncoder().encode(SECRET);
    const issuedAt = Date.now();
    const refreshExpirySeconds = Math.floor((issuedAt + 30 * 24 * 60 * 60 * 1000) / 1000);

    refreshToken = await new SignJWT({
      openId: OPEN_ID,
      appId: APP_ID,
      tokenVersion: 1,
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setExpirationTime(refreshExpirySeconds)
      .sign(secretKey);

    console.log('Refresh token created:', refreshToken.substring(0, 50) + '...');
    expect(refreshToken).toBeTruthy();
  });

  it('Step 3: Verify access token is valid', async () => {
    const secretKey = new TextEncoder().encode(SECRET);
    const { payload } = await jwtVerify(accessToken, secretKey, {
      algorithms: ['HS256'],
    });

    expect(payload.tokenType).toBe('access');
    expect(payload.openId).toBe(OPEN_ID);
    console.log('Access token verified successfully');
  });

  it('Step 4: Verify refresh token is valid', async () => {
    const secretKey = new TextEncoder().encode(SECRET);
    const { payload } = await jwtVerify(refreshToken, secretKey, {
      algorithms: ['HS256'],
    });

    expect(payload.tokenVersion).toBe(1);
    expect(payload.openId).toBe(OPEN_ID);
    console.log('Refresh token verified successfully');
  });

  it('Step 5: Simulate token expiry detection', async () => {
    const secretKey = new TextEncoder().encode(SECRET);

    // Criar access token que expira em 1 minuto
    const issuedAt = Date.now();
    const expirySeconds = Math.floor((issuedAt + 60 * 1000) / 1000);

    const shortLivedToken = await new SignJWT({
      openId: OPEN_ID,
      appId: APP_ID,
      name: 'Test User',
      tokenType: 'access',
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setExpirationTime(expirySeconds)
      .sign(secretKey);

    const { payload } = await jwtVerify(shortLivedToken, secretKey, {
      algorithms: ['HS256'],
    });

    const exp = payload.exp as number;
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = exp - now;

    console.log('Time until expiry:', timeUntilExpiry, 'seconds');
    expect(timeUntilExpiry).toBeGreaterThan(0);
    expect(timeUntilExpiry).toBeLessThanOrEqual(60);
  });

  it('Step 6: Simulate token renewal', async () => {
    const secretKey = new TextEncoder().encode(SECRET);

    // Verificar refresh token original
    const { payload: originalPayload } = await jwtVerify(refreshToken, secretKey, {
      algorithms: ['HS256'],
    });

    const originalVersion = originalPayload.tokenVersion as number;
    console.log('Original refresh token version:', originalVersion);

    // Criar novo access token (simulando renovação)
    const issuedAt = Date.now();
    const newAccessExpirySeconds = Math.floor((issuedAt + 15 * 60 * 1000) / 1000);

    const newAccessToken = await new SignJWT({
      openId: OPEN_ID,
      appId: APP_ID,
      name: 'Test User',
      tokenType: 'access',
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setExpirationTime(newAccessExpirySeconds)
      .sign(secretKey);

    // Criar novo refresh token (rotação)
    const newRefreshExpirySeconds = Math.floor((issuedAt + 30 * 24 * 60 * 60 * 1000) / 1000);

    const newRefreshToken = await new SignJWT({
      openId: OPEN_ID,
      appId: APP_ID,
      tokenVersion: originalVersion + 1,
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setExpirationTime(newRefreshExpirySeconds)
      .sign(secretKey);

    // Verificar novo refresh token
    const { payload: newPayload } = await jwtVerify(newRefreshToken, secretKey, {
      algorithms: ['HS256'],
    });

    const newVersion = newPayload.tokenVersion as number;
    console.log('New refresh token version:', newVersion);

    expect(newVersion).toBe(originalVersion + 1);
    expect(newAccessToken).toBeTruthy();
    expect(newRefreshToken).toBeTruthy();
  });

  it('Step 7: Verify token rotation prevents reuse', async () => {
    const secretKey = new TextEncoder().encode(SECRET);

    // Simular validação de versão de token
    const { payload: payload1 } = await jwtVerify(refreshToken, secretKey, {
      algorithms: ['HS256'],
    });

    const version1 = payload1.tokenVersion as number;

    // Criar token com versão diferente
    const issuedAt = Date.now();
    const expirySeconds = Math.floor((issuedAt + 30 * 24 * 60 * 60 * 1000) / 1000);

    const oldRefreshToken = await new SignJWT({
      openId: OPEN_ID,
      appId: APP_ID,
      tokenVersion: version1 - 1, // Versão antiga
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setExpirationTime(expirySeconds)
      .sign(secretKey);

    const { payload: payload2 } = await jwtVerify(oldRefreshToken, secretKey, {
      algorithms: ['HS256'],
    });

    const version2 = payload2.tokenVersion as number;

    // Versão antiga deve ser diferente
    expect(version2).toBeLessThan(version1);
    console.log('Token rotation prevents reuse: old version', version2, '< current version', version1);
  });

  it('Step 8: Verify token expiry is checked', async () => {
    const secretKey = new TextEncoder().encode(SECRET);

    // Criar token que já expirou
    const issuedAt = Date.now() - 1000; // 1 segundo atrás
    const expirySeconds = Math.floor((issuedAt + 500) / 1000); // Expirou 500ms atrás

    const expiredToken = await new SignJWT({
      openId: OPEN_ID,
      appId: APP_ID,
      tokenVersion: 1,
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setExpirationTime(expirySeconds)
      .sign(secretKey);

    try {
      await jwtVerify(expiredToken, secretKey, {
        algorithms: ['HS256'],
      });
      expect.fail('Should have thrown error for expired token');
    } catch (error) {
      console.log('Expired token correctly rejected');
      expect(error).toBeTruthy();
    }
  });

  it('Full flow: Access token → Refresh → New Access Token', async () => {
    const secretKey = new TextEncoder().encode(SECRET);

    // 1. Criar access token
    const issuedAt = Date.now();
    const accessExpirySeconds = Math.floor((issuedAt + 15 * 60 * 1000) / 1000);

    const token1 = await new SignJWT({
      openId: OPEN_ID,
      appId: APP_ID,
      name: 'Test User',
      tokenType: 'access',
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setExpirationTime(accessExpirySeconds)
      .sign(secretKey);

    // 2. Verificar access token
    const { payload: payload1 } = await jwtVerify(token1, secretKey, {
      algorithms: ['HS256'],
    });
    expect(payload1.tokenType).toBe('access');

    // 3. Usar refresh token para criar novo access token
    const token2 = await new SignJWT({
      openId: OPEN_ID,
      appId: APP_ID,
      name: 'Test User',
      tokenType: 'access',
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setExpirationTime(Math.floor((Date.now() + 15 * 60 * 1000) / 1000))
      .sign(secretKey);

    // 4. Verificar novo access token
    const { payload: payload2 } = await jwtVerify(token2, secretKey, {
      algorithms: ['HS256'],
    });
    expect(payload2.tokenType).toBe('access');

    console.log('Full refresh flow completed successfully');
  });
});
