import { ENV } from "../_core/env";
import { invokeLLM } from "../_core/llm";
import type { TenantContext } from "../tenant-access";
import type { ClimaDiaHint, EventoParaSugestao, SugestaoIA } from "../../lib/eventos/ia-sugestoes";
import {
  buildEventosAgendaPrompt,
  parseLlmSugestoesJson,
} from "../../lib/eventos/ia-sugestoes-llm";

export async function fetchLlmSugestoesEventos(opts: {
  tenant: TenantContext;
  eventos: EventoParaSugestao[];
  climaDias: ClimaDiaHint[];
  regrasCount: number;
  propriedadeId?: number | null;
}): Promise<SugestaoIA[]> {
  if (!ENV.forgeApiUrl?.trim() || !ENV.forgeApiKey?.trim()) {
    return [];
  }

  const {
    getOrgAiPolicy,
    llmPrivacyOptions,
    auditAiInvocation,
    DEFAULT_AI_MODEL,
  } = await import("../ai-governance");

  const orgPolicy = await getOrgAiPolicy(opts.tenant.organizationId);
  const privacy = llmPrivacyOptions(orgPolicy);
  const prompt = buildEventosAgendaPrompt({
    eventos: opts.eventos,
    climaDias: opts.climaDias,
    regrasCount: opts.regrasCount,
  });

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "Respostas curtas em português do Brasil. Somente JSON, sem markdown.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 900,
      store: privacy.store,
      metadata: { ...privacy.metadata, afu_purpose: "eventos_agenda" },
    });

    const rawContent = response.choices[0]?.message?.content;
    const content =
      typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent ?? "");
    const sugestoes = parseLlmSugestoesJson(content);
    const model = response.model || DEFAULT_AI_MODEL;

    await auditAiInvocation({
      tenant: opts.tenant,
      purpose: "eventos_agenda_assistente",
      model,
      fieldSummary: ["eventos_agenda", `count=${opts.eventos.length}`],
      propriedadeId: opts.propriedadeId ?? undefined,
      success: sugestoes.length > 0,
    });

    return sugestoes;
  } catch (err) {
    console.warn("[eventos-ia-llm] fallback para regras:", err);
    try {
      const { DEFAULT_AI_MODEL: model } = await import("../ai-governance");
      await auditAiInvocation({
        tenant: opts.tenant,
        purpose: "eventos_agenda_assistente",
        model,
        fieldSummary: ["eventos_agenda", "error"],
        propriedadeId: opts.propriedadeId ?? undefined,
        success: false,
      });
    } catch {
      /* audit opcional */
    }
    return [];
  }
}
