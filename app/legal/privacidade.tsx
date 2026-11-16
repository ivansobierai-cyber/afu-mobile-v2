import { Text, View } from "react-native";
import { LegalDocumentScreen } from "@/components/legal-document-screen";
import { LGPD_PRIVACY_VERSION } from "@/lib/lgpd/constants";
import {
  PRIVACY_INTRO,
  PRIVACY_SECTIONS,
} from "@/lib/legal/privacidade-content";

/**
 * Política de Privacidade — conteúdo Play Store (#60) + aviso LGPD (#69).
 * URL pública: https://afuagro.tech/privacidade → redirect aqui.
 */
export default function PoliticaPrivacidadeScreen() {
  return (
    <LegalDocumentScreen
      title="Política de Privacidade"
      intro={PRIVACY_INTRO}
      sections={PRIVACY_SECTIONS}
      banner={
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
      }
    />
  );
}
