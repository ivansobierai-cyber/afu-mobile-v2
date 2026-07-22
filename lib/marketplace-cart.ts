import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CartItem } from "@/shared/marketplace";
import {
  isValidOfflineScope,
  localDbStorageKey,
  type OfflineTenantScope,
} from "@/lib/offline/tenant-scope";

/** Legado pré–Etapa 8 (global) — só limpeza */
const LEGACY_CART_KEY = "afu_marketplace_cart";

function cartKey(scope?: OfflineTenantScope | null): string {
  if (isValidOfflineScope(scope)) return localDbStorageKey(scope, "cart", "items");
  return LEGACY_CART_KEY;
}

export async function loadCart(scope?: OfflineTenantScope | null): Promise<CartItem[]> {
  try {
    const raw = await AsyncStorage.getItem(cartKey(scope));
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export async function saveCart(
  items: CartItem[],
  scope?: OfflineTenantScope | null,
): Promise<void> {
  await AsyncStorage.setItem(cartKey(scope), JSON.stringify(items));
}

export async function clearCart(scope?: OfflineTenantScope | null): Promise<void> {
  await AsyncStorage.removeItem(cartKey(scope));
  if (isValidOfflineScope(scope)) {
    try {
      await AsyncStorage.removeItem(LEGACY_CART_KEY);
    } catch {
      // ignore
    }
  }
}
