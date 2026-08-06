import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { PropriedadeOperacoesAgricolasPanel } from "@/components/propriedade-operacoes-agricolas-panel";
import { PropriedadeTarefasPanel } from "@/components/propriedade-tarefas-panel";
import { resolveOperacoesPanelSectionForRegistrar } from "@/lib/operacoes";

type Section = "operacoes" | "tarefas";

type Props = {
  propriedadeId: number;
  terrenos: { id: number; nome: string }[];
  cultivos: { id: number; nomeCultura: string; terrenoId: number | null }[];
  safraId?: number;
  culturaId?: number;
  readOnly?: boolean;
  canWriteOperations?: boolean;
  canApproveOperations?: boolean;
  /** Abre modal de nova tarefa (+ Registrar) */
  openCreateTarefaNonce?: number;
  /** Abre modal de nova operação agrícola (+ Registrar) */
  openCreateOperacaoNonce?: number;
  onCreateTarefaOpened?: () => void;
  onCreateOperacaoOpened?: () => void;
};

/**
 * Aba Operações do painel: separa Operação Agrícola (2E/2F) de Tarefa operacional (Etapa 3).
 */
export function PropriedadeOperacoesPanel({
  propriedadeId,
  terrenos,
  cultivos,
  safraId,
  culturaId,
  readOnly = false,
  canWriteOperations = false,
  canApproveOperations = false,
  openCreateTarefaNonce = 0,
  openCreateOperacaoNonce = 0,
  onCreateTarefaOpened,
  onCreateOperacaoOpened,
}: Props) {
  const colors = useColors();
  const [section, setSection] = useState<Section>("operacoes");

  useEffect(() => {
    if (openCreateOperacaoNonce > 0) {
      setSection(resolveOperacoesPanelSectionForRegistrar("operacao"));
    }
  }, [openCreateOperacaoNonce]);

  useEffect(() => {
    if (openCreateTarefaNonce > 0) {
      setSection(resolveOperacoesPanelSectionForRegistrar("tarefa"));
    }
  }, [openCreateTarefaNonce]);

  const styles = StyleSheet.create({
    seg: {
      flexDirection: "row",
      marginBottom: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    segBtn: {
      flex: 1,
      minHeight: 44,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 8,
    },
  });

  const contextTerrenoId =
    culturaId != null
      ? (cultivos.find((c) => c.id === culturaId)?.terrenoId ?? undefined)
      : undefined;

  return (
    <View>
      <View style={styles.seg} accessibilityRole="tablist">
        <TouchableOpacity
          accessibilityRole="tab"
          accessibilityState={{ selected: section === "operacoes" }}
          onPress={() => setSection("operacoes")}
          style={[
            styles.segBtn,
            section === "operacoes" ? { backgroundColor: colors.primary } : { backgroundColor: colors.surface },
          ]}
        >
          <Text
            style={{
              fontWeight: "700",
              fontSize: 13,
              color: section === "operacoes" ? "#FFF" : colors.foreground,
            }}
          >
            Operações agrícolas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="tab"
          accessibilityState={{ selected: section === "tarefas" }}
          onPress={() => setSection("tarefas")}
          style={[
            styles.segBtn,
            section === "tarefas" ? { backgroundColor: colors.primary } : { backgroundColor: colors.surface },
          ]}
        >
          <Text
            style={{
              fontWeight: "700",
              fontSize: 13,
              color: section === "tarefas" ? "#FFF" : colors.foreground,
            }}
          >
            Tarefas
          </Text>
        </TouchableOpacity>
      </View>

      {section === "operacoes" ? (
        <PropriedadeOperacoesAgricolasPanel
          propriedadeId={propriedadeId}
          terrenos={terrenos}
          cultivos={cultivos}
          safraId={safraId}
          readOnly={readOnly}
          canWriteOperations={canWriteOperations}
          canApproveOperations={canApproveOperations}
          prefillCulturaId={culturaId}
          prefillTerrenoId={contextTerrenoId ?? undefined}
          openCreateNonce={openCreateOperacaoNonce}
          onCreateOpened={onCreateOperacaoOpened}
        />
      ) : (
        <>
          <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 10, lineHeight: 17 }}>
            Tarefas são trabalhos planejados e atribuídos (iniciar, pausar, concluir). Não substituem
            operações agrícolas nem apontamentos de execução.
          </Text>
          <PropriedadeTarefasPanel
            propriedadeId={propriedadeId}
            terrenos={terrenos}
            safraId={safraId}
            culturaId={culturaId}
            readOnly={readOnly}
            openCreateNonce={openCreateTarefaNonce}
            onCreateOpened={onCreateTarefaOpened}
          />
        </>
      )}
    </View>
  );
}
