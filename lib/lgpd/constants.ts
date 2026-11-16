/**
 * Versões canônicas dos documentos legais exibidos no app.
 * PLACEHOLDER — revisar com assessoria jurídica antes de produção Play Store.
 */
export const LGPD_TERMS_VERSION = "1.0.0-placeholder";
export const LGPD_PRIVACY_VERSION = "1.0.0-placeholder";

/** Período de graça padrão antes da anonimização (dias). Nunca exclusão imediata. */
export const LGPD_DELETION_GRACE_DAYS = 30;

export const LGPD_DOCUMENT_LABELS = {
  terms: "Termos de Uso",
  privacy: "Política de Privacidade",
} as const;

export type LgpdDocumentType = keyof typeof LGPD_DOCUMENT_LABELS;
