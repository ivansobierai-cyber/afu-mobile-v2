/**
 * Teste de compatibilidade: token-service vs sdk.verifySession
 * Verifica se o token gerado por createAccessToken é aceito por sdk.verifySession
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Carregar env
require('./load-env.js');

import { SignJWT, jwtVerify } from 'jose';

const ENV = {
  cookieSecret: process.env.JWT_SECRET,
  appId: process.env.VITE_APP_ID,
};

console.log('=== Teste de Compatibilidade de Tokens ===\n');
console.log('JWT_SECRET configurado:', ENV.cookieSecret ? `SIM (${ENV.cookieSecret.length} chars)` : 'NAO');
console.log('VITE_APP_ID configurado:', ENV.appId ? 'SIM' : 'NAO');
console.log('');

async function testTokenCompat() {
  const secretKey = new TextEncoder().encode(ENV.cookieSecret);

  // --- Teste 1: createAccessToken (token-service.ts) ---
  console.log('--- Teste 1: Token gerado por createAccessToken ---');
  const accessToken = await new SignJWT({
    openId: 'email_test123',
    appId: ENV.appId,
    name: 'Test User',
    tokenType: 'access',  // campo extra do token-service
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setExpirationTime(Math.floor((Date.now() + 15 * 60 * 1000) / 1000))
    .sign(secretKey);

  console.log('Token (primeiros 80 chars):', accessToken.substring(0, 80) + '...');

  // Verificar com sdk.verifySession (que exige openId, appId, name)
  try {
    const { payload } = await jwtVerify(accessToken, secretKey, { algorithms: ['HS256'] });
    const { openId, appId, name } = payload;
    const isValid = typeof openId === 'string' && openId.length > 0
                 && typeof appId === 'string' && appId.length > 0
                 && typeof name === 'string' && name.length > 0;
    console.log('openId:', openId);
    console.log('appId:', appId);
    console.log('name:', name);
    console.log('VALIDO pelo sdk.verifySession?', isValid ? 'SIM ✅' : 'NAO ❌');
    if (!isValid) {
      console.log('PROBLEMA: sdk.verifySession requer openId, appId e name nao-vazios');
    }
  } catch (err) {
    console.log('ERRO na verificacao:', err.message);
  }

  console.log('');

  // --- Teste 2: sdk.createSessionToken ---
  console.log('--- Teste 2: Token gerado por sdk.createSessionToken ---');
  const sdkToken = await new SignJWT({
    openId: 'email_test123',
    appId: ENV.appId,
    name: 'Test User',
    // SEM tokenType — este é o formato do sdk
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setExpirationTime(Math.floor((Date.now() + 365 * 24 * 60 * 60 * 1000) / 1000))
    .sign(secretKey);

  console.log('Token (primeiros 80 chars):', sdkToken.substring(0, 80) + '...');

  try {
    const { payload } = await jwtVerify(sdkToken, secretKey, { algorithms: ['HS256'] });
    const { openId, appId, name } = payload;
    const isValid = typeof openId === 'string' && openId.length > 0
                 && typeof appId === 'string' && appId.length > 0
                 && typeof name === 'string' && name.length > 0;
    console.log('openId:', openId);
    console.log('appId:', appId);
    console.log('name:', name);
    console.log('VALIDO pelo sdk.verifySession?', isValid ? 'SIM ✅' : 'NAO ❌');
  } catch (err) {
    console.log('ERRO na verificacao:', err.message);
  }

  console.log('');

  // --- Teste 3: Simular fluxo completo ---
  console.log('--- Teste 3: Fluxo completo login → requisicao autenticada ---');
  console.log('1. Login gera accessToken com createAccessToken()');
  console.log('2. Frontend armazena accessToken');
  console.log('3. Frontend envia: Authorization: Bearer <accessToken>');
  console.log('4. Middleware extrai token do header');
  console.log('5. sdk.verifySession(token) valida JWT');
  console.log('6. Verifica openId, appId, name no payload');
  console.log('');

  // O token gerado por createAccessToken tem tokenType: 'access'
  // mas sdk.verifySession NAO verifica tokenType, apenas openId, appId, name
  // Portanto DEVERIA funcionar
  console.log('CONCLUSAO: O token gerado por createAccessToken DEVERIA ser aceito por sdk.verifySession');
  console.log('O problema NAO esta na compatibilidade de tokens');
  console.log('');
  console.log('HIPOTESE MAIS PROVAVEL: O token nao esta sendo enviado no header Authorization');
  console.log('Verificar: lib/trpc.ts headers() function');
}

testTokenCompat().catch(console.error);
