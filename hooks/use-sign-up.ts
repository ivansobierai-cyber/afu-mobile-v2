import { useState, useCallback } from 'react';
import { apiCall } from '@/lib/_core/api';
import * as Auth from '@/lib/_core/auth';
import { Platform } from 'react-native';

export type SignUpData = {
  name: string;
  email: string;
  phone: string;
  password: string;
  profile: 'produtor' | 'tecnico' | 'administrador';
};

export type SignUpResponse = {
  sessionToken?: string;
  user: {
    id: number;
    email: string;
    name: string;
    openId: string;
    loginMethod: string;
    lastSignedIn: string;
  };
};

/**
 * useSignUp — Hook para criar nova conta de usuário
 *
 * Oferece:
 * - Validação de dados
 * - Chamada à API de cadastro
 * - Armazenamento de token e info do usuário
 * - Tratamento de erros
 */
export function useSignUp() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signUp = useCallback(async (data: SignUpData) => {
    setLoading(true);
    setError(null);

    try {
      console.log('[useSignUp] Iniciando cadastro com dados:', {
        name: data.name,
        email: data.email,
        profile: data.profile,
      });

      // Chamar API de cadastro
      const response = await apiCall<SignUpResponse>('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: data.password,
          profile: data.profile,
        }),
      });

      console.log('[useSignUp] Resposta de cadastro recebida:', {
        hasSessionToken: !!response.sessionToken,
        hasUser: !!response.user,
      });

      // Armazenar token se fornecido (native)
      if (response.sessionToken && Platform.OS !== 'web') {
        console.log('[useSignUp] Armazenando token de sessão...');
        await Auth.setSessionToken(response.sessionToken);
      }

      // Armazenar info do usuário
      if (response.user) {
        console.log('[useSignUp] Armazenando info do usuário...');
        const userInfo: Auth.User = {
          id: response.user.id,
          openId: response.user.openId,
          name: response.user.name,
          email: response.user.email,
          loginMethod: response.user.loginMethod,
          lastSignedIn: new Date(response.user.lastSignedIn),
        };
        await Auth.setUserInfo(userInfo);
      }

      console.log('[useSignUp] Cadastro concluído com sucesso');
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Falha ao criar conta';
      console.error('[useSignUp] Erro ao criar conta:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    signUp,
    loading,
    error,
  };
}
