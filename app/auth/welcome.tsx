import { View, Text, ScrollView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { AuthButton } from "@/components/auth-button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import type { ComponentProps } from "react";

type FeatureIcon = ComponentProps<typeof IconSymbol>["name"];

export default function WelcomeScreen() {
  const router = useRouter();
  const colors = useColors();

  return (
    <ScreenContainer className="justify-between py-8">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        className="flex-1"
      >
        {/* Logo e Branding */}
        <View className="flex-1 items-center justify-center gap-6 mb-12">
          <View className="w-24 h-24 bg-primary rounded-full items-center justify-center mb-4">
            <IconSymbol name={"sprout.fill" as any} size={48} color="#FFFFFF" />
          </View>

          <Text
            accessibilityRole="header"
            className="text-4xl font-bold text-foreground text-center"
            {...(Platform.OS === "web"
              ? ({
                  accessibilityLevel: 1,
                  role: "heading",
                  "aria-level": 1,
                } as object)
              : {})}
          >
            AFU Agro
          </Text>

          <Text className="text-base text-muted text-center px-4 leading-relaxed">
            Analisador Fitotécnico Universal — Diagnóstico inteligente para suas plantas
          </Text>

          <View className="bg-primary/10 rounded-lg p-4 mx-4 mt-4">
            <Text className="text-sm text-foreground text-center leading-relaxed">
              Análise de doenças, pragas e deficiências nutricionais com inteligência artificial.
              Recomendações personalizadas para cada cultivo.
            </Text>
          </View>
        </View>

        {/* Features */}
        <View className="gap-3 mb-12">
          <FeatureItem icon="camera.fill" title="Análise por Foto" description="Tire uma foto e obtenha diagnóstico instantâneo" />
          <FeatureItem icon="chart.bar.fill" title="Histórico Completo" description="Acompanhe o histórico de diagnósticos" />
          <FeatureItem icon="leaf.fill" title="Múltiplos Cultivos" description="Gerencie várias propriedades e cultivos" />
          <FeatureItem icon="books.vertical.fill" title="Materiais Didáticos" description="Acesse guias e recomendações técnicas" />
        </View>
      </ScrollView>

      {/* Botões */}
      <View className="gap-3">
        <AuthButton
          label="Entrar"
          onPress={() => router.push("/auth/login")}
          variant="primary"
          size="large"
          iconName="person.fill"
        />
        <AuthButton
          label="Criar Conta"
          onPress={() => router.push("/auth/cadastro")}
          variant="outline"
          size="large"
          iconName="star.fill"
        />
      </View>
    </ScreenContainer>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: FeatureIcon;
  title: string;
  description: string;
}) {
  const colors = useColors();

  return (
    <View className="flex-row gap-3 px-4 py-3 bg-surface rounded-lg items-start">
      <View className="mt-1">
        <IconSymbol name={icon} size={24} color={colors.primary} />
      </View>
      <View className="flex-1">
        <Text className="font-semibold text-foreground">{title}</Text>
        <Text className="text-xs text-muted mt-1">{description}</Text>
      </View>
    </View>
  );
}
