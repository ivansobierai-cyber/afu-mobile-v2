import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

type TimelineEvent = {
  id: string;
  tipo: string;
  titulo: string;
  descricao?: string | null;
  data: string;
};

type Props = {
  events: TimelineEvent[];
};

const TIPO_ICON: Record<string, string> = {
  plantio: "sprout.fill",
  fase: "leaf.fill",
  tarefa: "wrench.fill",
  ocorrencia: "exclamationmark.triangle.fill",
  diagnostico: "cross.case.fill",
  colheita: "scalemass.fill",
  encerramento: "xmark.circle.fill",
};

const TIPO_COLOR: Record<string, string> = {
  plantio: "#38A169",
  fase: "#2F6B4F",
  tarefa: "#0EA5E9",
  ocorrencia: "#D97706",
  diagnostico: "#8B5CF6",
  colheita: "#6B7C6E",
  encerramento: "#E53E3E",
};

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

/** Linha do tempo do cultivo (Cultivos V2 Etapa 4). */
export function TimelineCultivo({ events }: Props) {
  const colors = useColors();

  if (!events.length) {
    return (
      <View
        style={[
          styles.empty,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>
          Histórico vazio
        </Text>
        <Text style={{ fontSize: 13, color: colors.muted, marginTop: 6 }}>
          Eventos de plantio, fases, tarefas, ocorrências e diagnósticos aparecerão aqui.
        </Text>
      </View>
    );
  }

  return (
    <View>
      {events.map((ev, idx) => {
        const color = TIPO_COLOR[ev.tipo] ?? colors.primary;
        const icon = TIPO_ICON[ev.tipo] ?? "circle.fill";
        const isLast = idx === events.length - 1;
        return (
          <View key={ev.id} style={styles.row}>
            <View style={styles.rail}>
              <View style={[styles.dot, { backgroundColor: color }]}>
                <IconSymbol name={icon as "leaf.fill"} size={12} color="#FFF" />
              </View>
              {!isLast ? (
                <View style={[styles.line, { backgroundColor: colors.border }]} />
              ) : null}
            </View>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  marginBottom: isLast ? 0 : 12,
                },
              ]}
            >
              <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 4 }}>
                {formatWhen(ev.data)} · {ev.tipo}
              </Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>
                {ev.titulo}
              </Text>
              {ev.descricao ? (
                <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
                  {ev.descricao}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
  },
  row: { flexDirection: "row", gap: 12 },
  rail: { width: 28, alignItems: "center" },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  line: { flex: 1, width: 2, marginTop: 4, marginBottom: 4 },
  card: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
});
