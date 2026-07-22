/**
 * Modal de confirmação tipando o nome (exclusão definitiva — Etapa 7).
 */
import { useMemo, useState } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useColors } from "@/hooks/use-colors";

type Props = {
  visible: boolean;
  expectedName: string;
  title?: string;
  message?: string;
  confirmLabel?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: (typedName: string) => void;
};

export function ConfirmNameModal({
  visible,
  expectedName,
  title = "Confirmar exclusão",
  message,
  confirmLabel = "Excluir definitivamente",
  loading = false,
  onCancel,
  onConfirm,
}: Props) {
  const colors = useColors();
  const [typed, setTyped] = useState("");
  const matches = typed.trim() === expectedName.trim();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          padding: 24,
        },
        card: {
          backgroundColor: colors.background,
          borderRadius: 16,
          padding: 18,
          borderWidth: 1,
          borderColor: colors.border,
        },
        input: {
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          color: colors.foreground,
          minHeight: 44,
          marginTop: 10,
          marginBottom: 14,
        },
      }),
    [colors],
  );

  const handleClose = () => {
    setTyped("");
    onCancel();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={{ fontSize: 17, fontWeight: "800", color: colors.foreground }}>
            {title}
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 8, lineHeight: 19 }}>
            {message ??
              `Digite o nome exato “${expectedName}” para confirmar. Esta ação não pode ser desfeita. Prefira arquivar.`}
          </Text>
          <Text style={{ fontSize: 12, fontWeight: "700", color: colors.muted, marginTop: 12 }}>
            Nome da propriedade
          </Text>
          <TextInput
            style={styles.input}
            value={typed}
            onChangeText={setTyped}
            placeholder={expectedName}
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Digite o nome da propriedade para confirmar"
          />
          <View style={{ flexDirection: "row", gap: 10 }}>
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
              onPress={() => {
                if (!matches || loading) return;
                onConfirm(typed.trim());
                setTyped("");
              }}
              disabled={!matches || loading}
              style={{
                flex: 1,
                minHeight: 44,
                borderRadius: 12,
                backgroundColor: colors.error,
                alignItems: "center",
                justifyContent: "center",
                opacity: matches && !loading ? 1 : 0.45,
              }}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
              accessibilityState={{ disabled: !matches || loading }}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={{ fontWeight: "800", color: "#FFF", fontSize: 13 }}>{confirmLabel}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
