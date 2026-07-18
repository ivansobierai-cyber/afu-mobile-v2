/**
 * Etapa 9 — contexto de IA no cliente; limpa ao trocar org ou propriedade.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  clearAiContext,
  clearAllAiContexts,
  loadAiContext,
  saveAiContext,
  type AiClientContext,
} from "@/lib/ai/ai-context-store";
import { useOfflineTenantScope } from "@/hooks/use-offline-tenant-scope";

export function useAiContext(propriedadeId?: number | null) {
  const { scope } = useOfflineTenantScope();
  const organizationId = scope?.organizationId ?? null;
  const [context, setContext] = useState<AiClientContext | null>(null);
  const prevOrg = useRef<number | null | undefined>(undefined);
  const prevProp = useRef<number | null | undefined>(undefined);

  useEffect(() => {
    const org = organizationId;
    const prop = propriedadeId ?? null;

    // Troca de organização → limpa memória da org anterior
    if (prevOrg.current !== undefined && prevOrg.current !== org) {
      if (prevOrg.current) {
        void clearAiContext(prevOrg.current, null, { clearAllOrg: true });
      }
    }
    // Troca de propriedade → limpa memória da propriedade anterior (mesma org)
    if (
      prevOrg.current === org &&
      prevProp.current !== undefined &&
      prevProp.current !== prop &&
      org
    ) {
      void clearAiContext(org, prevProp.current);
    }

    prevOrg.current = org;
    prevProp.current = prop;

    if (!org) {
      setContext(null);
      return;
    }
    let cancelled = false;
    void loadAiContext(org, prop).then((ctx) => {
      if (!cancelled) setContext(ctx);
    });
    return () => {
      cancelled = true;
    };
  }, [organizationId, propriedadeId]);

  const rememberDiagnostico = useCallback(
    async (summary: { problema?: string; tipo?: string; confianca?: number }) => {
      if (!organizationId) return;
      const next: AiClientContext = {
        organizationId,
        propriedadeId: propriedadeId ?? null,
        lastDiagnosticoSummary: { ...summary, at: Date.now() },
        sessionNotes: context?.sessionNotes,
        updatedAt: Date.now(),
      };
      await saveAiContext(next);
      setContext(next);
    },
    [organizationId, propriedadeId, context?.sessionNotes],
  );

  const clearCurrent = useCallback(async () => {
    if (!organizationId) return;
    await clearAiContext(organizationId, propriedadeId ?? null);
    setContext(null);
  }, [organizationId, propriedadeId]);

  return {
    organizationId,
    propriedadeId: propriedadeId ?? null,
    context,
    rememberDiagnostico,
    clearCurrent,
    clearAll: clearAllAiContexts,
  };
}
