/**
 * Etapas 42–44 — Geointeligência, IoT e Marketplace (fundação + stats)
 */
import { desc, eq, isNotNull, and } from "drizzle-orm";
import { getDb } from "./db";
import {
  camadasGeo,
  sensores,
  leiturasSensores,
  propriedades,
  terrenos,
  produtosMarketplace,
  pedidos,
} from "../drizzle/schema";

export async function listarCamadasGeo() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(camadasGeo).orderBy(camadasGeo.tipo);
}

export async function statsGeo() {
  const db = await getDb();
  if (!db) {
    return {
      totalCamadas: 0,
      camadasAtivas: 0,
      propriedadesComGps: 0,
      totalPropriedades: 0,
      totalTerrenos: 0,
      areaHaTotal: 0,
      coberturaKm2: 0,
    };
  }

  const [camadas, props, terr] = await Promise.all([
    db.select().from(camadasGeo),
    db.select().from(propriedades),
    db.select().from(terrenos),
  ]);

  const comGps = props.filter((p) => p.latitude != null && p.longitude != null);
  const areaHaTotal = props.reduce((acc, p) => {
    const n = Number(p.tamanhoArea ?? 0);
    return acc + (Number.isFinite(n) ? n : 0);
  }, 0);
  const coberturaKm2 = camadas.reduce((acc, c) => {
    const n = Number(c.coberturaKm2 ?? 0);
    return acc + (Number.isFinite(n) ? n : 0);
  }, 0);

  return {
    totalCamadas: camadas.length,
    camadasAtivas: camadas.filter((c) => c.ativo !== false).length,
    propriedadesComGps: comGps.length,
    totalPropriedades: props.length,
    totalTerrenos: terr.length,
    areaHaTotal: Math.round(areaHaTotal * 100) / 100,
    coberturaKm2: Math.round(coberturaKm2 * 100) / 100,
  };
}

export async function listarSensoresDemo(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sensores).orderBy(desc(sensores.createdAt)).limit(limit);
}

export async function listarLeiturasRecentes(limit = 30) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: leiturasSensores.id,
      sensorId: leiturasSensores.sensorId,
      valor: leiturasSensores.valor,
      unidade: leiturasSensores.unidade,
      dataLeitura: leiturasSensores.dataLeitura,
      alertaGerado: leiturasSensores.alertaGerado,
      alertaMensagem: leiturasSensores.alertaMensagem,
      tipoSensor: sensores.tipoSensor,
      codigoSensor: sensores.codigoSensor,
      localInstalacao: sensores.localInstalacao,
    })
    .from(leiturasSensores)
    .leftJoin(sensores, eq(leiturasSensores.sensorId, sensores.id))
    .orderBy(desc(leiturasSensores.dataLeitura))
    .limit(limit);
  return rows;
}

export async function statsIot() {
  const db = await getDb();
  if (!db) {
    return {
      totalSensores: 0,
      sensoresAtivos: 0,
      sensoresFalha: 0,
      totalLeituras: 0,
      alertas: 0,
      porTipo: {} as Record<string, number>,
    };
  }

  const [sens, leituras] = await Promise.all([
    db.select().from(sensores),
    db.select().from(leiturasSensores),
  ]);

  const porTipo: Record<string, number> = {};
  for (const s of sens) {
    porTipo[s.tipoSensor] = (porTipo[s.tipoSensor] ?? 0) + 1;
  }

  return {
    totalSensores: sens.length,
    sensoresAtivos: sens.filter((s) => s.status === "ativo").length,
    sensoresFalha: sens.filter((s) => s.status === "falha" || s.status === "manutencao").length,
    totalLeituras: leituras.length,
    alertas: leituras.filter((l) => l.alertaGerado).length,
    porTipo,
  };
}

export async function listarCatalogoMarketplacePublico(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(produtosMarketplace)
    .where(eq(produtosMarketplace.status, "disponivel"))
    .orderBy(desc(produtosMarketplace.createdAt))
    .limit(limit);
}

export async function statsMarketplace() {
  const db = await getDb();
  if (!db) {
    return {
      totalProdutos: 0,
      disponiveis: 0,
      totalPedidos: 0,
      pedidosAbertos: 0,
      categorias: {} as Record<string, number>,
      valorCatalogoEstimado: 0,
    };
  }

  const [produtos, ped] = await Promise.all([
    db.select().from(produtosMarketplace),
    db.select().from(pedidos),
  ]);

  const categorias: Record<string, number> = {};
  let valorCatalogoEstimado = 0;
  for (const p of produtos) {
    categorias[p.categoria] = (categorias[p.categoria] ?? 0) + 1;
    if (p.status === "disponivel") {
      const preco = Number(p.preco ?? 0);
      const estoque = Number(p.estoque ?? 0);
      if (Number.isFinite(preco) && Number.isFinite(estoque)) {
        valorCatalogoEstimado += preco * Math.min(estoque, 100);
      }
    }
  }

  return {
    totalProdutos: produtos.length,
    disponiveis: produtos.filter((p) => p.status === "disponivel").length,
    totalPedidos: ped.length,
    pedidosAbertos: ped.filter((p) =>
      ["aguardando", "confirmado", "em_preparo", "enviado"].includes(p.statusPedido ?? ""),
    ).length,
    categorias,
    valorCatalogoEstimado: Math.round(valorCatalogoEstimado * 100) / 100,
  };
}

export async function countGeoIotMarketStats() {
  const [geo, iot, market] = await Promise.all([statsGeo(), statsIot(), statsMarketplace()]);
  return {
    totalCamadasGeo: geo.totalCamadas,
    propriedadesComGps: geo.propriedadesComGps,
    areaHaMonitorada: geo.areaHaTotal,
    totalSensores: iot.totalSensores,
    sensoresAtivos: iot.sensoresAtivos,
    totalLeiturasSensores: iot.totalLeituras,
    alertasIot: iot.alertas,
    totalProdutosMarketplace: market.totalProdutos,
    produtosDisponiveis: market.disponiveis,
    totalPedidosMarketplace: market.totalPedidos,
  };
}

/** Helper used by seeds / health checks — props with GPS */
export async function listPropriedadesComGps() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(propriedades)
    .where(and(isNotNull(propriedades.latitude), isNotNull(propriedades.longitude)));
}
