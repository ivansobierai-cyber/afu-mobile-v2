import "@/lib/_core/nativewind-safe-area";
import "@/global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import "@/lib/_core/nativewind-pressable";
import { ThemeProvider } from "@/lib/theme-provider";
import { useSession } from "@/hooks/use-session";
import { ManusSafeAreaBridge } from "@/components/manus-safe-area-bridge";
import { isAuthDisabled } from "@shared/dev-auth";

import { trpc, createTRPCClient } from "@/lib/trpc";
import { initManusRuntime } from "@/lib/_core/manus-runtime";
import {
  startTokenRefreshCheck,
  stopTokenRefreshCheck,
} from "@/lib/token-refresh-interceptor";
import { useCoreOfflineSync } from "@/hooks/use-core-offline-sync";

export const unstable_settings = {
  anchor: "(tabs)",
};

/**
 * AuthGuard — Monitora a sessão e redireciona automaticamente.
 * Desativado em desenvolvimento quando isAuthDisabled() === true.
 */
const PROTECTED_ROUTE_GROUPS = new Set(["(tabs)", "mais", "propriedades", "cultivos", "admin"]);

function AuthGuard() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, onboardingPendente, contaSuspensa, loading } = useSession();

  useEffect(() => {
    if (isAuthDisabled()) {
      const root = segments[0];
      if (root === "auth") {
        router.replace("/(tabs)" as any);
      }
      return;
    }

    if (loading) return;

    const root = segments[0];
    const inAuthGroup = root === "auth";
    const inOAuthGroup = root === "oauth";
    const isProtectedRoute = PROTECTED_ROUTE_GROUPS.has(root ?? "");
    const authScreen = segments[1];

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

function TokenRefreshManager() {
  const { isAuthenticated, loading } = useSession();

  useEffect(() => {
    if (isAuthDisabled() || loading) return;

    if (isAuthenticated) {
      startTokenRefreshCheck();
    } else {
      stopTokenRefreshCheck();
    }

    return () => stopTokenRefreshCheck();
  }, [isAuthenticated, loading]);

  return null;
}

/** Processa fila de mutações core ao reconectar. */
function CoreOfflineSyncManager() {
  const { isAuthenticated, loading } = useSession();
  const { syncNow, isOnline } = useCoreOfflineSync();

  useEffect(() => {
    if (loading || !isAuthenticated || !isOnline) return;
    void syncNow();
  }, [isAuthenticated, isOnline, loading, syncNow]);

  return null;
}

export default function RootLayout() {
  useEffect(() => {
    initManusRuntime();
  }, []);

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

  return (
    <ThemeProvider>
      <ManusSafeAreaBridge>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
              {/* Default to hiding native headers so raw route segments don't appear (e.g. "(tabs)", "products/[id]"). */}
              {/* If a screen needs the native header, explicitly enable it and set a human title via Stack.Screen options. */}
              {/* in order for ios apps tab switching to work properly, use presentation: "fullScreenModal" for login page, whenever you decide to use presentation: "modal*/}
              <AuthGuard />
              <TokenRefreshManager />
              <CoreOfflineSyncManager />
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
      </ManusSafeAreaBridge>
    </ThemeProvider>
  );
}
