import { View, Text, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { AuthButton } from "@/components/auth-button";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <ScreenContainer className="justify-between py-8">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        className="flex-1"
      >
        {/* Logo e Branding */}
        <View className="flex-1 items-center justify-center gap-6 mb-12">
          {/* Logo */}
          <View className="w-24 h-24 bg-primary rounded-full items-center justify-center mb-4">
            <Text className="text-5xl">🌱</Text>
          </View>

          {/* Título */}
          <Text className="text-4xl font-bold text-foreground text-center">
            AFU Agro
          </Text>

          {/* Subtítulo */}
          <Text className="text-base text-muted text-center px-4 leading-relaxed">
            Analisador Fitotécnico Universal — Diagnóstico inteligente para suas plantas
          </Text>

          {/* Descrição */}
          <View className="bg-primary/10 rounded-lg p-4 mx-4 mt-4">
            <Text className="text-sm text-foreground text-center leading-relaxed">
              Análise de doenças, pragas e deficiências nutricionais com inteligência artificial.
              Recomendações personalizadas para cada cultivo.
            </Text>
          </View>
        </View>

        {/* Features */}
        <View className="gap-3 mb-12">
          <FeatureItem icon="📸" title="Análise por Foto" description="Tire uma foto e obtenha diagnóstico instantâneo" />
          <FeatureItem icon="📊" title="Histórico Completo" description="Acompanhe o histórico de diagnósticos" />
          <FeatureItem icon="🌾" title="Múltiplos Cultivos" description="Gerencie várias propriedades e cultivos" />
          <FeatureItem icon="📚" title="Materiais Didáticos" description="Acesse guias e recomendações técnicas" />
        </View>
      </ScrollView>

      {/* Botões */}
      <View className="gap-3">
        <AuthButton
          label="Entrar"
          onPress={() => router.push('/auth/login')}
          variant="primary"
          size="large"
          icon="👤"
        />
        <AuthButton
          label="Criar Conta"
          onPress={() => router.push('/auth/cadastro')}
          variant="outline"
          size="large"
          icon="✨"
        />
      </View>
    </ScreenContainer>
  );
}

/**
 * Componente auxiliar para exibir features
 */
function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <View className="flex-row gap-3 px-4 py-3 bg-surface rounded-lg items-start">
      <Text className="text-2xl mt-1">{icon}</Text>
      <View className="flex-1">
        <Text className="font-semibold text-foreground">{title}</Text>
        <Text className="text-xs text-muted mt-1">{description}</Text>
      </View>
    </View>
  );
}
