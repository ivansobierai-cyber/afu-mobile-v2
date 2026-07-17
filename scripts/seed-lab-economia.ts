/**
 * Seed etapas 39–40 — lab_modulos + economia_cultura.
 * Etapa 41 (IA) usa diagnosticos_ia + consulta agronômica já existentes.
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { labModulos, economiaCultura, culturasCatalogo } from "../drizzle/schema";

const LAB_MODULOS = [
  {
    slug: "solo",
    nome: "Solo",
    descricao: "Análise química e física do solo (pH, CTC, macronutrientes).",
    parametros: JSON.stringify(["pH", "MO", "P", "K", "Ca", "Mg", "S", "Al", "CTC", "V%", "Argila"]),
    cor: "#4E342E",
    emoji: "🪨",
  },
  {
    slug: "foliar",
    nome: "Foliar",
    descricao: "Teores foliares de macro e micronutrientes.",
    parametros: JSON.stringify(["N", "P", "K", "Ca", "Mg", "S", "B", "Zn", "Cu", "Fe", "Mn"]),
    cor: "#2E7D32",
    emoji: "🌿",
  },
  {
    slug: "agua",
    nome: "Água",
    descricao: "Qualidade de água para irrigação e consumo rural.",
    parametros: JSON.stringify(["pH", "CE", "Na", "Cl", "Ca", "Mg", "Dureza", "RAS"]),
    cor: "#0288D1",
    emoji: "💧",
  },
  {
    slug: "sementes",
    nome: "Sementes",
    descricao: "Germinação, vigor e pureza física.",
    parametros: JSON.stringify(["Germinação", "Vigor", "Pureza", "Umidade"]),
    cor: "#F57F17",
    emoji: "🌱",
  },
  {
    slug: "microbiologia",
    nome: "Microbiologia",
    descricao: "Contagem de fungos, bactérias e nematoides.",
    parametros: JSON.stringify(["UFC", "Fungos", "Bactérias", "Nematoides"]),
    cor: "#7B1FA2",
    emoji: "🔬",
  },
  {
    slug: "compostagem",
    nome: "Compostagem",
    descricao: "Maturidade e qualidade de compostos orgânicos.",
    parametros: JSON.stringify(["C/N", "pH", "Umidade", "Temperatura"]),
    cor: "#558B2F",
    emoji: "♻️",
  },
  {
    slug: "substratos",
    nome: "Substratos",
    descricao: "Caracterização física de substratos hortícolas.",
    parametros: JSON.stringify(["Densidade", "Porosidade", "CRA", "pH"]),
    cor: "#6D4C41",
    emoji: "🪴",
  },
];

/** Heurística: deriva economia a partir de produtividadeMedia textual do catálogo */
function parseEconomiaFromCultura(c: {
  id: number;
  nomePopular: string;
  produtividadeMedia: string | null;
  categoria: string | null;
}) {
  const raw = c.produtividadeMedia || "";
  const nums = raw.match(/[\d.]+/g)?.map(Number).filter((n) => !Number.isNaN(n)) ?? [];
  const min = nums[0] ?? 1000;
  const max = nums[1] ?? min * 1.4;
  const med = Math.round(((min + max) / 2) * 100) / 100;

  let unidade = "kg/ha";
  if (/t\/ha|ton/i.test(raw)) unidade = "t/ha";
  else if (/sacas/i.test(raw)) unidade = "sacas/ha";
  else if (/m³/i.test(raw)) unidade = "m³/ha/ano";
  else if (/plantas/i.test(raw)) unidade = "plantas/ha";

  // Custos e preços de referência (BRL) — ordem de grandeza MVP
  const custoBase: Record<string, number> = {
    graos: 3500,
    oleaginosas: 4200,
    hortalicas: 12000,
    frutas: 15000,
    fibrosas: 5000,
    outros: 6000,
  };
  const precoBase: Record<string, number> = {
    graos: 1.2,
    oleaginosas: 2.5,
    hortalicas: 3.5,
    frutas: 4.0,
    fibrosas: 8.0,
    outros: 2.0,
  };
  const cat = c.categoria || "outros";
  const custoHaEstimado = custoBase[cat] ?? 5000;
  const precoUnidade = precoBase[cat] ?? 2;

  return {
    culturaCatalogoId: c.id,
    unidadeProdutividade: unidade,
    produtividadeMin: String(min),
    produtividadeMed: String(med),
    produtividadeMax: String(max),
    custoHaEstimado: String(custoHaEstimado),
    precoUnidade: String(precoUnidade),
    moeda: "BRL",
    observacoes: `Estimativa MVP a partir de: ${raw || c.nomePopular}`,
  };
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não configurada");

  const connection = await mysql.createConnection(url);
  const db = drizzle(connection);

  console.log("[seed-lab-economia] Iniciando...");

  for (const mod of LAB_MODULOS) {
    const existing = await db.select().from(labModulos).where(eq(labModulos.slug, mod.slug)).limit(1);
    if (existing[0]) {
      await db.update(labModulos).set(mod).where(eq(labModulos.id, existing[0].id));
    } else {
      await db.insert(labModulos).values(mod);
    }
  }

  const culturas = await db.select().from(culturasCatalogo);
  for (const c of culturas) {
    const row = parseEconomiaFromCultura(c);
    const existing = await db
      .select()
      .from(economiaCultura)
      .where(eq(economiaCultura.culturaCatalogoId, c.id))
      .limit(1);
    if (existing[0]) {
      await db.update(economiaCultura).set(row).where(eq(economiaCultura.id, existing[0].id));
    } else {
      await db.insert(economiaCultura).values(row);
    }
  }

  const labs = await db.select().from(labModulos);
  const ecos = await db.select().from(economiaCultura);
  console.log(`[seed-lab-economia] Concluído: ${labs.length} módulos lab · ${ecos.length} fichas econômicas`);
  await connection.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
