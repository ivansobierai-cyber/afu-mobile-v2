/**
 * token-refresh-interceptor.ts — Interceptor para renovar automaticamente tokens
 * 
 * Implementa:
 * - Detecção de tokens próximos de expirar
 * - Renovação automática usando refresh token
 * - Fila de requisições durante renovação (sem interrupção)
 * - Retry automático após renovação
 */
import { Platform } from 'react-native';
import * as Auth from './_core/auth';
import { trpc } from './trpc';

const ACCESS_TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutos
const REFRESH_THRESHOLD_MS = 2 * 60 * 1000; // Renovar 2 minutos antes de expirar
const REFRESH_CHECK_INTERVAL_MS = 1 * 60 * 1000; // Verificar a cada 1 minuto

let refreshPromise: Promise<{ accessToken: string; refreshToken: string } | null> | null = null;
let lastRefreshTime = 0;
let tokenRefreshInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Decodificar JWT e extrair tempo de expiração
 */
function getTokenExpiry(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return (payload.exp ?? 0) * 1000; // Converter para ms
  } catch (error) {
    console.warn('[TokenRefresh] Failed to decode token:', error);
    return null;
  }
}

/**
 * Verificar se token está próximo de expirar
 */
function isTokenExpiringSoon(token: string): boolean {
  const expiry = getTokenExpiry(token);
  if (!expiry) return true; // Considerar como expirando se não conseguir ler

  const now = Date.now();
  const timeUntilExpiry = expiry - now;

  return timeUntilExpiry < REFRESH_THRESHOLD_MS;
}

/**
 * Renovar tokens usando refresh token
 */
async function refreshAccessToken(): Promise<{ accessToken: string; refreshToken: string } | null> {
  try {
    const refreshToken = await Auth.getRefreshToken();
    if (!refreshToken) {
      console.warn('[TokenRefresh] No refresh token available');
      return null;
    }

    console.log('[TokenRefresh] Refreshing access token...');

    // Chamar endpoint de refresh
    const response = await fetch('/api/trpc/auth.refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        json: { refreshToken },
      }),
      credentials: 'include',
    });

    if (!response.ok) {
      console.error('[TokenRefresh] Refresh failed:', response.status);
      return null;
    }

    const data = await response.json();
    if (!data.result?.data?.accessToken) {
      console.error('[TokenRefresh] Invalid refresh response');
      return null;
    }

    const { accessToken, refreshToken: newRefreshToken } = data.result.data;

    // Armazenar novos tokens
    await Auth.setSessionToken(accessToken);
    if (newRefreshToken) {
      await Auth.setRefreshToken(newRefreshToken);
    }

    console.log('[TokenRefresh] Tokens refreshed successfully');
    return { accessToken, refreshToken: newRefreshToken || refreshToken };
  } catch (error) {
    console.error('[TokenRefresh] Token refresh failed:', error);
    return null;
  }
}

/**
 * Obter access token válido, renovando se necessário
 */
export async function getValidAccessToken(): Promise<string | null> {
  try {
    const currentToken = await Auth.getSessionToken();
    if (!currentToken) {
      console.log('[TokenRefresh] No access token available');
      return null;
    }

    // Se token não está expirando, retornar como está
    if (!isTokenExpiringSoon(currentToken)) {
      return currentToken;
    }

    console.log('[TokenRefresh] Access token expiring soon, refreshing...');

    // Se já há um refresh em andamento, aguardar
    if (refreshPromise) {
      console.log('[TokenRefresh] Refresh already in progress, waiting...');
      const result = await refreshPromise;
      return result?.accessToken || null;
    }

    // Iniciar novo refresh
    refreshPromise = refreshAccessToken();
    try {
      const result = await refreshPromise;
      lastRefreshTime = Date.now();
      return result?.accessToken || null;
    } finally {
      refreshPromise = null;
    }
  } catch (error) {
    console.error('[TokenRefresh] Error getting valid access token:', error);
    return null;
  }
}

/**
 * Iniciar verificação periódica de expiração de token
 */
export function startTokenRefreshCheck(): void {
  if (Platform.OS === 'web') {
    console.log('[TokenRefresh] Skipping token refresh check on web platform');
    return;
  }

  if (tokenRefreshInterval) {
    console.log('[TokenRefresh] Token refresh check already running');
    return;
  }

  console.log('[TokenRefresh] Starting token refresh check...');

  tokenRefreshInterval = setInterval(async () => {
    try {
      const token = await Auth.getSessionToken();
      if (!token) return;

      if (isTokenExpiringSoon(token)) {
        console.log('[TokenRefresh] Token expiring soon, initiating refresh...');
        await getValidAccessToken();
      }
    } catch (error) {
      console.error('[TokenRefresh] Error in refresh check:', error);
    }
  }, REFRESH_CHECK_INTERVAL_MS);
}

/**
 * Parar verificação periódica de expiração de token
 */
export function stopTokenRefreshCheck(): void {
  if (tokenRefreshInterval) {
    console.log('[TokenRefresh] Stopping token refresh check...');
    clearInterval(tokenRefreshInterval);
    tokenRefreshInterval = null;
  }
}

/**
 * Limpar estado de refresh
 */
export function clearTokenRefreshState(): void {
  stopTokenRefreshCheck();
  refreshPromise = null;
  lastRefreshTime = 0;
}

/**
 * Obter tempo até expiração do token (em segundos)
 */
export async function getTimeUntilTokenExpiry(): Promise<number | null> {
  try {
    const token = await Auth.getSessionToken();
    if (!token) return null;

    const expiry = getTokenExpiry(token);
    if (!expiry) return null;

    const now = Date.now();
    const timeUntilExpiry = Math.max(0, expiry - now);

    return Math.floor(timeUntilExpiry / 1000); // Retornar em segundos
  } catch (error) {
    console.error('[TokenRefresh] Error getting token expiry:', error);
    return null;
  }
}

/**
 * Verificar se token está válido
 */
export async function isTokenValid(): Promise<boolean> {
  try {
    const token = await Auth.getSessionToken();
    if (!token) return false;

    const expiry = getTokenExpiry(token);
    if (!expiry) return false;

    const now = Date.now();
    return expiry > now;
  } catch (error) {
    console.error('[TokenRefresh] Error checking token validity:', error);
    return false;
  }
}
