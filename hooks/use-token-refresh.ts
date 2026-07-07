/**
 * useTokenRefresh — Hook para gerenciar renovação automática de tokens
 * 
 * Uso:
 * - Iniciar verificação periódica quando app carrega
 * - Parar verificação quando app fecha
 * - Renovar token antes de requisições críticas
 */
import { useEffect } from 'react';
import {
  startTokenRefreshCheck,
  stopTokenRefreshCheck,
  getValidAccessToken,
  getTimeUntilTokenExpiry,
  isTokenValid,
  clearTokenRefreshState,
} from '@/lib/token-refresh-interceptor';

export function useTokenRefresh() {
  useEffect(() => {
    console.log('[useTokenRefresh] Mounting, starting token refresh check');
    startTokenRefreshCheck();

    return () => {
      console.log('[useTokenRefresh] Unmounting, stopping token refresh check');
      stopTokenRefreshCheck();
    };
  }, []);

  return {
    getValidAccessToken,
    getTimeUntilTokenExpiry,
    isTokenValid,
    clearTokenRefreshState,
  };
}
