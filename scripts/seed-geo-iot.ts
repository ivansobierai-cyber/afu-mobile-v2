/**
 * Seed etapas 42–43 — camadas_geo + sensores demo + leituras.
 * Etapa 44 usa catálogo de `npm run seed:marketplace` (já existente).
 *
 * Uso: npm run seed:geo-iot
 */
import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import {
  camadasGeo,
  sensores,
  leiturasSensores,
  propriedades,
  users,
} from "../drizzle/schema";

const DEMO_EMAIL = "demo@afuagro.com.br";

const CAMADAS = [
  {
    codigo: "ndvi-sentinel",
    nome: "NDVI Sentinel-2",
    tipo: "ndvi" as const,
    descricao: "Índice de vegetação a cada 5 dias, resolução 10 m.",
    fonte: "Copernicus / Sentinel-2",
    coberturaKm2: "8500000",
    resolucaoM: 10,
  },
  {
    codigo: "chuva-gpm",
    nome: "Precipitação GPM",
    tipo: "chuva" as const,
    descricao: "Acumulado de chuva 24h / 7d / sazonal.",
    fonte: "NASA GPM",
    coberturaKm2: "8500000",
    resolucaoM: 10000,
  },
  {
    codigo: "solo-textura",
    nome: "Textura e umidade de solo",
    tipo: "solo" as const,
    descricao: "Mapa de textura + umidade superficial estimada.",
    fonte: "AFU Solos + satélite",
    coberturaKm2: "3200000",
    resolucaoM: 250,
  },
  {
    codigo: "risco-ferrugem",
    nome: "Risco fitossanitário",
    tipo: "risco" as const,
    descricao: "Modelo de risco de ferrugem e doenças foliares.",
    fonte: "AFU AI CORE",
    coberturaKm2: "2100000",
    resolucaoM: 500,
  },
  {
    codigo: "clima-estacao",
    nome: "Malha climática regional",
    tipo: "clima" as const,
    descricao: "Temperatura, UR e vento interpolados.",
    fonte: "INMET + AFU GeoClima",
    coberturaKm2: "8500000",
    resolucaoM: 5000,
  },
  {
    codigo: "drone-rgb",
    nome: "Ortomosaico drone RGB",
    tipo: "drone" as const,
    descricao: "Voos de precisão por talhão (demo).",
    fonte: "AFU Drones",
    coberturaKm2: "1200",
    resolucaoM: 5,
  },
];

