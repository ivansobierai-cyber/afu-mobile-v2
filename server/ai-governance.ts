/**
 * Etapa 9 — governança de IA: contexto mínimo, escopo por org, auditoria, sem treinamento.
 */
import { TRPCError } from "@trpc/server";
import {
  AI_OUTPUT_DISCLAIMER,
  canUseForModelImprovement,
  DEFAULT_ORG_AI_POLICY,
  type OrgAiPolicy,
} from "../lib/ai/ai-policy";
import { writeAuditLog } from "./private-files";
import { getDb } from "./db";
import { organizations } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import type { TenantContext } from "./tenant-access";
import { assertRelatedIdsInTenant } from "./tenant-access";
import { safeLogger } from "./_core/safe-logger";

export const DEFAULT_AI_MODEL = "builtin-default";

export type AiPurpose = "diagnostico_fitossanitario" | "interpretacao_laboratorio";

export async function getOrgAiPolicy(organizationId: number): Promise<OrgAiPolicy> {
  const db = await getDb();
  if (!db) return { ...DEFAULT_ORG_AI_POLICY };
  try {
    const rows = await db
      .select({
        aiAllowModelImprovement: (organizations as any).aiAllowModelImprovement,
        aiShareAggregatedInsights: (organizations as any).aiShareAggregatedInsights,
      })
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);
    const row = rows[0] as OrgAiPolicy | undefined;
    if (!row) return { ...DEFAULT_ORG_AI_POLICY };
    return {
      aiAllowModelImprovement: Boolean(row.aiAllowModelImprovement),
      aiShareAggregatedInsights: Boolean(row.aiShareAggregatedInsights),
    };
  } catch {
    // Colunas ainda não migradas
    return { ...DEFAULT_ORG_AI_POLICY };
  }
}

/** Opções extras enviadas ao provedor — nunca habilitar store/treino com dados privados. */
export function llmPrivacyOptions(orgPolicy: OrgAiPolicy): {
  store: false;
  metadata: Record<string, string>;
} {
  const allowImprove = canUseForModelImprovement(orgPolicy);
  return {
    store: false,
    metadata: {
      afu_training: allowImprove ? "opt_in_aggregated_only" : "forbidden",
      afu_privacy: "tenant_scoped",
    },
  };
}

export function buildDiagnosticoPrompt(input: {
  culturaNome: string;
  parteAnalisada: string;
  sintomas?: string;
  faseFenologica?: string;
  organizationId: number;
  propriedadeId?: number;
}): { prompt: string; fieldSummary: string[] } {
  const fieldSummary: string[] = ["culturaNome", "parteAnalisada", "image"];
  const lines = [
    `Cultura: ${input.culturaNome.slice(0, 80)}`,
    `Parte analisada: ${input.parteAnalisada.slice(0, 60)}`,
  ];
  if (input.faseFenologica) {
    lines.push(`Fase fenológica: ${input.faseFenologica.slice(0, 60)}`);
    fieldSummary.push("faseFenologica");
  }
  if (input.sintomas) {
    lines.push(`Sintomas relatados: ${input.sintomas.slice(0, 400)}`);
    fieldSummary.push("sintomas");
  }
  // Sem nome de propriedade, coordenadas, custos ou PII
  const prompt = `Você é um agrônomo especialista em fitossanidade. Analise a imagem com o contexto mínimo abaixo.
Organização (id interno): ${input.organizationId}${input.propriedadeId ? ` · propriedadeId: ${input.propriedadeId}` : ""}.

${lines.join("\n")}

Identifique praga, doença, deficiência, estresse ou planta saudável.
Esta análise é triagem preliminar — oriente confirmação com técnico quando necessário.
${AI_OUTPUT_DISCLAIMER}

Responda APENAS com JSON válido (sem markdown):
{
  "problema": "string",
  "tipo": "praga"|"doenca"|"deficiencia_nutricional"|"estresse_ambiental"|"saudavel"|"outro",
  "confianca": 0-100,
  "severidade": "leve"|"moderada"|"grave"|"critica",
  "descricao": "string",
  "recomendacoes": ["string"],
  "agenteCausal": "string opcional",
  "observacoesTecnicas": "string opcional"
}`;
  return { prompt, fieldSummary };
}

