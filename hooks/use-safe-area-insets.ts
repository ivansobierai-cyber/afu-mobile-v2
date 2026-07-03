import { useContext } from "react";
import {
  SafeAreaInsetsContext,
  type EdgeInsets,
} from "react-native-safe-area-context";

const ZERO_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };

/**
 * Safe-area insets with a zero fallback during navigation transitions.
 * Prefer this over `useSafeAreaInsets()` in layouts that unmount on auth changes.
 */
export function useSafeAreaInsetsOrZero(): EdgeInsets {
  return useContext(SafeAreaInsetsContext) ?? ZERO_INSETS;
}

/** Minimum top/bottom padding applied across app screens. */
export function useAppSafeAreaInsets(): EdgeInsets {
  const insets = useSafeAreaInsetsOrZero();
  return {
    top: Math.max(insets.top, 16),
    right: insets.right,
    bottom: Math.max(insets.bottom, 12),
    left: insets.left,
  };
}
