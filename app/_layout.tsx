import "@/global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { ActivityIndicator, Platform, Text, View } from "react-native";
import "@/lib/_core/nativewind-pressable";
import { ThemeProvider } from "@/lib/theme-provider";
import { useSession } from "@/hooks/use-session";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type { EdgeInsets, Metrics, Rect } from "react-native-safe-area-context";

import { trpc, createTRPCClient } from "@/lib/trpc";
import { initManusRuntime, subscribeSafeAreaInsets } from "@/lib/_core/manus-runtime";
import { CoreOfflineSyncManager } from "@/components/core-offline-sync-manager";
import { PushNotificationManager } from "@/components/push-notification-manager";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { useColors } from "@/hooks/use-colors";

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };
const PROTECTED_ROUTE_GROUPS = new Set(["(tabs)", "mais", "propriedades", "cultivos", "admin"]);

export const unstable_settings = {
  anchor: "(tabs)",
};

/**
 * Spinner só em rotas protegidas enquanto a sessão resolve (máx. ~2s via useSession).
 * Telas públicas (auth/*) renderizam imediatamente — sessão em background.
 */
function ProtectedSessionGate({ children }: { children: React.ReactNode }) {
  const { loading, sessionTimedOut, refetch } = useSession();
  const segments = useSegments();
  const colors = useColors();
  const root = segments[0];
  const isProtectedRoute = PROTECTED_ROUTE_GROUPS.has(root ?? "");

  if (isProtectedRoute && loading) {
    return (
      <View
        style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}
        accessibilityLabel="Verificando sessão"
        accessibilityRole="progressbar"
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 14, fontSize: 15, color: colors.muted, fontWeight: "600" }}>
          Verificando sessão…
        </Text>
      </View>
    );
  }

  if (isProtectedRoute && sessionTimedOut) {
    return (
      <View
        style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background, padding: 24 }}
      >
        <Text style={{ fontSize: 16, color: colors.foreground, fontWeight: "700", marginBottom: 8, textAlign: "center" }}>
          Não foi possível verificar a sessão
        </Text>
        <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 20, textAlign: "center" }}>
          A verificação demorou demais. Tente novamente ou faça login.
        </Text>
        <Text
          onPress={() => refetch()}
          accessibilityRole="button"
          style={{ color: colors.primary, fontWeight: "700", fontSize: 15, padding: 12 }}
        >
          Tentar novamente
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}

/**
 * AuthGuard — Monitora a sessão e redireciona automaticamente:
 * - Usuário não autenticado → /auth/welcome
 * - Usuário autenticado sem perfil AFU → /auth/onboarding
 * - Conta suspensa → /auth/login (com mensagem)
 */
function AuthGuard() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, onboardingPendente, contaSuspensa, loading } = useSession();

  useEffect(() => {
    if (loading) return;

    const root = segments[0];
    const inAuthGroup = root === "auth";
    const inOAuthGroup = root === "oauth";
    const isProtectedRoute = PROTECTED_ROUTE_GROUPS.has(root ?? "");
    const authScreen = segments.at(1);

    const isPublicAuthScreen =
      !authScreen ||
      authScreen === "welcome" ||
      authScreen === "login" ||
      authScreen === "login-new" ||
      authScreen === "cadastro" ||
      authScreen === "cadastro-new" ||
      authScreen === "forgot-password" ||
      authScreen === "reset-password";

    if (!isAuthenticated) {
      if (isProtectedRoute) {
        router.replace("/auth/welcome" as any);
      }
      return;
    }

    if (contaSuspensa) {
      if (!inAuthGroup || authScreen !== "login") {
        router.replace("/auth/login" as any);
      }
      return;
    }

    if (onboardingPendente) {
      if (!inAuthGroup || authScreen !== "onboarding") {
        router.replace("/auth/onboarding" as any);
      }
      return;
    }

    if (inAuthGroup && isPublicAuthScreen) {
      router.replace("/(tabs)" as any);
      return;
    }

    if (inOAuthGroup) return;
  }, [loading, isAuthenticated, onboardingPendente, contaSuspensa, segments, router]);

  return null;
}

/** Monta sync/push e telas protegidas só com sessão autenticada. */
function AuthenticatedRuntime() {
  const { isAuthenticated, loading } = useSession();
  if (loading || !isAuthenticated) return null;
  return (
    <>
      <CoreOfflineSyncManager />
      <PushNotificationManager />
    </>
  );
}

export default function RootLayout() {
  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;

  const [insets, setInsets] = useState<EdgeInsets>(initialInsets);
  const [frame, setFrame] = useState<Rect>(initialFrame);

  useEffect(() => {
    initManusRuntime();
  }, []);

  const handleSafeAreaUpdate = useCallback((metrics: Metrics) => {
    setInsets(metrics.insets);
    setFrame(metrics.frame);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const unsubscribe = subscribeSafeAreaInsets(handleSafeAreaUpdate);
    return () => unsubscribe();
  }, [handleSafeAreaUpdate]);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );
  const [trpcClient] = useState(() => createTRPCClient());

  const providerInitialMetrics = useMemo(() => {
    const metrics = initialWindowMetrics ?? { insets: initialInsets, frame: initialFrame };
    return {
      ...metrics,
      insets: {
        ...metrics.insets,
        top: Math.max(metrics.insets.top, 16),
        bottom: Math.max(metrics.insets.bottom, 12),
      },
    };
  }, [initialInsets, initialFrame]);

  const content = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          {/* Auth pública imediata; gate só em rotas protegidas */}
          <AuthGuard />
          <AuthenticatedRuntime />
          <ProtectedSessionGate>
            <ProtectedStack />
          </ProtectedSessionGate>
          <StatusBar style="auto" />
          {Platform.OS === "web" ? <SpeedInsights /> : null}
        </QueryClientProvider>
      </trpc.Provider>
    </GestureHandlerRootView>
  );

  const shouldOverrideSafeArea = Platform.OS === "web";

  if (shouldOverrideSafeArea) {
    return (
      <ThemeProvider>
        <SafeAreaProvider initialMetrics={providerInitialMetrics}>
          <SafeAreaFrameContext.Provider value={frame}>
            <SafeAreaInsetsContext.Provider value={insets}>
              {content}
            </SafeAreaInsetsContext.Provider>
          </SafeAreaFrameContext.Provider>
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider initialMetrics={providerInitialMetrics}>{content}</SafeAreaProvider>
    </ThemeProvider>
  );
}

/**
 * Rotas protegidas via Stack.Protected (Expo Router 6).
 * Evita Fragment/null como filhos do Stack — isso dispara o aviso
 * "Layout children must be of type Screen".
 * AuthGuard continua redirecionando; Protected impede deep-link sem sessão.
 */
function ProtectedStack() {
  const { isAuthenticated, loading } = useSession();
  const showProtected = isAuthenticated && !loading;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={showProtected}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="mais" />
        <Stack.Screen name="propriedades" />
        <Stack.Screen name="cultivos" />
      </Stack.Protected>
      <Stack.Screen name="oauth/callback" />
      <Stack.Screen name="auth" />
    </Stack>
  );
}
