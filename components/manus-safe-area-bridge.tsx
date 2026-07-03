import { useEffect, useState, type PropsWithChildren } from "react";
import { Platform } from "react-native";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  type Metrics,
} from "react-native-safe-area-context";

import { subscribeSafeAreaInsets } from "@/lib/_core/manus-runtime";

function withAppMinimumInsets(metrics: Metrics): Metrics {
  return {
    ...metrics,
    insets: {
      ...metrics.insets,
      top: Math.max(metrics.insets.top, 16),
      bottom: Math.max(metrics.insets.bottom, 12),
    },
  };
}

/**
 * Applies Manus iframe safe-area updates without nesting another SafeAreaProvider.
 * Expo Router already mounts SafeAreaProvider at the app root.
 */
export function ManusSafeAreaBridge({ children }: PropsWithChildren) {
  const [override, setOverride] = useState<Metrics | null>(null);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    return subscribeSafeAreaInsets((metrics) => {
      setOverride(withAppMinimumInsets(metrics));
    });
  }, []);

  if (Platform.OS !== "web" || override == null) {
    return children;
  }

  return (
    <SafeAreaFrameContext.Provider value={override.frame}>
      <SafeAreaInsetsContext.Provider value={override.insets}>
        {children}
      </SafeAreaInsetsContext.Provider>
    </SafeAreaFrameContext.Provider>
  );
}
