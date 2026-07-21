/**
 * Etapa 6 — fluxos do menu "+ Registrar".
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

export function buildPropertyReturnHref(opts: {
  propriedadeId: number;
  tab?: string;
  safraId?: number | null;
}): string {
  const q = new URLSearchParams();
  q.set("tab", opts.tab && opts.tab.length ? opts.tab : "visao");
  if (opts.safraId != null && opts.safraId > 0) q.set("safraId", String(opts.safraId));
  return `/propriedades/${opts.propriedadeId}?${q.toString()}`;
}
