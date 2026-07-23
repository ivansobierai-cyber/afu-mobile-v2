import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { WeatherCard } from "@/components/weather-card";

type DashboardData = {
  diasAposPlantio: number | null;
  saudePercent: number;
  saudeMotivo: string;
  clima: {
    available: boolean;
    message?: string;
  };
  cultivo: {
    propriedadeId: number;
    faseAtual: string | null;
    faseProgress: number;
    areaPlantadaHa: number | null;
    producaoEstimada: number | null;
    unidadeProducao: string | null;
  };
  proximaTarefa: {
    titulo: string;
    dataPrevista: string | Date;
    status: string;
  } | null;
  ultimaInspecao: {
    titulo: string;
    categoria: string;
    createdAt: string | Date;
  } | null;
  ultimoDiagnostico: {
    pragaProvavel: string | null;
    doencaProvavel: string | null;
  } | null;
  alertas: { tipo: string; mensagem: string; severidade: string }[];
};

type Props = {
  data: DashboardData;
};

function formatShortDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR");
}

/** Cards do dashboard operacional (Cultivos V2 Etapa 3). */
export function CultivoDashboardCards({ data }: Props) {
  const colors = useColors();

  const cards: {
    key: string;
    icon: string;
    label: string;
    value: string;
    hint?: string;
    color: string;
  }[] = [
    {
      key: "fase",
      icon: "leaf.fill",
      label: "Estágio",
      value: (data.cultivo.faseAtual ?? "—").replace(/_/g, " "),
      hint: `${Math.round(data.cultivo.faseProgress * 100)}% do ciclo`,
      color: colors.primary,
    },
    {
      key: "dap",
      icon: "calendar",
      label: "DAP",
      value: data.diasAposPlantio != null ? `${data.diasAposPlantio}d` : "—",
      hint: "Dias após plantio",
      color: "#0EA5E9",
    },
    {
      key: "saude",
      icon: "heart.fill",
      label: "Saúde",
      value: `${data.saudePercent}%`,
      hint: data.saudeMotivo,
      color:
        data.saudePercent >= 70
          ? colors.success
          : data.saudePercent >= 40
            ? "#D97706"
            : colors.error ?? "#E53E3E",
    },
    {
      key: "area",
      icon: "scalemass.fill",
      label: "Área",
      value:
        data.cultivo.areaPlantadaHa != null
          ? `${data.cultivo.areaPlantadaHa} ha`
          : "—",
      color: "#8B5CF6",
    },
  ];

  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
        {cards.map((c) => (
          <View
            key={c.key}
            style={[
              styles.stat,
              {
                backgroundColor: c.color + "15",
                borderColor: c.color + "30",
                width: "48%",
                flexGrow: 1,
              },
            ]}
          >
            <IconSymbol name={c.icon as "leaf.fill"} size={18} color={c.color} />
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>{c.label}</Text>
            <Text style={{ fontSize: 16, fontWeight: "700", color: c.color }} numberOfLines={1}>
              {c.value}
            </Text>
            {c.hint ? (
              <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }} numberOfLines={2}>
                {c.hint}
              </Text>
            ) : null}
          </View>
        ))}
      </View>

      {data.clima.available ? (
        <View style={{ marginBottom: 12 }}>
          <WeatherCard propriedadeId={data.cultivo.propriedadeId} compact />
        </View>
      ) : (
        <View
          style={[
            styles.infoCard,
            { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: 12 },
          ]}
        >
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.foreground }}>Clima</Text>
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
            {data.clima.message ?? "Clima indisponível"}
          </Text>
        </View>
      )}

      <View
        style={[
          styles.infoCard,
          { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: 12 },
        ]}
      >
        <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
          Próxima operação
        </Text>
        {data.proximaTarefa ? (
          <>
            <Text style={{ fontSize: 14, color: colors.foreground, fontWeight: "600" }}>
              {data.proximaTarefa.titulo}
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
              {formatShortDate(data.proximaTarefa.dataPrevista)} · {data.proximaTarefa.status}
            </Text>
          </>
        ) : (
          <Text style={{ fontSize: 13, color: colors.muted }}>Nenhuma tarefa aberta neste cultivo</Text>
        )}
      </View>

      <View
        style={[
          styles.infoCard,
          { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: 12 },
        ]}
      >
        <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
          Produtividade prevista
        </Text>
        <Text style={{ fontSize: 14, color: colors.foreground }}>
          {data.cultivo.producaoEstimada != null
            ? `${data.cultivo.producaoEstimada} ${data.cultivo.unidadeProducao ?? ""}`.trim()
            : "Não informada"}
        </Text>
      </View>

      {(data.ultimaInspecao || data.ultimoDiagnostico) && (
        <View
          style={[
            styles.infoCard,
            { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: 12 },
          ]}
        >
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
            Última inspeção / diagnóstico
          </Text>
          {data.ultimaInspecao ? (
            <Text style={{ fontSize: 13, color: colors.foreground }}>
              Ocorrência: {data.ultimaInspecao.titulo} ({data.ultimaInspecao.categoria})
            </Text>
          ) : null}
          {data.ultimoDiagnostico ? (
            <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
              IA:{" "}
              {data.ultimoDiagnostico.pragaProvavel ||
                data.ultimoDiagnostico.doencaProvavel ||
                "resultado registrado"}
            </Text>
          ) : null}
        </View>
      )}

      {data.alertas.length > 0 && (
        <View
          style={[
            styles.infoCard,
            { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: 12 },
          ]}
        >
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
            Alertas
          </Text>
          {data.alertas.map((a, i) => (
            <Text
              key={`${a.tipo}-${i}`}
              style={{
                fontSize: 13,
                color:
                  a.severidade === "critical"
                    ? colors.error ?? "#E53E3E"
                    : a.severidade === "warning"
                      ? "#D97706"
                      : colors.muted,
                marginBottom: 4,
              }}
            >
              • {a.mensagem}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stat: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    minHeight: 88,
  },
  infoCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
});
