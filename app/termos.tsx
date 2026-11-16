import { LegalDocumentScreen } from "@/components/legal-document-screen";
import { TERMS_INTRO, TERMS_SECTIONS } from "@/lib/legal/privacidade-content";

export default function TermosPage() {
  return (
    <LegalDocumentScreen
      title="Termos de Uso"
      intro={TERMS_INTRO}
      sections={TERMS_SECTIONS}
    />
  );
}
