/**
 * Cultivos V2 Etapa 9 — indicadores financeiros escopados ao cultivo.
 */
import { listCustos, listFinanceiroLancamentos } from "./db-propriedade-expansao";
import { calcularIndicadores } from "../lib/propriedades/indicadores-financeiros";
import { calcularProdutividadeCultivo } from "../lib/propriedades/produtividade";
import type { Cultura } from "../drizzle/schema";

export async function buildCultivoIndicadores(opts: {
  organizationId: number;
  cultura: Cultura;
}) {
  const { cultura, organizationId } = opts;
  const [custosAll, lancamentosAll] = await Promise.all([
    listCustos(cultura.propriedadeId),
    listFinanceiroLancamentos(
      cultura.propriedadeId,
      organizationId,
      cultura.safraId ?? undefined,
    ),
  ]);

  const custos = custosAll.filter(
    (c) =>
      (c.organizationId == null || c.organizationId === organizationId) &&
      c.culturaId === cultura.id,
  );
  const lancamentos = lancamentosAll.filter((l) => l.culturaId === cultura.id);

  const prod = calcularProdutividadeCultivo({
    areaPlantada: cultura.areaPlantada,
    producaoEstimada: cultura.producaoEstimada,
    producaoReal: cultura.producaoReal,
  });

  const indicadores = calcularIndicadores({
    areaHa: prod.areaHa,
    custos: custos.map((c) => ({
      valor: c.valor,
      safraId: c.safraId,
      culturaId: c.culturaId,
      tarefaId: c.tarefaId,
      terrenoId: c.terrenoId,
    })),
    lancamentos: lancamentos.map((l) => ({
      tipo: l.tipo as "despesa" | "receita" | "custo" | "investimento",
      valor: l.valor,
    })),
    produtividade: prod.produtividade,
  });

  return {
    ...indicadores,
    produtividadeFonte: prod.fonte,
    producaoUsada: prod.producaoUsada,
    scope: {
      organizationId,
      propriedadeId: cultura.propriedadeId,
      culturaId: cultura.id,
      safraId: cultura.safraId ?? null,
    },
    custosCount: custos.length,
    lancamentosCount: lancamentos.length,
  };
}
