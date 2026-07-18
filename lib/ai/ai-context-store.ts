/**
 * Etapa 9 — memória/contexto de IA no cliente, isolada por org + propriedade.
 * Limpa ao trocar organização ou propriedade.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

export type AiClientContext = {
  organizationId: number;
  propriedadeId: number | null;
  /** Rascunho da última análise (sem imagem base64) */
  lastDiagnosticoSummary?: {
    problema?: string;
    tipo?: string;
    confianca?: number;
    at: number;
  };
  /** Notas curtas de sessão (nunca cruzam propriedades) */
  sessionNotes?: string;
  updatedAt: number;
};

function storageKey(organizationId: number, propriedadeId: number | null): string {
  const prop = propriedadeId && propriedadeId > 0 ? String(propriedadeId) : "none";
  return `afu:ai:ctx:o${organizationId}:p${prop}`;
}

export async function loadAiContext(
  organizationId: number,
  propriedadeId: number | null,
): Promise<AiClientContext | null> {
  if (!organizationId || organizationId <= 0) return null;
  try {
    const raw = await AsyncStorage.getItem(storageKey(organizationId, propriedadeId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AiClientContext;
    if (parsed.organizationId !== organizationId) return null;
    if ((parsed.propriedadeId ?? null) !== (propriedadeId ?? null)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveAiContext(ctx: AiClientContext): Promise<void> {
  // Nunca persistir base64 / tokens
  const safe: AiClientContext = {
    organizationId: ctx.organizationId,
    propriedadeId: ctx.propriedadeId,
    lastDiagnosticoSummary: ctx.lastDiagnosticoSummary
      ? {
          problema: ctx.lastDiagnosticoSummary.problema?.slice(0, 120),
          tipo: ctx.lastDiagnosticoSummary.tipo,
          confianca: ctx.lastDiagnosticoSummary.confianca,
          at: ctx.lastDiagnosticoSummary.at,
        }
      : undefined,
    sessionNotes: ctx.sessionNotes?.slice(0, 500),
    updatedAt: Date.now(),
  };
  await AsyncStorage.setItem(
    storageKey(safe.organizationId, safe.propriedadeId),
    JSON.stringify(safe),
  );
}

/** Remove memória de uma propriedade (ou todas da org se propriedadeId=null e clearAllOrg). */
export async function clearAiContext(
  organizationId: number,
  propriedadeId?: number | null,
  options?: { clearAllOrg?: boolean },
): Promise<void> {
  if (!organizationId || organizationId <= 0) return;
  if (options?.clearAllOrg) {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const prefix = `afu:ai:ctx:o${organizationId}:`;
      const mine = keys.filter((k) => k.startsWith(prefix));
      if (mine.length) await AsyncStorage.multiRemove(mine);
    } catch {
      await AsyncStorage.removeItem(storageKey(organizationId, null));
    }
    return;
  }
  await AsyncStorage.removeItem(storageKey(organizationId, propriedadeId ?? null));
}

/** Limpa toda memória de IA do aparelho (logout). */
export async function clearAllAiContexts(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const mine = keys.filter((k) => k.startsWith("afu:ai:ctx:"));
    if (mine.length) await AsyncStorage.multiRemove(mine);
  } catch {
    // ignore
  }
}
