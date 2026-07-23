/**
 * Cultivos V2 — contexto de workspace (abas) do detalhe do cultivo.
 * Espelha o padrão de property-workspace sem acoplar ao painel de propriedade.
 */

export type CultivoWorkspaceTab =
  | "visao"
  | "operacoes"
  | "monitoramento"
  | "diagnosticos"
  | "ia"
  | "custos"
  | "historico"
  | "arquivos";

export const CULTIVO_WORKSPACE_TABS: {
  id: CultivoWorkspaceTab;
  label: string;
  icon: string;
}[] = [
  { id: "visao", label: "Visão Geral", icon: "leaf.fill" },
  { id: "operacoes", label: "Operações", icon: "wrench.fill" },
  { id: "monitoramento", label: "Monitoramento", icon: "eye.fill" },
  { id: "diagnosticos", label: "Diagnósticos", icon: "cross.case.fill" },
  { id: "ia", label: "IA", icon: "sparkles" },
  { id: "custos", label: "Custos", icon: "dollarsign.circle.fill" },
  { id: "historico", label: "Histórico", icon: "clock.fill" },
  { id: "arquivos", label: "Arquivos", icon: "doc.fill" },
];

export const CULTIVO_FASES = [
  "planejamento",
  "plantio",
  "germinacao",
  "muda",
  "crescimento_vegetativo",
  "floracao",
  "frutificacao",
  "maturacao",
  "colheita",
] as const;

export type CultivoFase = (typeof CULTIVO_FASES)[number];

export const CULTIVO_STATUS_COLORS: Record<string, string> = {
  em_andamento: "#38A169",
  planejado: "#D97706",
  colhido: "#6B7C6E",
  perdido: "#E53E3E",
};

export const CULTIVO_STATUS_LABELS: Record<string, string> = {
  em_andamento: "Em andamento",
  planejado: "Planejado",
  colhido: "Colhido",
  perdido: "Perdido",
};

export function resolveCultivoTab(
  tabParam: string | undefined | null,
): CultivoWorkspaceTab {
  if (tabParam && CULTIVO_WORKSPACE_TABS.some((t) => t.id === tabParam)) {
    return tabParam as CultivoWorkspaceTab;
  }
  return "visao";
}

export function nextCultivoFase(faseAtual: string | null | undefined): string {
  const atual = faseAtual ?? "plantio";
  const idx = CULTIVO_FASES.indexOf(atual as CultivoFase);
  if (idx < 0) return CULTIVO_FASES[0];
  if (idx >= CULTIVO_FASES.length - 1) return atual;
  return CULTIVO_FASES[idx + 1];
}

export function cultivoFaseProgress(faseAtual: string | null | undefined): {
  index: number;
  progress: number;
  label: string;
} {
  const label = faseAtual ?? "plantio";
  const index = CULTIVO_FASES.indexOf(label as CultivoFase);
  const safeIdx = index >= 0 ? index : 0;
  return {
    index: safeIdx,
    progress: (safeIdx + 1) / CULTIVO_FASES.length,
    label,
  };
}
