/**
 * Etapa 9 — política de uso de IA e melhoria de modelos.
 *
 * Dados privados de clientes NÃO entram em treinamento sem autorização
 * explícita da organização (`aiAllowModelImprovement`).
 */

/** Política global (env) — default: nunca treinar com dados privados */
export function globalAiTrainingAllowed(): boolean {
  const v = (process.env.AI_ALLOW_TRAINING ?? "false").toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export type OrgAiPolicy = {
  aiAllowModelImprovement: boolean;
  aiShareAggregatedInsights: boolean;
};

export const DEFAULT_ORG_AI_POLICY: OrgAiPolicy = {
  aiAllowModelImprovement: false,
  aiShareAggregatedInsights: false,
};

/**
 * Pode enviar dados desta org para melhoria/treinamento de modelo?
 * Exige flag global E consentimento da organização.
 */
export function canUseForModelImprovement(orgPolicy?: Partial<OrgAiPolicy> | null): boolean {
  if (!globalAiTrainingAllowed()) return false;
  return Boolean(orgPolicy?.aiAllowModelImprovement);
}

/** Campos permitidos no contexto de diagnóstico (mínimo necessário) */
export const DIAGNOSTICO_CONTEXT_FIELDS = [
  "culturaNome",
  "parteAnalisada",
  "sintomas",
  "faseFenologica",
] as const;

/** Campos permitidos na interpretação laboratorial (sem PII/financeiros) */
export const INTERPRETACAO_CONTEXT_FIELDS = [
  "tipoAmostra",
  "culturaNome",
  "phSolo",
  "phAgua",
  "materiaOrganica",
  "umidade",
  "condutividadeEletrica",
  "nitrogenio",
  "fosforo",
  "potassio",
  "calcio",
  "magnesio",
  "enxofre",
  "ferro",
  "manganes",
  "zinco",
  "cobre",
  "boro",
] as const;

/** Disclaimer obrigatório na saída */
export const AI_OUTPUT_DISCLAIMER =
  "Recomendação assistida por IA — confirme com técnico/agrônomo antes de decisões críticas.";
