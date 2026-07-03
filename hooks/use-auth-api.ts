/**
 * useAuthAPI — Hook para chamar endpoints de autenticação via tRPC
 * Usa o cliente tRPC correto com JWT válido
 */
import { useState } from 'react';
import { Platform } from 'react-native';
import { trpc } from '@/lib/trpc';
import * as Auth from '@/lib/_core/auth';
import * as Api from '@/lib/_core/api';
import { clearTokenRefreshState } from '@/lib/token-refresh-interceptor';

export interface AuthError {
  code: string;
  message: string;
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface SignupInput {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  profile: 'produtor' | 'tecnico' | 'administrador';
}

type AuthTokens = {
  accessToken: string;
  refreshToken?: string;
};

type AuthUserPayload = {
  id: number;
  openId?: string | null;
  name: string | null;
  email: string | null;
  role?: string | null;
};

function parseAuthError(err: unknown): AuthError {
  const e = err as {
    data?: { code?: string; message?: string };
    shape?: { message?: string };
    message?: string;
    code?: string;
  };
  return {
    code: e?.data?.code || e?.code || 'UNKNOWN_ERROR',
    message: e?.shape?.message || e?.data?.message || e?.message || 'Erro de autenticação',
  };
}

export function useAuthAPI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.login.useMutation();
  const signupMutation = trpc.auth.signup.useMutation();
  const logoutMutation = trpc.auth.logout.useMutation();

  const finalizeAuthSession = async (tokens: AuthTokens, user: AuthUserPayload) => {
    await Auth.setSessionToken(tokens.accessToken);
    if (tokens.refreshToken) {
      await Auth.setRefreshToken(tokens.refreshToken);
    }

    if (Platform.OS === 'web') {
      await Api.establishSession(tokens.accessToken);
    }

    await Auth.setUserInfo({
      id: user.id,
      openId: user.openId || '',
      name: user.name,
      email: user.email,
      loginMethod: 'email',
      lastSignedIn: new Date(),
    });

    // Sincronizar sessão tRPC (usada pelo AuthGuard via useSession)
    await utils.auth.session.refetch();
  };

  const login = async (input: LoginInput): Promise<{ success: boolean; user?: AuthUser; error?: AuthError }> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await loginMutation.mutateAsync({
        email: input.email.trim().toLowerCase(),
        password: input.password,
      });

      if (result.success && result.accessToken && result.user) {
        await finalizeAuthSession(
          { accessToken: result.accessToken, refreshToken: result.refreshToken },
          result.user,
        );

        return {
          success: true,
          user: {
            id: result.user.id,
            email: result.user.email || '',
            name: result.user.name || '',
            role: result.user.role || 'user',
          },
        };
      }

      throw new Error(result.message || 'Login falhou');
    } catch (err: unknown) {
      const authError = parseAuthError(err);
      setError(authError);
      return { success: false, error: authError };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (input: SignupInput): Promise<{ success: boolean; user?: AuthUser; error?: AuthError }> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signupMutation.mutateAsync({
        email: input.email.trim().toLowerCase(),
        password: input.password,
        confirmPassword: input.confirmPassword,
        name: input.name,
        profile: input.profile,
      });

      if (result.success && result.accessToken && result.user) {
        await finalizeAuthSession(
          { accessToken: result.accessToken, refreshToken: result.refreshToken },
          result.user,
        );

        return {
          success: true,
          user: {
            id: result.user.id,
            email: result.user.email || '',
            name: result.user.name || '',
          },
        };
      }

      throw new Error(result.message || 'Cadastro falhou');
    } catch (err: unknown) {
      const authError = parseAuthError(err);
      setError(authError);
      return { success: false, error: authError };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<{ success: boolean }> => {
    setIsLoading(true);
    setError(null);

    try {
      await logoutMutation.mutateAsync();
    } catch (err: unknown) {
      console.warn('[useAuthAPI] Logout API call failed, continuing local cleanup:', parseAuthError(err).message);
    }

    try {
      if (Platform.OS === 'web') {
        await Api.logout();
      }
    } catch (err) {
      console.warn('[useAuthAPI] Logout cookie clear failed:', err);
    }

    clearTokenRefreshState();
    await Auth.clearLocalAuth();

    await utils.auth.session.reset();
    utils.invalidate();

    setIsLoading(false);
    return { success: true };
  };

  const clearError = () => {
    setError(null);
  };

  return {
    login,
    signup,
    logout,
    isLoading,
    error,
    clearError,
  };
}
