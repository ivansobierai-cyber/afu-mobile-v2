import { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { NUTRIENTES } from "@/lib/mock-data";
import type { Nutriente } from "@/shared/types";

export default function NutricaoScreen() {
  const colors = useColors();
  const router = useRouter();
  const [selected, setSelected] = useState<Nutriente | null>(null);
  const [filterTipo, setFilterTipo] = useState<"todos" | "macronutriente" | "micronutriente">("todos");

  const filtered = filterTipo === "todos" ? NUTRIENTES : NUTRIENTES.filter((n) => n.tipo === filterTipo);

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
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
    const isMacro = selected.tipo === "macronutriente";
    const headerColor = isMacro ? "#2D6A4F" : "#8B5CF6";

    return (
      <ScreenContainer>
        <View
          style={{
            backgroundColor: headerColor,
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
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 24, fontWeight: "700", color: "#FFFFFF" }}>
              {selected.nome} ({selected.simbolo})
            </Text>
            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 2, textTransform: "capitalize" }}>
              {selected.tipo}
            </Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <View style={styles.infoSection}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 6 }}>
              Função na Planta
            </Text>
            <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 22 }}>
              {selected.funcao}
            </Text>
          </View>
          <View style={[styles.infoSection, { borderColor: colors.error + "40" }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <IconSymbol name="exclamationmark.triangle.fill" size={18} color={colors.error} />
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.error }}>
                Sintomas de Deficiência
              </Text>
            </View>
            <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 22 }}>
              {selected.sintomasDeficiencia}
            </Text>
          </View>
          <View style={[styles.infoSection, { borderColor: colors.warning + "40" }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <IconSymbol name="exclamationmark.triangle.fill" size={18} color={colors.warning} />
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.warning }}>
                Sintomas de Excesso
              </Text>
            </View>
            <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 22 }}>
              {selected.sintomasExcesso}
            </Text>
          </View>
          <View style={[styles.infoSection, { borderColor: colors.success + "40" }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <IconSymbol name="flask.fill" size={18} color={colors.success} />
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.success }}>
                Fontes de Fertilizantes
              </Text>
            </View>
            <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 22 }}>
              {selected.fontesFertilizantes}
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
          backgroundColor: colors.primary,
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
        <Text style={{ fontSize: 22, fontWeight: "700", color: "#FFFFFF" }}>Nutrição Vegetal</Text>
      </View>

      {/* Filter tabs */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        {(["todos", "macronutriente", "micronutriente"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={{
              flex: 1,
              paddingVertical: 14,
              alignItems: "center",
              borderBottomWidth: 2,
              borderBottomColor: filterTipo === t ? colors.primary : "transparent",
            }}
            onPress={() => setFilterTipo(t)}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: filterTipo === t ? colors.primary : colors.muted,
              }}
            >
              {t === "todos" ? "Todos" : t === "macronutriente" ? "Macro" : "Micro"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isMacro = item.tipo === "macronutriente";
          const accentColor = isMacro ? "#2D6A4F" : "#8B5CF6";
          return (
            <TouchableOpacity style={styles.card} onPress={() => setSelected(item)}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    backgroundColor: accentColor + "20",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 22, fontWeight: "900", color: accentColor }}>
                    {item.simbolo}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>
                    {item.nome}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }} numberOfLines={2}>
                    {item.funcao}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: accentColor + "15",
                    borderRadius: 8,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: "700", color: accentColor }}>
                    {isMacro ? "Macro" : "Micro"}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </ScreenContainer>
  );
}
