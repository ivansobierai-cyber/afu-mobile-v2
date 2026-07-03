import { useMemo } from "react";
import { View, type ViewProps, type ViewStyle } from "react-native";
import { type Edge } from "react-native-safe-area-context";

import { useAppSafeAreaInsets } from "@/hooks/use-safe-area-insets";
import { cn } from "@/lib/utils";

export interface ScreenContainerProps extends ViewProps {
  /**
   * SafeArea edges to apply. Defaults to ["top", "left", "right"].
   * Bottom is typically handled by Tab Bar.
   */
  edges?: Edge[];
  /**
   * Tailwind className for the content area.
   */
  className?: string;
  /**
   * Additional className for the outer container (background layer).
   */
  containerClassName?: string;
  /**
   * @deprecated Use `className` — kept for backwards compatibility.
   */
  safeAreaClassName?: string;
}

function buildSafeAreaPadding(
  edges: Edge[],
  insets: { top: number; right: number; bottom: number; left: number },
): ViewStyle {
  const padding: ViewStyle = {};

  if (edges.includes("top")) padding.paddingTop = insets.top;
  if (edges.includes("right")) padding.paddingRight = insets.right;
  if (edges.includes("bottom")) padding.paddingBottom = insets.bottom;
  if (edges.includes("left")) padding.paddingLeft = insets.left;

  return padding;
}

/**
 * Screen wrapper that applies safe-area padding via `useSafeAreaInsets` + View.
 * Avoids nested SafeAreaView instances during stack/tab transitions.
 */
export function ScreenContainer({
  children,
  edges = ["top", "left", "right"],
  className,
  containerClassName,
  safeAreaClassName,
  style,
  ...props
}: ScreenContainerProps) {
  const insets = useAppSafeAreaInsets();

  const safeAreaStyle = useMemo(
    () => buildSafeAreaPadding(edges, insets),
    [edges, insets],
  );

  return (
    <View
      className={cn("flex-1", "bg-background", containerClassName)}
      style={style}
      {...props}
    >
      <View
        className={cn("flex-1", safeAreaClassName, className)}
        style={safeAreaStyle}
      >
        {children}
      </View>
    </View>
  );
}
