import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { ScreenHeader } from "@/components/screen-header";
import { useColors } from "@/hooks/use-colors";
import { LGPD_TERMS_VERSION } from "@/lib/lgpd/constants";

/**
 * Termos de Uso — texto PLACEHOLDER para revisão jurídica.
 * Não é parecer legal. Validar com assessoria antes de produção / Play Store.
 */
export default function TermosDeUsoScreen() {
  const colors = useColors();
  const router = useRouter();

  return (
    <ScreenContainer>
      <ScreenHeader title="Termos de Uso" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
        <View
          style={{
            backgroundColor: "#FFF8E1",
            borderColor: "#F9A825",
            borderWidth: 1,
            borderRadius: 12,
            padding: 14,
            marginBottom: 16,
          }}
        >
          <Text style={{ color: "#F57F17", fontWeight: "800", fontSize: 13, marginBottom: 4 }}>
            PLACEHOLDER — REVISÃO JURÍDICA OBRIGATÓRIA
          </Text>
          <Text style={{ color: "#5D4037", fontSize: 13, lineHeight: 19 }}>
            Este texto é provisório para conformidade técnica (WP-07 / LGPD). Não substitui parecer
            de advogado/DPO. Versão exibida: {LGPD_TERMS_VERSION}.
          </Text>
        </View>

        <Text style={{ fontSize: 22, fontWeight: "800", color: colors.foreground, marginBottom: 8 }}>
          Termos de Uso — AFU Agro
        </Text>
        <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 16 }}>
          Versão {LGPD_TERMS_VERSION} · Brasil
        </Text>

        {[
          {
            t: "1. Objeto",
            d: "A plataforma AFU (Analisador Fitotécnico Universal) oferece ferramentas de gestão rural, diagnóstico assistido por IA e serviços correlatos. O uso implica aceitação destes Termos.",
          },
          {
            t: "2. Cadastro e conta",
            d: "O usuário é responsável pela veracidade dos dados e pela guarda de credenciais. Contas podem ser suspensas em caso de abuso, inadimplência ou solicitação de exclusão LGPD.",
          },
          {
            t: "3. Uso permitido",
            d: "É permitido usar o app para fins agrícolas legítimos vinculados à sua operação. É proibido engenharia reversa indevida, scraping abusivo, compartilhamento de credenciais ou uso que viole leis brasileiras.",
          },
          {
            t: "4. Diagnóstico por IA",
            d: "Resultados de IA são apoio à decisão e não substituem laudo de profissional habilitado. O usuário permanece responsável por ações tomadas com base nas recomendações.",
          },
          {
            t: "5. Propriedade intelectual",
            d: "Marcas, software e conteúdos da AFU permanecem de titularidade da AFU Agro / licenciantes. Dados de produção inseridos pelo usuário seguem a Política de Privacidade.",
          },
          {
            t: "6. Limitação de responsabilidade",
            d: "PLACEHOLDER: cláusulas de limitação, força maior e disponibilidade serão definidas pela assessoria jurídica.",
          },
          {
            t: "7. Rescisão e exclusão",
            d: "O usuário pode solicitar exclusão da conta pelo app. A exclusão não é imediata: há período de graça e anonimização programada (ver Política de Privacidade e docs/LGPD.md).",
          },
          {
            t: "8. Foro",
            d: "PLACEHOLDER: foro e lei aplicável (sugestão operacional: legislação brasileira / foro da sede da AFU Agro).",
          },
        ].map((s) => (
          <View key={s.t} style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 6 }}>
              {s.t}
            </Text>
            <Text style={{ fontSize: 14, lineHeight: 22, color: colors.foreground }}>{s.d}</Text>
          </View>
        ))}

        <TouchableOpacity onPress={() => router.push("/legal/privacidade" as any)}>
          <Text style={{ color: colors.primary, fontWeight: "700", marginTop: 8 }}>
            Ver Política de Privacidade →
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
