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
