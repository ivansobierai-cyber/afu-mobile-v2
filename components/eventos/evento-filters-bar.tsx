import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { MODULE_COLORS } from "@/constants/module-colors";

export type EventoFilters = {
  propriedadeId?: number;
  terrenoId?: number;
  culturaId?: number;
  safraId?: number;
  responsavelUserId?: number;
};

type Option = { id: number; label: string };

type Props = {
  fazendaLabel: string;
  filters: EventoFilters;
  onChange: (next: EventoFilters) => void;
  propriedades: Option[];
  terrenos: Option[];
  cultivos: Option[];
  safras: Option[];
  responsaveis: Option[];
};

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[
        styles.chip,
        {
          backgroundColor: active ? `${MODULE_COLORS.eventos}22` : colors.surface,
          borderColor: active ? MODULE_COLORS.eventos : colors.border,
        },
      ]}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: "700",
          color: active ? MODULE_COLORS.eventos : colors.foreground,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function FilterRow({
  title,
  options,
  value,
  onSelect,
  allLabel = "Todas",
}: {
  title: string;
  options: Option[];
  value?: number;
  onSelect: (id?: number) => void;
  allLabel?: string;
}) {
  const colors = useColors();
  if (!options.length && value == null) {
    return null;
  }
  return (
    <View style={styles.rowBlock}>
      <Text style={[styles.rowTitle, { color: colors.muted }]}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label={allLabel} active={value == null} onPress={() => onSelect(undefined)} />
        {options.map((opt) => (
          <Chip
            key={opt.id}
            label={opt.label}
            active={value === opt.id}
            onPress={() => onSelect(opt.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

/** Barra de filtros Etapa 2 — fazenda (contexto) + propriedade/talhão/cultivo/safra/responsável. */
export function EventoFiltersBar({
  fazendaLabel,
  filters,
  onChange,
  propriedades,
  terrenos,
  cultivos,
  safras,
  responsaveis,
}: Props) {
  const colors = useColors();
  const activeCount = [
    filters.propriedadeId,
    filters.terrenoId,
    filters.culturaId,
    filters.safraId,
    filters.responsavelUserId,
  ].filter((v) => v != null).length;

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      <View style={styles.header}>
        <View
          style={[
            styles.fazendaPill,
            { backgroundColor: `${MODULE_COLORS.eventos}14`, borderColor: `${MODULE_COLORS.eventos}44` },
          ]}
        >
          <Text style={{ fontSize: 11, fontWeight: "800", color: MODULE_COLORS.eventos }} numberOfLines={1}>
            Fazenda · {fazendaLabel}
          </Text>
        </View>
        {activeCount > 0 ? (
          <TouchableOpacity
            onPress={() => onChange({})}
            accessibilityLabel="Limpar filtros"
          >
            <Text style={{ fontSize: 12, fontWeight: "700", color: colors.primary }}>Limpar</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <FilterRow
        title="Propriedade"
        options={propriedades}
        value={filters.propriedadeId}
        allLabel="Todas"
        onSelect={(id) =>
          onChange({
            propriedadeId: id,
            // cascata: limpa dependentes
            terrenoId: undefined,
            culturaId: undefined,
            safraId: undefined,
            responsavelUserId: filters.responsavelUserId,
          })
        }
      />
      <FilterRow
        title="Talhão"
        options={terrenos}
        value={filters.terrenoId}
        allLabel="Todos"
        onSelect={(id) => onChange({ ...filters, terrenoId: id })}
      />
      <FilterRow
        title="Cultivo"
        options={cultivos}
        value={filters.culturaId}
        allLabel="Todos"
        onSelect={(id) => onChange({ ...filters, culturaId: id })}
      />
      <FilterRow
        title="Safra"
        options={safras}
        value={filters.safraId}
        allLabel="Todas"
        onSelect={(id) => onChange({ ...filters, safraId: id })}
      />
      <FilterRow
        title="Responsável"
        options={responsaveis}
        value={filters.responsavelUserId}
        allLabel="Todos"
        onSelect={(id) => onChange({ ...filters, responsavelUserId: id })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  fazendaPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: "80%",
  },
  rowBlock: {
    marginTop: 4,
  },
  rowTitle: {
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 12,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  chips: {
    paddingHorizontal: 12,
    gap: 6,
    flexDirection: "row",
  },
  chip: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    maxWidth: 180,
  },
});
