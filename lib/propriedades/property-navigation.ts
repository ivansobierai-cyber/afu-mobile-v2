/**
 * FASE 2N — navegação canônica do painel da propriedade (Plano Mestre Etapa 2).
 * Preserva deep links legados (tab=talhoes|cultivos|mais) e normaliza para módulos.
 */
import type { PanelTab } from "./property-workspace";

/** Módulos de conteúdo (desktop: todos de 1º nível; mobile: parte fica sob "Mais"). */
export const PROPERTY_MODULE_TABS = [
  "visao",
  "mapa",
  "talhoes",
  "cultivos",
  "operacoes",
  "tarefas",
  "monitoramento",
  "custos",
  "recursos",
  "documentos",
  "configuracoes",
] as const satisfies readonly PanelTab[];

export type PropertyModuleTab = (typeof PROPERTY_MODULE_TABS)[number];

/** Abas primárias no mobile (máx. 5). */
export const MOBILE_PRIMARY_TABS = [
  "visao",
  "mapa",
  "operacoes",
  "tarefas",
  "mais",
] as const;

export type MobilePrimaryTab = (typeof MOBILE_PRIMARY_TABS)[number];

/** Módulos acessados pelo hub "Mais" no mobile. */
export const MOBILE_MORE_MODULES: PropertyModuleTab[] = [
  "talhoes",
  "cultivos",
  "monitoramento",
  "custos",
  "recursos",
  "documentos",
  "configuracoes",
];

const LEGACY_TAB_ALIASES: Record<string, PanelTab> = {
  mais: "mais",
};

const MODULE_SET = new Set<string>(PROPERTY_MODULE_TABS);

export function isPropertyModuleTab(value: string): value is PropertyModuleTab {
  return MODULE_SET.has(value);
}

/**
 * Normaliza `tab` da URL (inclui legado tab=mais com section implícita).
 */
export function normalizePropertyTabParam(
  tabParam: string | undefined,
  sectionParam?: string | undefined,
): PanelTab {
  const raw = (tabParam ?? "").trim();
  if (raw === "mais") {
    const sec = (sectionParam ?? "").trim();
    if (sec && isPropertyModuleTab(sec)) return sec;
    return "mais";
  }
  if (raw && isPropertyModuleTab(raw)) return raw;
  if (raw && LEGACY_TAB_ALIASES[raw]) return LEGACY_TAB_ALIASES[raw]!;
  if (raw === "talhoes" || raw === "cultivos") return raw;
  return "visao";
}

/** Qual item da barra inferior mobile deve aparecer selecionado. */
export function resolveMobilePrimaryHighlight(tab: PanelTab): MobilePrimaryTab {
  if (tab === "visao" || tab === "mapa" || tab === "operacoes" || tab === "tarefas") {
    return tab;
  }
  if (tab === "mais" || MOBILE_MORE_MODULES.includes(tab as PropertyModuleTab)) {
    return "mais";
  }
  return "visao";
}

export function moduleLabel(tab: PanelTab): string {
  switch (tab) {
    case "visao":
      return "Visão geral";
    case "mapa":
      return "Mapa";
    case "talhoes":
      return "Talhões";
    case "cultivos":
      return "Cultivos e safras";
    case "operacoes":
      return "Operações";
    case "tarefas":
      return "Tarefas";
    case "monitoramento":
      return "Monitoramento";
    case "custos":
      return "Custos e resultados";
    case "recursos":
      return "Recursos";
    case "documentos":
      return "Documentos";
    case "configuracoes":
      return "Configurações";
    case "mais":
      return "Mais";
    default: {
      const _exhaustive: never = tab;
      return _exhaustive;
    }
  }
}

export type NavItem = {
  id: PanelTab;
  label: string;
  icon: string;
  mobilePrimary?: MobilePrimaryTab;
};

export const DESKTOP_NAV_ITEMS: NavItem[] = [
  { id: "visao", label: "Visão geral", icon: "house.fill" },
  { id: "mapa", label: "Mapa", icon: "map.fill" },
  { id: "talhoes", label: "Talhões", icon: "square.grid.2x2.fill" },
  { id: "cultivos", label: "Cultivos e safras", icon: "leaf.fill" },
  { id: "operacoes", label: "Operações", icon: "checkmark.circle.fill" },
  { id: "tarefas", label: "Tarefas", icon: "list.bullet.clipboard.fill" },
  { id: "monitoramento", label: "Monitoramento", icon: "eye.fill" },
  { id: "custos", label: "Custos e resultados", icon: "chart.bar.fill" },
  { id: "recursos", label: "Recursos", icon: "tray.full.fill" },
  { id: "documentos", label: "Documentos", icon: "doc.fill" },
  { id: "configuracoes", label: "Configurações", icon: "gearshape.fill" },
];

export const MOBILE_BOTTOM_NAV: NavItem[] = [
  { id: "visao", label: "Visão", icon: "house.fill", mobilePrimary: "visao" },
  { id: "mapa", label: "Mapa", icon: "map.fill", mobilePrimary: "mapa" },
  { id: "operacoes", label: "Operações", icon: "checkmark.circle.fill", mobilePrimary: "operacoes" },
  { id: "tarefas", label: "Tarefas", icon: "list.bullet.clipboard.fill", mobilePrimary: "tarefas" },
  { id: "mais", label: "Mais", icon: "ellipsis", mobilePrimary: "mais" },
];

export const MOBILE_MORE_MENU_ITEMS: Array<{
  id: PropertyModuleTab;
  title: string;
  subtitle: string;
  icon: string;
}> = [
  {
    id: "talhoes",
    title: "Talhões",
    subtitle: "Áreas e geometrias da propriedade",
    icon: "square.grid.2x2.fill",
  },
  {
    id: "cultivos",
    title: "Cultivos e safras",
    subtitle: "Cultivos vinculados à safra selecionada",
    icon: "leaf.fill",
  },
  {
    id: "monitoramento",
    title: "Monitoramento",
    subtitle: "Ocorrências → diagnóstico → tarefa",
    icon: "eye.fill",
  },
  {
    id: "custos",
    title: "Custos e resultados",
    subtitle: "Orçamento da safra e lançamentos",
    icon: "chart.bar.fill",
  },
  {
    id: "recursos",
    title: "Recursos e estoque",
    subtitle: "Máquinas, equipamentos e insumos",
    icon: "tray.full.fill",
  },
  {
    id: "documentos",
    title: "Documentos",
    subtitle: "Relatórios e laudos da organização",
    icon: "doc.fill",
  },
  {
    id: "configuracoes",
    title: "Configurações",
    subtitle: "Cadastro e administração da propriedade",
    icon: "gearshape.fill",
  },
];

/** Params de URL ao selecionar um módulo (preserva safraId externamente). */
export function buildPropertyTabParams(tab: PanelTab): Record<string, string> {
  if (tab === "mais") return { tab: "mais" };
  return { tab };
}

export function safraContextLabel(opts: {
  safraNome: string;
  isHistorical: boolean;
}): string {
  const tag = opts.isHistorical ? "Histórica" : "Atual";
  return `Safra: ${opts.safraNome} · ${tag}`;
}
