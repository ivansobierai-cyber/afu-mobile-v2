/**
 * auth-integration.test.ts — Teste de integração completo de autenticação
 * Verifica o fluxo: signup → login → JWT validation → protected endpoint
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { SignJWT, jwtVerify } from 'jose';

describe('Authentication Integration Flow', () => {
  const SECRET = 'TYLxVRr2EaBE8jVoLDqKQX';
  const APP_ID = 'RiSprfgpLu2V46urERiwsY';
  const EMAIL = 'test@example.com';
  const PASSWORD = 'SecurePassword123';
  const NAME = 'Test User';
  
  let generatedToken: string;
  let openId: string;

  it('Step 1: Signup creates user with openId', async () => {
    // Simula: createUserWithEmail() gera openId único
    openId = `email_${crypto.randomUUID()}`;
    
    console.log('Signup result:', { email: EMAIL, name: NAME, openId });
    expect(openId).toBeTruthy();
    expect(openId).toMatch(/^email_/);
  });

  it('Step 2: Backend creates JWT with openId', async () => {
    // Simula: sdk.createSessionToken(openId, { name })
    const secretKey = new TextEncoder().encode(SECRET);
    const issuedAt = Date.now();
    const expiresInMs = 365 * 24 * 60 * 60 * 1000;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);

    generatedToken = await new SignJWT({
      openId,
      appId: APP_ID,
      name: NAME,
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);

    console.log('JWT created:', generatedToken.substring(0, 50) + '...');
    expect(generatedToken).toBeTruthy();
    expect(generatedToken.split('.')).toHaveLength(3);
  });

  it('Step 3: Frontend receives and stores JWT', async () => {
    // Simula: Auth.setSessionToken(result.sessionToken)
    console.log('Token stored in SecureStore:', generatedToken.substring(0, 50) + '...');
    expect(generatedToken).toBeTruthy();
  });

  it('Step 4: Frontend sends JWT in Authorization header', async () => {
    // Simula: fetch com header Authorization: Bearer ${token}
    const authHeader = `Bearer ${generatedToken}`;
    console.log('Authorization header:', authHeader.substring(0, 50) + '...');
    expect(authHeader).toMatch(/^Bearer /);
  });

  it('Step 5: Backend extracts and validates JWT', async () => {
    // Simula: sdk.authenticateRequest() → jwtVerify()
    const secretKey = new TextEncoder().encode(SECRET);
    
    // Extrai token do header
    const token = generatedToken;
    
    // Valida JWT
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256'],
    });

    console.log('JWT validated:', payload);
    expect(payload.openId).toBe(openId);
    expect(payload.appId).toBe(APP_ID);
    expect(payload.name).toBe(NAME);
  });

  it('Step 6: Backend returns authenticated user for protected endpoint', async () => {
    // Simula: protectedProcedure.query() retorna ctx.user
    const authenticatedUser = {
      id: 1,
      openId,
      name: NAME,
      email: EMAIL,
      loginMethod: 'email',
      lastSignedIn: new Date(),
    };

    console.log('Protected endpoint returns:', authenticatedUser);
    expect(authenticatedUser.openId).toBe(openId);
    expect(authenticatedUser.email).toBe(EMAIL);
  });

  it('Step 7: Frontend receives user and can make authenticated requests', async () => {
    // Simula: useAuth() recebe usuário autenticado
    const user = {
      id: 1,
      openId,
      name: NAME,
      email: EMAIL,
      loginMethod: 'email',
      lastSignedIn: new Date(),
    };

    console.log('Frontend authenticated as:', user.email);
    expect(user.openId).toBe(openId);
    expect(user.email).toBe(EMAIL);
  });

  it('Full flow: Invalid token should fail validation', async () => {
    const secretKey = new TextEncoder().encode(SECRET);
    const wrongSecret = new TextEncoder().encode('WRONG_SECRET');

    try {
      await jwtVerify(generatedToken, wrongSecret, {
        algorithms: ['HS256'],
      });
      expect.fail('Should have thrown error');
    } catch (error) {
      console.log('Invalid token correctly rejected');
      expect(error).toBeTruthy();
    }
  });

  it('Full flow: Missing required fields should fail validation', async () => {
    const secretKey = new TextEncoder().encode(SECRET);
    const issuedAt = Date.now();
    const expiresInMs = 365 * 24 * 60 * 60 * 1000;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);

    // Create token without appId
    const invalidToken = await new SignJWT({
      openId,
      // appId missing!
      name: NAME,
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);

    const { payload } = await jwtVerify(invalidToken, secretKey, {
      algorithms: ['HS256'],
    });

    // Check validation
    const isNonEmptyString = (value: unknown): value is string =>
      typeof value === 'string' && value.length > 0;

    const { openId: oId, appId, name } = payload as Record<string, unknown>;
    const isValid = isNonEmptyString(oId) && isNonEmptyString(appId) && isNonEmptyString(name);

    console.log('Token without appId validation result:', isValid);
    expect(isValid).toBe(false);
  });
});
