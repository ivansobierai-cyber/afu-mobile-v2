import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { MODULE_COLORS } from "@/constants/module-colors";
import type { SugestaoIA } from "@/lib/eventos/ia-sugestoes";

type Props = {
  sugestoes: SugestaoIA[];
  climaUsado?: boolean;
  loading?: boolean;
  onRefresh?: () => void;
};

const SEV_COLOR = {
  info: "#3B82F6",
  atencao: "#D97706",
  critico: "#E53E3E",
} as const;

/** Painel de sugestões IA do Centro de Eventos (Etapa 5). */
export function EventoIaPanel({ sugestoes, climaUsado, loading, onRefresh }: Props) {
  const colors = useColors();

  if (loading) {
    return (
      <View style={[styles.wrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <Text style={{ color: colors.muted, fontSize: 13 }}>Analisando agenda…</Text>
      </View>
    );
  }

  if (!sugestoes.length) {
    return (
      <View style={[styles.wrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <View style={styles.header}>
          <IconSymbol name="sparkles" size={14} color={MODULE_COLORS.eventos} />
          <Text style={[styles.title, { color: colors.foreground }]}>Assistente de agenda</Text>
          {onRefresh ? (
            <TouchableOpacity onPress={onRefresh} accessibilityLabel="Atualizar sugestões">
              <Text style={{ fontSize: 12, fontWeight: "700", color: colors.primary }}>Atualizar</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <Text style={{ fontSize: 12, color: colors.muted }}>
          Nenhuma sugestão no momento
          {climaUsado ? " (clima considerado)." : "."}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <IconSymbol name="sparkles" size={14} color={MODULE_COLORS.eventos} />
        <Text style={[styles.title, { color: colors.foreground }]}>
          Assistente · {sugestoes.length}
        </Text>
        {onRefresh ? (
          <TouchableOpacity onPress={onRefresh} accessibilityLabel="Atualizar sugestões">
            <Text style={{ fontSize: 12, fontWeight: "700", color: colors.primary }}>Atualizar</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {sugestoes.slice(0, 5).map((s) => (
        <View
          key={s.id}
          style={[styles.item, { borderLeftColor: SEV_COLOR[s.severidade] }]}
        >
          <Text style={{ fontSize: 12, fontWeight: "800", color: colors.foreground }}>
            {s.titulo}
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{s.mensagem}</Text>
          {s.dataSugerida ? (
            <Text style={{ fontSize: 11, fontWeight: "700", color: MODULE_COLORS.eventos, marginTop: 4 }}>
              Data sugerida: {s.dataSugerida.split("-").reverse().join("/")}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  title: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
  },
  item: {
    borderLeftWidth: 3,
    paddingLeft: 10,
    paddingVertical: 4,
  },
});
