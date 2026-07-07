import { useRef, useEffect } from "react";
import MapView, { Marker } from "react-native-maps";
import { View, Text, type ViewStyle } from "react-native";
import { useColors } from "@/hooks/use-colors";
import type { MapMarker } from "./property-map-types";

interface PropertyMapProps {
  markers: MapMarker[];
  height?: number;
  style?: ViewStyle;
  onMarkerPress?: (marker: MapMarker) => void;
}

export function PropertyMap({ markers, height = 220, style, onMarkerPress }: PropertyMapProps) {
  const colors = useColors();
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (!mapRef.current || markers.length === 0) return;
    mapRef.current.fitToCoordinates(
      markers.map((m) => ({ latitude: m.latitude, longitude: m.longitude })),
      { edgePadding: { top: 40, right: 40, bottom: 40, left: 40 }, animated: true },
    );
  }, [markers]);

  if (markers.length === 0) {
    return (
      <View
        style={[
          { height, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center", padding: 16, backgroundColor: colors.surface, borderColor: colors.border },
          style,
        ]}
      >
        <Text style={{ color: colors.muted, fontSize: 14, textAlign: "center" }}>
          Nenhuma coordenada GPS cadastrada.
        </Text>
      </View>
    );
  }

  const initial = markers[0];

  return (
    <View style={[{ height, borderRadius: 12, overflow: "hidden" }, style]}>
      <MapView
        ref={mapRef}
        style={{ width: "100%", height: "100%" }}
        initialRegion={{
          latitude: initial.latitude,
          longitude: initial.longitude,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}
      >
        {markers.map((marker) => (
          <Marker
            key={String(marker.id)}
            coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
            title={marker.title}
            description={marker.description}
            onPress={() => onMarkerPress?.(marker)}
          />
        ))}
      </MapView>
    </View>
  );
}
