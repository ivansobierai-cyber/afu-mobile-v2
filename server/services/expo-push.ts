import type { ExpoPushResponse, PushNotificationPayload } from "@/shared/push";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const CHUNK_SIZE = 100;

export interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  priority?: "default" | "normal" | "high";
}

export function chunkPushMessages<T>(items: T[], size = CHUNK_SIZE): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export function collectInvalidPushTokens(response: ExpoPushResponse, tokens: string[]): string[] {
  const invalid: string[] = [];
  response.data.forEach((ticket, index) => {
    if (ticket.status !== "error") return;
    const errorCode = ticket.details?.error;
    if (errorCode === "DeviceNotRegistered" || errorCode === "InvalidCredentials") {
      const token = tokens[index];
      if (token) invalid.push(token);
    }
  });
  return invalid;
}

export async function sendExpoPushMessages(
  messages: ExpoPushMessage[],
): Promise<{ sent: number; failed: number; invalidTokens: string[] }> {
  if (messages.length === 0) {
    return { sent: 0, failed: 0, invalidTokens: [] };
  }

  let sent = 0;
  let failed = 0;
  const invalidTokens: string[] = [];

  for (const chunk of chunkPushMessages(messages)) {
    const tokens = chunk.map((m) => m.to);
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(chunk),
    });

    if (!response.ok) {
      failed += chunk.length;
      continue;
    }

    const payload = (await response.json()) as ExpoPushResponse;
    for (const ticket of payload.data) {
      if (ticket.status === "ok") sent += 1;
      else failed += 1;
    }
    invalidTokens.push(...collectInvalidPushTokens(payload, tokens));
  }

  return { sent, failed, invalidTokens: [...new Set(invalidTokens)] };
}

export function buildExpoPushMessage(
  token: string,
  notification: PushNotificationPayload,
): ExpoPushMessage {
  return {
    to: token,
    title: notification.title,
    body: notification.body,
    data: notification.data,
    sound: "default",
    priority: notification.priority ?? "high",
  };
}