const SENSORES_DEMO: Array<{
  tipoSensor:
    | "temperatura"
    | "umidade_solo"
    | "umidade_ar"
    | "ph"
    | "chuva"
    | "luminosidade";
  codigoSensor: string;
  localInstalacao: string;
  ultimaLeitura: string;
  unidadeLeitura: string;
  status: "ativo" | "manutencao";
}> = [
  {
    tipoSensor: "umidade_solo",
    codigoSensor: "SOLO-A1",
    localInstalacao: "Talhão Norte — 20 cm",
    ultimaLeitura: "28.4000",
    unidadeLeitura: "%",
    status: "ativo",
  },
  {
    tipoSensor: "umidade_solo",
    codigoSensor: "SOLO-A2",
    localInstalacao: "Talhão Sul — 20 cm",
    ultimaLeitura: "19.2000",
    unidadeLeitura: "%",
    status: "ativo",
  },
  {
    tipoSensor: "temperatura",
    codigoSensor: "TEMP-EST1",
    localInstalacao: "Estação meteorológica HQ",
    ultimaLeitura: "26.8000",
    unidadeLeitura: "°C",
    status: "ativo",
  },
  {
    tipoSensor: "umidade_ar",
    codigoSensor: "UR-EST1",
    localInstalacao: "Estação meteorológica HQ",
    ultimaLeitura: "62.0000",
    unidadeLeitura: "%",
    status: "ativo",
  },
  {
    tipoSensor: "ph",
    codigoSensor: "PH-B3",
    localInstalacao: "Talhão Irrigado — zona B",
    ultimaLeitura: "6.1000",
    unidadeLeitura: "pH",
    status: "ativo",
  },
  {
    tipoSensor: "chuva",
    codigoSensor: "CHUVA-1",
    localInstalacao: "Pivô central",
    ultimaLeitura: "0.0000",
    unidadeLeitura: "mm",
    status: "ativo",
  },
  {
    tipoSensor: "luminosidade",
    codigoSensor: "LUX-EST1",
    localInstalacao: "Estação meteorológica HQ",
    ultimaLeitura: "78000.0000",
    unidadeLeitura: "lux",
    status: "manutencao",
  },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("FALHA: DATABASE_URL não configurada.");
    process.exit(1);
  }

  const conn = await mysql.createConnection(url);
  const db = drizzle(conn);

  let camadasUpsert = 0;
  for (const c of CAMADAS) {
    const [exist] = await db.select().from(camadasGeo).where(eq(camadasGeo.codigo, c.codigo)).limit(1);
    if (exist) {
      await db
        .update(camadasGeo)
        .set({
          nome: c.nome,
          tipo: c.tipo,
          descricao: c.descricao,
          fonte: c.fonte,
          coberturaKm2: c.coberturaKm2,
          resolucaoM: c.resolucaoM,
          atualizadoEm: new Date(),
          ativo: true,
        })
        .where(eq(camadasGeo.id, exist.id));
    } else {
      await db.insert(camadasGeo).values({
        ...c,
        atualizadoEm: new Date(),
        ativo: true,
      });
      camadasUpsert += 1;
    }
  }
  console.log(`Camadas GEO: ${CAMADAS.length} (novas: ${camadasUpsert})`);

  const props = await db.select().from(propriedades).limit(1);
  let prop = props[0];
  if (!prop) {
    console.warn("Nenhuma propriedade — sensores IoT não serão criados. Rode npm run seed.");
  } else {
    // Prefer demo user's property if present
    const [demoUser] = await db.select().from(users).where(eq(users.email, DEMO_EMAIL)).limit(1);
    if (demoUser) {
      // propriedade already linked via seed to demo — use first with GPS if available
      const comGps = await db
        .select()
        .from(propriedades)
        .where(and(eq(propriedades.id, prop.id)));
      prop = comGps[0] ?? prop;
    }

    let sensoresNovos = 0;
    let leiturasNovas = 0;

    for (const s of SENSORES_DEMO) {
      const [exist] = await db
        .select()
        .from(sensores)
        .where(
          and(eq(sensores.propriedadeId, prop.id), eq(sensores.codigoSensor, s.codigoSensor)),
        )
        .limit(1);

      let sensorId = exist?.id;
      if (!exist) {
        const inserted = await db.insert(sensores).values({
          propriedadeId: prop.id,
          tipoSensor: s.tipoSensor,
          codigoSensor: s.codigoSensor,
          localInstalacao: s.localInstalacao,
          status: s.status,
          ultimaLeitura: s.ultimaLeitura,
          unidadeLeitura: s.unidadeLeitura,
          dataInstalacao: new Date(),
        });
        sensorId = Number(inserted[0].insertId);
        sensoresNovos += 1;
      } else {
        await db
          .update(sensores)
          .set({
            status: s.status,
            ultimaLeitura: s.ultimaLeitura,
            unidadeLeitura: s.unidadeLeitura,
            localInstalacao: s.localInstalacao,
          })
          .where(eq(sensores.id, exist.id));
      }

      if (!sensorId) continue;

      const [jaTemLeitura] = await db
        .select()
        .from(leiturasSensores)
        .where(eq(leiturasSensores.sensorId, sensorId))
        .limit(1);

      if (!jaTemLeitura) {
        const valor = Number(s.ultimaLeitura);
        const alerta =
          s.tipoSensor === "umidade_solo" && valor < 22
            ? { alertaGerado: true, alertaMensagem: "Umidade de solo baixa — avaliar irrigação" }
            : { alertaGerado: false, alertaMensagem: null };

        await db.insert(leiturasSensores).values({
          sensorId,
          valor: s.ultimaLeitura,
          unidade: s.unidadeLeitura,
          dataLeitura: new Date(),
          ...alerta,
        });
        // 2 leituras históricas extras
        await db.insert(leiturasSensores).values({
          sensorId,
          valor: String((valor * 0.95).toFixed(4)),
          unidade: s.unidadeLeitura,
          dataLeitura: new Date(Date.now() - 3600_000),
          alertaGerado: false,
        });
        await db.insert(leiturasSensores).values({
          sensorId,
          valor: String((valor * 1.02).toFixed(4)),
          unidade: s.unidadeLeitura,
          dataLeitura: new Date(Date.now() - 7200_000),
          alertaGerado: false,
        });
        leiturasNovas += 3;
      }
    }

    console.log(
      `IoT propriedade #${prop.id}: sensores novos ${sensoresNovos}, leituras novas ${leiturasNovas}`,
    );
  }

  console.log("OK seed:geo-iot — rode também npm run seed:marketplace se catálogo vazio.");
  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
