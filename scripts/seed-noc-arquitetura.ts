/**
 * Seed etapas 45–46 — noc_alertas + arquitetura_componentes.
 * Uso: npm run seed:noc-arquitetura
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { nocAlertas, arquiteturaComponentes } from "../drizzle/schema";

const ALERTAS = [
  {
    codigo: "IOT-UMIDADE-BAIXA",
    titulo: "Umidade de solo abaixo do limiar",
    descricao: "Sensor SOLO-A2 reportou umidade < 22%. Avaliar irrigação no talhão Sul.",
    severidade: "alta" as const,
    modulo: "iot",
    status: "aberto" as const,
    origem: "sensores / seed:geo-iot",
  },
  {
    codigo: "GEO-NDVI-ATENCAO",
    titulo: "Camada NDVI disponível para revisão",
    descricao: "Camada ndvi-sentinel atualizada. Revisar talhões com vigor reduzido.",
    severidade: "media" as const,
    modulo: "geo",
    status: "aberto" as const,
    origem: "camadas_geo",
  },
  {
    codigo: "MKT-CATALOGO-OK",
    titulo: "Catálogo marketplace operacional",
    descricao: "≥ 8 produtos disponíveis no seed demo.",
    severidade: "info" as const,
    modulo: "marketplace",
    status: "resolvido" as const,
    origem: "produtos_marketplace",
  },
  {
    codigo: "LAB-MODULOS-READY",
    titulo: "Laboratório digital com módulos seed",
    descricao: "7 módulos lab_modulos prontos para laudos.",
    severidade: "info" as const,
    modulo: "lab",
    status: "resolvido" as const,
    origem: "lab_modulos",
  },
  {
    codigo: "IA-DIAG-PIPELINE",
    titulo: "Pipeline de diagnóstico IA ativo",
    descricao: "Tabela diagnosticos_ia pronta; confiança média monitorada no NOC.",
    severidade: "baixa" as const,
    modulo: "ia",
    status: "reconhecido" as const,
    origem: "diagnosticos_ia",
  },
  {
    codigo: "PILOTO-CAMPO",
    titulo: "Piloto de campo ainda parcial",
    descricao: "Etapa 29 parcial — aguarda produtores reais em testes de campo.",
    severidade: "media" as const,
    modulo: "piloto",
    status: "aberto" as const,
    origem: "piloto_*",
  },
  {
    codigo: "SYS-STACK-CHECK",
    titulo: "Stack real alinhada (Expo + Express + MySQL)",
    descricao: "Arquitetura final documentada em arquitetura_componentes.",
    severidade: "info" as const,
    modulo: "sistema",
    status: "resolvido" as const,
    origem: "AFU_STACK_REAL",
  },
  {
    codigo: "IOT-LUX-MANUT",
    titulo: "Sensor de luminosidade em manutenção",
    descricao: "LUX-EST1 marcado como manutencao — verificar firmware/gateway.",
    severidade: "baixa" as const,
    modulo: "iot",
    status: "aberto" as const,
    origem: "sensores",
  },
];

const COMPONENTES: Array<{
  slug: string;
  nome: string;
  camada:
    | "frontend"
    | "backend"
    | "dados"
    | "ia"
    | "infra"
    | "seguranca"
    | "devops"
    | "integracao";
  descricao: string;
  tecnologia: string;
  status: "planejado" | "parcial" | "operacional" | "deprecado";
  ordem: number;
}> = [
  {
    slug: "app-expo",
    nome: "App Planta Saudável",
    camada: "frontend",
    descricao: "App mobile/web do produtor (Expo Router + NativeWind).",
    tecnologia: "Expo SDK 54 · React Native · Expo Router",
    status: "operacional",
    ordem: 10,
  },
  {
    slug: "portal-web",
    nome: "Portal Web do Produtor",
    camada: "frontend",
    descricao: "Mesmo codebase Expo web (Metro).",
    tecnologia: "Expo Web · Metro 8081",
    status: "operacional",
    ordem: 20,
  },
  {
    slug: "api-express-trpc",
    nome: "API Express + tRPC",
    camada: "backend",
    descricao: "Contratos tipados, auth JWT, routers de domínio.",
    tecnologia: "Express · tRPC · tsx watch",
    status: "operacional",
    ordem: 30,
  },
  {
    slug: "mysql-drizzle",
    nome: "MySQL 8 + Drizzle",
    camada: "dados",
    descricao: "Schema único, migrations drizzle-kit, seeds idempotentes.",
    tecnologia: "MySQL 8 · Drizzle ORM",
    status: "operacional",
    ordem: 40,
  },
  {
    slug: "banco-agronomico",
    nome: "Banco Agronômico",
    camada: "dados",
    descricao: "Catálogo 17 culturas + clima/irrigação/nutrientes/fitossanitário.",
    tecnologia: "culturas_catalogo + satélites de domínio",
    status: "operacional",
    ordem: 50,
  },
  {
    slug: "ia-diagnostico",
    nome: "IA Diagnóstico / Agrônomo",
    camada: "ia",
    descricao: "Diagnósticos e consulta agronômica (AFU AI CORE MVP).",
    tecnologia: "diagnosticos_ia · bancoAgronomico.ia",
    status: "parcial",
    ordem: 60,
  },
  {
    slug: "geo-iot",
    nome: "GEO + IoT",
    camada: "integracao",
    descricao: "Camadas satélite/drone e rede de sensores.",
    tecnologia: "camadas_geo · sensores · leituras_sensores",
    status: "operacional",
    ordem: 70,
  },
  {
    slug: "marketplace",
    nome: "Marketplace agrícola",
    camada: "backend",
    descricao: "Catálogo, pedidos e checkout autenticado.",
    tecnologia: "produtos_marketplace · secondaryData.marketplace",
    status: "operacional",
    ordem: 80,
  },
  {
    slug: "noc",
    nome: "Centro de Comando NOC",
    camada: "frontend",
    descricao: "Painel operacional com alertas e KPIs do ecossistema.",
    tecnologia: "noc_alertas · painel agregado",
    status: "operacional",
    ordem: 90,
  },
  {
    slug: "auth-jwt",
    nome: "Autenticação JWT",
    camada: "seguranca",
    descricao: "Login e-mail/senha, refresh token, bcrypt.",
    tecnologia: "JWT · bcrypt · usuarios_afu",
    status: "operacional",
    ordem: 100,
  },
  {
    slug: "lgpd-auditoria",
    nome: "LGPD e auditoria básica",
    camada: "seguranca",
    descricao: "Controles de acesso por perfil; trilhas em tickets/pedidos.",
    tecnologia: "roles · protectedProcedure",
    status: "parcial",
    ordem: 110,
  },
  {
    slug: "deploy-railway-vercel",
    nome: "Deploy Cloud",
    camada: "infra",
    descricao: "API Railway, web Vercel, mobile EAS.",
    tecnologia: "Railway · Vercel · EAS",
    status: "parcial",
    ordem: 120,
  },
  {
    slug: "ci-vitest",
    nome: "Qualidade e testes",
    camada: "devops",
    descricao: "Vitest + tsc check; lint com débitos conhecidos.",
    tecnologia: "Vitest · TypeScript",
    status: "operacional",
    ordem: 130,
  },
  {
    slug: "push-alertas",
    nome: "Push e alertas climáticos",
    camada: "integracao",
    descricao: "Tokens push e jobs opcionais de clima.",
    tecnologia: "push_tokens · weather alerts",
    status: "parcial",
    ordem: 140,
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

  let alertasNovos = 0;
  for (const a of ALERTAS) {
    const [exist] = await db.select().from(nocAlertas).where(eq(nocAlertas.codigo, a.codigo)).limit(1);
    if (exist) {
      await db
        .update(nocAlertas)
        .set({
          titulo: a.titulo,
          descricao: a.descricao,
          severidade: a.severidade,
          modulo: a.modulo,
          status: a.status,
          origem: a.origem,
          resolvedAt: a.status === "resolvido" ? new Date() : null,
        })
        .where(eq(nocAlertas.id, exist.id));
    } else {
      await db.insert(nocAlertas).values({
        ...a,
        resolvedAt: a.status === "resolvido" ? new Date() : null,
      });
      alertasNovos += 1;
    }
  }
  console.log(`NOC alertas: ${ALERTAS.length} (novos: ${alertasNovos})`);

  let compsNovos = 0;
  for (const c of COMPONENTES) {
    const [exist] = await db
      .select()
      .from(arquiteturaComponentes)
      .where(eq(arquiteturaComponentes.slug, c.slug))
      .limit(1);
    if (exist) {
      await db.update(arquiteturaComponentes).set(c).where(eq(arquiteturaComponentes.id, exist.id));
    } else {
      await db.insert(arquiteturaComponentes).values(c);
      compsNovos += 1;
    }
  }
  console.log(`Arquitetura componentes: ${COMPONENTES.length} (novos: ${compsNovos})`);

  await conn.end();
  console.log("OK seed:noc-arquitetura");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
