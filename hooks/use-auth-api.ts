/**
 * useAuthAPI — Hook para chamar endpoints de autenticação via tRPC
 * Usa o cliente tRPC correto com JWT válido
 */
import { useState } from 'react';
import { Platform } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import * as Auth from '@/lib/_core/auth';
import { clearTokenRefreshState } from '@/lib/token-refresh-interceptor';
import * as Api from '@/lib/_core/api';
import { cleanupOfflineScope } from '@/lib/offline/session-cleanup';
import {
  buildOfflineScope,
  getOrCreateDeviceId,
} from '@/lib/offline/tenant-scope';
import {
  loadCoreQueue,
  processCoreQueue,
  type CoreMutationItem,
} from '@/lib/offline/core-mutation-queue';

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
  profile: 'produtor' | 'tecnico';
}

export function useAuthAPI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const queryClient = useQueryClient();
  const utils = trpc.useUtils();

  // Usar mutations do tRPC
  const loginMutation = trpc.auth.login.useMutation();
  const signupMutation = trpc.auth.signup.useMutation();
  const logoutMutation = trpc.auth.logout.useMutation();

  /**
   * Fazer login com e-mail e senha
   */
  const login = async (input: LoginInput): Promise<{ success: boolean; user?: AuthUser; error?: AuthError }> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await loginMutation.mutateAsync({
        email: input.email,
        password: input.password,
      });

      if (result.success && result.accessToken) {
        // Armazenar tokens para autenticação em mobile
        await Auth.setSessionToken(result.accessToken);
        if (result.refreshToken) {
          await Auth.setRefreshToken(result.refreshToken);
        }

        // CORREÇÃO P1: Em web/iframe, cookies de domínio cruzado não funcionam.
        // Chamar /api/auth/session para que o backend sete o cookie no domínio correto.
        if (Platform.OS === 'web') {
          console.log('[useAuthAPI] Web: estabelecendo sessão via /api/auth/session...');
          const ok = await Api.establishSession(result.accessToken);
          console.log('[useAuthAPI] establishSession resultado:', ok ? 'sucesso' : 'falhou');
        }

        // Armazenar informações do usuário
        if (result.user) {
          await Auth.setUserInfo({
            id: result.user.id,
            openId: result.user.openId || '',
            name: result.user.name || '',
            email: result.user.email || '',
            loginMethod: 'email',
            lastSignedIn: new Date(),
          });
        }

        // CORREÇÃO P3: Invalidar cache tRPC para forçar re-fetch de auth.session
        await queryClient.invalidateQueries({ queryKey: [['auth', 'session']] });
        await queryClient.refetchQueries({ queryKey: [['auth', 'session']] });
        console.log('[useAuthAPI] Cache tRPC invalidado após login');

        return {
          success: true,
          user: result.user ? {
            id: result.user.id,
            email: result.user.email || '',
            name: result.user.name || '',
            role: result.user.role || 'user',
          } : undefined,
        };
      }

      throw new Error(result.message || 'Login falhou');
    } catch (err: any) {
      const authError: AuthError = {
        code: err?.data?.code || err?.code || 'UNKNOWN_ERROR',
        message: err?.message || 'Erro ao fazer login',
      };

      setError(authError);
      return {
        success: false,
        error: authError,
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fazer cadastro com e-mail e senha
   */
  const signup = async (input: SignupInput): Promise<{ success: boolean; user?: AuthUser; error?: AuthError }> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signupMutation.mutateAsync({
        email: input.email,
        password: input.password,
        confirmPassword: input.confirmPassword,
        name: input.name,
        profile: input.profile,
      });

      if (result.success && result.accessToken) {
        // Armazenar tokens para autenticação em mobile
        await Auth.setSessionToken(result.accessToken);
        if (result.refreshToken) {
          await Auth.setRefreshToken(result.refreshToken);
        }

        // CORREÇÃO P1: Em web/iframe, cookies de domínio cruzado não funcionam.
        // Chamar /api/auth/session para que o backend sete o cookie no domínio correto.
        if (Platform.OS === 'web') {
          console.log('[useAuthAPI] Web: estabelecendo sessão via /api/auth/session...');
          const ok = await Api.establishSession(result.accessToken);
          console.log('[useAuthAPI] establishSession resultado:', ok ? 'sucesso' : 'falhou');
        }

        // Armazenar informações do usuário
        if (result.user) {
          await Auth.setUserInfo({
            id: result.user.id,
            openId: result.user.openId || '',
            name: result.user.name || '',
            email: result.user.email || '',
            loginMethod: 'email',
            lastSignedIn: new Date(),
          });
        }

        // CORREÇÃO P3: Invalidar cache tRPC para forçar re-fetch de auth.session
        await queryClient.invalidateQueries({ queryKey: [['auth', 'session']] });
        await queryClient.refetchQueries({ queryKey: [['auth', 'session']] });
        console.log('[useAuthAPI] Cache tRPC invalidado após signup');

        return {
          success: true,
          user: result.user ? {
            id: result.user.id,
            email: result.user.email || '',
            name: result.user.name || '',
          } : undefined,
        };
      }

      throw new Error(result.message || 'Cadastro falhou');
    } catch (err: any) {
      const authError: AuthError = {
        code: err?.data?.code || err?.code || 'UNKNOWN_ERROR',
        message: err?.message || 'Erro ao criar conta',
      };

      setError(authError);
      return {
        success: false,
        error: authError,
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fazer logout
   */
  const logout = async (): Promise<{ success: boolean }> => {
    setIsLoading(true);
    setError(null);

    // Etapa 8 — captura escopo antes de derrubar a sessão
    const session = utils.auth.session.getData();
    const deviceId = await getOrCreateDeviceId();
    const offlineScope = buildOfflineScope(
      session?.user?.id,
      session?.activeOrganizationId,
      deviceId,
    );

    try {
      // Drena fila pendente do escopo atual enquanto a sessão ainda é válida
      if (offlineScope) {
        try {
          const pending = await loadCoreQueue(offlineScope);
          if (pending.length > 0) {
            await processCoreQueue(offlineScope, async (item: CoreMutationItem) => {
              const { entity, action, payload } = item;
              const id = payload.id as number | undefined;
              if (entity === "propriedade") {
                if (action === "create") await utils.client.coreData.propriedades.create.mutate(payload as any);
                else if (action === "update" && id) await utils.client.coreData.propriedades.update.mutate({ id, data: payload.data as any });
                else if (action === "delete" && id) await utils.client.coreData.propriedades.delete.mutate({ id });
              } else if (entity === "cultivo") {
                if (action === "create") await utils.client.coreData.cultivos.create.mutate(payload as any);
                else if (action === "update" && id) await utils.client.coreData.cultivos.update.mutate({ id, data: payload.data as any });
                else if (action === "delete" && id) await utils.client.coreData.cultivos.delete.mutate({ id });
              } else if (entity === "terreno") {
                if (action === "create") await utils.client.coreData.terrenos.create.mutate(payload as any);
                else if (action === "update" && id) await utils.client.coreData.terrenos.update.mutate({ id, data: payload.data as any });
                else if (action === "delete" && id) await utils.client.coreData.terrenos.delete.mutate({ id });
              } else if (entity === "evento") {
                if (action === "create") await utils.client.coreData.calendario.create.mutate(payload as any);
                else if (action === "update" && id) await utils.client.coreData.calendario.update.mutate({ id, data: payload.data as any });
                else if (action === "delete" && id) await utils.client.coreData.calendario.delete.mutate({ id });
              } else if (entity === "tarefa") {
                if (action === "create") {
                  await utils.client.coreData.tarefas.create.mutate({
                    ...(payload as any),
                    clientMutationId: item.clientMutationId,
                  });
                } else if (action === "update" && id) {
                  await utils.client.coreData.tarefas.transition.mutate({
                    id,
                    status: payload.status as any,
                    motivoCancelamento: payload.motivoCancelamento as string | undefined,
                    notasApontamento: payload.notasApontamento as string | undefined,
                    areaExecutada: payload.areaExecutada as number | undefined,
                    expectedStatus: payload.expectedStatus as any,
                  });
                }
              }
            });
          }
        } catch {
          // Offline ou erro: limpeza abaixo remove resíduos do aparelho
        }
      }

      // Revogar sessão no servidor (Bearer no web + cookie)
      try {
        await logoutMutation.mutateAsync();
      } catch {
        // continua limpeza local
      }
      if (Platform.OS === "web") {
        try {
          await Api.logout();
        } catch {
          // cookie pode já estar ausente
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "unknown";
      console.warn("[useAuthAPI] Logout API call failed, continuing local cleanup:", message);
    } finally {
      await cleanupOfflineScope(offlineScope, "logout");
      clearTokenRefreshState();
      await Auth.clearLocalAuth();
      queryClient.clear();
      queryClient.setQueryData([["auth", "session"]], {
        user: null,
        perfil: null,
        isAdmin: false,
        organizations: [],
        activeOrganizationId: null,
        activeRole: null,
      });
    }
    setIsLoading(false);
    return { success: true };
  };

  /**
   * Limpar erro
   */
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
