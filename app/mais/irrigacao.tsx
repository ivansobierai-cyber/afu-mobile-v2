import { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { CULTURAS } from "@/lib/mock-data";
import type { Cultura } from "@/shared/types";

const METODOS_IRRIGACAO = [
  {
    nome: "Gotejamento",
    descricao: "Alta eficiência hídrica, ideal para fruticultura e horticultura. Aplica água diretamente na zona radicular.",
    eficiencia: "90–95%",
    culturas: ["Tomate", "Pimentão", "Melão", "Morango"],
    cor: "#3B82F6",
  },
  {
    nome: "Aspersão Convencional",
    descricao: "Simula chuva natural. Adequado para culturas de ciclo curto e médio porte.",
    eficiencia: "70–80%",
    culturas: ["Feijão", "Milho", "Trigo", "Cebola"],
    cor: "#06B6D4",
  },
  {
    nome: "Pivô Central",
    descricao: "Alta automação e cobertura de grandes áreas. Amplamente usado em grãos.",
    eficiencia: "75–85%",
    culturas: ["Soja", "Milho", "Algodão", "Feijão"],
    cor: "#8B5CF6",
  },
  {
    nome: "Sulcos",
    descricao: "Método por gravidade, baixo custo. Adequado para solos argilosos e culturas em fileiras.",
    eficiencia: "50–65%",
    culturas: ["Cana-de-açúcar", "Milho", "Batata"],
    cor: "#D97706",
  },
  {
    nome: "Microaspersão",
    descricao: "Intermediário entre gotejamento e aspersão. Indicado para pomares e cultivos semi-perenes.",
    eficiencia: "80–90%",
    culturas: ["Citros", "Café", "Banana", "Maçã"],
    cor: "#38A169",
  },
];

export default function IrrigacaoScreen() {
  const colors = useColors();
  const router = useRouter();
  const [tab, setTab] = useState<"culturas" | "metodos">("culturas");
  const [selectedCultura, setSelectedCultura] = useState<Cultura | null>(null);

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

  if (selectedCultura) {
    return (
      <ScreenContainer>
        <View
          style={{
            backgroundColor: "#3B82F6",
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 20,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <TouchableOpacity onPress={() => setSelectedCultura(null)}>
            <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#FFFFFF" }}>
              {selectedCultura.nomePopular}
            </Text>
            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>Necessidades Hídricas</Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: "#3B82F620",
                borderRadius: 14,
                padding: 14,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#3B82F640",
              }}
            >
              <IconSymbol name="drop.fill" size={24} color="#3B82F6" />
              <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground, marginTop: 6 }}>
                {selectedCultura.precipitacaoMin}–{selectedCultura.precipitacaoMax}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>mm/ciclo</Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.success + "15",
                borderRadius: 14,
                padding: 14,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.success + "30",
              }}
            >
              <IconSymbol name="leaf.fill" size={24} color={colors.success} />
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginTop: 6, textAlign: "center" }}>
                {selectedCultura.tipoSolo}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>tipo de solo</Text>
            </View>
          </View>

          <View style={styles.infoSection}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
              Recomendações de Irrigação
            </Text>
            <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 22 }}>
              A cultura de {selectedCultura.nomePopular} requer entre {selectedCultura.precipitacaoMin} e {selectedCultura.precipitacaoMax} mm de água por ciclo produtivo. 
              {"\n\n"}Monitorar a umidade do solo regularmente e ajustar a frequência de irrigação conforme a fase fenológica da cultura. Fases críticas como floração e enchimento de grãos demandam maior atenção hídrica.
            </Text>
          </View>

          <View style={styles.infoSection}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 8 }}>
              Fases Críticas
            </Text>
            {selectedCultura.fasesFenologicas.slice(0, 4).map((fase, idx) => (
              <View key={idx} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: idx < 2 ? "#3B82F6" : colors.muted,
                  }}
                />
                <Text style={{ fontSize: 14, color: colors.foreground }}>{fase}</Text>
                {idx < 2 && (
                  <View
                    style={{
                      backgroundColor: "#3B82F620",
                      borderRadius: 6,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                    }}
                  >
                    <Text style={{ fontSize: 11, color: "#3B82F6", fontWeight: "600" }}>Crítica</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View
        style={{
          backgroundColor: "#3B82F6",
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
        <Text style={{ fontSize: 22, fontWeight: "700", color: "#FFFFFF" }}>Irrigação</Text>
      </View>

      {/* Tabs */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        {(["culturas", "metodos"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={{
              flex: 1,
              paddingVertical: 14,
              alignItems: "center",
              borderBottomWidth: 2,
              borderBottomColor: tab === t ? "#3B82F6" : "transparent",
            }}
            onPress={() => setTab(t)}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: tab === t ? "#3B82F6" : colors.muted,
              }}
            >
              {t === "culturas" ? "Por Cultura" : "Métodos"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "culturas" ? (
        <FlatList
          data={CULTURAS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => setSelectedCultura(item)}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>
                    {item.nomePopular}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                    <IconSymbol name="drop.fill" size={14} color="#3B82F6" />
                    <Text style={{ fontSize: 13, color: "#3B82F6", fontWeight: "600" }}>
                      {item.precipitacaoMin}–{item.precipitacaoMax} mm/ciclo
                    </Text>
                  </View>
                </View>
                <IconSymbol name="chevron.right" size={18} color={colors.muted} />
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          data={METODOS_IRRIGACAO}
          keyExtractor={(item) => item.nome}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: item.cor }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, flex: 1 }}>
                  {item.nome}
                </Text>
                <View
                  style={{
                    backgroundColor: item.cor + "20",
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "700", color: item.cor }}>
                    {item.eficiencia}
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 20, marginBottom: 10 }}>
                {item.descricao}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {item.culturas.map((c) => (
                  <View
                    key={c}
                    style={{
                      backgroundColor: item.cor + "15",
                      borderRadius: 6,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                    }}
                  >
                    <Text style={{ fontSize: 12, color: item.cor, fontWeight: "600" }}>{c}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        />
      )}
    </ScreenContainer>
  );
}
