import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";

export type RelatedLink = {
  etapa: number;
  title: string;
  subtitle: string;
  route: string;
  color: string;
  emoji: string;
};

type Props = {
  links: RelatedLink[];
  title?: string;
};

/**
 * RelatedLinks — Componente de navegação cruzada entre telas do AFU.
 * Exibe uma seção "Ver também" com cards horizontais deslizáveis
 * que conectam telas relacionadas entre si.
 */
export function RelatedLinks({ links, title = "Ver também" }: Props) {
  const router = useRouter();
  const colors = useColors();

  if (!links || links.length === 0) return null;

  return (
    <View
      style={{
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: 16,
        marginTop: 8,
      }}
    >
      {/* Cabeçalho da seção */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 16,
          marginBottom: 12,
        }}
      >
        <View
          style={{
            width: 3,
            height: 16,
            backgroundColor: colors.primary,
            borderRadius: 2,
          }}
        />
        <Text
          style={{
            fontSize: 12,
            fontWeight: "700",
            color: colors.muted,
            textTransform: "uppercase",
            letterSpacing: 0.8,
          }}
        >
          {title}
        </Text>
      </View>

      {/* Cards horizontais deslizáveis */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
      >
        {links.map((link) => (
          <TouchableOpacity
            key={link.route}
            onPress={() => router.push(link.route as any)}
            style={{
              width: 180,
              backgroundColor: link.color + "12",
              borderWidth: 1,
              borderColor: link.color + "35",
              borderRadius: 14,
              padding: 12,
            }}
          >
            {/* Badge da etapa + emoji */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <View
                style={{
                  backgroundColor: link.color,
                  borderRadius: 6,
                  paddingHorizontal: 7,
                  paddingVertical: 3,
                }}
              >
                <Text
                  style={{ color: "#fff", fontSize: 10, fontWeight: "800" }}
                >
                  Etapa {link.etapa}
                </Text>
              </View>
              <Text style={{ fontSize: 18 }}>{link.emoji}</Text>
            </View>

            {/* Título */}
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: link.color,
                marginBottom: 4,
                lineHeight: 18,
              }}
              numberOfLines={2}
            >
              {link.title}
            </Text>

            {/* Subtítulo */}
            <Text
              style={{
                fontSize: 11,
                color: colors.muted,
                lineHeight: 15,
              }}
              numberOfLines={2}
            >
              {link.subtitle}
            </Text>

            {/* Seta indicativa */}
            <View
              style={{
                marginTop: 8,
                alignSelf: "flex-end",
                backgroundColor: link.color + "20",
                borderRadius: 10,
                width: 20,
                height: 20,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: link.color, fontSize: 12, fontWeight: "700" }}>
                →
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={{ height: 16 }} />
    </View>
  );
}
