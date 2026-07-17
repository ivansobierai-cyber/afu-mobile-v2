import "dotenv/config";
import { vi } from "vitest";

(globalThis as typeof globalThis & { __DEV__?: boolean }).__DEV__ = false;

const localStorageMock = (() => {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  } satisfies Storage;
})();

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

vi.mock("react-native", () => ({
  Platform: { OS: "web" },
  TurboModuleRegistry: {
    get: () => null,
    getEnforcing: () => null,
  },
}));

vi.mock("expo-linking", () => ({
  createURL: vi.fn((path: string) => `afu://${path}`),
  canOpenURL: vi.fn(async () => true),
  openURL: vi.fn(async () => undefined),
  parse: vi.fn(),
  getInitialURL: vi.fn(async () => null),
}));

vi.mock("expo-secure-store", () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

vi.mock("expo-modules-core", () => {
  class MockEventEmitter {
    addListener() {
      return { remove: () => undefined };
    }
    removeAllListeners() {}
    emit() {}
  }
  return {
    EventEmitter: MockEventEmitter,
    NativeModulesProxy: {},
    requireNativeModule: vi.fn(() => ({})),
    requireOptionalNativeModule: vi.fn(() => null),
    CodedError: class CodedError extends Error {},
    UnavailabilityError: class UnavailabilityError extends Error {},
  };
});

vi.mock("expo-constants", () => ({
  default: {
    expoConfig: { extra: {} },
    manifest: {},
    platform: {},
  },
}));
