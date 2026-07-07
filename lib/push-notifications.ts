/**
 * Push remoto (FCM/APNs via Expo Push API).
 * No web, o registro é ignorado com segurança.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const PUSH_TOKEN_STORAGE_KEY = "afu_expo_push_token";

export type PushRegistrationResult =
  | { registered: true; token: string }
  | { registered: false; reason: "web" | "simulator" | "permission_denied" | "missing_project_id" | "error"; message?: string };

function getExpoProjectId(): string | null {
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId;
  return projectId ?? null;
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "AFU Agro",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#2D6A4F",
  });
}

export async function registerForRemotePush(): Promise<PushRegistrationResult> {
  if (Platform.OS === "web") {
    return { registered: false, reason: "web" };
  }

  if (!Device.isDevice) {
    return { registered: false, reason: "simulator", message: "Push requer dispositivo físico." };
  }

  const projectId = getExpoProjectId();
  if (!projectId) {
    return { registered: false, reason: "missing_project_id" };
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return { registered: false, reason: "permission_denied" };
  }

  try {
    await ensureAndroidChannel();
    const tokenResult = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenResult.data;
    await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
    return { registered: true, token };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao obter token push";
    return { registered: false, reason: "error", message };
  }
}

export async function getStoredPushToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export async function clearStoredPushToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function getPushPlatform(): "ios" | "android" | "web" {
  if (Platform.OS === "ios") return "ios";
  if (Platform.OS === "android") return "android";
  return "web";
}
