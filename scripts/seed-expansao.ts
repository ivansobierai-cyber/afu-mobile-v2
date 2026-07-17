/**
 * Seed idempotente — expansão etapas 35–36 (GeoClima + Solos).
 * Genética (37) e calendário de plantio (38) usam dados já em culturas_catalogo / genetica_cultura.
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { zonasClimaticas, tiposSolo } from "../drizzle/schema";

const ZONAS = [
  {
    codigoKoppen: "Af",
    nome: "Tropical chuvoso",
    descricao: "Sem estação seca definida; precipitação alta o ano todo.",
    regioesBrasil: "Amazônia, litoral úmido do NE",
    tempMediaMin: "24",
    tempMediaMax: "28",
    precipitacaoAnualMin: 2000,
    precipitacaoAnualMax: 3500,
    aptidaoCulturas: JSON.stringify(["banana", "cana", "mandioca", "cacau"]),
  },
  {
    codigoKoppen: "Am",
    nome: "Tropical monção",
    descricao: "Estação seca curta; chuvas intensas no verão.",
    regioesBrasil: "Norte e transição Amazônia–Cerrado",
    tempMediaMin: "23",
    tempMediaMax: "28",
    precipitacaoAnualMin: 1500,
    precipitacaoAnualMax: 2500,
    aptidaoCulturas: JSON.stringify(["soja", "milho", "arroz", "mandioca"]),
  },
  {
    codigoKoppen: "Aw",
    nome: "Tropical savânico",
    descricao: "Inverno seco e verão chuvoso — típico do Cerrado.",
    regioesBrasil: "Centro-Oeste, partes do SE e NE",
    tempMediaMin: "20",
    tempMediaMax: "28",
    precipitacaoAnualMin: 1000,
    precipitacaoAnualMax: 1800,
    aptidaoCulturas: JSON.stringify(["soja", "milho", "algodao", "sorgo", "cafe"]),
  },
  {
    codigoKoppen: "Cfa",
    nome: "Subtropical úmido",
    descricao: "Verões quentes, invernos amenos, chuvas bem distribuídas.",
    regioesBrasil: "Sul do Brasil (PR, SC, RS)",
    tempMediaMin: "14",
    tempMediaMax: "24",
    precipitacaoAnualMin: 1200,
    precipitacaoAnualMax: 2000,
    aptidaoCulturas: JSON.stringify(["trigo", "milho", "soja", "arroz", "feijao"]),
  },
  {
    codigoKoppen: "Cfb",
    nome: "Oceânico temperado",
    descricao: "Verões frescos, altitude; geadas frequentes no inverno.",
    regioesBrasil: "Planalto Sul, Serra Gaúcha",
    tempMediaMin: "10",
    tempMediaMax: "20",
    precipitacaoAnualMin: 1400,
    precipitacaoAnualMax: 2200,
    aptidaoCulturas: JSON.stringify(["trigo", "batata", "cebola", "maca"]),
  },
  {
    codigoKoppen: "Cwa",
    nome: "Subtropical com inverno seco",
    descricao: "Verão chuvoso, inverno seco — planalto central.",
    regioesBrasil: "SP, MG, GO, DF",
    tempMediaMin: "16",
    tempMediaMax: "26",
    precipitacaoAnualMin: 1100,
    precipitacaoAnualMax: 1600,
    aptidaoCulturas: JSON.stringify(["cafe", "cana", "laranja", "milho", "soja"]),
  },
  {
    codigoKoppen: "Cwb",
    nome: "Subtropical de altitude",
    descricao: "Noites frias, dias amenos; café de qualidade.",
    regioesBrasil: "Serra da Mantiqueira, Sul de MG",
    tempMediaMin: "12",
    tempMediaMax: "22",
    precipitacaoAnualMin: 1200,
    precipitacaoAnualMax: 1800,
    aptidaoCulturas: JSON.stringify(["cafe", "batata", "hortalicas"]),
  },
  {
    codigoKoppen: "BSh",
    nome: "Semiárido quente",
    descricao: "Déficit hídrico marcado; irrigação estratégica.",
    regioesBrasil: "Sertão Nordestino",
    tempMediaMin: "22",
    tempMediaMax: "32",
    precipitacaoAnualMin: 300,
    precipitacaoAnualMax: 800,
    aptidaoCulturas: JSON.stringify(["sorgo", "algodao", "feijao", "mandioca"]),
  },
  {
    codigoKoppen: "BSk",
    nome: "Semiárido frio",
    descricao: "Invernos frios e secos; verões moderados.",
    regioesBrasil: "Campos Gerais (PR) e áreas de transição",
    tempMediaMin: "12",
    tempMediaMax: "24",
    precipitacaoAnualMin: 400,
    precipitacaoAnualMax: 900,
    aptidaoCulturas: JSON.stringify(["trigo", "cebola", "batata"]),
  },
];

const SOLOS = [
  {
    slug: "latossolo",
    nome: "Latossolo",
    descricao: "Profundos, bem drenados, muito comuns no Brasil; boa mecanização.",
    textura: "Argiloso a franco-argiloso",
    phMin: "4.5",
    phMax: "6.5",
    drenagem: "Boa",
    fertilidade: "Baixa a média (requer correção)",
    aptidaoCulturas: JSON.stringify(["cafe", "soja", "milho", "cana", "mandioca"]),
    manejo: "Calagem, gessagem e adubação de base conforme análise.",
  },
  {
    slug: "argissolo",
    nome: "Argissolo",
    descricao: "Gradiente textural; horizonte B mais argiloso.",
    textura: "Franco a argiloso",
    phMin: "4.5",
    phMax: "6.0",
    drenagem: "Moderada",
    fertilidade: "Média",
    aptidaoCulturas: JSON.stringify(["mandioca", "feijao", "laranja", "eucalipto"]),
    manejo: "Controle de erosão e cobertura permanente.",
  },
  {
    slug: "nitossolo",
    nome: "Nitossolo",
    descricao: "Alta fertilidade natural e boa estrutura.",
    textura: "Argiloso",
    phMin: "5.5",
    phMax: "7.0",
    drenagem: "Boa",
    fertilidade: "Alta",
    aptidaoCulturas: JSON.stringify(["cafe", "milho", "soja", "tomate"]),
    manejo: "Manter matéria orgânica; evitar compactação.",
  },
  {
    slug: "neossolo",
    nome: "Neossolo",
    descricao: "Solos jovens, pouco desenvolvidos, baixa profundidade.",
    textura: "Arenoso a franco",
    phMin: "5.0",
    phMax: "7.0",
    drenagem: "Variável",
    fertilidade: "Baixa",
    aptidaoCulturas: JSON.stringify(["alface", "cebola", "hortalicas"]),
    manejo: "Irrigação frequente e adubação parcelada.",
  },
  {
    slug: "gleissolo",
    nome: "Gleissolo",
    descricao: "Hidromórfico, saturado; horizonte glei.",
    textura: "Argiloso",
    phMin: "4.5",
    phMax: "6.5",
    drenagem: "Ruim (requer drenagem)",
    fertilidade: "Média",
    aptidaoCulturas: JSON.stringify(["arroz"]),
    manejo: "Drenagem ou cultivo de arroz irrigado.",
  },
  {
    slug: "planossolo",
    nome: "Planossolo",
    descricao: "Horizonte B plânico; drenagem impedida — típico do RS.",
    textura: "Franco a argiloso",
    phMin: "5.0",
    phMax: "6.5",
    drenagem: "Impedida",
    fertilidade: "Média",
    aptidaoCulturas: JSON.stringify(["arroz", "trigo"]),
    manejo: "Terraplanagem e manejo de irrigação/drenagem.",
  },
  {
    slug: "vertissolo",
    nome: "Vertissolo",
    descricao: "Alta expansão/contração; fendas na seca — típico do NE.",
    textura: "Muito argiloso",
    phMin: "6.0",
    phMax: "8.0",
    drenagem: "Lenta",
    fertilidade: "Alta",
    aptidaoCulturas: JSON.stringify(["algodao", "sorgo"]),
    manejo: "Evitar tráfego com solo úmido; irrigação controlada.",
  },
  {
    slug: "cambissolo",
    nome: "Cambissolo",
    descricao: "Solos jovens em formação; fertilidade variável.",
    textura: "Franco",
    phMin: "5.0",
    phMax: "6.5",
    drenagem: "Moderada a boa",
    fertilidade: "Média",
    aptidaoCulturas: JSON.stringify(["batata", "hortalicas", "trigo"]),
    manejo: "Adubação de acordo com análise; cobertura vegetal.",
  },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não configurada");

  const connection = await mysql.createConnection(url);
  const db = drizzle(connection);

  console.log("[seed-expansao] Iniciando zonas climáticas e tipos de solo...");

  for (const zona of ZONAS) {
    const existing = await db
      .select()
      .from(zonasClimaticas)
      .where(eq(zonasClimaticas.codigoKoppen, zona.codigoKoppen))
      .limit(1);
    if (existing[0]) {
      await db.update(zonasClimaticas).set(zona).where(eq(zonasClimaticas.id, existing[0].id));
    } else {
      await db.insert(zonasClimaticas).values(zona);
    }
  }

  for (const solo of SOLOS) {
    const existing = await db
      .select()
      .from(tiposSolo)
      .where(eq(tiposSolo.slug, solo.slug))
      .limit(1);
    if (existing[0]) {
      await db.update(tiposSolo).set(solo).where(eq(tiposSolo.id, existing[0].id));
    } else {
      await db.insert(tiposSolo).values(solo);
    }
  }

  const z = await db.select().from(zonasClimaticas);
  const s = await db.select().from(tiposSolo);
  console.log(`[seed-expansao] Concluído: ${z.length} zonas · ${s.length} tipos de solo`);
  await connection.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
