import {
  deletePushToken,
  deletePushTokensByUsuario,
  getPushTokensByUsuario,
  upsertPushToken,
} from "../db";
import { buildExpoPushMessage, sendExpoPushMessages } from "./expo-push";
import type { PushNotificationPayload } from "@/shared/push";

export async function sendPushToUsuario(
  usuarioAfuId: number,
  notification: PushNotificationPayload,
): Promise<{ sent: number; failed: number }> {
  try {
    const tokens = await getPushTokensByUsuario(usuarioAfuId);
    if (tokens.length === 0) {
      return { sent: 0, failed: 0 };
    }

    const messages = tokens.map((row) => buildExpoPushMessage(row.expoPushToken, notification));
    const result = await sendExpoPushMessages(messages);

    for (const invalid of result.invalidTokens) {
      await deletePushToken(invalid);
    }

    return { sent: result.sent, failed: result.failed };
  } catch (error) {
    console.warn("[Push] Falha ao enviar notificação:", error);
    return { sent: 0, failed: 0 };
  }
}

export async function registerUsuarioPushToken(input: {
  usuarioAfuId: number;
  expoPushToken: string;
  platform: "ios" | "android" | "web";
  deviceName?: string;
}): Promise<void> {
  await upsertPushToken(input);
}

export async function unregisterUsuarioPushToken(expoPushToken: string): Promise<void> {
  await deletePushToken(expoPushToken);
}

export async function unregisterAllUsuarioPushTokens(usuarioAfuId: number): Promise<void> {
  await deletePushTokensByUsuario(usuarioAfuId);
}