export function buildInterpretacaoPrompt(input: {
  tipoAmostra: string;
  culturaNome?: string;
  organizationId: number;
  propriedadeId?: number;
  valores: Record<string, number | undefined>;
}): { prompt: string; fieldSummary: string[] } {
  const labels: Record<string, string> = {
    phSolo: "pH Solo",
    phAgua: "pH Água",
    materiaOrganica: "MO (%)",
    umidade: "Umidade (%)",
    condutividadeEletrica: "CE (dS/m)",
    nitrogenio: "N",
    fosforo: "P",
    potassio: "K",
    calcio: "Ca",
    magnesio: "Mg",
    enxofre: "S",
    ferro: "Fe",
    manganes: "Mn",
    zinco: "Zn",
    cobre: "Cu",
    boro: "B",
  };
  const fieldSummary: string[] = ["tipoAmostra"];
  const valoresTexto = Object.entries(input.valores)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => {
      fieldSummary.push(k);
      return `${labels[k] ?? k}: ${v}`;
    })
    .join("\n");
  if (input.culturaNome) fieldSummary.push("culturaNome");

  // Sem nome textual da propriedade (PII/identificação) — só id interno se autorizado
  const prompt = `Você é engenheiro agrônomo (fertilidade/nutrição). Interprete análise de ${input.tipoAmostra.slice(0, 40)}.
Escopo: organizationId=${input.organizationId}${input.propriedadeId ? ` propriedadeId=${input.propriedadeId}` : ""}${input.culturaNome ? ` cultura=${input.culturaNome.slice(0, 60)}` : ""}.

Resultados:
${valoresTexto || "(sem valores numéricos)"}

${AI_OUTPUT_DISCLAIMER}

Responda APENAS com JSON válido:
{
  "interpretacao": "string",
  "recomendacoes": ["string"],
  "alertas": ["string"],
  "classificacaoGeral": "adequado"|"deficiente"|"excessivo"|"critico"
}`;
  return { prompt, fieldSummary };
}

export async function assertAiPropertyScope(
  tenant: TenantContext,
  propriedadeId?: number,
  culturaId?: number,
): Promise<void> {
  if (propriedadeId || culturaId) {
    await assertRelatedIdsInTenant(tenant, { propriedadeId, culturaId });
  }
}

export async function auditAiInvocation(params: {
  tenant: TenantContext;
  purpose: AiPurpose;
  model: string;
  fieldSummary: string[];
  propriedadeId?: number;
  culturaId?: number;
  imageIncluded?: boolean;
  success: boolean;
  errorMessage?: string;
}): Promise<void> {
  const orgPolicy = await getOrgAiPolicy(params.tenant.organizationId);
  try {
    await writeAuditLog({
      organizationId: params.tenant.organizationId,
      actorUserId: params.tenant.userId,
      action: params.success ? "ai.invoke" : "ai.invoke_failed",
      resourceType: params.purpose,
      resourceId: params.propriedadeId != null ? String(params.propriedadeId) : undefined,
      meta: JSON.stringify({
        model: params.model,
        purpose: params.purpose,
        fields: params.fieldSummary,
        imageIncluded: Boolean(params.imageIncluded),
        culturaId: params.culturaId,
        role: params.tenant.orgRole,
        trainingAllowed: canUseForModelImprovement(orgPolicy),
        store: false,
        error: params.errorMessage ? params.errorMessage.slice(0, 200) : undefined,
      }),
    });
  } catch (e) {
    safeLogger.warn("[ai-governance] falha ao auditar invoke", {
      message: e instanceof Error ? e.message : "unknown",
    });
  }
}

export function requireAiOrgPermission(tenant: TenantContext): void {
  // Diagnóstico/lab: qualquer membro ativo com leitura de propriedade
  if (!tenant.organizationId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Organização ativa obrigatória para IA" });
  }
}

export { AI_OUTPUT_DISCLAIMER };
