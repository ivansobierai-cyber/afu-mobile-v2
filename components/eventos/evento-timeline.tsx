import { View, Text, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { ScreenState } from "@/components/screen-state";
import { EventoCard } from "@/components/eventos/evento-card";
import { getTipoInfo } from "@/lib/eventos/constants";
import { groupByDateKey } from "@/lib/eventos/date-utils";
import type { EventoItem } from "@/lib/eventos/types";

type Props = {
  eventos: EventoItem[];
  refreshing: boolean;
  onRefresh: () => void;
  onToggleStatus: (item: EventoItem) => void;
  onDelete: (item: EventoItem) => void;
  onCreate: () => void;
  loading?: boolean;
};

/** Timeline agrícola — eventos agrupados por dia em linha do tempo. */
export function EventoTimeline({
  eventos,
  refreshing,
  onRefresh,
  onToggleStatus,
  onDelete,
  onCreate,
  loading,
}: Props) {
  const colors = useColors();
  const groups = groupByDateKey(eventos, (e) => e.dataProgramada);

  if (loading) {
    return <ScreenState status="loading" message="Montando timeline…" />;
  }

  if (!groups.length) {
    return (
      <ScreenState
        status="empty"
        title="Timeline vazia"
        message="Seus eventos agrícolas aparecerão aqui em ordem cronológica."
        actionLabel="Criar evento"
        onAction={onCreate}
      />
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {groups.map((group) => (
        <View key={group.key} style={styles.group}>
          <View style={styles.groupHeader}>
            <View style={[styles.badge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="calendar" size={12} color={colors.primary} />
              <Text style={[styles.groupLabel, { color: colors.foreground }]}>
                {group.label}
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: colors.muted, fontWeight: "600" }}>
              {group.items.length} {group.items.length === 1 ? "evento" : "eventos"}
            </Text>
          </View>

          {group.items.map((item, idx) => {
            const tipo = getTipoInfo(item.tipoAtividade);
            const isLast = idx === group.items.length - 1;
            return (
              <View key={item.id} style={styles.row}>
                <View style={styles.rail}>
                  <View style={[styles.dot, { backgroundColor: tipo.color }]} />
                  {!isLast ? (
                    <View style={[styles.line, { backgroundColor: colors.border }]} />
                  ) : null}
                </View>
                <View style={styles.cardWrap}>
                  <EventoCard
                    item={item}
                    onToggleStatus={() => onToggleStatus(item)}
                    onDelete={() => onDelete(item)}
                  />
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  group: {
    marginBottom: 8,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  groupLabel: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  row: {
    flexDirection: "row",
  },
  rail: {
    width: 20,
    alignItems: "center",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 18,
  },
  line: {
    width: 2,
    flex: 1,
    marginTop: 4,
    marginBottom: 4,
  },
  cardWrap: {
    flex: 1,
    paddingLeft: 8,
  },
});
