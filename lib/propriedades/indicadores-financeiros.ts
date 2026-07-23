/**
 * Etapa 8 Passo 5 — indicadores financeiros/operacionais (cálculo puro).
 * Evita dupla contagem: custos de `custos_operacao` + despesas/receitas/investimentos
 * de lançamentos; ignora lançamentos tipo `custo` no P&L se já houver custos_operacao.
 */

export type CustoLike = {
  valor: string | number;
  safraId?: number | null;
  culturaId?: number | null;
  tarefaId?: number | null;
  terrenoId?: number | null;
};

export type LancamentoLike = {
  tipo: "despesa" | "receita" | "custo" | "investimento";
  valor: string | number;
};

export type IndicadoresInput = {
  areaHa: number;
  custos: CustoLike[];
  lancamentos: LancamentoLike[];
  /** kg/ha ou sc/ha — informado quando disponível */
  produtividade?: number | null;
};

function money(n: number) {
  return Math.round(n * 100) / 100;
}

function sumBy<T>(rows: T[], keyFn: (r: T) => string | number | null | undefined, valFn: (r: T) => number) {
  const map = new Map<string, number>();
  for (const r of rows) {
    const k = keyFn(r);
    if (k == null) continue;
    const key = String(k);
    map.set(key, (map.get(key) ?? 0) + valFn(r));
  }
  return [...map.entries()].map(([id, total]) => ({ id, total: money(total) }));
}

export function calcularIndicadores(input: IndicadoresInput) {
  const areaHa = Number.isFinite(input.areaHa) && input.areaHa > 0 ? input.areaHa : 0;
  const custosTotais = input.custos.reduce((a, c) => a + Number(c.valor), 0);

  let receita = 0;
  let despesas = 0;
  let investimentos = 0;
  let custosLancados = 0;
  for (const l of input.lancamentos) {
    const v = Number(l.valor);
    if (l.tipo === "receita") receita += v;
    else if (l.tipo === "despesa") despesas += v;
    else if (l.tipo === "investimento") investimentos += v;
    else if (l.tipo === "custo") custosLancados += v;
  }

  // Sem custos_operacao, usa lançamentos tipo custo; senão evita dupla contagem
  const custosOperacionais =
    custosTotais > 0 ? custosTotais : custosLancados;
  const lucro = receita - despesas - custosOperacionais;
  const baseRoi = custosOperacionais + despesas + investimentos;
  const margem = receita > 0 ? (lucro / receita) * 100 : 0;
  const roi = baseRoi > 0 ? (lucro / baseRoi) * 100 : 0;
  const custoPorHectare = areaHa > 0 ? custosOperacionais / areaHa : null;
  const produtividade = input.produtividade ?? null;

  return {
    areaHa: money(areaHa),
    custoPorHectare: custoPorHectare == null ? null : money(custoPorHectare),
    custoPorSafra: sumBy(input.custos, (c) => c.safraId, (c) => Number(c.valor)),
    custoPorCultura: sumBy(input.custos, (c) => c.culturaId, (c) => Number(c.valor)),
    custoPorOperacao: sumBy(input.custos, (c) => c.tarefaId, (c) => Number(c.valor)),
    produtividade,
    receita: money(receita),
    despesas: money(despesas),
    custosOperacionais: money(custosOperacionais),
    investimentos: money(investimentos),
    lucro: money(lucro),
    margemPct: money(margem),
    roiPct: money(roi),
  };
}

export type IndicadoresResult = ReturnType<typeof calcularIndicadores>;
