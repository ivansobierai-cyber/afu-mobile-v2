import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { useSession } from "@/hooks/use-session";
import { trpc } from "@/lib/trpc";
import {
  clearStoredPushToken,
  getPushPlatform,
  getStoredPushToken,
  registerForRemotePush,
} from "@/lib/push-notifications";

/**
 * Registra token push remoto (FCM/APNs via Expo) quando o usuário está autenticado.
 */
export function PushNotificationManager() {
  const router = useRouter();
  const { isAuthenticated, onboardingPendente, loading } = useSession();
  const registerMutation = trpc.push.register.useMutation();
  const unregisterMutation = trpc.push.unregister.useMutation();
  const registeredTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (loading || !isAuthenticated || onboardingPendente || Platform.OS === "web") {
      return;
    }

    let cancelled = false;

    const register = async () => {
      const result = await registerForRemotePush();
      if (cancelled || !result.registered) return;

      registeredTokenRef.current = result.token;
      await registerMutation.mutateAsync({
        expoPushToken: result.token,
        platform: getPushPlatform(),
        deviceName: Platform.OS,
      });
    };

    void register();

    return () => {
      cancelled = true;
    };
  }, [loading, isAuthenticated, onboardingPendente, registerMutation]);

  useEffect(() => {
    if (Platform.OS === "web") return;

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown> | undefined;
      const type = data?.type;

      if (type === "calendario") {
        router.push("/mais/calendario" as any);
        return;
      }
      if (type === "diagnostico") {
        router.push("/(tabs)/diagnostico?historico=1" as any);
        return;
      }
      if (type === "test") {
        router.push("/mais/perfil" as any);
        return;
      }
      if (type === "weather_alert") {
        router.push("/mais/tempo" as any);
        return;
      }
      if (type === "marketplace_pedido" || type === "marketplace_venda") {
        router.push("/mais/marketplace" as any);
      }
    });

    return () => subscription.remove();
  }, [router]);

  useEffect(() => {
    if (!loading && !isAuthenticated && registeredTokenRef.current) {
      const token = registeredTokenRef.current;
      registeredTokenRef.current = null;
      void unregisterMutation.mutateAsync({ expoPushToken: token });
      void clearStoredPushToken();
    }
  }, [loading, isAuthenticated, unregisterMutation]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      void getStoredPushToken().then((token) => {
        if (token) {
          void unregisterMutation.mutateAsync({ expoPushToken: token });
          void clearStoredPushToken();
        }
      });
    }
  }, [loading, isAuthenticated, unregisterMutation]);

  return null;
}
