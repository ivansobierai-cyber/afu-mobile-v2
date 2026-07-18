/**
 * Stub web — registro de push remoto ignorado sem carregar expo-notifications.
 */
export type PushRegistrationResult =
  | { registered: true; token: string }
  | {
      registered: false;
      reason: "web" | "simulator" | "permission_denied" | "missing_project_id" | "error";
      message?: string;
    };

export async function registerForRemotePush(): Promise<PushRegistrationResult> {
  return { registered: false, reason: "web" };
}

export async function getStoredPushToken(): Promise<string | null> {
  return null;
}

export async function clearStoredPushToken(): Promise<void> {
  // no-op
}

export function getPushPlatform(): "ios" | "android" | "web" {
  return "web";
}
