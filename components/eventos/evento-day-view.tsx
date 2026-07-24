import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { formatDayLabel, parseDateKey, toDateKey } from "@/lib/eventos/date-utils";
import { addDays } from "@/lib/eventos/week-utils";
import type { EventoItem } from "@/lib/eventos/types";
import { EventoCard } from "@/components/eventos/evento-card";
import { ScreenState } from "@/components/screen-state";

type Props = {
  eventos: EventoItem[];
  dayKey: string;
  onDayChange: (key: string) => void;
  onToggleStatus: (item: EventoItem) => void;
  onDelete: (item: EventoItem) => void;
  onCreate: () => void;
};

export function EventoDayView({
  eventos,
  dayKey,
  onDayChange,
  onToggleStatus,
  onDelete,
  onCreate,
}: Props) {
  const colors = useColors();
  const day = parseDateKey(dayKey);
  const items = eventos.filter(
    (e) => e.dataProgramada && toDateKey(e.dataProgramada) === dayKey,
  );

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
      <View style={styles.nav}>
        <TouchableOpacity
          onPress={() => onDayChange(toDateKey(addDays(day, -1)))}
          accessibilityLabel="Dia anterior"
        >
          <IconSymbol name="chevron.left" size={18} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={{ fontSize: 15, fontWeight: "800", color: colors.foreground }}>
          {formatDayLabel(day)}
        </Text>
        <TouchableOpacity
          onPress={() => onDayChange(toDateKey(addDays(day, 1)))}
          accessibilityLabel="Próximo dia"
        >
          <IconSymbol name="chevron.right" size={18} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <ScreenState
          status="empty"
          title="Dia livre"
          message="Nenhuma operação neste dia."
          actionLabel="Criar evento"
          onAction={onCreate}
          compact
        />
      ) : (
        items.map((item) => (
          <EventoCard
            key={item.id}
            item={item}
            onToggleStatus={() => onToggleStatus(item)}
            onDelete={() => onDelete(item)}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
});
