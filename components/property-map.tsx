import { useRef, useEffect } from "react";
import MapView, { Marker, Polygon } from "react-native-maps";
import { View, Text, type ViewStyle } from "react-native";
import { useColors } from "@/hooks/use-colors";
import type { MapMarker, MapPolygon } from "./property-map-types";

interface PropertyMapProps {
  markers: MapMarker[];
  polygons?: MapPolygon[];
  height?: number;
  style?: ViewStyle;
  onMarkerPress?: (marker: MapMarker) => void;
}

export function PropertyMap({
  markers,
  polygons = [],
  height = 220,
  style,
  onMarkerPress,
}: PropertyMapProps) {
  const colors = useColors();
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    const coords = [
      ...markers.map((m) => ({ latitude: m.latitude, longitude: m.longitude })),
      ...polygons.flatMap((p) => p.coordinates),
    ];
    if (coords.length === 0) return;
    mapRef.current.fitToCoordinates(coords, {
      edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
      animated: true,
    });
  }, [markers, polygons]);

  if (markers.length === 0 && polygons.length === 0) {
    return (
      <View
        style={[
          {
            height,
            borderRadius: 12,
            borderWidth: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
          style,
        ]}
      >
        <Text style={{ color: colors.muted, fontSize: 14, textAlign: "center" }}>
          Nenhuma coordenada GPS cadastrada.
        </Text>
      </View>
    );
  }

  const initial =
    markers[0] ??
    polygons[0]?.coordinates[0] ?? { latitude: 0, longitude: 0 };

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
        {polygons.map((poly) => (
          <Polygon
            key={String(poly.id)}
            coordinates={poly.coordinates}
            fillColor={poly.color ?? "rgba(46,125,50,0.25)"}
            strokeColor={poly.strokeColor ?? colors.primary}
            strokeWidth={2}
          />
        ))}
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
