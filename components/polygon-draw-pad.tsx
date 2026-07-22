import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type LayoutChangeEvent,
  type GestureResponderEvent,
} from "react-native";
import { useColors } from "@/hooks/use-colors";
import {
  verticesToPolygonGeoJson,
  type LatLng,
} from "@/lib/propriedades/geojson-helpers";

type PolygonDrawPadProps = {
  center: LatLng;
  height?: number;
  onComplete: (geoJson: string) => void;
  onCancel: () => void;
};

const SPAN_DEGREES = 0.02;
const NUDGE_DEGREES = 0.001;

function clampCoordinate(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatCoord(value: number) {
  return value.toFixed(6);
}

export function PolygonDrawPad({
  center,
  height = 320,
  onComplete,
  onCancel,
}: PolygonDrawPadProps) {
  const colors = useColors();
  const [vertices, setVertices] = useState<LatLng[]>([]);
  const [draftLat, setDraftLat] = useState(formatCoord(center.latitude));
  const [draftLng, setDraftLng] = useState(formatCoord(center.longitude));
  const [padSize, setPadSize] = useState({ width: 0, height });

  useEffect(() => {
    setDraftLat(formatCoord(center.latitude));
    setDraftLng(formatCoord(center.longitude));
  }, [center.latitude, center.longitude]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        pad: {
          height,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.primary + "12",
          overflow: "hidden",
          justifyContent: "center",
          alignItems: "center",
        },
        button: {
          minHeight: 42,
          borderRadius: 12,
          paddingHorizontal: 12,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: colors.border,
        },
        primaryButton: {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },
        input: {
          flex: 1,
          minHeight: 42,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 10,
          color: colors.foreground,
        },
      }),
    [colors, height],
  );

  const addVertex = (point: LatLng) => {
    setVertices((current) => [...current, point]);
    setDraftLat(formatCoord(point.latitude));
    setDraftLng(formatCoord(point.longitude));
  };

  const addDraftVertex = () => {
    const latitude = Number(draftLat.replace(",", "."));
    const longitude = Number(draftLng.replace(",", "."));
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      Alert.alert(
        "Coordenadas inválidas",
        "Informe latitude e longitude numéricas.",
      );
      return;
    }
    addVertex({
      latitude: clampCoordinate(latitude, -90, 90),
      longitude: clampCoordinate(longitude, -180, 180),
    });
  };

  const nudgeDraft = (deltaLat: number, deltaLng: number) => {
    const latitude = Number(draftLat.replace(",", "."));
    const longitude = Number(draftLng.replace(",", "."));
    setDraftLat(
      formatCoord(
        clampCoordinate(
          (Number.isFinite(latitude) ? latitude : center.latitude) + deltaLat,
          -90,
          90,
        ),
      ),
    );
    setDraftLng(
      formatCoord(
        clampCoordinate(
          (Number.isFinite(longitude) ? longitude : center.longitude) +
            deltaLng,
          -180,
          180,
        ),
      ),
    );
  };

  const handlePadPress = (event: GestureResponderEvent) => {
    const nativeEvent =
      event.nativeEvent as GestureResponderEvent["nativeEvent"] & {
        locationX?: number;
        locationY?: number;
      };
    if (
      !Number.isFinite(nativeEvent.locationX) ||
      !Number.isFinite(nativeEvent.locationY) ||
      padSize.width <= 0 ||
      padSize.height <= 0
    ) {
      return;
    }
    const xRatio = clampCoordinate(
      (nativeEvent.locationX ?? 0) / padSize.width,
      0,
      1,
    );
    const yRatio = clampCoordinate(
      (nativeEvent.locationY ?? 0) / padSize.height,
      0,
      1,
    );
    addVertex({
      latitude: clampCoordinate(
        center.latitude + (0.5 - yRatio) * SPAN_DEGREES,
        -90,
        90,
      ),
      longitude: clampCoordinate(
        center.longitude + (xRatio - 0.5) * SPAN_DEGREES,
        -180,
        180,
      ),
    });
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height: nextHeight } = event.nativeEvent.layout;
    setPadSize({ width, height: nextHeight });
  };

  const conclude = () => {
    const result = verticesToPolygonGeoJson(vertices);
    if (!result.ok) {
      Alert.alert("Polígono inválido", result.error);
      return;
    }
    onComplete(result.normalized);
  };

  return (
    <View style={{ gap: 12 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Área para desenhar perímetro"
        onPress={handlePadPress}
        onLayout={handleLayout}
        style={styles.pad}
      >
        <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 4 }}>
          Toque para adicionar vértices
        </Text>
        <Text style={{ color: colors.muted, fontSize: 11 }}>
          Centro: {formatCoord(center.latitude)},{" "}
          {formatCoord(center.longitude)}
        </Text>
        {vertices.map((vertex, index) => {
          const left =
            padSize.width / 2 +
            ((vertex.longitude - center.longitude) / SPAN_DEGREES) *
              padSize.width;
          const top =
            padSize.height / 2 -
            ((vertex.latitude - center.latitude) / SPAN_DEGREES) *
              padSize.height;
          return (
            <View
              key={`${index}-${vertex.latitude}-${vertex.longitude}`}
              pointerEvents="none"
              style={{
                position: "absolute",
                left,
                top,
                transform: [{ translateX: -12 }, { translateY: -12 }],
                minWidth: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 5,
              }}
            >
              <Text style={{ color: "#FFF", fontSize: 11, fontWeight: "800" }}>
                {index + 1}
              </Text>
            </View>
          );
        })}
      </Pressable>

      <View style={{ gap: 8 }}>
        <Text
          style={{ fontSize: 13, fontWeight: "700", color: colors.foreground }}
        >
          Adicionar ponto manual
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput
            value={draftLat}
            onChangeText={setDraftLat}
            keyboardType="decimal-pad"
            placeholder="Latitude"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
          <TextInput
            value={draftLng}
            onChangeText={setDraftLng}
            keyboardType="decimal-pad"
            placeholder="Longitude"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {[
            ["N", NUDGE_DEGREES, 0],
            ["S", -NUDGE_DEGREES, 0],
            ["E", 0, NUDGE_DEGREES],
            ["W", 0, -NUDGE_DEGREES],
          ].map(([label, dLat, dLng]) => (
            <TouchableOpacity
              key={String(label)}
              accessibilityRole="button"
              accessibilityLabel={`Mover ponto ${label}`}
              onPress={() => nudgeDraft(Number(dLat), Number(dLng))}
              style={[styles.button, { minWidth: 48 }]}
            >
              <Text style={{ color: colors.foreground, fontWeight: "700" }}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Adicionar ponto no GPS"
            onPress={() => {
              setDraftLat(formatCoord(center.latitude));
              setDraftLng(formatCoord(center.longitude));
              addVertex(center);
            }}
            style={styles.button}
          >
            <Text style={{ color: colors.foreground, fontWeight: "700" }}>
              Adicionar ponto no GPS
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Adicionar ponto manual"
            onPress={addDraftVertex}
            style={[styles.button, styles.primaryButton]}
          >
            <Text style={{ color: "#FFF", fontWeight: "700" }}>Adicionar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ maxHeight: 150 }}
        showsVerticalScrollIndicator={false}
      >
        {vertices.length === 0 ? (
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            Nenhum vértice. Adicione pelo menos 3 pontos para concluir.
          </Text>
        ) : (
          vertices.map((vertex, index) => (
            <View
              key={`row-${index}-${vertex.latitude}-${vertex.longitude}`}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                paddingVertical: 6,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{ color: "#FFF", fontSize: 11, fontWeight: "800" }}
                >
                  {index + 1}
                </Text>
              </View>
              <Text style={{ flex: 1, color: colors.foreground, fontSize: 12 }}>
                {formatCoord(vertex.latitude)}, {formatCoord(vertex.longitude)}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Desfazer último ponto"
          disabled={vertices.length === 0}
          onPress={() => setVertices((current) => current.slice(0, -1))}
          style={[styles.button, { opacity: vertices.length === 0 ? 0.5 : 1 }]}
        >
          <Text style={{ color: colors.foreground, fontWeight: "700" }}>
            Desfazer
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Limpar pontos"
          disabled={vertices.length === 0}
          onPress={() => setVertices([])}
          style={[styles.button, { opacity: vertices.length === 0 ? 0.5 : 1 }]}
        >
          <Text style={{ color: colors.foreground, fontWeight: "700" }}>
            Limpar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Cancelar desenho"
          onPress={onCancel}
          style={styles.button}
        >
          <Text style={{ color: colors.foreground, fontWeight: "700" }}>
            Cancelar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Concluir polígono"
          disabled={vertices.length < 3}
          onPress={conclude}
          style={[
            styles.button,
            styles.primaryButton,
            { opacity: vertices.length < 3 ? 0.5 : 1, flexGrow: 1 },
          ]}
        >
          <Text style={{ color: "#FFF", fontWeight: "700" }}>Concluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
