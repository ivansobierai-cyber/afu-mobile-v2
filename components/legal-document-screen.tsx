import type { ReactNode } from "react";
import { Linking, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import type { LegalSection } from "@/lib/legal/privacidade-content";
import { PRIVACY_CONTACT_EMAIL, PRIVACY_LAST_UPDATED } from "@/lib/legal/privacidade-content";

type Props = {
  title: string;
  intro: string;
  sections: LegalSection[];
  /** Aviso LGPD / revisão jurídica (mantido do WP-07). */
  banner?: ReactNode;
};

export function LegalDocumentScreen({ title, intro, sections, banner }: Props) {
  const router = useRouter();

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]} className="px-4">
      <View className="flex-row items-center justify-between py-3 mb-2">
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace("/auth/welcome" as never);
          }}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          className="px-2 py-2"
        >
          <Text className="text-primary font-semibold text-base">← Voltar</Text>
        </TouchableOpacity>
        <Text className="text-xs text-muted">Atualizado em {PRIVACY_LAST_UPDATED}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {banner}
        <Text
          accessibilityRole="header"
          className="text-2xl font-bold text-foreground mb-3"
        >
          {title}
        </Text>
        <Text className="text-sm text-muted leading-6 mb-6">{intro}</Text>

        {sections.map((section) => (
          <View key={section.title} className="mb-5">
            <Text className="text-base font-bold text-foreground mb-2">{section.title}</Text>
            {section.paragraphs.map((p) => (
              <Text key={p.slice(0, 48)} className="text-sm text-foreground leading-6 mb-2">
                {p}
              </Text>
            ))}
          </View>
        ))}

        <TouchableOpacity
          onPress={() => Linking.openURL(`mailto:${PRIVACY_CONTACT_EMAIL}`)}
          accessibilityRole="link"
          className="mt-2 py-3"
        >
          <Text className="text-primary font-semibold">{PRIVACY_CONTACT_EMAIL}</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
