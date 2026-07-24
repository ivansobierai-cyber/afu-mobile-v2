import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useColors } from "@/hooks/use-colors";
import type { EventoItem } from "@/lib/eventos/types";
import { EventoCard } from "@/components/eventos/evento-card";

type Props = {
  eventos: EventoItem[];
  onToggleStatus: (item: EventoItem) => void;
  onDelete: (item: EventoItem) => void;
};

const COLUMNS: { id: string; label: string; match: (e: EventoItem) => boolean }[] = [
  {
    id: "pendente",
    label: "Pendentes",
    match: (e) => e.status === "pendente",
  },
  {
    id: "andamento",
    label: "Em andamento",
    match: (e) => e.status === "em_andamento",
  },
  {
    id: "concluido",
    label: "Concluídos",
    match: (e) => e.status === "concluido",
  },
];

export function EventoKanban({ eventos, onToggleStatus, onDelete }: Props) {
  const colors = useColors();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ padding: 12, paddingBottom: 100, gap: 10 }}
    >
      {COLUMNS.map((col) => {
        const items = eventos.filter(col.match);
        return (
          <View
            key={col.id}
            style={[
              styles.col,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.colTitle, { color: colors.foreground }]}>
              {col.label} · {items.length}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {items.map((item) => (
                <EventoCard
                  key={item.id}
                  item={item}
                  onToggleStatus={() => onToggleStatus(item)}
                  onDelete={() => onDelete(item)}
                />
              ))}
              {items.length === 0 ? (
                <Text style={{ color: colors.muted, fontSize: 12, padding: 8 }}>Vazio</Text>
              ) : null}
            </ScrollView>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  col: {
    width: 300,
    maxHeight: "100%",
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
  },
  colTitle: {
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 8,
  },
});
