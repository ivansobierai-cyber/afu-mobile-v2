import { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { ScreenState } from "@/components/screen-state";
import { PropriedadeOperacoesPanel } from "@/components/propriedade-operacoes-panel";
import { openLaudoHtml } from "@/lib/laudo-html";
import { buildResultadoCultivoConteudo } from "@/lib/cultivos/resultado-cultivo-report";
import { trpc } from "@/lib/trpc";

type IaProps = { culturaId: number };

/** Aba IA — resumo explicável (Etapa 7). */
export function CultivoIaTab({ culturaId }: IaProps) {
  const colors = useColors();
  const { data, isLoading, isError, refetch } = trpc.coreData.cultivos.iaResumo.useQuery({
    id: culturaId,
  });

  if (isLoading) {
    return <ScreenState status="loading" compact message="Calculando resumo de IA…" />;
  }
  if (isError || !data) {
    return (
      <ScreenState
        status="error"
        compact
        message="Falha ao carregar IA."
        onAction={() => void refetch()}
      />
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
  const utils = trpc.useUtils();
  const { data, isLoading, isError, refetch } = trpc.coreData.cultivos.indicadores.useQuery({
    id: culturaId,
  });
  const { data: dash } = trpc.coreData.cultivos.dashboard.useQuery({ id: culturaId });
  const [producaoReal, setProducaoReal] = useState("");
  const update = trpc.coreData.cultivos.update.useMutation({
    onSuccess: () => {
      void utils.coreData.cultivos.indicadores.invalidate({ id: culturaId });
      void utils.coreData.cultivos.dashboard.invalidate({ id: culturaId });
      setProducaoReal("");
    },
  });
  const pdfMutation = trpc.analise.gerarPDF.useMutation();

  if (isLoading) {
    return <ScreenState status="loading" compact message="Carregando indicadores…" />;
  }
  if (isError || !data) {
    return (
      <ScreenState
        status="error"
        compact
        message="Falha ao carregar indicadores."
        onAction={() => void refetch()}
      />
    );
  }

  const fonteLabel =
    data.produtividadeFonte === "real"
      ? "colheita real"
      : data.produtividadeFonte === "estimada"
        ? "estimada"
        : null;

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
      value:
        data.produtividade != null
          ? `${data.produtividade}/ha${fonteLabel ? ` (${fonteLabel})` : ""}`
          : "—",
    },
  ];

  const gerarRelatorio = async () => {
    try {
      const conteudo = buildResultadoCultivoConteudo({
        indicadores: data,
        dashboard: dash,
      });
      const result = await pdfMutation.mutateAsync({
        tipo: "resultado_cultivo",
        titulo: `Resultado — ${dash?.cultivo.nomeCultura ?? `Cultivo #${culturaId}`}`,
        propriedadeId: dash?.cultivo.propriedadeId,
        culturaNome: dash?.cultivo.nomeCultura ?? undefined,
        conteudo: JSON.stringify(conteudo),
        dataEmissao: new Date().toISOString().slice(0, 10),
        persist: true,
      });
      await openLaudoHtml(result.html, result.titulo);
    } catch (e: any) {
      Alert.alert("Erro", e?.message ?? "Falha ao gerar relatório");
    }
  };

  return (
    <View>
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
        <TouchableOpacity
          disabled={pdfMutation.isPending}
          onPress={() => void gerarRelatorio()}
          accessibilityRole="button"
          accessibilityLabel="Gerar relatório PDF do resultado do cultivo"
          style={{
            marginTop: 14,
            minHeight: 44,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
            opacity: pdfMutation.isPending ? 0.7 : 1,
          }}
        >
          <Text style={{ color: colors.primary, fontWeight: "700" }}>
            {pdfMutation.isPending ? "Gerando…" : "Gerar relatório PDF"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
          Registrar colheita real
        </Text>
        <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 8 }}>
          Produção real:{" "}
          {dash?.cultivo.producaoReal != null
            ? `${dash.cultivo.producaoReal} ${dash.cultivo.unidadeProducao ?? ""}`.trim()
            : "não informada"}
          {dash?.cultivo.producaoEstimada != null
            ? ` · estimada ${dash.cultivo.producaoEstimada}`
            : ""}
        </Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: colors.foreground,
            marginBottom: 10,
          }}
          placeholder="Produção real (ex.: 3600)"
          placeholderTextColor={colors.muted}
          keyboardType="decimal-pad"
          value={producaoReal}
          onChangeText={setProducaoReal}
          accessibilityLabel="Produção real colhida"
        />
        <TouchableOpacity
          disabled={update.isPending}
          onPress={() => {
            const n = Number(String(producaoReal).replace(",", "."));
            if (!Number.isFinite(n) || n < 0) {
              Alert.alert("Informe a produção real (≥ 0)");
              return;
            }
            void update
              .mutateAsync({
                id: culturaId,
                data: {
                  producaoReal: n,
                  status: "colhido",
                  unidadeProducao: dash?.cultivo.unidadeProducao ?? "kg",
                },
              })
              .catch((e) => Alert.alert("Erro", e?.message ?? "Falha"));
          }}
          style={{
            minHeight: 44,
            borderRadius: 12,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
            opacity: update.isPending ? 0.7 : 1,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>
            {update.isPending ? "Salvando…" : "Salvar produção real"}
          </Text>
        </TouchableOpacity>
      </View>
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
