/**
 * Monta payload JSON para analise.gerarPDF tipo resultado_cultivo.
 */
export type IndicadoresCultivoLike = {
  areaHa?: number | null;
  custosOperacionais?: number | null;
  custoPorHectare?: number | null;
  receita?: number | null;
  despesas?: number | null;
  lucro?: number | null;
  margemPct?: number | null;
  roiPct?: number | null;
  produtividade?: number | null;
  produtividadeFonte?: string | null;
  producaoUsada?: number | null;
};

export type DashboardCultivoLike = {
  cultivo?: {
    nomeCultura?: string | null;
    variedade?: string | null;
    status?: string | null;
    faseAtual?: string | null;
    areaPlantadaHa?: number | null;
    producaoEstimada?: number | null;
    producaoReal?: number | null;
    unidadeProducao?: string | null;
  };
  saudePercent?: number | null;
  saudeMotivo?: string | null;
  diasAposPlantio?: number | null;
};

function money(n: number | null | undefined) {
  if (n == null || !Number.isFinite(Number(n))) return "—";
  return `R$ ${Number(n).toFixed(2)}`;
}

export function buildResultadoCultivoConteudo(opts: {
  indicadores: IndicadoresCultivoLike;
  dashboard?: DashboardCultivoLike | null;
}) {
  const ind = opts.indicadores;
  const cult = opts.dashboard?.cultivo;
  const fonte =
    ind.produtividadeFonte === "real"
      ? "colheita real"
      : ind.produtividadeFonte === "estimada"
        ? "estimada"
        : null;

  const indicadores = [
    { label: "Área (ha)", value: ind.areaHa != null ? String(ind.areaHa) : "—" },
    { label: "Custos operacionais", value: money(ind.custosOperacionais) },
    {
      label: "Custo / ha",
      value: ind.custoPorHectare != null ? money(ind.custoPorHectare) : "—",
    },
    { label: "Receita", value: money(ind.receita) },
    { label: "Despesas", value: money(ind.despesas) },
    { label: "Lucro", value: money(ind.lucro) },
    {
      label: "Margem",
      value: ind.margemPct != null ? `${Number(ind.margemPct).toFixed(1)}%` : "—",
    },
    {
      label: "ROI",
      value: ind.roiPct != null ? `${Number(ind.roiPct).toFixed(1)}%` : "—",
    },
    {
      label: "Produtividade",
      value:
        ind.produtividade != null
          ? `${ind.produtividade}/ha${fonte ? ` (${fonte})` : ""}`
          : "—",
    },
  ];

  if (ind.producaoUsada != null) {
    indicadores.push({
      label: "Produção usada",
      value: String(ind.producaoUsada),
    });
  }

  const alertas: string[] = [];
  if (opts.dashboard?.saudePercent != null && opts.dashboard.saudePercent < 60) {
    alertas.push(
      `Saúde do cultivo em ${opts.dashboard.saudePercent}%${
        opts.dashboard.saudeMotivo ? ` — ${opts.dashboard.saudeMotivo}` : ""
      }`,
    );
  }

  const interpretacao = [
    cult?.nomeCultura ? `Cultivo: ${cult.nomeCultura}` : null,
    cult?.variedade ? `Variedade: ${cult.variedade}` : null,
    cult?.faseAtual ? `Fase: ${cult.faseAtual}` : null,
    cult?.status ? `Status: ${cult.status}` : null,
    opts.dashboard?.diasAposPlantio != null
      ? `Dias após plantio: ${opts.dashboard.diasAposPlantio}`
      : null,
    cult?.producaoReal != null
      ? `Produção real: ${cult.producaoReal} ${cult.unidadeProducao ?? ""}`.trim()
      : cult?.producaoEstimada != null
        ? `Produção estimada: ${cult.producaoEstimada} ${cult.unidadeProducao ?? ""}`.trim()
        : null,
  ]
    .filter(Boolean)
    .join(". ");

  return {
    interpretacao: interpretacao || "Resultado operacional do cultivo.",
    indicadores,
    alertas,
    recomendacoes: [
      "Validar produtividade com pesagem de colheita quando disponível.",
      "Confrontar custo/ha com orçamento da safra.",
    ],
  };
}
