import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { PropriedadeOperacoesPanel } from "@/components/propriedade-operacoes-panel";
import { trpc } from "@/lib/trpc";

type IaProps = { culturaId: number };

/** Aba IA — resumo explicável (Etapa 7). */
export function CultivoIaTab({ culturaId }: IaProps) {
  const colors = useColors();
  const { data, isLoading, isError, refetch } = trpc.coreData.cultivos.iaResumo.useQuery({
    id: culturaId,
  });

  if (isLoading) return <Text style={{ color: colors.muted }}>Calculando resumo…</Text>;
  if (isError || !data) {
    return (
      <Text style={{ color: colors.muted }} onPress={() => void refetch()}>
        Falha ao carregar IA. Toque para tentar de novo.
      </Text>
    );
  }

  const riscoColor =
    data.riscoNivel === "critico"
      ? "#E53E3E"
      : data.riscoNivel === "alto"
        ? "#D97706"
        : data.riscoNivel === "moderado"
          ? "#0EA5E9"
          : colors.success;

  return (
    <View>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>
          Índice de saúde: {data.saudePercent}%
        </Text>
        <Text style={{ fontSize: 13, color: riscoColor, marginTop: 6, fontWeight: "700" }}>
          Risco: {data.riscoNivel}
        </Text>
        <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>{data.riscoMotivo}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
          Recomendações explicáveis
        </Text>
        {data.recomendacoes.map((r) => (
          <Text key={`${r.prioridade}-${r.origem}`} style={{ fontSize: 13, color: colors.foreground, marginBottom: 8 }}>
            {r.prioridade}. {r.texto}
            <Text style={{ color: colors.muted }}> ({r.origem})</Text>
          </Text>
        ))}
      </View>

      {data.alertasPriorizados.length > 0 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
            Alertas priorizados
          </Text>
          {data.alertasPriorizados.map((a, i) => (
            <Text key={`${a.tipo}-${i}`} style={{ fontSize: 13, color: colors.muted, marginBottom: 4 }}>
              • [{a.severidade}] {a.mensagem}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

type OpsProps = {
  culturaId: number;
  propriedadeId: number;
  terrenoId?: number | null;
  safraId?: number | null;
  terrenos: { id: number; nome: string }[];
  canWrite?: boolean;
};

/** Aba Operações contextuais (Etapa 8). */
export function CultivoOperacoesTab({
  culturaId,
  propriedadeId,
  terrenoId,
  safraId,
  terrenos,
  canWrite = true,
}: OpsProps) {
  const colors = useColors();
  const filtered =
    terrenoId != null ? terrenos.filter((t) => t.id === terrenoId) : terrenos;

  return (
    <View>
      <View
        style={[
          styles.banner,
          { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" },
        ]}
      >
        <Text style={{ fontSize: 13, color: colors.foreground }}>
          Tarefas deste cultivo. Novas operações já saem com culturaId vinculado.
        </Text>
      </View>
      <PropriedadeOperacoesPanel
        propriedadeId={propriedadeId}
        terrenos={filtered.length ? filtered : terrenos}
        safraId={safraId ?? undefined}
        culturaId={culturaId}
        readOnly={!canWrite}
      />
    </View>
  );
}

type CustosProps = { culturaId: number };

/** Aba Custos / indicadores (Etapa 9). */
export function CultivoCustosTab({ culturaId }: CustosProps) {
  const colors = useColors();
  const { data, isLoading, isError, refetch } = trpc.coreData.cultivos.indicadores.useQuery({
    id: culturaId,
  });

  if (isLoading) return <Text style={{ color: colors.muted }}>Carregando indicadores…</Text>;
  if (isError || !data) {
    return (
      <Text style={{ color: colors.muted }} onPress={() => void refetch()}>
        Falha ao carregar indicadores. Toque para tentar de novo.
      </Text>
    );
  }

  const rows = [
    { label: "Custos operacionais", value: `R$ ${data.custosOperacionais.toFixed(2)}` },
    {
      label: "Custo / ha",
      value: data.custoPorHectare != null ? `R$ ${data.custoPorHectare.toFixed(2)}` : "—",
    },
    { label: "Receita", value: `R$ ${data.receita.toFixed(2)}` },
    { label: "Despesas", value: `R$ ${data.despesas.toFixed(2)}` },
    { label: "Lucro", value: `R$ ${data.lucro.toFixed(2)}` },
    {
      label: "Margem",
      value: `${Number(data.margemPct ?? 0).toFixed(1)}%`,
    },
    { label: "ROI", value: `${Number(data.roiPct ?? 0).toFixed(1)}%` },
    {
      label: "Produtividade",
      value: data.produtividade != null ? String(data.produtividade) : "—",
    },
  ];

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
        Indicadores do cultivo
      </Text>
      <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 12 }}>
        {data.custosCount} custo(s) · {data.lancamentosCount} lançamento(s) · área {data.areaHa} ha
      </Text>
      {rows.map((r) => (
        <View
          key={r.label}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingVertical: 8,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 13, color: colors.muted }}>{r.label}</Text>
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.foreground }}>{r.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  banner: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
});
