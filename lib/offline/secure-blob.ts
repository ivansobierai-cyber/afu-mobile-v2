/**
 * Etapa 8 — ofuscação/criptografia leve de blobs sensíveis no dispositivo.
 * Usa Web Crypto AES-GCM quando disponível; caso contrário, isola por namespace
 * (a chave de storage já é tenant-scoped).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const DEVICE_SECRET_KEY = "afu:device_secret:v1";
const ENC_PREFIX = "afuenc:v1:";

function bytesToB64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]!);
  if (typeof btoa === "function") return btoa(s);
  return Buffer.from(bytes).toString("base64");
}

function b64ToBytes(b64: string): Uint8Array {
  if (typeof atob === "function") {
    const s = atob(b64);
    const out = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  }
  return new Uint8Array(Buffer.from(b64, "base64"));
}

async function getOrCreateDeviceSecret(): Promise<Uint8Array> {
  let raw: string | null = null;
  try {
    raw = await AsyncStorage.getItem(DEVICE_SECRET_KEY);
  } catch {
    raw = null;
  }
  if (!raw && Platform.OS === "web" && typeof window !== "undefined") {
    try {
      raw = window.localStorage.getItem(DEVICE_SECRET_KEY);
    } catch {
      raw = null;
    }
  }
  if (raw) return b64ToBytes(raw);

  const secret = new Uint8Array(32);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(secret);
  } else {
    for (let i = 0; i < secret.length; i++) secret[i] = Math.floor(Math.random() * 256);
  }
  const encoded = bytesToB64(secret);
  try {
    await AsyncStorage.setItem(DEVICE_SECRET_KEY, encoded);
  } catch {
    // ignore
  }
  if (Platform.OS === "web" && typeof window !== "undefined") {
    try {
      window.localStorage.setItem(DEVICE_SECRET_KEY, encoded);
    } catch {
      // ignore
    }
  }
  return secret;
}

function hasSubtle(): boolean {
  return Boolean(globalThis.crypto?.subtle);
}

async function importAesKey(secret: Uint8Array): Promise<CryptoKey> {
  return globalThis.crypto.subtle.importKey(
    "raw",
    secret.buffer.slice(secret.byteOffset, secret.byteOffset + secret.byteLength) as ArrayBuffer,
    "AES-GCM",
    false,
    ["encrypt", "decrypt"],
  );
}

/** Serializa e cifra (quando possível) um valor JSON sensível. */
export async function sealJson(value: unknown): Promise<string> {
  const plain = JSON.stringify(value);
  if (!hasSubtle()) return plain;

  const secret = await getOrCreateDeviceSecret();
  const key = await importAesKey(secret);
  const iv = new Uint8Array(12);
  globalThis.crypto.getRandomValues(iv);
  const encoded = new TextEncoder().encode(plain);
  const cipher = await globalThis.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  return `${ENC_PREFIX}${bytesToB64(iv)}.${bytesToB64(new Uint8Array(cipher))}`;
}

export async function openJson<T>(raw: string | null | undefined): Promise<T | null> {
  if (!raw) return null;
  if (!raw.startsWith(ENC_PREFIX)) {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }
  if (!hasSubtle()) return null;
  try {
    const body = raw.slice(ENC_PREFIX.length);
    const [ivB64, dataB64] = body.split(".");
    if (!ivB64 || !dataB64) return null;
    const secret = await getOrCreateDeviceSecret();
    const key = await importAesKey(secret);
    const plainBuf = await globalThis.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: b64ToBytes(ivB64) },
      key,
      b64ToBytes(dataB64),
    );
    return JSON.parse(new TextDecoder().decode(plainBuf)) as T;
  } catch {
    return null;
  }
}
