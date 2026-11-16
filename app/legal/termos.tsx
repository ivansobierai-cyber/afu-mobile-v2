import { Text, View } from "react-native";
import { LegalDocumentScreen } from "@/components/legal-document-screen";
import { LGPD_TERMS_VERSION } from "@/lib/lgpd/constants";
import { TERMS_INTRO, TERMS_SECTIONS } from "@/lib/legal/privacidade-content";

/**
 * Termos de Uso — conteúdo Play Store (#60) + aviso LGPD (#69).
 * URL pública: https://afuagro.tech/termos → redirect aqui.
 */
export default function TermosDeUsoScreen() {
  return (
    <LegalDocumentScreen
      title="Termos de Uso"
      intro={TERMS_INTRO}
      sections={TERMS_SECTIONS}
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
            Este texto é provisório para conformidade técnica (WP-07 / LGPD). Não substitui parecer
            de advogado/DPO. Versão exibida: {LGPD_TERMS_VERSION}.
          </Text>
        </View>
      }
    />
  );
}
