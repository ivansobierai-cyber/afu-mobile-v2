import { LegalDocumentScreen } from "@/components/legal-document-screen";
import {
  PRIVACY_INTRO,
  PRIVACY_SECTIONS,
} from "@/lib/legal/privacidade-content";

export default function PrivacidadePage() {
  return (
    <LegalDocumentScreen
      title="Política de Privacidade"
      intro={PRIVACY_INTRO}
      sections={PRIVACY_SECTIONS}
    />
  );
}
