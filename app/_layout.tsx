import "@/global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { Platform } from "react-native";
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

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };
const PROTECTED_ROUTE_GROUPS = new Set(["(tabs)", "mais", "propriedades", "cultivos", "admin"]);

export const unstable_settings = {
  anchor: "(tabs)",
};

/**
 * AuthGuard — Monitora a sessão e redireciona automaticamente:
 * - Usuário não autenticado → /auth/welcome
 * - Usuário autenticado sem perfil AFU → /auth/onboarding
 * - Conta suspensa → /auth/login (com mensagem)
 *
 * Deve ser renderizado DENTRO dos providers (trpc + queryClient).
 */
function AuthGuard() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, onboardingPendente, contaSuspensa, loading } = useSession();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Aguarda o carregamento da sessão antes de agir
    if (loading) return;

    const root = segments[0];
    const inAuthGroup = root === "auth";
    const inOAuthGroup = root === "oauth";
    const isProtectedRoute = PROTECTED_ROUTE_GROUPS.has(root ?? "");
    const authScreen = (segments as string[])[1];

    // Rotas públicas de auth (login, cadastro, recuperação)
    const isPublicAuthScreen =
      !authScreen ||
      authScreen === "welcome" ||
      authScreen === "login" ||
      authScreen === "login-new" ||
      authScreen === "cadastro" ||
      authScreen === "cadastro-new" ||
      authScreen === "forgot-password" ||
      authScreen === "reset-password";

    // Não autenticado: redireciona para welcome
    if (!isAuthenticated) {
      if (isProtectedRoute) {
        router.replace("/auth/welcome" as any);
      }
      return;
    }

    // Conta suspensa: redireciona para login com aviso
    if (contaSuspensa) {
      if (!inAuthGroup || authScreen !== "login") {
        router.replace("/auth/login" as any);
      }
      return;
    }

    // Usuário logado sem perfil AFU: redireciona para onboarding
    if (onboardingPendente) {
      if (!inAuthGroup || authScreen !== "onboarding") {
        router.replace("/auth/onboarding" as any);
      }
      return;
    }

    // Perfil completo: não permanece em telas de entrada/login
    if (inAuthGroup && isPublicAuthScreen) {
      router.replace("/(tabs)" as any);
      return;
    }

    // Evita redirecionar durante callback OAuth
    if (inOAuthGroup) return;
  }, [loading, isAuthenticated, onboardingPendente, contaSuspensa, segments, router]);

  return null;
}

export default function RootLayout() {
  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;

  const [insets, setInsets] = useState<EdgeInsets>(initialInsets);
  const [frame, setFrame] = useState<Rect>(initialFrame);

  // Initialize Manus runtime for cookie injection from parent container
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

  // Create clients once and reuse them
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Disable automatic refetching on window focus for mobile
            refetchOnWindowFocus: false,
            // Retry failed requests once
            retry: 1,
          },
        },
      }),
  );
  const [trpcClient] = useState(() => createTRPCClient());

  // Ensure minimum 8px padding for top and bottom on mobile
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
          {/* Default to hiding native headers so raw route segments don't appear (e.g. "(tabs)", "products/[id]"). */}
          {/* If a screen needs the native header, explicitly enable it and set a human title via Stack.Screen options. */}
          {/* in order for ios apps tab switching to work properly, use presentation: "fullScreenModal" for login page, whenever you decide to use presentation: "modal*/}
          <AuthGuard />
          <CoreOfflineSyncManager />
          <PushNotificationManager />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="oauth/callback" />
            <Stack.Screen name="admin" />
            <Stack.Screen name="mais" />
            <Stack.Screen name="propriedades" />
            <Stack.Screen name="cultivos" />
            <Stack.Screen name="auth" />
          </Stack>
          <StatusBar style="auto" />
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
