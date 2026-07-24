import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { MODULE_COLORS } from "@/constants/module-colors";
import { getPrioridadeInfo } from "@/lib/eventos/constants";
import { toDateKey } from "@/lib/eventos/date-utils";
import { addDays, buildWeekDays, formatWeekRange, startOfWeek } from "@/lib/eventos/week-utils";
import type { EventoItem } from "@/lib/eventos/types";
import { EventoCard } from "@/components/eventos/evento-card";

type Props = {
  eventos: EventoItem[];
  anchor: Date;
  selectedKey: string | null;
  onAnchorChange: (d: Date) => void;
  onSelectDay: (key: string) => void;
  onToggleStatus: (item: EventoItem) => void;
  onDelete: (item: EventoItem) => void;
};

export function EventoWeekView({
  eventos,
  anchor,
  selectedKey,
  onAnchorChange,
  onSelectDay,
  onToggleStatus,
  onDelete,
}: Props) {
  const colors = useColors();
  const days = buildWeekDays(anchor);
  const byDay = new Map<string, EventoItem[]>();
  for (const ev of eventos) {
    if (!ev.dataProgramada) continue;
    const key = toDateKey(ev.dataProgramada);
    const list = byDay.get(key) ?? [];
    list.push(ev);
    byDay.set(key, list);
  }
  const selectedItems = selectedKey ? (byDay.get(selectedKey) ?? []) : [];

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
      <View style={styles.nav}>
        <TouchableOpacity
          onPress={() => onAnchorChange(addDays(startOfWeek(anchor), -7))}
          accessibilityLabel="Semana anterior"
        >
          <IconSymbol name="chevron.left" size={18} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={{ fontSize: 15, fontWeight: "800", color: colors.foreground }}>
          {formatWeekRange(anchor)}
        </Text>
        <TouchableOpacity
          onPress={() => onAnchorChange(addDays(startOfWeek(anchor), 7))}
          accessibilityLabel="Próxima semana"
        >
          <IconSymbol name="chevron.right" size={18} color={colors.foreground} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {days.map((day) => {
          const items = byDay.get(day.key) ?? [];
          const selected = selectedKey === day.key;
          return (
            <TouchableOpacity
              key={day.key}
              onPress={() => onSelectDay(day.key)}
              style={[
                styles.dayCol,
                {
                  backgroundColor: colors.surface,
                  borderColor: selected ? MODULE_COLORS.eventos : colors.border,
                },
              ]}
            >
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.muted }}>
                {day.date.toLocaleDateString("pt-BR", { weekday: "short" })}
              </Text>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "800",
                  color: selected ? MODULE_COLORS.eventos : colors.foreground,
                }}
              >
                {day.date.getDate()}
              </Text>
              <View style={styles.dots}>
                {items.slice(0, 3).map((e) => (
                  <View
                    key={e.id}
                    style={[
                      styles.dot,
                      { backgroundColor: getPrioridadeInfo(e.prioridade).color },
                    ]}
                  />
                ))}
              </View>
              <Text style={{ fontSize: 10, color: colors.muted }}>{items.length} evt</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text style={[styles.section, { color: colors.foreground }]}>
        {selectedKey ? selectedKey.split("-").reverse().join("/") : "Selecione um dia"}
      </Text>
      {selectedItems.map((item) => (
        <EventoCard
          key={item.id}
          item={item}
          onToggleStatus={() => onToggleStatus(item)}
          onDelete={() => onDelete(item)}
        />
      ))}
      {selectedKey && selectedItems.length === 0 ? (
        <Text style={{ color: colors.muted, fontSize: 13 }}>Sem eventos neste dia.</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  dayCol: {
    width: 72,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: "center",
    gap: 4,
  },
  dots: { flexDirection: "row", gap: 3, minHeight: 6 },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  section: { fontSize: 14, fontWeight: "800", marginTop: 16, marginBottom: 8 },
});
