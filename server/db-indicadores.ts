/**
 * Etapa 8 Passo 5 — agrega dados e calcula indicadores.
 */
import { getDb } from "./db";
import { listCustos, listFinanceiroLancamentos } from "./db-propriedade-expansao";
import { calcularIndicadores } from "../lib/propriedades/indicadores-financeiros";
import { propriedades, terrenos } from "../drizzle/schema";
import { and, eq } from "drizzle-orm";

export async function getIndicadoresFinanceiros(opts: {
  propriedadeId: number;
  organizationId: number;
  safraId?: number;
}) {
  const db = await getDb();
  const [custosAll, lancamentos] = await Promise.all([
    listCustos(opts.propriedadeId),
    listFinanceiroLancamentos(opts.propriedadeId, opts.organizationId, opts.safraId),
  ]);

  let custos = custosAll.filter(
    (c) => c.organizationId == null || c.organizationId === opts.organizationId,
  );
  if (opts.safraId != null) {
    custos = custos.filter((c) => c.safraId === opts.safraId);
  }

  let areaHa = 0;
  if (db) {
    const prop = await db
      .select()
      .from(propriedades)
      .where(
        and(
          eq(propriedades.id, opts.propriedadeId),
          eq(propriedades.organizationId, opts.organizationId),
        ),
      )
      .limit(1);
    const areaProp = Number(prop[0]?.areaGeometricaHa ?? prop[0]?.tamanhoArea ?? 0);
    if (areaProp > 0) {
      areaHa = areaProp;
    } else {
      const tals = await db
        .select()
        .from(terrenos)
        .where(
          and(
            eq(terrenos.propriedadeId, opts.propriedadeId),
            eq(terrenos.organizationId, opts.organizationId),
          ),
        );
      areaHa = tals.reduce(
        (acc, t) => acc + Number(t.areaGeometricaHa ?? t.area ?? 0),
        0,
      );
    }
  }

  const indicadores = calcularIndicadores({
    areaHa,
    custos: custos.map((c) => ({
      valor: c.valor,
      safraId: c.safraId,
      culturaId: c.culturaId,
      tarefaId: c.tarefaId,
      terrenoId: c.terrenoId,
    })),
    lancamentos: lancamentos.map((l) => ({
      tipo: l.tipo,
      valor: l.valor,
    })),
    produtividade: null,
  });

  return {
    ...indicadores,
    scope: {
      organizationId: opts.organizationId,
      propriedadeId: opts.propriedadeId,
      safraId: opts.safraId ?? null,
    },
  };
}

/** Etapa 8 Passo 6 — dashboard: planejado × executado + resultado */
export async function getDashboardFinanceiro(opts: {
  propriedadeId: number;
  organizationId: number;
  safraId?: number;
}) {
  const { listOrcamentos } = await import("./db-propriedade-expansao");
  const [indicadores, orcamentosAll] = await Promise.all([
    getIndicadoresFinanceiros(opts),
    listOrcamentos(opts.propriedadeId),
  ]);

  let orcamentos = orcamentosAll.filter(
    (o) => o.organizationId == null || o.organizationId === opts.organizationId,
  );
  if (opts.safraId != null) {
    orcamentos = orcamentos.filter((o) => o.safraId === opts.safraId);
  }

  const planejado = orcamentos.reduce((a, o) => a + Number(o.orcamentoPrevisto), 0);
  const executadoOrcamento = orcamentos.reduce((a, o) => a + Number(o.custoRealizado), 0);
  const executado = Math.max(executadoOrcamento, indicadores.custosOperacionais);

  const series = [
    { label: "Planejado", valor: Math.round(planejado * 100) / 100 },
    { label: "Executado", valor: Math.round(executado * 100) / 100 },
    { label: "Receita", valor: indicadores.receita },
    { label: "Despesas", valor: indicadores.despesas },
    { label: "Custos", valor: indicadores.custosOperacionais },
    { label: "Resultado", valor: indicadores.lucro },
  ];

  return {
    planejado: Math.round(planejado * 100) / 100,
    executado: Math.round(executado * 100) / 100,
    receita: indicadores.receita,
    despesas: indicadores.despesas,
    custos: indicadores.custosOperacionais,
    resultado: indicadores.lucro,
    margemPct: indicadores.margemPct,
    roiPct: indicadores.roiPct,
    custoPorHectare: indicadores.custoPorHectare,
    series,
    orcamentos: orcamentos.map((o) => ({
      id: o.id,
      nomeSafra: o.nomeSafra,
      previsto: Number(o.orcamentoPrevisto),
      realizado: Number(o.custoRealizado),
    })),
    scope: indicadores.scope,
  };
}
