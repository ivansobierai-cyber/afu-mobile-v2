// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * SF Symbols to Material Icons mappings for AFU app
 */
const MAPPING = {
  // Navigation
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "chevron.down": "expand-more",
  "chevron.up": "expand-less",
  // AFU specific
  "leaf.fill": "eco",
  "map.fill": "map",
  "camera.fill": "camera-alt",
  "calendar": "calendar-today",
  "ellipsis": "more-horiz",
  "plus": "add",
  "plus.circle.fill": "add-circle",
  "trash.fill": "delete",
  "pencil": "edit",
  "magnifyingglass": "search",
  "bell.fill": "notifications",
  "person.fill": "person",
  "gear": "settings",
  "chart.bar.fill": "bar-chart",
  "waveform.path.ecg": "monitor-heart",
  "drop.fill": "water-drop",
  "sun.max.fill": "wb-sunny",
  "cloud.rain.fill": "grain",
  "thermometer": "device-thermostat",
  "exclamationmark.triangle.fill": "warning",
  "checkmark.circle.fill": "check-circle",
  "xmark.circle.fill": "cancel",
  "info.circle": "info",
  "photo.fill": "photo",
  "arrow.up.doc.fill": "upload-file",
  "doc.text.fill": "description",
  "list.bullet": "list",
  "square.grid.2x2.fill": "grid-view",
  "star.fill": "star",
  "clock.fill": "schedule",
  "location.fill": "location-on",
  "scalemass.fill": "scale",
  "flask.fill": "science",
  "ant.fill": "bug-report",
  "cross.case.fill": "medical-services",
  "cross.circle.fill": "coronavirus",
  "sprout.fill": "grass",
  "tractor.fill": "agriculture",
  "arrow.clockwise": "refresh",
  "xmark": "close",
  "checkmark": "check",
  "eye.fill": "visibility",
  "eye.slash.fill": "visibility-off",
  "arrow.right": "arrow-forward",
  "arrow.left": "arrow-back",
  "ellipsis.circle": "more-vert",
  "square.and.arrow.up": "share",
  "bookmark.fill": "bookmark",
  "heart.fill": "favorite",
  "hand.thumbsup.fill": "thumb-up",
  "bolt.fill": "bolt",
  "wind": "air",
  "humidity.fill": "water",
  // New modules
  "doc.fill": "description",
  "building.2.fill": "business",
  "cart.fill": "shopping-cart",
  "shield.fill": "shield",
  "wrench.fill": "build",
  "circle.fill": "circle",
  "square.fill": "square",
  "person.2.fill": "group",
  "server.rack": "storage",
  "chart.line.uptrend.xyaxis": "trending-up",
  "arrow.down.doc.fill": "download",
  "printer.fill": "print",
  "envelope.fill": "email",
  "phone.fill": "phone",
  "globe": "language",
  "lock.fill": "lock",
  "iphone": "smartphone",
  "desktopcomputer": "desktop-windows",
  "brain": "psychology",
  "books.vertical.fill": "library-books",
  "key.fill": "key",
  "tag.fill": "label",
  "slider.horizontal.3": "tune",
  "antenna.radiowaves.left.and.right": "sensors",
  "graduationcap.fill": "school",
  // Etapas 1-16 new icons
  "megaphone.fill": "campaign",
  "dollarsign.circle.fill": "attach-money",
  "cloud.fill": "cloud",
  "link": "link",
  "paintbrush.fill": "brush",
  "rectangle.on.rectangle": "layers",
  "gearshape.2.fill": "settings-applications",
  "hammer.fill": "hardware",
  "map": "map",
} as unknown as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
