import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, string>();

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async (key: string) => store.get(key) ?? null),
    setItem: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn(async (key: string) => {
      store.delete(key);
    }),
    getAllKeys: vi.fn(async () => [...store.keys()]),
    multiRemove: vi.fn(async (keys: string[]) => {
      for (const k of keys) store.delete(k);
    }),
  },
}));

import {
  canUseForModelImprovement,
  DEFAULT_ORG_AI_POLICY,
  INTERPRETACAO_CONTEXT_FIELDS,
} from "../lib/ai/ai-policy";
import {
  buildDiagnosticoPrompt,
  buildInterpretacaoPrompt,
  llmPrivacyOptions,
} from "../server/ai-governance";
import { redactString, redactValue } from "../server/_core/safe-logger";
import {
  clearAiContext,
  loadAiContext,
  saveAiContext,
} from "../lib/ai/ai-context-store";

describe("AI policy (Etapa 9)", () => {
  it("default bloqueia treinamento mesmo com opt-in local se global off", () => {
    const prev = process.env.AI_ALLOW_TRAINING;
    delete process.env.AI_ALLOW_TRAINING;
    expect(canUseForModelImprovement({ aiAllowModelImprovement: true })).toBe(false);
    expect(DEFAULT_ORG_AI_POLICY.aiAllowModelImprovement).toBe(false);
    process.env.AI_ALLOW_TRAINING = prev;
  });

  it("exige global + org para improvement", () => {
    const prev = process.env.AI_ALLOW_TRAINING;
    process.env.AI_ALLOW_TRAINING = "true";
    expect(canUseForModelImprovement({ aiAllowModelImprovement: false })).toBe(false);
    expect(canUseForModelImprovement({ aiAllowModelImprovement: true })).toBe(true);
    process.env.AI_ALLOW_TRAINING = prev;
  });

  it("llmPrivacyOptions nunca habilita store", () => {
    expect(llmPrivacyOptions({ ...DEFAULT_ORG_AI_POLICY }).store).toBe(false);
    expect(
      llmPrivacyOptions({
        aiAllowModelImprovement: true,
        aiShareAggregatedInsights: true,
      }).store,
    ).toBe(false);
  });

  it("prompts usam campos mínimos e não incluem nome de propriedade", () => {
    const d = buildDiagnosticoPrompt({
      culturaNome: "Soja",
      parteAnalisada: "folha",
      organizationId: 10,
      propriedadeId: 5,
    });
    expect(d.prompt).toContain("id interno");
    expect(d.prompt).toContain("propriedadeId: 5");
    expect(d.prompt).not.toContain("Fazenda");
    expect(d.fieldSummary).toContain("culturaNome");
    expect(d.fieldSummary).toContain("image");

    const i = buildInterpretacaoPrompt({
      tipoAmostra: "solo",
      organizationId: 10,
      propriedadeId: 5,
      valores: { phSolo: 6.2, nitrogenio: 10 },
    });
    expect(i.prompt).not.toContain("propriedadeNome");
    expect(i.fieldSummary).toEqual(expect.arrayContaining(["tipoAmostra", "phSolo", "nitrogenio"]));
    expect(INTERPRETACAO_CONTEXT_FIELDS).toContain("phSolo");
  });
});

describe("safe-logger redaction (Etapa 9)", () => {
  it("remove tokens, bearer e base64 de imagens", () => {
    const s = redactString(
      "Authorization: Bearer abc.def.ghi data:image/jpeg;base64,/9j/4AAQSkZJRg== password=secret",
    );
    expect(s).not.toContain("abc.def.ghi");
    expect(s).not.toContain("/9j/4AAQ");
    expect(s).toContain("[REDACTED]");
  });

  it("redige chaves sensíveis em objetos", () => {
    const out = redactValue({
      password: "123",
      token: "xyz",
      ok: true,
      nested: { apiKey: "k", nome: "Soja" },
    }) as Record<string, unknown>;
    expect(out.password).toBe("[REDACTED]");
    expect(out.token).toBe("[REDACTED]");
    expect(out.ok).toBe(true);
    expect((out.nested as { apiKey: string }).apiKey).toBe("[REDACTED]");
    expect((out.nested as { nome: string }).nome).toBe("Soja");
  });
});

describe("AI client context isolation (Etapa 9)", () => {
  beforeEach(() => {
    store.clear();
  });

  it("não cruza memória entre propriedades da mesma org", async () => {
    await saveAiContext({
      organizationId: 1,
      propriedadeId: 10,
      lastDiagnosticoSummary: { problema: "Ferrugem", at: Date.now() },
      updatedAt: Date.now(),
    });
    await saveAiContext({
      organizationId: 1,
      propriedadeId: 20,
      lastDiagnosticoSummary: { problema: "Saudável", at: Date.now() },
      updatedAt: Date.now(),
    });

    const a = await loadAiContext(1, 10);
    const b = await loadAiContext(1, 20);
    expect(a?.lastDiagnosticoSummary?.problema).toBe("Ferrugem");
    expect(b?.lastDiagnosticoSummary?.problema).toBe("Saudável");

    await clearAiContext(1, 10);
    expect(await loadAiContext(1, 10)).toBeNull();
    expect((await loadAiContext(1, 20))?.lastDiagnosticoSummary?.problema).toBe("Saudável");
  });

  it("não cruza memória entre organizações", async () => {
    await saveAiContext({
      organizationId: 1,
      propriedadeId: null,
      sessionNotes: "org1",
      updatedAt: Date.now(),
    });
    expect(await loadAiContext(2, null)).toBeNull();
  });
});
