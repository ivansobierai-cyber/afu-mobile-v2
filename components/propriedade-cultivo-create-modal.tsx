/**
 * Modal de novo cultivo no contexto da propriedade (Etapa 6 — + Registrar).
 * Pré-preenche propriedadeId + safraId; exige talhão.
 */
import { useMemo, useState } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useRunCoreMutation } from "@/hooks/use-run-core-mutation";
import { trpc } from "@/lib/trpc";

const CULTURAS_COMUNS = [
  "Soja",
  "Milho",
  "Trigo",
  "Arroz",
  "Feijão",
  "Algodão",
  "Cana-de-açúcar",
  "Café",
];

type Props = {
  visible: boolean;
  onClose: () => void;
  propriedadeId: number;
  safraId?: number;
  terrenos: { id: number; nome: string; area?: number | string | null }[];
  safraLabel?: string;
  onCreated?: () => void;
};

export function PropriedadeCultivoCreateModal({
  visible,
  onClose,
  propriedadeId,
  safraId,
  terrenos,
  safraLabel,
  onCreated,
}: Props) {
  const colors = useColors();
  const utils = trpc.useUtils();
  const { runMutation } = useRunCoreMutation();
  const [nomeCultura, setNomeCultura] = useState("");
  const [variedade, setVariedade] = useState("");
  const [dataPlantio, setDataPlantio] = useState("");
  const [areaPlantada, setAreaPlantada] = useState("");
  const [terrenoId, setTerrenoId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.45)",
          justifyContent: "flex-end",
        },
        sheet: {
          backgroundColor: colors.background,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          maxHeight: "88%",
          padding: 16,
        },
        input: {
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          color: colors.foreground,
          marginBottom: 10,
          minHeight: 44,
        },
        chip: {
          borderRadius: 10,
          borderWidth: 1,
          paddingHorizontal: 10,
          paddingVertical: 6,
          marginRight: 6,
          marginBottom: 6,
        },
        label: {
          fontSize: 12,
          fontWeight: "700",
          color: colors.muted,
          marginBottom: 6,
        },
      }),
    [colors],
  );

  const reset = () => {
    setNomeCultura("");
    setVariedade("");
    setDataPlantio("");
    setAreaPlantada("");
    setTerrenoId(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = async () => {
    if (!nomeCultura.trim()) {
      Alert.alert("Atenção", "Informe o nome da cultura.");
      return;
    }
    if (!terrenoId) {
      Alert.alert("Atenção", "Selecione um talhão.");
      return;
    }
    setSaving(true);
    try {
      await runMutation("cultivo", "create", {
        propriedadeId,
        safraId,
        terrenoId,
        nomeCultura: nomeCultura.trim(),
        variedade: variedade.trim() || undefined,
        dataPlantio: dataPlantio || undefined,
        areaPlantada: areaPlantada ? parseFloat(areaPlantada) : undefined,
        status: "em_andamento" as const,
      });
      await utils.coreData.cultivos.listByPropriedade.invalidate({
        propriedadeId,
        safraId,
      });
      await utils.coreData.expansao.overview.invalidate({ propriedadeId, safraId });
      reset();
      onClose();
      onCreated?.();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Não foi possível salvar.";
      Alert.alert("Erro", message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text
              style={{
                fontSize: 18,
                fontWeight: "800",
                color: colors.foreground,
                marginBottom: 4,
              }}
            >
              Novo cultivo
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 14 }}>
              {safraLabel ? `Safra: ${safraLabel}` : "Vinculado à safra atual"}
              {safraId != null ? ` (#${safraId})` : ""}
            </Text>

            <Text style={styles.label}>Cultura *</Text>
            <TextInput
              style={styles.input}
              value={nomeCultura}
              onChangeText={setNomeCultura}
              placeholder="Ex: Soja, Milho"
              placeholderTextColor={colors.muted}
              accessibilityLabel="Nome da cultura"
            />
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 8 }}>
              {CULTURAS_COMUNS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: nomeCultura === c ? colors.primary : colors.surface,
                      borderColor: nomeCultura === c ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setNomeCultura(c)}
                  accessibilityRole="button"
                  accessibilityLabel={`Cultura ${c}`}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: nomeCultura === c ? "#FFF" : colors.foreground,
                    }}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Variedade</Text>
            <TextInput
              style={styles.input}
              value={variedade}
              onChangeText={setVariedade}
              placeholder="Ex: BRS 1010"
              placeholderTextColor={colors.muted}
            />

            <Text style={styles.label}>Talhão *</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 8 }}>
              {terrenos.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: terrenoId === t.id ? colors.primary : colors.surface,
                      borderColor: terrenoId === t.id ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setTerrenoId(t.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Talhão ${t.nome}`}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: terrenoId === t.id ? "#FFF" : colors.foreground,
                    }}
                  >
                    {t.nome}
                  </Text>
                </TouchableOpacity>
              ))}
              {terrenos.length === 0 ? (
                <Text style={{ color: colors.muted, fontSize: 13 }}>
                  Cadastre um talhão antes de criar o cultivo.
                </Text>
              ) : null}
            </View>

            <Text style={styles.label}>Data de plantio (AAAA-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={dataPlantio}
              onChangeText={setDataPlantio}
              placeholder="2026-10-15"
              placeholderTextColor={colors.muted}
            />

            <Text style={styles.label}>Área plantada (ha)</Text>
            <TextInput
              style={styles.input}
              value={areaPlantada}
              onChangeText={setAreaPlantada}
              placeholder="0.0"
              placeholderTextColor={colors.muted}
              keyboardType="decimal-pad"
            />

            <View style={{ flexDirection: "row", gap: 10, marginTop: 8, marginBottom: 24 }}>
              <TouchableOpacity
                onPress={handleClose}
                style={{
                  flex: 1,
                  minHeight: 44,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                accessibilityRole="button"
                accessibilityLabel="Cancelar"
              >
                <Text style={{ fontWeight: "700", color: colors.foreground }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => void handleSave()}
                disabled={saving}
                style={{
                  flex: 1,
                  minHeight: 44,
                  borderRadius: 12,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: saving ? 0.7 : 1,
                }}
                accessibilityRole="button"
                accessibilityLabel="Salvar cultivo"
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={{ fontWeight: "800", color: "#FFF" }}>Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
