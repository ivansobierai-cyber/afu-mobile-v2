import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { ScreenState } from "@/components/screen-state";
import { PropriedadeMonitoramentoPanel } from "@/components/propriedade-expansao-panels";
import { trpc } from "@/lib/trpc";

type Props = {
  culturaId: number;
  propriedadeId: number;
  terrenoId?: number | null;
  safraId?: number | null;
  terrenos: { id: number; nome: string }[];
  canWrite?: boolean;
};

/** Aba Monitoramento do workspace do cultivo (Etapa 5). */
export function CultivoMonitoramentoTab({
  culturaId,
  propriedadeId,
  terrenoId,
  safraId,
  terrenos,
  canWrite = true,
}: Props) {
  const colors = useColors();
  const filteredTerrenos =
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
          Ocorrências e inspeções vinculadas a este cultivo
          {terrenoId ? " (talhão do cultivo pré-selecionável)." : "."}
        </Text>
      </View>
      <PropriedadeMonitoramentoPanel
        propriedadeId={propriedadeId}
        terrenos={filteredTerrenos.length ? filteredTerrenos : terrenos}
        safraId={safraId ?? undefined}
        culturaId={culturaId}
        readOnly={!canWrite}
      />
    </View>
  );
}

type DiagProps = {
  culturaId: number;
  propriedadeId: number;
  nomeCultura: string;
};

/** Aba Diagnósticos do workspace do cultivo (Etapa 5). */
export function CultivoDiagnosticosTab({ culturaId, propriedadeId, nomeCultura }: DiagProps) {
  const colors = useColors();
  const router = useRouter();
  const { data: diagnosticos = [], isLoading } = trpc.coreData.cultivos.diagnosticos.useQuery({
    id: culturaId,
  });

  return (
    <View>
      <TouchableOpacity
        style={[
          styles.cta,
          { backgroundColor: colors.primary },
        ]}
        onPress={() =>
          router.push({
            pathname: "/(tabs)/diagnostico",
            params: {
              propriedadeId: String(propriedadeId),
              culturaId: String(culturaId),
              culturaNome: nomeCultura,
            },
          } as any)
        }
        accessibilityRole="button"
        accessibilityLabel="Novo diagnóstico IA"
      >
        <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 14 }}>
          Novo diagnóstico IA
        </Text>
      </TouchableOpacity>

      {isLoading ? (
        <ScreenState status="loading" compact message="Carregando diagnósticos…" />
      ) : diagnosticos.length === 0 ? (
        <View
          style={[
            styles.empty,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>
            Nenhum diagnóstico
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 6 }}>
            Diagnósticos IA vinculados a este cultivo aparecerão aqui.
          </Text>
        </View>
      ) : (
        diagnosticos.map((d) => (
          <View
            key={d.id}
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>
              {d.pragaProvavel || d.doencaProvavel || "Diagnóstico"}
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
              {d.dataDiagnostico
                ? new Date(d.dataDiagnostico).toLocaleString("pt-BR")
                : "—"}
              {d.gravidade ? ` · ${d.gravidade}` : ""}
            </Text>
            {d.recomendacao ? (
              <Text style={{ fontSize: 13, color: colors.foreground, marginTop: 8 }} numberOfLines={3}>
                {d.recomendacao}
              </Text>
            ) : null}
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  cta: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  empty: {
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
  },
  card: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
});
