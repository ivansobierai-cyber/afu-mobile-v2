/**
 * use-session.ts — Hook de sessão completa do AFU
 *
 * Combina o usuário OAuth (role, name, email) com o perfil AFU
 * (tipoUsuario, status) em uma única chamada tRPC (auth.session).
 */
import { trpc } from "@/lib/trpc";

export type SessionUser = {
  id: number;
  name: string | null;
  email: string | null;
  role: "user" | "admin";
  lastSignedIn: Date;
};

export type SessionPerfil = {
  id: number;
  userId: number;
  nome: string;
  email: string | null;
  telefone: string | null;
  tipoUsuario: "administrador" | "tecnico" | "produtor" | "parceiro" | "comprador";
  status: "ativo" | "inativo" | "suspenso";
  cargo: string | null;
  registroProfissional: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UseSessionResult = {
  user: SessionUser | null;
  perfil: SessionPerfil | null;
  isAdmin: boolean;
  /** Acesso à aba "Mais" e hub de módulos do painel principal */
  canAccessMaisTab: boolean;
  isAuthenticated: boolean;
  onboardingPendente: boolean;
  contaSuspensa: boolean;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
};

export function useSession(): UseSessionResult {
  const { data, isLoading, error, refetch } = trpc.auth.session.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const user = (data?.user as SessionUser | null | undefined) ?? null;
  const perfil = (data?.perfil as SessionPerfil | null | undefined) ?? null;
  const isAdmin = data?.isAdmin ?? false;
  const isAuthenticated = !!user;
  /** Aba Mais: todos autenticados (módulos operacionais); docs/admin filtrados no menu */
  const canAccessMaisTab = isAuthenticated;
  const onboardingPendente = isAuthenticated && !perfil;
  const contaSuspensa = perfil?.status === "suspenso";

  return {
    user,
    perfil,
    isAdmin,
    canAccessMaisTab,
    isAuthenticated,
    onboardingPendente,
    contaSuspensa,
    loading: isLoading,
    error: error as Error | null,
    refetch,
  };
}
