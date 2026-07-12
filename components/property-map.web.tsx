import { createElement } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  StyleSheet,
  type ViewStyle,
} from "react-native";
import { useColors } from "@/hooks/use-colors";
import { formatCoordinates, openStreetMapEmbedUrl, openStreetMapUrl } from "@/lib/geo/coordinates";
import type { MapMarker } from "./property-map-types";

interface PropertyMapProps {
  markers: MapMarker[];
  height?: number;
  style?: ViewStyle;
  onMarkerPress?: (marker: MapMarker) => void;
}

function OsmMapEmbed({ src, height }: { src: string; height: number }) {
  return createElement("iframe", {
    src,
    title: "Mapa da propriedade",
    loading: "lazy",
    style: {
      width: "100%",
      height,
      border: "0",
      display: "block",
      pointerEvents: "none",
    },
  });
}

export function PropertyMap({ markers, height = 220, style, onMarkerPress }: PropertyMapProps) {
  const colors = useColors();

  if (markers.length === 0) {
    return (
      <View
        style={[
          styles.empty,
          { height, backgroundColor: colors.surface, borderColor: colors.border },
          style,
        ]}
      >
        <Text style={{ color: colors.muted, fontSize: 14, textAlign: "center" }}>
          Nenhuma coordenada GPS cadastrada.
        </Text>
      </View>
    );
  }

  const embedUrl = openStreetMapEmbedUrl(markers);
  const primary = markers[0];
  const mapsUrl = openStreetMapUrl(primary.latitude, primary.longitude);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => {
        if (markers.length === 1 && onMarkerPress) {
          onMarkerPress(markers[0]);
          return;
        }
        Linking.openURL(mapsUrl);
      }}
      style={[{ height, borderRadius: 12, overflow: "hidden" }, style]}
    >
      {embedUrl ? (
        <OsmMapEmbed src={embedUrl} height={height} />
      ) : (
        <View style={[styles.empty, { height: "100%", backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={{ color: colors.muted }}>Mapa indisponível</Text>
        </View>
      )}
      <View style={[styles.webOverlay, { backgroundColor: colors.primary + "E6" }]}>
        <Text style={styles.webOverlayText}>
          {markers.length === 1
            ? formatCoordinates(primary.latitude, primary.longitude)
            : `${markers.length} propriedades no mapa`}
        </Text>
        <Text style={styles.webOverlayHint}>
          {markers.length === 1 ? "Toque para ver detalhes" : "Toque para abrir no OpenStreetMap"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  empty: {
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  webOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  webOverlayText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  webOverlayHint: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    marginTop: 2,
  },
});
