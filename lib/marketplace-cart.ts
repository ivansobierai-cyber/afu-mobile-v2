import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CartItem } from "@/shared/marketplace";

const CART_KEY = "afu_marketplace_cart";

export async function loadCart(): Promise<CartItem[]> {
  try {
    const raw = await AsyncStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export async function saveCart(items: CartItem[]): Promise<void> {
  await AsyncStorage.setItem(CART_KEY, JSON.stringify(items));
}

export async function clearCart(): Promise<void> {
  await AsyncStorage.removeItem(CART_KEY);
}
