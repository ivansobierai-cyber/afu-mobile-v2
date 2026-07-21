/**
 * Etapa 6 — fluxos do menu "+ Registrar".
 * Etapa 8 — deep links de retorno ao painel (tab + safraId).
 * Abre formulários contextuais com propriedadeId + safraId pré-preenchidos.
 */
import type { PanelTab } from "@/lib/propriedades/property-workspace";

export type RegistrarAction = "tarefa" | "ocorrencia" | "cultivo" | "talhao";

export type MaisSection = "menu" | "monitoramento" | "estoque" | "custos" | "indicadores";

export type RegistrarTarget = {
  /** Aba do painel da propriedade (null = navega para rota externa) */
  tab: PanelTab | null;
  maisSection?: MaisSection;
  /** Rota externa quando o formulário vive fora do painel */
  externalRoute?: "cultivos" | "terrenos";
  /** Sempre true: "+ Registrar" deve abrir o formulário, não só a lista */
  openCreate: true;
};

export type PropertyReturnContext = {
  propriedadeId: number;
  tab?: string | null;
  safraId?: number | null;
};

export function resolveRegistrarTarget(action: RegistrarAction): RegistrarTarget {
  switch (action) {
    case "tarefa":
      return { tab: "operacoes", openCreate: true };
    case "ocorrencia":
      return { tab: "mais", maisSection: "monitoramento", openCreate: true };
    case "cultivo":
      return { tab: "cultivos", openCreate: true };
    case "talhao":
      return { tab: null, externalRoute: "terrenos", openCreate: true };
  }
}

export function buildTerrenosManageHref(opts: {
  propriedadeId: number;
  safraId?: number | null;
  returnTab?: string;
  openCreate?: boolean;
}): string {
  const q = new URLSearchParams();
  q.set("propriedadeId", String(opts.propriedadeId));
  q.set("returnTab", opts.returnTab && opts.returnTab.length ? opts.returnTab : "talhoes");
  if (opts.safraId != null && opts.safraId > 0) q.set("safraId", String(opts.safraId));
  if (opts.openCreate) q.set("openCreate", "1");
  return `/propriedades/terrenos?${q.toString()}`;
}

export function buildCultivosCreateHref(opts: {
  propriedadeId: number;
  safraId?: number | null;
  returnTab?: string;
  openCreate?: boolean;
}): string {
  const q = new URLSearchParams();
  q.set("propriedadeId", String(opts.propriedadeId));
  q.set("returnTab", opts.returnTab && opts.returnTab.length ? opts.returnTab : "cultivos");
  if (opts.safraId != null && opts.safraId > 0) q.set("safraId", String(opts.safraId));
  if (opts.openCreate !== false) q.set("openCreate", "1");
  return `/(tabs)/cultivos?${q.toString()}`;
}

export function buildPropertyReturnHref(opts: PropertyReturnContext): string {
  const q = new URLSearchParams();
  q.set("tab", opts.tab && opts.tab.length ? opts.tab : "visao");
  if (opts.safraId != null && opts.safraId > 0) q.set("safraId", String(opts.safraId));
  return `/propriedades/${opts.propriedadeId}?${q.toString()}`;
}

/** Editar propriedade na lista e voltar ao painel com tab/safra. */
export function buildPropertyEditHref(opts: {
  propriedadeId: number;
  tab?: string | null;
  safraId?: number | null;
}): string {
  const q = new URLSearchParams();
  q.set("editId", String(opts.propriedadeId));
  q.set("returnTo", "propriedade");
  q.set("returnTab", opts.tab && opts.tab.length ? opts.tab : "mais");
  if (opts.safraId != null && opts.safraId > 0) q.set("safraId", String(opts.safraId));
  return `/(tabs)/propriedades?${q.toString()}`;
}

/** Detalhe de cultivo com retorno ao painel. */
export function buildCultivoDetailHref(opts: {
  cultivoId: number;
  propriedadeId: number;
  tab?: string | null;
  safraId?: number | null;
}): string {
  const q = new URLSearchParams();
  q.set("propriedadeId", String(opts.propriedadeId));
  q.set("returnTab", opts.tab && opts.tab.length ? opts.tab : "cultivos");
  if (opts.safraId != null && opts.safraId > 0) q.set("safraId", String(opts.safraId));
  return `/cultivos/${opts.cultivoId}?${q.toString()}`;
}

export function parsePropertyReturnParams(params: {
  propriedadeId?: string | string[];
  returnTab?: string | string[];
  safraId?: string | string[];
  returnTo?: string | string[];
}): PropertyReturnContext | null {
  const rawId = Array.isArray(params.propriedadeId)
    ? params.propriedadeId[0]
    : params.propriedadeId;
  const id = rawId ? parseInt(rawId, 10) : NaN;
  if (!Number.isFinite(id) || id <= 0) return null;

  const rawTab = Array.isArray(params.returnTab) ? params.returnTab[0] : params.returnTab;
  const rawSafra = Array.isArray(params.safraId) ? params.safraId[0] : params.safraId;
  const safraParsed = rawSafra ? parseInt(rawSafra, 10) : NaN;

  return {
    propriedadeId: id,
    tab: rawTab && rawTab.length ? rawTab : "visao",
    safraId: Number.isFinite(safraParsed) && safraParsed > 0 ? safraParsed : null,
  };
}

/**
 * Etapa 9 — resolve status de UI para queries do painel.
 * Prioridade: offline > loading > error > empty > ready.
 */
export type PanelQueryUiStatus = "loading" | "error" | "empty" | "offline" | "ready";

export function resolvePanelQueryUiStatus(opts: {
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  isOnline?: boolean;
}): PanelQueryUiStatus {
  if (opts.isOnline === false && !opts.isLoading) return "offline";
  if (opts.isLoading) return "loading";
  if (opts.isError) return "error";
  if (opts.isEmpty) return "empty";
  return "ready";
}
