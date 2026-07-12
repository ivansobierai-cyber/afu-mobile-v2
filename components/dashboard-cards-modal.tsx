import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
  StyleSheet,
} from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import type { DashboardCardConfig, DashboardCardId } from "@/hooks/use-dashboard-cards";

const CARD_LABELS: Record<DashboardCardId, string> = {
  propriedades: "Propriedades",
  cultivos: "Cultivos",
  diagnostico: "Diagnóstico",
  laboratorio: "Laboratório",
  laudos: "Laudos",
  eventos: "Eventos",
  marketplace: "Marketplace",
  clima: "Clima",
  materiais: "Materiais",
};

type DashboardCardsModalProps = {
  visible: boolean;
  cards: DashboardCardConfig[];
  onClose: () => void;
  onMove: (id: DashboardCardId, direction: "up" | "down") => void;
  onToggleVisible: (id: DashboardCardId) => void;
  onReset: () => void;
};

export function DashboardCardsModal({
  visible,
  cards,
  onClose,
  onMove,
  onToggleVisible,
  onReset,
}: DashboardCardsModalProps) {
  const colors = useColors();

  const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    sheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: "85%",
      padding: 20,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 10,
    },
    iconBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>Personalizar Painel</Text>
            <TouchableOpacity onPress={onClose}>
              <IconSymbol name="xmark" size={22} color={colors.muted} />
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 12 }}>
            Reordene e escolha quais módulos aparecem no painel.
          </Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {cards.map((card, index) => (
              <View key={card.id} style={styles.row}>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  <TouchableOpacity
                    style={[styles.iconBtn, index === 0 && { opacity: 0.35 }]}
                    onPress={() => onMove(card.id, "up")}
                    disabled={index === 0}
                  >
                    <IconSymbol name="chevron.up" size={16} color={colors.foreground} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.iconBtn, index === cards.length - 1 && { opacity: 0.35 }]}
                    onPress={() => onMove(card.id, "down")}
                    disabled={index === cards.length - 1}
                  >
                    <IconSymbol name="chevron.down" size={16} color={colors.foreground} />
                  </TouchableOpacity>
                </View>
                <Text style={{ flex: 1, fontSize: 15, fontWeight: "600", color: colors.foreground }}>
                  {CARD_LABELS[card.id]}
                </Text>
                <Switch
                  value={card.visible}
                  onValueChange={() => onToggleVisible(card.id)}
                  trackColor={{ false: colors.border, true: colors.primary + "80" }}
                  thumbColor={card.visible ? colors.primary : colors.muted}
                />
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            onPress={onReset}
            style={{
              marginTop: 16,
              paddingVertical: 12,
              alignItems: "center",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.muted }}>Restaurar padrão</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
