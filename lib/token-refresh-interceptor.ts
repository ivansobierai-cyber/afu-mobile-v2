/**
 * token-refresh-interceptor.ts — Interceptor para renovar automaticamente tokens
 */
import { Platform } from 'react-native';
import { getApiBaseUrl } from '@/constants/oauth';
import * as Auth from './_core/auth';

const REFRESH_THRESHOLD_MS = 2 * 60 * 1000; // Renovar 2 minutos antes de expirar
const REFRESH_CHECK_INTERVAL_MS = 1 * 60 * 1000; // Verificar a cada 1 minuto

let refreshPromise: Promise<{ accessToken: string; refreshToken: string } | null> | null = null;
let tokenRefreshInterval: ReturnType<typeof setInterval> | null = null;

function decodeBase64Url(value: string): string | null {
  try {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    if (typeof globalThis.atob === 'function') {
      return globalThis.atob(padded);
    }
    const BufferImpl = (globalThis as Record<string, unknown>).Buffer as
      | { from: (input: string, encoding: string) => { toString: (encoding: string) => string } }
      | undefined;
    if (BufferImpl) {
      return BufferImpl.from(padded, 'base64').toString('utf-8');
    }
    return null;
  } catch {
    return null;
  }
}

function getTokenExpiry(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const decoded = decodeBase64Url(parts[1]);
    if (!decoded) return null;

    const payload = JSON.parse(decoded) as { exp?: number };
    return (payload.exp ?? 0) * 1000;
  } catch (error) {
    console.warn('[TokenRefresh] Failed to decode token:', error);
    return null;
  }
}

function isTokenExpiringSoon(token: string): boolean {
  const expiry = getTokenExpiry(token);
  if (!expiry) return true;

  const timeUntilExpiry = expiry - Date.now();
  return timeUntilExpiry < REFRESH_THRESHOLD_MS;
}

function parseRefreshResponse(data: unknown): { accessToken: string; refreshToken?: string } | null {
  const root = data as Record<string, unknown>;
  const result = root?.result as Record<string, unknown> | undefined;
  const resultData = result?.data as Record<string, unknown> | undefined;
  const payload = (resultData?.json ?? resultData) as Record<string, unknown> | undefined;

  if (typeof payload?.accessToken === 'string') {
    return {
      accessToken: payload.accessToken,
      refreshToken: typeof payload.refreshToken === 'string' ? payload.refreshToken : undefined,
    };
  }
  return null;
}

async function refreshAccessToken(): Promise<{ accessToken: string; refreshToken: string } | null> {
  try {
    const refreshToken = await Auth.getRefreshToken();
    if (!refreshToken) {
      console.warn('[TokenRefresh] No refresh token available');
      return null;
    }

    const baseUrl = getApiBaseUrl().replace(/\/$/, '');
    const url = `${baseUrl}/api/trpc/auth.refresh`;

    const response = await fetch(url, {
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
    const tokens = parseRefreshResponse(data);
    if (!tokens) {
      console.error('[TokenRefresh] Invalid refresh response');
      return null;
    }

    await Auth.setSessionToken(tokens.accessToken);
    if (tokens.refreshToken) {
      await Auth.setRefreshToken(tokens.refreshToken);
    }

    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken || refreshToken };
  } catch (error) {
    console.error('[TokenRefresh] Token refresh failed:', error);
    return null;
  }
}

export async function getValidAccessToken(): Promise<string | null> {
  try {
    const currentToken = await Auth.getSessionToken();
    if (!currentToken) {
      return null;
    }

    if (!isTokenExpiringSoon(currentToken)) {
      return currentToken;
    }

    if (refreshPromise) {
      const result = await refreshPromise;
      return result?.accessToken || null;
    }

    refreshPromise = refreshAccessToken();
    try {
      const result = await refreshPromise;
      return result?.accessToken || null;
    } finally {
      refreshPromise = null;
    }
  } catch (error) {
    console.error('[TokenRefresh] Error getting valid access token:', error);
    return null;
  }
}

export function startTokenRefreshCheck(): void {
  if (Platform.OS === 'web') {
    return;
  }

  if (tokenRefreshInterval) {
    return;
  }

  tokenRefreshInterval = setInterval(async () => {
    try {
      const token = await Auth.getSessionToken();
      if (!token) return;

      if (isTokenExpiringSoon(token)) {
        await getValidAccessToken();
      }
    } catch (error) {
      console.error('[TokenRefresh] Error in refresh check:', error);
    }
  }, REFRESH_CHECK_INTERVAL_MS);
}

export function stopTokenRefreshCheck(): void {
  if (tokenRefreshInterval) {
    clearInterval(tokenRefreshInterval);
    tokenRefreshInterval = null;
  }
}

export function clearTokenRefreshState(): void {
  stopTokenRefreshCheck();
  refreshPromise = null;
}

export async function getTimeUntilTokenExpiry(): Promise<number | null> {
  try {
    const token = await Auth.getSessionToken();
    if (!token) return null;

    const expiry = getTokenExpiry(token);
    if (!expiry) return null;

    const timeUntilExpiry = Math.max(0, expiry - Date.now());
    return Math.floor(timeUntilExpiry / 1000);
  } catch (error) {
    console.error('[TokenRefresh] Error getting token expiry:', error);
    return null;
  }
}

export async function isTokenValid(): Promise<boolean> {
  try {
    const token = await Auth.getSessionToken();
    if (!token) return false;

    const expiry = getTokenExpiry(token);
    if (!expiry) return false;

    return expiry > Date.now();
  } catch (error) {
    console.error('[TokenRefresh] Error checking token validity:', error);
    return false;
  }
}
