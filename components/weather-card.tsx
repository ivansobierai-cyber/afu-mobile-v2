import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import type { WeatherAlert } from "@/shared/weather";

interface WeatherCardProps {
  propriedadeId: number;
  compact?: boolean;
  showForecast?: boolean;
}

const ALERT_COLORS: Record<WeatherAlert["type"], string> = {
  frost: "#3B82F6",
  heat: "#EF4444",
  rain: "#2563EB",
  wind: "#D97706",
};

function formatDay(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "Hoje";
  if (date.toDateString() === tomorrow.toDateString()) return "Amanhã";
  return date.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" });
}

export function WeatherCard({ propriedadeId, compact = false, showForecast = true }: WeatherCardProps) {
  const colors = useColors();
  const router = useRouter();

  const { data, isLoading, isError, error, refetch, isFetching } =
    trpc.weather.byPropriedade.useQuery(
      { propriedadeId },
      { staleTime: 10 * 60 * 1000, retry: 1 },
    );

  if (isLoading) {
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={{ color: colors.muted, marginTop: 8, fontSize: 13 }}>Carregando clima...</Text>
      </View>
    );
  }

  if (isError) {
    const message = error.message?.includes("coordenadas GPS")
      ? "Cadastre GPS na propriedade para ver o clima em tempo real."
      : "Não foi possível carregar o clima agora.";

    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <IconSymbol name="cloud.fill" size={28} color={colors.muted} />
        <Text style={{ color: colors.muted, marginTop: 8, fontSize: 13, textAlign: "center", lineHeight: 20 }}>
          {message}
        </Text>
        {!error.message?.includes("coordenadas GPS") && (
          <TouchableOpacity onPress={() => refetch()} style={{ marginTop: 10 }}>
            <Text style={{ color: colors.primary, fontWeight: "600" }}>Tentar novamente</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (!data) return null;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "600" }}>CLIMA AGORA</Text>
          {data.locationName ? (
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginTop: 2 }} numberOfLines={1}>
              {data.locationName}
            </Text>
          ) : null}
        </View>
        {isFetching && <ActivityIndicator size="small" color={colors.primary} />}
        {!compact && (
          <TouchableOpacity onPress={() => router.push("/mais/tempo" as any)}>
            <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 13 }}>Ver mais</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.currentRow}>
        <View>
          <Text style={{ fontSize: 36, fontWeight: "700", color: colors.foreground }}>
            {Math.round(data.current.temperature)}°
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, marginTop: 2 }}>{data.current.weatherLabel}</Text>
        </View>
        <View style={styles.metrics}>
          <View style={styles.metric}>
            <IconSymbol name="drop.fill" size={14} color="#3B82F6" />
            <Text style={{ fontSize: 12, color: colors.foreground, marginLeft: 4 }}>{data.current.humidity}%</Text>
          </View>
          <View style={styles.metric}>
            <IconSymbol name="wind" size={14} color="#D97706" />
            <Text style={{ fontSize: 12, color: colors.foreground, marginLeft: 4 }}>
              {Math.round(data.current.windSpeed)} km/h
            </Text>
          </View>
          <View style={styles.metric}>
            <IconSymbol name="cloud.rain.fill" size={14} color="#2563EB" />
            <Text style={{ fontSize: 12, color: colors.foreground, marginLeft: 4 }}>
              {data.current.precipitation.toFixed(1)} mm
            </Text>
          </View>
        </View>
      </View>

      {data.alerts.length > 0 && (
        <View style={{ marginTop: 12, gap: 6 }}>
          {data.alerts.slice(0, compact ? 1 : 3).map((alert, index) => (
            <View
              key={`${alert.type}-${index}`}
              style={[
                styles.alert,
                {
                  backgroundColor: ALERT_COLORS[alert.type] + "15",
                  borderColor: ALERT_COLORS[alert.type] + "40",
                },
              ]}
            >
              <Text style={{ fontSize: 12, color: colors.foreground, lineHeight: 18 }}>{alert.message}</Text>
            </View>
          ))}
        </View>
      )}

      {showForecast && data.daily.length > 0 && (
        <View style={[styles.forecastRow, { borderTopColor: colors.border }]}>
          {data.daily.slice(0, compact ? 3 : 5).map((day) => (
            <View key={day.date} style={styles.forecastDay}>
              <Text style={{ fontSize: 11, color: colors.muted, fontWeight: "600" }}>{formatDay(day.date)}</Text>
              <Text style={{ fontSize: 13, fontWeight: "700", color: colors.foreground, marginTop: 4 }}>
                {Math.round(day.tempMax)}°
              </Text>
              <Text style={{ fontSize: 11, color: colors.muted }}>{Math.round(day.tempMin)}°</Text>
              {day.precipitationSum > 0 && (
                <Text style={{ fontSize: 10, color: "#2563EB", marginTop: 2 }}>{day.precipitationSum.toFixed(0)}mm</Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  currentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metrics: {
    gap: 8,
    alignItems: "flex-end",
  },
  metric: {
    flexDirection: "row",
    alignItems: "center",
  },
  alert: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  forecastRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  forecastDay: {
    alignItems: "center",
    flex: 1,
  },
});
