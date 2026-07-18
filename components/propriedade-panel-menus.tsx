/**
 * Etapa 2 — menus do cabeçalho do painel da propriedade:
 * seletor de safra, + Registrar, ações administrativas.
 */
import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { useColors } from "@/hooks/use-colors";
import { currentSafraLabel, isHistoricoSafra } from "@/lib/propriedades/safra-label";

type MenuKind = "safra" | "registrar" | "admin" | null;

type Props = {
  visible: MenuKind;
  onClose: () => void;
  safraLabel: string;
  safraOptions: string[];
  onSelectSafra: (label: string) => void;
  onRegistrar: (action: "tarefa" | "ocorrencia" | "cultivo" | "talhao") => void;
  onAdmin: (action: "editar" | "exportar" | "arquivar" | "excluir") => void;
  propriedadeNome: string;
};

export function PropriedadePanelMenus({
  visible,
  onClose,
  safraLabel,
  safraOptions,
  onSelectSafra,
  onRegistrar,
  onAdmin,
  propriedadeNome,
}: Props) {
  const colors = useColors();

  const title =
    visible === "safra"
      ? "Selecionar safra"
      : visible === "registrar"
        ? "Registrar"
        : visible === "admin"
          ? "Ações da propriedade"
          : "";

  return (
    <Modal visible={visible != null} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Fechar menu"
      >
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
          {visible === "safra" && (
            <View style={{ gap: 8 }}>
              {safraOptions.map((opt) => {
                const active = opt === safraLabel;
                const historico = isHistoricoSafra(opt);
                return (
                  <TouchableOpacity
                    key={opt}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => {
                      onSelectSafra(opt);
                      onClose();
                    }}
                    style={[
                      styles.row,
                      {
                        borderColor: active ? colors.primary : colors.border,
                        backgroundColor: active ? colors.primary + "14" : colors.background,
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: "700", color: colors.foreground }}>{opt}</Text>
                      <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                        {historico
                          ? "Histórico — consulta sem misturar à safra atual"
                          : opt === currentSafraLabel()
                            ? "Safra atual"
                            : "Período"}
                      </Text>
                    </View>
                    {active ? (
                      <Text style={{ color: colors.primary, fontWeight: "700" }}>Ativa</Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {visible === "registrar" && (
            <View style={{ gap: 8 }}>
              {(
                [
                  { id: "tarefa" as const, label: "Nova tarefa / operação", hint: "Abrir Operações" },
                  { id: "ocorrencia" as const, label: "Nova ocorrência", hint: "Monitoramento" },
                  { id: "talhao" as const, label: "Novo talhão", hint: "Cadastro espacial" },
                  { id: "cultivo" as const, label: "Novo cultivo", hint: "Lista de cultivos" },
                ] as const
              ).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  onPress={() => {
                    onClose();
                    onRegistrar(item.id);
                  }}
                  style={[styles.row, { borderColor: colors.border, backgroundColor: colors.background }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "700", color: colors.foreground }}>{item.label}</Text>
                    <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{item.hint}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {visible === "admin" && (
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>
                {propriedadeNome}
              </Text>
              {(
                [
                  { id: "editar" as const, label: "Editar cadastro", danger: false },
                  { id: "exportar" as const, label: "Exportar resumo", danger: false },
                  { id: "arquivar" as const, label: "Arquivar (em breve)", danger: false },
                  { id: "excluir" as const, label: "Excluir propriedade", danger: true },
                ] as const
              ).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  onPress={() => {
                    onClose();
                    if (item.id === "excluir") {
                      Alert.alert(
                        "Excluir propriedade?",
                        `“${propriedadeNome}” será removida. Esta ação não pode ser desfeita.`,
                        [
                          { text: "Cancelar", style: "cancel" },
                          {
                            text: "Excluir",
                            style: "destructive",
                            onPress: () => onAdmin("excluir"),
                          },
                        ],
                      );
                      return;
                    }
                    onAdmin(item.id);
                  }}
                  style={[
                    styles.row,
                    {
                      borderColor: item.danger ? colors.error + "55" : colors.border,
                      backgroundColor: item.danger ? colors.error + "10" : colors.background,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontWeight: "700",
                      color: item.danger ? colors.error : colors.foreground,
                    }}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity
            onPress={onClose}
            accessibilityRole="button"
            style={{ marginTop: 14, minHeight: 44, alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ color: colors.muted, fontWeight: "600" }}>Fechar</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    padding: 16,
    paddingBottom: 28,
    maxHeight: "80%",
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 12,
  },
  row: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
  },
});
