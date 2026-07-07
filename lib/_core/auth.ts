import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { SESSION_TOKEN_KEY, USER_INFO_KEY } from "@/constants/oauth";

export type User = {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  lastSignedIn: Date;
};

function getWebStorage(): Storage | null {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;
  return window.sessionStorage;
}

export async function getSessionToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      const token = getWebStorage()?.getItem(SESSION_TOKEN_KEY) ?? null;
      return token;
    }

    console.log("[Auth] Getting session token...");
    const token = await SecureStore.getItemAsync(SESSION_TOKEN_KEY);
    return token ?? null;
  } catch (error) {
    console.error("[Auth] Failed to get session token:", error);
    return null;
  }
}

export async function setSessionToken(token: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      getWebStorage()?.setItem(SESSION_TOKEN_KEY, token);
      return;
    }

    await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
  } catch (error) {
    console.error("[Auth] Failed to set session token:", error);
    throw error;
  }
}

export async function removeSessionToken(): Promise<void> {
  try {
    if (Platform.OS === "web") {
      getWebStorage()?.removeItem(SESSION_TOKEN_KEY);
      return;
    }

    await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
  } catch (error) {
    console.error("[Auth] Failed to remove session token:", error);
  }
}

export async function getUserInfo(): Promise<User | null> {
  try {
    let info: string | null = null;
    if (Platform.OS === "web") {
      info = window.localStorage.getItem(USER_INFO_KEY);
    } else {
      info = await SecureStore.getItemAsync(USER_INFO_KEY);
    }

    if (!info) return null;
    return JSON.parse(info) as User;
  } catch (error) {
    console.error("[Auth] Failed to get user info:", error);
    return null;
  }
}

export async function setUserInfo(user: User): Promise<void> {
  try {
    if (Platform.OS === "web") {
      window.localStorage.setItem(USER_INFO_KEY, JSON.stringify(user));
      return;
    }

    await SecureStore.setItemAsync(USER_INFO_KEY, JSON.stringify(user));
  } catch (error) {
    console.error("[Auth] Failed to set user info:", error);
  }
}

export async function clearUserInfo(): Promise<void> {
  try {
    if (Platform.OS === "web") {
      window.localStorage.removeItem(USER_INFO_KEY);
      return;
    }

    await SecureStore.deleteItemAsync(USER_INFO_KEY);
  } catch (error) {
    console.error("[Auth] Failed to clear user info:", error);
  }
}

const REFRESH_TOKEN_KEY = "afu_refresh_token";

export async function getRefreshToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      return getWebStorage()?.getItem(REFRESH_TOKEN_KEY) ?? null;
    }

    const token = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    return token ?? null;
  } catch (error) {
    console.error("[Auth] Failed to get refresh token:", error);
    return null;
  }
}

export async function setRefreshToken(token: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      getWebStorage()?.setItem(REFRESH_TOKEN_KEY, token);
      return;
    }

    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  } catch (error) {
    console.error("[Auth] Failed to set refresh token:", error);
    throw error;
  }
}

export async function removeRefreshToken(): Promise<void> {
  try {
    if (Platform.OS === "web") {
      getWebStorage()?.removeItem(REFRESH_TOKEN_KEY);
      return;
    }

    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error("[Auth] Failed to remove refresh token:", error);
  }
}

/** Limpa toda autenticação local (web + native). */
export async function clearLocalAuth(): Promise<void> {
  await removeSessionToken();
  await removeRefreshToken();
  await clearUserInfo();
}
