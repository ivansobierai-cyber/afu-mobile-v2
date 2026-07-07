import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { PropertyMap } from "@/components/property-map";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { hasValidCoordinates, parseCoordinate } from "@/lib/geo/coordinates";
import { trpc } from "@/lib/trpc";

export default function PropriedadesMapaScreen() {
  const colors = useColors();
  const router = useRouter();
  const { data: propriedades = [], isLoading } = trpc.coreData.propriedades.list.useQuery();

  const comCoordenadas = propriedades
    .map((p) => {
      const latitude = parseCoordinate(p.latitude);
      const longitude = parseCoordinate(p.longitude);
      if (!hasValidCoordinates(latitude, longitude)) return null;
      return {
        id: p.id,
        latitude: latitude!,
        longitude: longitude!,
        title: p.nome,
        description: [p.cidade, p.estado].filter(Boolean).join(", ") || undefined,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p != null);

  const semCoordenadas = propriedades.filter((p) => {
    const latitude = parseCoordinate(p.latitude);
    const longitude = parseCoordinate(p.longitude);
    return !hasValidCoordinates(latitude, longitude);
  });

  const styles = StyleSheet.create({
    header: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 20,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 8,
    },
  });

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#FFFFFF" }}>Mapa de Propriedades</Text>
          <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>
            {comCoordenadas.length} com GPS · {semCoordenadas.length} sem GPS
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <PropertyMap
            markers={comCoordenadas}
            height={280}
            onMarkerPress={(marker) => router.push(`/propriedades/${marker.id}`)}
          />

          {comCoordenadas.length > 0 && (
            <>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginTop: 20, marginBottom: 10 }}>
                No mapa ({comCoordenadas.length})
              </Text>
              {comCoordenadas.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.card}
                  onPress={() => router.push(`/propriedades/${p.id}`)}
                >
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>{p.title}</Text>
                  {p.description ? (
                    <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>{p.description}</Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </>
          )}

          {semCoordenadas.length > 0 && (
            <>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginTop: 20, marginBottom: 10 }}>
                Sem localização GPS ({semCoordenadas.length})
              </Text>
              {semCoordenadas.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.card}
                  onPress={() => router.push(`/propriedades/${p.id}`)}
                >
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>{p.nome}</Text>
                  <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
                    Edite a propriedade para adicionar coordenadas GPS.
                  </Text>
                </TouchableOpacity>
              ))}
            </>
          )}

          {propriedades.length === 0 && (
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <Text style={{ color: colors.muted }}>Nenhuma propriedade cadastrada.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </ScreenContainer>
  );
}
