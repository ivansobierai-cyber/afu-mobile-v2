/**
 * token-service.ts — Serviço de gerenciamento de tokens (access + refresh)
 * 
 * Implementa:
 * - Geração de access tokens (15 min)
 * - Geração de refresh tokens (30 dias)
 * - Validação e renovação de tokens
 * - Armazenamento seguro de refresh tokens
 */
import { SignJWT, jwtVerify } from 'jose';
import { ENV } from './_core/env';
import { eq } from 'drizzle-orm';
import { users } from '../drizzle/schema';
import type { AccessTokenPayload, RefreshTokenPayload } from '../drizzle/schema';
import * as db from './db';

const ACCESS_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutos
const REFRESH_TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

/**
 * Obter chave secreta para assinar tokens
 */
function getTokenSecret(): Uint8Array {
  const secret = ENV.cookieSecret;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }
  return new TextEncoder().encode(secret);
}

/**
 * Criar access token (curta duração, para requisições)
 */
export async function createAccessToken(
  openId: string,
  name: string = '',
): Promise<string> {
  const secretKey = getTokenSecret();
  const issuedAt = Date.now();
  const expirationSeconds = Math.floor((issuedAt + ACCESS_TOKEN_EXPIRY_MS) / 1000);

  const token = await new SignJWT({
    openId,
    appId: ENV.appId || "afu-mobile",
    name,
    tokenType: 'access',
  } as AccessTokenPayload)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setExpirationTime(expirationSeconds)
    .sign(secretKey);

  return token;
}

/**
 * Criar refresh token (longa duração, armazenado no banco)
 */
export async function createRefreshToken(
  openId: string,
  tokenVersion: number = 1,
): Promise<string> {
  const secretKey = getTokenSecret();
  const issuedAt = Date.now();
  const expirationSeconds = Math.floor((issuedAt + REFRESH_TOKEN_EXPIRY_MS) / 1000);

  const token = await new SignJWT({
    openId,
    appId: ENV.appId,
    tokenVersion,
  } as RefreshTokenPayload)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setExpirationTime(expirationSeconds)
    .sign(secretKey);

  return token;
}

/**
 * Verificar e extrair payload de access token
 */
export async function verifyAccessToken(
  token: string,
): Promise<AccessTokenPayload | null> {
  try {
    const secretKey = getTokenSecret();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256'],
    });

    const { openId, appId, name, tokenType } = payload as Record<string, unknown>;

    // Validar campos obrigatórios
    if (
      typeof openId !== 'string' ||
      typeof appId !== 'string' ||
      typeof name !== 'string' ||
      tokenType !== 'access'
    ) {
      console.warn('[TokenService] Invalid access token payload');
      return null;
    }

    return { openId, appId, name, tokenType: 'access' };
  } catch (error) {
    console.warn('[TokenService] Access token verification failed:', error);
    return null;
  }
}

/**
 * Verificar e extrair payload de refresh token
 */
export async function verifyRefreshToken(
  token: string,
): Promise<RefreshTokenPayload | null> {
  try {
    const secretKey = getTokenSecret();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256'],
    });

    const { openId, appId, tokenVersion } = payload as Record<string, unknown>;

    // Validar campos obrigatórios
    if (
      typeof openId !== 'string' ||
      typeof appId !== 'string' ||
      typeof tokenVersion !== 'number'
    ) {
      console.warn('[TokenService] Invalid refresh token payload');
      return null;
    }

    return { openId, appId, tokenVersion };
  } catch (error) {
    console.warn('[TokenService] Refresh token verification failed:', error);
    return null;
  }
}

/**
 * Armazenar refresh token no banco de dados
 */
export async function storeRefreshToken(
  userId: number,
  refreshToken: string,
): Promise<void> {
  const expiryDate = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

  const database = await db.getDb();
  if (!database) {
    throw new Error('Database not available');
  }

  await database
    .update(users)
    .set({
      refreshToken,
      refreshTokenExpiry: expiryDate,
    })
    .where(eq(users.id, userId));

  console.log('[TokenService] Refresh token stored for user:', userId);
}

/**
 * Renovar tokens usando refresh token
 * Retorna novo access token e novo refresh token (se necessário)
 */
export async function renewTokens(
  refreshToken: string,
): Promise<{
  accessToken: string;
  refreshToken: string;
} | null> {
  try {
    // Verificar refresh token
    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) {
      console.warn('[TokenService] Invalid refresh token');
      return null;
    }

    // Buscar usuário no banco
    const user = await db.getUserByOpenId(payload.openId);
    if (!user) {
      console.warn('[TokenService] User not found for openId:', payload.openId);
      return null;
    }

    // Verificar se refresh token armazenado bate com o fornecido
    if (user.refreshToken !== refreshToken) {
      console.warn('[TokenService] Refresh token mismatch');
      return null;
    }

    // Verificar se refresh token expirou
    if (user.refreshTokenExpiry && new Date() > user.refreshTokenExpiry) {
      console.warn('[TokenService] Refresh token expired');
      return null;
    }

    // Criar novo access token
    const newAccessToken = await createAccessToken(user.openId || '', user.name || '');

    // Criar novo refresh token (rotação de token)
    const newRefreshToken = await createRefreshToken(user.openId || '', payload.tokenVersion + 1);

    // Armazenar novo refresh token
    await storeRefreshToken(user.id, newRefreshToken);

    console.log('[TokenService] Tokens renewed for user:', user.id);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    console.error('[TokenService] Token renewal failed:', error);
    return null;
  }
}

/**
 * Revogar refresh token (logout)
 */
export async function revokeRefreshToken(userId: number): Promise<void> {
  const database = await db.getDb();
  if (!database) {
    throw new Error('Database not available');
  }

  await database
    .update(users)
    .set({
      refreshToken: null,
      refreshTokenExpiry: null,
    })
    .where(eq(users.id, userId));

  console.log('[TokenService] Refresh token revoked for user:', userId);
}

/**
 * Verificar se access token está próximo de expirar
 * Retorna true se faltam menos de 2 minutos para expirar
 */
export async function isAccessTokenExpiringSoon(token: string): Promise<boolean> {
  try {
    const secretKey = getTokenSecret();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256'],
    });

    const exp = payload.exp;
    if (typeof exp !== 'number') {
      return true; // Considerar como expirando se não conseguir ler exp
    }

    const expiryTime = exp * 1000; // Converter para ms
    const now = Date.now();
    const timeUntilExpiry = expiryTime - now;
    const twoMinutesMs = 2 * 60 * 1000;

    return timeUntilExpiry < twoMinutesMs;
  } catch (error) {
    console.warn('[TokenService] Error checking token expiry:', error);
    return true; // Considerar como expirando em caso de erro
  }
}

/**
 * Obter tempo de expiração do access token em ms
 */
export function getAccessTokenExpiryMs(): number {
  return ACCESS_TOKEN_EXPIRY_MS;
}

/**
 * Obter tempo de expiração do refresh token em ms
 */
export function getRefreshTokenExpiryMs(): number {
  return REFRESH_TOKEN_EXPIRY_MS;
}
