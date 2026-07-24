import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  getPrioridadeInfo,
  getTipoInfo,
} from "@/lib/eventos/constants";
import { formatShortDate } from "@/lib/eventos/date-utils";
import type { EventoItem } from "@/lib/eventos/types";

type Props = {
  item: EventoItem;
  onToggleStatus: () => void;
  onDelete: () => void;
  onPress?: () => void;
};

/** Card de evento com faixa lateral colorida por prioridade. */
export function EventoCard({ item, onToggleStatus, onDelete, onPress }: Props) {
  const colors = useColors();
  const tipo = getTipoInfo(item.tipoAtividade);
  const prioridade = getPrioridadeInfo(item.prioridade);
  const isConcluido = item.status === "concluido";
  const isCancelado = item.status === "cancelado";
  const muted = isConcluido || isCancelado;

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.75 : 1}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Evento ${item.titulo}, prioridade ${prioridade.label}`}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: isCancelado ? 0.7 : 1,
        },
      ]}
    >
      <View style={[styles.priorityBar, { backgroundColor: prioridade.color }]} />
      <TouchableOpacity
        onPress={onToggleStatus}
        style={styles.checkWrap}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isConcluido }}
        accessibilityLabel={isConcluido ? "Marcar como pendente" : "Marcar como concluído"}
        hitSlop={8}
      >
        <View
          style={[
            styles.check,
            {
              borderColor: isConcluido ? colors.success : colors.border,
              backgroundColor: isConcluido ? colors.success : "transparent",
            },
          ]}
        >
          {isConcluido ? (
            <Text style={styles.checkMark}>✓</Text>
          ) : null}
        </View>
      </TouchableOpacity>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.title,
              {
                color: muted ? colors.muted : colors.foreground,
                textDecorationLine: isConcluido ? "line-through" : "none",
              },
            ]}
            numberOfLines={2}
          >
            {item.titulo}
          </Text>
          <View
            style={[styles.priorityPill, { backgroundColor: `${prioridade.color}22` }]}
          >
            <Text style={[styles.priorityText, { color: prioridade.color }]}>
              {prioridade.label}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={[styles.tipoChip, { backgroundColor: `${tipo.color}20` }]}>
            <Text style={[styles.tipoText, { color: tipo.color }]}>{tipo.label}</Text>
          </View>
          {item.dataProgramada ? (
            <Text style={[styles.date, { color: colors.muted }]}>
              {formatShortDate(item.dataProgramada)}
            </Text>
          ) : null}
          {item.status === "em_andamento" ? (
            <Text style={[styles.statusHint, { color: colors.primary }]}>Em andamento</Text>
          ) : null}
        </View>

        {item.descricao ? (
          <Text style={[styles.desc, { color: colors.muted }]} numberOfLines={2}>
            {item.descricao}
          </Text>
        ) : null}
      </View>

      <TouchableOpacity
        onPress={onDelete}
        accessibilityLabel="Excluir evento"
        hitSlop={10}
        style={styles.deleteBtn}
      >
        <IconSymbol name="trash.fill" size={16} color={colors.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    overflow: "hidden",
  },
  priorityBar: {
    width: 4,
    alignSelf: "stretch",
  },
  checkWrap: {
    paddingTop: 14,
    paddingLeft: 12,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkMark: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  body: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
  },
  priorityPill: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  tipoChip: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tipoText: {
    fontSize: 11,
    fontWeight: "700",
  },
  date: {
    fontSize: 12,
  },
  statusHint: {
    fontSize: 11,
    fontWeight: "600",
  },
  desc: {
    fontSize: 13,
    marginTop: 6,
  },
  deleteBtn: {
    paddingTop: 14,
    paddingRight: 12,
    paddingLeft: 4,
  },
});
