import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import type { ComponentProps } from "react";

type StateIcon = ComponentProps<typeof IconSymbol>["name"];

export type ScreenStateStatus =
  | "loading"
  | "empty"
  | "error"
  | "offline"
  | "forbidden"
  | "partial";

type ScreenStateProps = {
  status: ScreenStateStatus;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Para loading: tamanho do spinner */
  compact?: boolean;
};

const DEFAULTS: Record<
  ScreenStateStatus,
  { title: string; message: string; icon: StateIcon; actionLabel?: string }
> = {
  loading: {
    title: "Carregando",
    message: "Aguarde um momento…",
    icon: "arrow.clockwise",
  },
  empty: {
    title: "Nada por aqui",
    message: "Comece cadastrando o primeiro item.",
    icon: "tray",
    actionLabel: "Cadastrar",
  },
  error: {
    title: "Não foi possível carregar",
    message: "Verifique a conexão e tente novamente.",
    icon: "exclamationmark.triangle.fill",
    actionLabel: "Tentar novamente",
  },
  offline: {
    title: "Sem conexão",
    message: "Os dados podem estar desatualizados. Continuaremos quando a rede voltar.",
    icon: "wifi.slash",
    actionLabel: "Tentar novamente",
  },
  forbidden: {
    title: "Acesso restrito",
    message: "Você não tem permissão para ver este conteúdo.",
    icon: "lock.fill",
  },
  partial: {
    title: "Dados parciais",
    message: "Parte do ciclo ainda não está filtrada por safra. Preferimos filtro financeiro até completar.",
    icon: "exclamationmark.triangle.fill",
    actionLabel: "Entendi",
  },
};

export function ScreenState({
  status,
  title,
  message,
  actionLabel,
  onAction,
  compact = false,
}: ScreenStateProps) {
  const colors = useColors();
  const defaults = DEFAULTS[status];
  const resolvedTitle = title ?? defaults.title;
  const resolvedMessage = message ?? defaults.message;
  const resolvedAction = actionLabel ?? defaults.actionLabel;

  if (status === "loading") {
    return (
      <View
        style={[styles.wrap, compact && styles.compact]}
        accessibilityRole="progressbar"
        accessibilityLabel={resolvedTitle}
      >
        <ActivityIndicator size={compact ? "small" : "large"} color={colors.primary} />
        {!compact ? (
          <Text style={[styles.message, { color: colors.muted, marginTop: 12 }]}>{resolvedMessage}</Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.wrap, compact && styles.compact]} accessibilityRole="text">
      <View style={[styles.iconCircle, { backgroundColor: colors.primary + "18" }]}>
        <IconSymbol name={defaults.icon} size={28} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>{resolvedTitle}</Text>
      <Text style={[styles.message, { color: colors.muted }]}>{resolvedMessage}</Text>
      {resolvedAction && onAction ? (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={resolvedAction}
        >
          <Text style={styles.buttonText}>{resolvedAction}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 40,
    gap: 8,
  },
  compact: {
    paddingVertical: 24,
    flex: 0,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  button: {
    marginTop: 12,
    minHeight: 44,
    minWidth: 160,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
