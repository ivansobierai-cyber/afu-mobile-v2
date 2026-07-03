import { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { CULTURAS } from "@/lib/mock-data";
import type { Cultura } from "@/shared/types";

export default function ClimaScreen() {
  const colors = useColors();
  const router = useRouter();
  const [selected, setSelected] = useState<Cultura | null>(null);

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    infoBox: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
    },
    infoSection: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
    },
  });

  if (selected) {
    return (
      <ScreenContainer>
        <View
          style={{
            backgroundColor: "#F59E0B",
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 20,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <TouchableOpacity onPress={() => setSelected(null)}>
            <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#FFFFFF" }}>
              {selected.nomePopular}
            </Text>
            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>Necessidades Climáticas</Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {/* Climate metrics */}
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
            <View style={styles.infoBox}>
              <IconSymbol name="thermometer.medium" size={24} color="#EF4444" />
              <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground, marginTop: 6 }}>
                {selected.temperaturaMin}–{selected.temperaturaMax}°C
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2, textAlign: "center" }}>
                Temperatura ideal
              </Text>
            </View>
            <View style={styles.infoBox}>
              <IconSymbol name="drop.fill" size={24} color="#3B82F6" />
              <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground, marginTop: 6 }}>
                {selected.precipitacaoMin}–{selected.precipitacaoMax}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2, textAlign: "center" }}>
                mm/ano de chuva
              </Text>
            </View>
          </View>

          <View style={styles.infoSection}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <IconSymbol name="sun.max.fill" size={18} color="#F59E0B" />
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>
                Necessidade de Luz
              </Text>
            </View>
            <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 22 }}>
              {selected.necessidadeLuz}
            </Text>
          </View>

          <View style={styles.infoSection}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <IconSymbol name="leaf.fill" size={18} color={colors.success} />
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>
                Tipo de Solo Preferido
              </Text>
            </View>
            <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 22 }}>
              {selected.tipoSolo}
            </Text>
          </View>

          <View style={styles.infoSection}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <IconSymbol name="calendar" size={18} color={colors.primary} />
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>
                Épocas de Plantio
              </Text>
            </View>
            {(selected.epocasPlantio ?? []).map((ep, idx) => (
              <View key={idx} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.primary,
                  }}
                />
                <Text style={{ fontSize: 14, color: colors.foreground }}>{ep}</Text>
              </View>
            ))}
          </View>

          <View style={styles.infoSection}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <IconSymbol name="scalemass.fill" size={18} color={colors.warning} />
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>
                Produtividade Média
              </Text>
            </View>
            <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 22 }}>
              {selected.produtividadeMedia}
            </Text>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View
        style={{
          backgroundColor: "#F59E0B",
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 20,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: "700", color: "#FFFFFF" }}>Clima Agrícola</Text>
      </View>

      <FlatList
        data={CULTURAS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => setSelected(item)}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>
                  {item.nomePopular}
                </Text>
                <Text style={{ fontSize: 13, color: colors.muted, fontStyle: "italic", marginTop: 2 }}>
                  {item.nomeCientifico}
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={18} color={colors.muted} />
            </View>
            <View style={{ flexDirection: "row", gap: 16, marginTop: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <IconSymbol name="thermometer.medium" size={14} color="#EF4444" />
                <Text style={{ fontSize: 13, color: colors.muted }}>
                  {item.temperaturaMin}–{item.temperaturaMax}°C
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <IconSymbol name="drop.fill" size={14} color="#3B82F6" />
                <Text style={{ fontSize: 13, color: colors.muted }}>
                  {item.precipitacaoMin}–{item.precipitacaoMax} mm
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </ScreenContainer>
  );
}
