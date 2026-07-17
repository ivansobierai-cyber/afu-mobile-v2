/**
 * Etapas 45–46 — NOC Agrícola + Arquitetura Final
 */
import { desc, eq, asc } from "drizzle-orm";
import { getDb } from "./db";
import {
  nocAlertas,
  arquiteturaComponentes,
  users,
  propriedades,
  produtores,
  culturas,
  ticketsSuporte,
} from "../drizzle/schema";
import { countBancoAgronomicoStats, countExpansaoStats } from "./db-banco-agronomico";
import { countGeoIotMarketStats } from "./db-geo-iot";

export async function listarNocAlertas(status?: "aberto" | "reconhecido" | "resolvido") {
  const db = await getDb();
  if (!db) return [];
  if (status) {
    return db
      .select()
      .from(nocAlertas)
      .where(eq(nocAlertas.status, status))
      .orderBy(desc(nocAlertas.createdAt));
  }
  return db.select().from(nocAlertas).orderBy(desc(nocAlertas.createdAt));
}

export async function listarArquiteturaComponentes(camada?: string) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(arquiteturaComponentes).orderBy(asc(arquiteturaComponentes.ordem));
  if (camada) return rows.filter((r) => r.camada === camada);
  return rows;
}

export async function statsNoc() {
  const db = await getDb();
  if (!db) {
    return {
      totalAlertas: 0,
      abertos: 0,
      criticos: 0,
      reconhecidos: 0,
      resolvidos: 0,
      porModulo: {} as Record<string, number>,
      porSeveridade: {} as Record<string, number>,
    };
  }
  const rows = await db.select().from(nocAlertas);
  const porModulo: Record<string, number> = {};
  const porSeveridade: Record<string, number> = {};
  for (const a of rows) {
    porModulo[a.modulo] = (porModulo[a.modulo] ?? 0) + 1;
    porSeveridade[a.severidade] = (porSeveridade[a.severidade] ?? 0) + 1;
  }
  return {
    totalAlertas: rows.length,
    abertos: rows.filter((a) => a.status === "aberto").length,
    criticos: rows.filter((a) => a.severidade === "critica" && a.status !== "resolvido").length,
    reconhecidos: rows.filter((a) => a.status === "reconhecido").length,
    resolvidos: rows.filter((a) => a.status === "resolvido").length,
    porModulo,
    porSeveridade,
  };
}

export async function statsArquitetura() {
  const db = await getDb();
  if (!db) {
    return {
      totalComponentes: 0,
      operacionais: 0,
      parciais: 0,
      planejados: 0,
      porCamada: {} as Record<string, number>,
    };
  }
  const rows = await db.select().from(arquiteturaComponentes);
  const porCamada: Record<string, number> = {};
  for (const c of rows) {
    porCamada[c.camada] = (porCamada[c.camada] ?? 0) + 1;
  }
  return {
    totalComponentes: rows.length,
    operacionais: rows.filter((c) => c.status === "operacional").length,
    parciais: rows.filter((c) => c.status === "parcial").length,
    planejados: rows.filter((c) => c.status === "planejado").length,
    porCamada,
  };
}

/** Painel operacional — agrega ecossistema + alertas NOC */
export async function painelNoc() {
  const db = await getDb();
  const [core, expansao, geoIot, alertas] = await Promise.all([
    countBancoAgronomicoStats(),
    countExpansaoStats(),
    countGeoIotMarketStats(),
    statsNoc(),
  ]);

  let totalUsers = 0;
  let totalProdutores = 0;
  let totalPropriedades = 0;
  let totalCulturasCampo = 0;
  let totalDiagnosticos = expansao.totalDiagnosticos;
  let ticketsAbertos = 0;

  if (db) {
    const [u, p, prop, cult, tickets] = await Promise.all([
      db.select().from(users),
      db.select().from(produtores),
      db.select().from(propriedades),
      db.select().from(culturas),
      db.select().from(ticketsSuporte),
    ]);
    totalUsers = u.length;
    totalProdutores = p.length;
    totalPropriedades = prop.length;
    totalCulturasCampo = cult.length;
    ticketsAbertos = tickets.filter((t) => t.status === "aberto" || t.status === "em_andamento").length;
  }

  const saudeScore = (() => {
    let score = 100;
    score -= alertas.criticos * 15;
    score -= alertas.abertos * 5;
    score -= geoIot.alertasIot * 3;
    score -= ticketsAbertos * 2;
    return Math.max(0, Math.min(100, score));
  })();

  return {
    saudeScore,
    usuarios: totalUsers,
    produtores: totalProdutores,
    propriedades: totalPropriedades,
    culturasCampo: totalCulturasCampo,
    culturasCatalogo: core.totalCulturas,
    diagnosticosIa: totalDiagnosticos,
    sensores: geoIot.totalSensores,
    sensoresAtivos: geoIot.sensoresAtivos,
    alertasIot: geoIot.alertasIot,
    camadasGeo: geoIot.totalCamadasGeo,
    produtosMarketplace: geoIot.produtosDisponiveis,
    pedidos: geoIot.totalPedidosMarketplace,
    labModulos: expansao.totalLabModulos,
    zonasClima: expansao.totalZonas,
    ticketsAbertos,
    noc: alertas,
  };
}

export async function countNocArquiteturaStats() {
  const [noc, arch] = await Promise.all([statsNoc(), statsArquitetura()]);
  return {
    totalNocAlertas: noc.totalAlertas,
    nocAlertasAbertos: noc.abertos,
    nocCriticos: noc.criticos,
    totalArquiteturaComponentes: arch.totalComponentes,
    arquiteturaOperacionais: arch.operacionais,
  };
}
