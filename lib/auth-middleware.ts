import { useAuth } from '@/hooks/use-auth';
import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

/**
 * AuthMiddleware — Protege rotas baseado em estado de autenticação
 *
 * Rotas públicas: /auth/*, /
 * Rotas protegidas: /(tabs)/*
 *
 * Comportamento:
 * - Se não autenticado e tenta acessar rota protegida → redireciona para /auth/welcome
 * - Se autenticado e tenta acessar /auth/* → redireciona para /(tabs)
 */
export function useAuthMiddleware() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) {
      console.log('[AuthMiddleware] Carregando estado de autenticação...');
      return;
    }

    const inAuthGroup = segments[0] === 'auth';
    const inTabsGroup = segments[0] === '(tabs)';

    console.log('[AuthMiddleware]', {
      isAuthenticated,
      inAuthGroup,
      inTabsGroup,
      segments,
    });

    // Se não autenticado
    if (!isAuthenticated) {
      // Se tenta acessar rota protegida, redirecionar para welcome
      if (inTabsGroup) {
        console.log('[AuthMiddleware] Não autenticado, redirecionando para /auth/welcome');
        router.replace('/auth/welcome');
      }
    } else {
      // Se autenticado
      // Se tenta acessar rota de auth, redirecionar para dashboard
      if (inAuthGroup) {
        console.log('[AuthMiddleware] Já autenticado, redirecionando para /(tabs)');
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, loading, segments, router]);
}

/**
 * Hook para verificar se usuário está autenticado
 * Útil para componentes que precisam saber o estado de autenticação
 */
export function useRequireAuth() {
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      console.log('[useRequireAuth] Usuário não autenticado, redirecionando para login');
      router.replace('/auth/welcome');
    }
  }, [isAuthenticated, loading, router]);

  return { isAuthenticated, user, loading };
}
