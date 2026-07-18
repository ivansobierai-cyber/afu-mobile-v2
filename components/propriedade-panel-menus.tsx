/**
 * Menus do cabeçalho do painel da propriedade.
 * Com filtragem completa por safraId: "Selecionar safra" / modo histórico.
 * Sem filtragem completa: "Filtro financeiro por período" (nunca mentir histórico).
 */
import React, { useMemo } from "react";
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
import { adminMenuVisibility } from "@/lib/propriedades/overview-counts";
import type { WorkspaceSafra } from "@/lib/propriedades/property-workspace";

type MenuKind = "safra" | "registrar" | "admin" | null;

type Props = {
  visible: MenuKind;
  onClose: () => void;
  /** Entidades persistentes (preferido) */
  safras?: WorkspaceSafra[];
  selectedSafraId?: number | null;
  onSelectSafraId?: (id: number) => void;
  /** Legado por rótulo — só se safras vazio */
  safraLabel?: string;
  safraOptions?: string[];
  onSelectSafra?: (label: string) => void;
  onRegistrar: (action: "tarefa" | "ocorrencia" | "cultivo" | "talhao") => void;
  onAdmin: (action: "editar" | "exportar" | "excluir") => void;
  propriedadeNome: string;
  canWriteProperty?: boolean;
  canExport?: boolean;
  canDeleteProperty?: boolean;
  /** true só quando overview/painéis filtram por safraId de ponta a ponta */
  historicalModeReady?: boolean;
  /** bloqueia + Registrar no modo histórico */
  canRegister?: boolean;
};

export function PropriedadePanelMenus({
  visible,
  onClose,
  safras = [],
  selectedSafraId = null,
  onSelectSafraId,
  safraLabel = "",
  safraOptions = [],
  onSelectSafra,
  onRegistrar,
  onAdmin,
  propriedadeNome,
  canWriteProperty = false,
  canExport = false,
  canDeleteProperty = false,
  historicalModeReady = false,
  canRegister = true,
}: Props) {
  const colors = useColors();
  const adminItems = useMemo(() => {
    const vis = adminMenuVisibility({
      canWriteProperty,
      canExport,
      canDeleteProperty,
    });
    const items: Array<{ id: "editar" | "exportar" | "excluir"; label: string; danger: boolean }> =
      [];
    if (vis.showEditar) items.push({ id: "editar", label: "Editar cadastro", danger: false });
    if (vis.showExportar) items.push({ id: "exportar", label: "Exportar resumo", danger: false });
    if (vis.showExcluir) items.push({ id: "excluir", label: "Excluir propriedade", danger: true });
    return items;
  }, [canWriteProperty, canExport, canDeleteProperty]);

  const useEntities = safras.length > 0 && typeof onSelectSafraId === "function";

  const title =
    visible === "safra"
      ? historicalModeReady
        ? "Selecionar safra"
        : "Filtro financeiro por período"
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
              {!historicalModeReady ? (
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.muted,
                    marginBottom: 4,
                    lineHeight: 18,
                  }}
                >
                  Filtragem de ciclo ainda parcial — não use esta tela como histórico completo até
                  o overview marcar completeness complete.
                </Text>
              ) : null}
              {useEntities
                ? safras.map((s) => {
                    const active = s.id === selectedSafraId;
                    const historic = s.status === "encerrada" || s.status === "arquivada";
                    return (
                      <TouchableOpacity
                        key={s.id}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        onPress={() => {
                          onSelectSafraId?.(s.id);
                          onClose();
                        }}
                        style={[
                          styles.row,
                          {
                            borderColor: active ? colors.primary : colors.border,
                            backgroundColor: active
                              ? colors.primary + "14"
                              : colors.background,
                          },
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: "700", color: colors.foreground }}>
                            {s.nome}
                          </Text>
                          <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                            {historic
                              ? historicalModeReady
                                ? "Safra histórica (somente leitura)"
                                : "Período anterior (filtro parcial)"
                              : s.isDefault
                                ? "Safra atual / padrão"
                                : s.status}
                          </Text>
                        </View>
                        {active ? (
                          <Text style={{ color: colors.primary, fontWeight: "700" }}>Ativo</Text>
                        ) : null}
                      </TouchableOpacity>
                    );
                  })
                : safraOptions.map((opt) => {
                    const active = opt === safraLabel;
                    return (
                      <TouchableOpacity
                        key={opt}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        onPress={() => {
                          onSelectSafra?.(opt);
                          onClose();
                        }}
                        style={[
                          styles.row,
                          {
                            borderColor: active ? colors.primary : colors.border,
                            backgroundColor: active
                              ? colors.primary + "14"
                              : colors.background,
                          },
                        ]}
                      >
                        <Text style={{ fontWeight: "700", color: colors.foreground }}>{opt}</Text>
                      </TouchableOpacity>
                    );
                  })}
            </View>
          )}

          {visible === "registrar" && (
            <View style={{ gap: 8 }}>
              {!canRegister ? (
                <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 4, lineHeight: 18 }}>
                  Modo histórico — esta safra é somente leitura. Volte para a safra atual para
                  registrar.
                </Text>
              ) : (
                (
                  [
                    {
                      id: "tarefa" as const,
                      label: "Nova tarefa / operação",
                      hint: "Com propriedade e safra atuais",
                    },
                    {
                      id: "ocorrencia" as const,
                      label: "Nova ocorrência",
                      hint: "Monitoramento contextual",
                    },
                    {
                      id: "talhao" as const,
                      label: "Novo talhão",
                      hint: "Retorno à aba Talhões",
                    },
                    {
                      id: "cultivo" as const,
                      label: "Novo cultivo",
                      hint: "Vinculado à safra atual",
                    },
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
                    style={[
                      styles.row,
                      { borderColor: colors.border, backgroundColor: colors.background },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: "700", color: colors.foreground }}>
                        {item.label}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                        {item.hint}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {visible === "admin" && (
            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>
                {propriedadeNome}
              </Text>
              {adminItems.length === 0 ? (
                <Text style={{ fontSize: 13, color: colors.muted }}>
                  Nenhuma ação administrativa disponível para o seu papel.
                </Text>
              ) : (
                adminItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                    onPress={() => {
                      onClose();
                      if (item.id === "excluir") {
                        Alert.alert(
                          "Excluir propriedade?",
                          `“${propriedadeNome}” será removida. Esta ação não pode ser desfeita. Prefira arquivamento quando disponível.`,
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
                        backgroundColor: item.danger
                          ? colors.error + "10"
                          : colors.background,
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
                ))
              )}
            </View>
          )}

          <TouchableOpacity
            onPress={onClose}
            accessibilityRole="button"
            style={{
              marginTop: 14,
              minHeight: 44,
              alignItems: "center",
              justifyContent: "center",
            }}
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
