/**
 * Produtividade (kg/ha ou unidade/ha) a partir de produção e área.
 * Prefere produção real (colheita); estimada só como fallback explícito.
 */

export type ProducaoCulturaLike = {
  areaPlantada?: string | number | null;
  producaoEstimada?: string | number | null;
  producaoReal?: string | number | null;
};

export type ProdutividadeResult = {
  /** Produção total / área (arredondado 2 casas); null se sem dados */
  produtividade: number | null;
  /** Origem do número usado no cálculo */
  fonte: "real" | "estimada" | null;
  producaoUsada: number | null;
  areaHa: number;
};

function num(v: string | number | null | undefined): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function calcularProdutividadeCultivo(c: ProducaoCulturaLike): ProdutividadeResult {
  const areaHa = num(c.areaPlantada);
  const area = areaHa != null && areaHa > 0 ? areaHa : 0;
  const real = num(c.producaoReal);
  const estimada = num(c.producaoEstimada);

  if (real != null && real >= 0) {
    const produtividade =
      area > 0 ? Math.round((real / area) * 100) / 100 : Math.round(real * 100) / 100;
    return { produtividade, fonte: "real", producaoUsada: real, areaHa: area };
  }
  if (estimada != null && estimada >= 0) {
    const produtividade =
      area > 0 ? Math.round((estimada / area) * 100) / 100 : Math.round(estimada * 100) / 100;
    return { produtividade, fonte: "estimada", producaoUsada: estimada, areaHa: area };
  }
  return { produtividade: null, fonte: null, producaoUsada: null, areaHa: area };
}

/**
 * Agrega produtividade da propriedade/safra só com colheita real.
 * Cultivos sem `producaoReal` não entram (evita misturar estimado no nível fazenda).
 */
export function calcularProdutividadeAgregada(culturas: ProducaoCulturaLike[]): ProdutividadeResult {
  let prodTotal = 0;
  let areaTotal = 0;
  let comReal = 0;
  for (const c of culturas) {
    const real = num(c.producaoReal);
    const area = num(c.areaPlantada);
    if (real == null || real < 0) continue;
    if (area == null || area <= 0) continue;
    prodTotal += real;
    areaTotal += area;
    comReal += 1;
  }
  if (comReal === 0 || areaTotal <= 0) {
    return { produtividade: null, fonte: null, producaoUsada: null, areaHa: 0 };
  }
  return {
    produtividade: Math.round((prodTotal / areaTotal) * 100) / 100,
    fonte: "real",
    producaoUsada: Math.round(prodTotal * 100) / 100,
    areaHa: Math.round(areaTotal * 100) / 100,
  };
}
