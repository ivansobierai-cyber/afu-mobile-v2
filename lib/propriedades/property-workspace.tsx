/**
 * Contexto único da propriedade (correção Etapa 3).
 * Organização + propriedade + safra + aba — uma fonte de verdade no painel.
 */
import React, { createContext, useCallback, useContext, useMemo } from "react";
import type { OrgRole } from "@/lib/security/org-roles";
import { roleHasPermission } from "@/lib/security/org-roles";

export type PanelTab = "visao" | "mapa" | "operacoes" | "talhoes" | "cultivos" | "mais";
export type SafraStatus = "planejada" | "ativa" | "encerrada" | "arquivada";

export type WorkspaceSafra = {
  id: number;
  nome: string;
  status: SafraStatus;
  isDefault: boolean;
};

export type PropertyWorkspaceContextValue = {
  organizationId: number;
  propriedadeId: number;
  safraId: number | null;
  safra: WorkspaceSafra | null;
  safraStatus: SafraStatus | null;
  /** "historical" só quando filtragem completa + status encerrada/arquivada */
  mode: "current" | "historical";
  canWrite: boolean;
  tab: PanelTab;
  setSafraId: (id: number) => void;
  setTab: (tab: PanelTab) => void;
  safras: WorkspaceSafra[];
  /** true quando overview/painéis filtram por safraId de ponta a ponta */
  filterComplete: boolean;
};

const PropertyWorkspaceContext = createContext<PropertyWorkspaceContextValue | null>(null);

export function resolveWorkspaceSafra(opts: {
  safras: WorkspaceSafra[];
  urlSafraId: number | null;
}): { safra: WorkspaceSafra | null; invalidUrl: boolean } {
  const { safras, urlSafraId } = opts;
  if (urlSafraId != null) {
    const hit = safras.find((s) => s.id === urlSafraId) ?? null;
    return { safra: hit, invalidUrl: hit == null };
  }
  const def =
    safras.find((s) => s.isDefault) ??
    safras.find((s) => s.status === "ativa") ??
    safras[0] ??
    null;
  return { safra: def, invalidUrl: false };
}

export function resolveWorkspaceMode(opts: {
  safraStatus: SafraStatus | null;
  filterComplete: boolean;
}): "current" | "historical" {
  if (!opts.filterComplete) return "current";
  if (opts.safraStatus === "encerrada" || opts.safraStatus === "arquivada") {
    return "historical";
  }
  return "current";
}

export function PropertyWorkspaceProvider({
  organizationId,
  propriedadeId,
  tab,
  safras,
  urlSafraId,
  filterComplete,
  activeRole,
  onSetTab,
  onSetSafraId,
  children,
}: {
  organizationId: number;
  propriedadeId: number;
  tab: PanelTab;
  safras: WorkspaceSafra[];
  urlSafraId: number | null;
  filterComplete: boolean;
  activeRole: OrgRole | null;
  onSetTab: (tab: PanelTab) => void;
  onSetSafraId: (id: number) => void;
  children: React.ReactNode;
}) {
  const { safra } = resolveWorkspaceSafra({ safras, urlSafraId });
  const safraStatus = safra?.status ?? null;
  const mode = resolveWorkspaceMode({ safraStatus, filterComplete });
  const canWrite =
    Boolean(activeRole && roleHasPermission(activeRole, "property.write")) &&
    mode !== "historical" &&
    safraStatus !== "encerrada" &&
    safraStatus !== "arquivada";

  const value = useMemo<PropertyWorkspaceContextValue>(
    () => ({
      organizationId,
      propriedadeId,
      safraId: safra?.id ?? null,
      safra,
      safraStatus,
      mode,
      canWrite,
      tab,
      setSafraId: onSetSafraId,
      setTab: onSetTab,
      safras,
      filterComplete,
    }),
    [
      organizationId,
      propriedadeId,
      safra,
      safraStatus,
      mode,
      canWrite,
      tab,
      onSetSafraId,
      onSetTab,
      safras,
      filterComplete,
    ],
  );

  return (
    <PropertyWorkspaceContext.Provider value={value}>{children}</PropertyWorkspaceContext.Provider>
  );
}

export function usePropertyWorkspace(): PropertyWorkspaceContextValue {
  const ctx = useContext(PropertyWorkspaceContext);
  if (!ctx) {
    throw new Error("usePropertyWorkspace must be used within PropertyWorkspaceProvider");
  }
  return ctx;
}

/** Sync helpers for URL params (Expo Router setParams). */
export function useWorkspaceUrlSync(opts: {
  setParams: (p: Record<string, string>) => void;
  currentTab: PanelTab;
  currentSafraId: number | null;
}) {
  const setTab = useCallback(
    (next: PanelTab) => {
      const params: Record<string, string> = { tab: next };
      if (opts.currentSafraId != null) params.safraId = String(opts.currentSafraId);
      opts.setParams(params);
    },
    [opts],
  );
  const setSafraId = useCallback(
    (id: number) => {
      opts.setParams({ tab: opts.currentTab, safraId: String(id) });
    },
    [opts],
  );
  return { setTab, setSafraId };
}
