import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { WeatherCard } from "@/components/weather-card";
import { ScreenHeader } from "@/components/screen-header";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { MODULE_COLORS } from "@/constants/module-colors";
import { hasValidCoordinates, parseCoordinate } from "@/lib/geo/coordinates";
import { trpc } from "@/lib/trpc";
import { useTenantQueryScope } from "@/hooks/use-tenant-query-scope";

export default function TempoScreen() {
  const colors = useColors();
  const router = useRouter();
  const { cacheInput, activeOrganizationId } = useTenantQueryScope();
  const { data: propriedades = [], isLoading } = trpc.coreData.propriedades.list.useQuery(
    cacheInput,
    { enabled: !!activeOrganizationId },
  );

  const comGps = propriedades.filter((p) =>
    hasValidCoordinates(parseCoordinate(p.latitude), parseCoordinate(p.longitude)),
  );
  const semGps = propriedades.filter(
    (p) => !hasValidCoordinates(parseCoordinate(p.latitude), parseCoordinate(p.longitude)),
  );

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const activeId = selectedId ?? comGps[0]?.id ?? null;

  const styles = StyleSheet.create({
    chip: {
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderWidth: 1,
      marginRight: 8,
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
      <ScreenHeader
        title="Clima"
        subtitle="Open-Meteo · por propriedade"
        accentColor={MODULE_COLORS.clima}
      />

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {comGps.length === 0 ? (
            <View style={[styles.card, { alignItems: "center", paddingVertical: 32 }]}>
              <IconSymbol name="location.fill" size={40} color={colors.muted} />
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginTop: 12 }}>
                Nenhuma propriedade com GPS
              </Text>
              <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", marginTop: 8, lineHeight: 20 }}>
                Cadastre latitude e longitude nas propriedades para consultar o clima local.
              </Text>
              <TouchableOpacity
                style={{ marginTop: 16, backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 }}
                onPress={() => router.push("/(tabs)/propriedades" as any)}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>Ir para Propriedades</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {comGps.map((p) => {
                  const active = p.id === activeId;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: active ? colors.primary : colors.surface,
                          borderColor: active ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setSelectedId(p.id)}
                    >
                      <Text style={{ color: active ? "#fff" : colors.foreground, fontWeight: "600", fontSize: 13 }}>
                        {p.nome}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {activeId != null && <WeatherCard propriedadeId={activeId} showForecast />}
            </>
          )}

          {semGps.length > 0 && (
            <>
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginTop: 8, marginBottom: 10 }}>
                Sem GPS ({semGps.length})
              </Text>
              {semGps.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.card}
                  onPress={() => router.push(`/(tabs)/propriedades` as any)}
                >
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>{p.nome}</Text>
                  <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
                    Edite para adicionar coordenadas GPS.
                  </Text>
                </TouchableOpacity>
              ))}
            </>
          )}

          <TouchableOpacity
            style={{ marginTop: 8, alignItems: "center", paddingVertical: 12 }}
            onPress={() => router.push("/mais/clima" as any)}
          >
            <Text style={{ color: colors.primary, fontWeight: "600" }}>
              Ver necessidades climáticas por cultura →
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </ScreenContainer>
  );
}
