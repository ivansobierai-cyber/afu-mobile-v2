/**
 * route-guard.tsx — Proteção de Rotas do AFU
 *
 * Envolve telas que requerem autenticação ou role específico.
 * Redireciona automaticamente para login ou exibe mensagem de acesso negado.
 *
 * Uso básico (requer login):
 *   <RouteGuard><MinhaTelaProtegida /></RouteGuard>
 *
 * Uso com role admin:
 *   <RouteGuard requireAdmin><PainelAdmin /></RouteGuard>
 */
import React from "react";
import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useSession } from "@/hooks/use-session";
import { useColors } from "@/hooks/use-colors";
import { isAuthDisabled } from "@shared/dev-auth";

type RouteGuardProps = {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requirePerfil?: boolean;
};

export function RouteGuard({
  children,
  requireAuth = true,
  requireAdmin = false,
  requirePerfil = false,
}: RouteGuardProps) {
  const router = useRouter();
  const colors = useColors();
  const { isAuthenticated, isAdmin, perfil, onboardingPendente, contaSuspensa, loading } = useSession();

  if (isAuthDisabled()) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.muted, marginTop: 12, fontSize: 14 }}>Verificando acesso...</Text>
      </View>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, backgroundColor: colors.background }}>
        <Text style={{ fontSize: 40, marginBottom: 16 }}>🔒</Text>
        <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground, textAlign: "center", marginBottom: 8 }}>
          Acesso Restrito
        </Text>
        <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", marginBottom: 24, lineHeight: 20 }}>
          Você precisa estar autenticado para acessar esta área.
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/auth/login" as any)}
          style={{ backgroundColor: colors.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 }}
        >
          <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 15 }}>Fazer Login</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12, paddingVertical: 10 }}>
          <Text style={{ color: colors.muted, fontSize: 14 }}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isAuthenticated && contaSuspensa) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, backgroundColor: colors.background }}>
        <Text style={{ fontSize: 40, marginBottom: 16 }}>⛔</Text>
        <Text style={{ fontSize: 20, fontWeight: "700", color: colors.error, textAlign: "center", marginBottom: 8 }}>
          Conta Suspensa
        </Text>
        <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", lineHeight: 20 }}>
          Sua conta foi suspensa. Entre em contato com o suporte AFU para mais informações.
        </Text>
      </View>
    );
  }

  if (requirePerfil && onboardingPendente) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, backgroundColor: colors.background }}>
        <Text style={{ fontSize: 40, marginBottom: 16 }}>🌱</Text>
        <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground, textAlign: "center", marginBottom: 8 }}>
          Complete seu Perfil
        </Text>
        <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", marginBottom: 24, lineHeight: 20 }}>
          Para acessar esta área, complete seu cadastro no AFU.
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/auth/onboarding" as any)}
          style={{ backgroundColor: colors.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 }}
        >
          <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 15 }}>Completar Cadastro</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (requireAdmin && !isAdmin) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, backgroundColor: colors.background }}>
        <Text style={{ fontSize: 40, marginBottom: 16 }}>🚫</Text>
        <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground, textAlign: "center", marginBottom: 8 }}>
          Acesso Negado
        </Text>
        <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", marginBottom: 24, lineHeight: 20 }}>
          Esta área é restrita a administradores do sistema AFU.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 }}
        >
          <Text style={{ color: colors.foreground, fontWeight: "600" }}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <>{children}</>;
}

/**
 * Hook auxiliar para verificar permissões sem renderizar um guard.
 * Útil para ocultar botões ou seções com base no role.
 */
export function usePermission(opts: { requireAuth?: boolean; requireAdmin?: boolean }) {
  const { isAuthenticated, isAdmin, loading } = useSession();

  if (isAuthDisabled()) {
    return { canAccess: true, loading: false };
  }

  const canAccess =
    !loading &&
    (!opts.requireAuth || isAuthenticated) &&
    (!opts.requireAdmin || isAdmin);
  return { canAccess, loading };
}
