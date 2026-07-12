import { SymbolView, SymbolViewProps, SymbolWeight } from "expo-symbols";
import { StyleProp, ViewStyle } from "react-native";

import type { IconSymbolName } from "./icon-symbol";

/** Custom app icon names that differ from SF Symbols on iOS. */
const IOS_ALIASES: Partial<Record<IconSymbolName, SymbolViewProps["name"]>> = {
  "sprout.fill": "leaf.fill",
  "thermometer.medium": "thermometer",
  "sparkles": "sparkles",
};

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = "regular",
}: {
  name: IconSymbolName;
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  const sfName = (IOS_ALIASES[name] ?? name) as SymbolViewProps["name"];

  return (
    <SymbolView
      weight={weight}
      tintColor={color}
      resizeMode="scaleAspectFit"
      name={sfName}
      style={[
        {
          width: size,
          height: size,
        },
        style,
      ]}
    />
  );
}
