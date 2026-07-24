import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { MODULE_COLORS } from "@/constants/module-colors";
import { getPrioridadeInfo } from "@/lib/eventos/constants";
import {
  WEEKDAYS_SHORT,
  addMonths,
  buildMonthGrid,
  formatMonthTitle,
  toDateKey,
} from "@/lib/eventos/date-utils";
import type { EventoItem } from "@/lib/eventos/types";
import { EventoCard } from "@/components/eventos/evento-card";
import { ScreenState } from "@/components/screen-state";

type Props = {
  eventos: EventoItem[];
  month: Date;
  selectedKey: string | null;
  onMonthChange: (month: Date) => void;
  onSelectDay: (key: string) => void;
  onToggleStatus: (item: EventoItem) => void;
  onDelete: (item: EventoItem) => void;
  onCreateForDay?: (key: string) => void;
};

function dotsForDay(items: EventoItem[]): string[] {
  const colors = items.slice(0, 3).map((e) => getPrioridadeInfo(e.prioridade).color);
  return colors;
}

/** Calendário mensal com indicadores de prioridade e painel do dia. */
export function EventoMonthCalendar({
  eventos,
  month,
  selectedKey,
  onMonthChange,
  onSelectDay,
  onToggleStatus,
  onDelete,
  onCreateForDay,
}: Props) {
  const colors = useColors();
  const grid = buildMonthGrid(month);
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
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.monthCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.monthHeader}>
          <TouchableOpacity
            onPress={() => onMonthChange(addMonths(month, -1))}
            accessibilityLabel="Mês anterior"
            hitSlop={12}
            style={styles.navBtn}
          >
            <IconSymbol name="chevron.left" size={18} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.monthTitle, { color: colors.foreground }]}>
            {formatMonthTitle(month)}
          </Text>
          <TouchableOpacity
            onPress={() => onMonthChange(addMonths(month, 1))}
            accessibilityLabel="Próximo mês"
            hitSlop={12}
            style={styles.navBtn}
          >
            <IconSymbol name="chevron.right" size={18} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <View style={styles.weekRow}>
          {WEEKDAYS_SHORT.map((d) => (
            <Text key={d} style={[styles.weekday, { color: colors.muted }]}>
              {d}
            </Text>
          ))}
        </View>

        <View style={styles.grid}>
          {grid.map((cell) => {
            const dayItems = byDay.get(cell.key) ?? [];
            const selected = selectedKey === cell.key;
            const dots = dotsForDay(dayItems);
            return (
              <TouchableOpacity
                key={cell.key}
                onPress={() => onSelectDay(cell.key)}
                accessibilityRole="button"
                accessibilityLabel={`${cell.date.getDate()} de ${formatMonthTitle(month)}${
                  dayItems.length ? `, ${dayItems.length} eventos` : ""
                }`}
                style={[
                  styles.cell,
                  selected && {
                    backgroundColor: `${MODULE_COLORS.eventos}22`,
                    borderColor: MODULE_COLORS.eventos,
                  },
                  cell.isToday && !selected && {
                    borderColor: MODULE_COLORS.eventos,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: cell.isToday || selected ? "800" : "600",
                    color: !cell.inMonth
                      ? colors.muted
                      : selected
                        ? MODULE_COLORS.eventos
                        : colors.foreground,
                    opacity: cell.inMonth ? 1 : 0.4,
                  }}
                >
                  {cell.date.getDate()}
                </Text>
                <View style={styles.dots}>
                  {dots.map((c, i) => (
                    <View key={`${cell.key}-${i}`} style={[styles.dot, { backgroundColor: c }]} />
                  ))}
                  {dayItems.length > 3 ? (
                    <Text style={{ fontSize: 8, color: colors.muted, fontWeight: "700" }}>
                      +{dayItems.length - 3}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.dayPanel}>
        <View style={styles.dayPanelHeader}>
          <Text style={[styles.dayPanelTitle, { color: colors.foreground }]}>
            {selectedKey
              ? selectedKey.split("-").reverse().join("/")
              : "Selecione um dia"}
          </Text>
          {selectedKey && onCreateForDay ? (
            <TouchableOpacity
              onPress={() => onCreateForDay(selectedKey)}
              accessibilityLabel="Criar evento neste dia"
            >
              <Text style={{ color: MODULE_COLORS.eventos, fontWeight: "700", fontSize: 13 }}>
                + Adicionar
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {!selectedKey ? (
          <Text style={{ color: colors.muted, fontSize: 13 }}>
            Toque em um dia para ver a agenda agrícola.
          </Text>
        ) : selectedItems.length === 0 ? (
          <ScreenState
            status="empty"
            title="Dia livre"
            message="Nenhum evento programado. Planeje irrigação, pulverização ou inspeção."
            actionLabel="Criar evento"
            onAction={onCreateForDay ? () => onCreateForDay(selectedKey) : undefined}
            compact
          />
        ) : (
          selectedItems.map((item) => (
            <EventoCard
              key={item.id}
              item={item}
              onToggleStatus={() => onToggleStatus(item)}
              onDelete={() => onDelete(item)}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  monthCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  navBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  monthTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  weekday: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: "14.2857%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "transparent",
    paddingVertical: 4,
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 2,
    minHeight: 8,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  dayPanel: {
    marginTop: 16,
  },
  dayPanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  dayPanelTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
});
