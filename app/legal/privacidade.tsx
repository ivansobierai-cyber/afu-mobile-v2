import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { ScreenHeader } from "@/components/screen-header";
import { useColors } from "@/hooks/use-colors";
import { LGPD_DELETION_GRACE_DAYS, LGPD_PRIVACY_VERSION } from "@/lib/lgpd/constants";

/**
 * Política de Privacidade — texto PLACEHOLDER para revisão jurídica (LGPD).
 */
export default function PoliticaPrivacidadeScreen() {
  const colors = useColors();
  const router = useRouter();

  return (
    <ScreenContainer>
      <ScreenHeader title="Privacidade" onBack={() => router.back()} />
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
            Documento provisório alinhado à Lei 13.709/2018 (LGPD). Validar bases legais, DPO e
            retenção com assessoria antes de produção. Versão: {LGPD_PRIVACY_VERSION}.
          </Text>
        </View>

        <Text style={{ fontSize: 22, fontWeight: "800", color: colors.foreground, marginBottom: 8 }}>
          Política de Privacidade — AFU Agro
        </Text>
        <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 16 }}>
          Versão {LGPD_PRIVACY_VERSION} · Brasil
        </Text>

        {[
          {
            t: "1. Controlador",
            d: "PLACEHOLDER: AFU Agro (razão social, CNPJ e contato do DPO a preencher pelo dono).",
          },
          {
            t: "2. Dados coletados",
            d: "Identificação (nome, e-mail, telefone), dados de propriedade/cultivo, imagens para diagnóstico, logs técnicos, tokens de push e metadados de consentimento (versão, data/hora, IP).",
          },
          {
            t: "3. Finalidades e bases legais",
            d: "Execução de contrato (prestação do serviço), consentimento (quando aplicável) e legítimo interesse para segurança/fraude — PLACEHOLDER para mapeamento ROPA completo.",
          },
          {
            t: "4. Compartilhamento",
            d: "Provedores de infraestrutura (hospedagem, e-mail, push, armazenamento de arquivos). Dados não são vendidos. Processadores tratados sob contrato — PLACEHOLDER.",
          },
          {
            t: "5. Direitos do titular",
            d: "Acesso, correção, portabilidade (exportação JSON no app), eliminação mediante solicitação com período de graça, informação e revogação de consentimento, conforme LGPD.",
          },
          {
            t: "6. Exclusão de conta",
            d: `A exclusão NÃO é imediata. Ao solicitar, a conta é suspensa e a anonimização é agendada em cerca de ${LGPD_DELETION_GRACE_DAYS} dias (cancelável nesse intervalo). Não realizamos hard-delete imediato dos registros operacionais vinculados.`,
          },
          {
            t: "7. Retenção",
            d: "Dados de conta ativa enquanto houver relação. Após anonimização, identificadores pessoais são removidos/substituídos; trilhas de auditoria LGPD e obrigações legais podem ser retidas. Ver docs/LGPD.md.",
          },
          {
            t: "8. Segurança",
            d: "Autenticação JWT, controle de acesso multi-tenant, auditoria de ações sensíveis e arquivos privados por organização.",
          },
          {
            t: "9. Contato",
            d: "PLACEHOLDER: e-mail do DPO / privacidade (ex.: privacidade@afuagro.com.br) — definir pelo dono.",
          },
        ].map((s) => (
          <View key={s.t} style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 6 }}>
              {s.t}
            </Text>
            <Text style={{ fontSize: 14, lineHeight: 22, color: colors.foreground }}>{s.d}</Text>
          </View>
        ))}

        <TouchableOpacity onPress={() => router.push("/legal/termos" as any)}>
          <Text style={{ color: colors.primary, fontWeight: "700", marginTop: 8 }}>
            Ver Termos de Uso →
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
