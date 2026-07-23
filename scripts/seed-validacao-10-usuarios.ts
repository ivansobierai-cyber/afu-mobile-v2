/**
 * Seed de 10 usuários com dados para validação do sistema (idempotente).
 * Uso: npx tsx scripts/seed-validacao-10-usuarios.ts
 *
 * Não remove dados existentes — só cria se o e-mail ainda não existir.
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";
import type { User } from "../drizzle/schema";

const SHARED_PASSWORD = "Valid@1234";

type SeedUser = {
  email: string;
  name: string;
  profile: "produtor" | "tecnico" | "administrador";
  fazenda: string;
  cidade: string;
  estado: string;
  areaHa: number;
  cultura: string;
  categoriaEstoque: "fertilizante" | "defensivo" | "semente" | "combustivel" | "outro";
};

const USERS: SeedUser[] = [
  {
    email: "valida01.produtor@afuagro.com.br",
    name: "Ana Produtora",
    profile: "produtor",
    fazenda: "Fazenda Horizonte",
    cidade: "Londrina",
    estado: "PR",
    areaHa: 85,
    cultura: "Soja",
    categoriaEstoque: "fertilizante",
  },
  {
    email: "valida02.produtor@afuagro.com.br",
    name: "Bruno Campos",
    profile: "produtor",
    fazenda: "Sítio Boa Vista",
    cidade: "Uberaba",
    estado: "MG",
    areaHa: 42,
    cultura: "Milho",
    categoriaEstoque: "semente",
  },
  {
    email: "valida03.tecnico@afuagro.com.br",
    name: "Carla Agrônoma",
    profile: "tecnico",
    fazenda: "Estância Técnica Sul",
    cidade: "Passo Fundo",
    estado: "RS",
    areaHa: 28,
    cultura: "Trigo",
    categoriaEstoque: "defensivo",
  },
  {
    email: "valida04.produtor@afuagro.com.br",
    name: "Diego Ribeiro",
    profile: "produtor",
    fazenda: "Fazenda Cerrado Verde",
    cidade: "Rio Verde",
    estado: "GO",
    areaHa: 210,
    cultura: "Algodão",
    categoriaEstoque: "defensivo",
  },
  {
    email: "valida05.produtor@afuagro.com.br",
    name: "Elena Martins",
    profile: "produtor",
    fazenda: "Chácara Primavera",
    cidade: "Piracicaba",
    estado: "SP",
    areaHa: 18,
    cultura: "Cana",
    categoriaEstoque: "combustivel",
  },
  {
    email: "valida06.admin@afuagro.com.br",
    name: "Fábio Admin Validação",
    profile: "administrador",
    fazenda: "Base Admin Validação",
    cidade: "Curitiba",
    estado: "PR",
    areaHa: 12,
    cultura: "Hortifruti",
    categoriaEstoque: "outro",
  },
  {
    email: "valida07.produtor@afuagro.com.br",
    name: "Gabriela Nunes",
    profile: "produtor",
    fazenda: "Fazenda Pantanal Norte",
    cidade: "Cuiabá",
    estado: "MT",
    areaHa: 320,
    cultura: "Soja",
    categoriaEstoque: "fertilizante",
  },
  {
    email: "valida08.tecnico@afuagro.com.br",
    name: "Henrique Técnico",
    profile: "tecnico",
    fazenda: "Campo Experimental Oeste",
    cidade: "Dourados",
    estado: "MS",
    areaHa: 55,
    cultura: "Milho",
    categoriaEstoque: "semente",
  },
  {
    email: "valida09.produtor@afuagro.com.br",
    name: "Isabela Costa",
    profile: "produtor",
    fazenda: "Sítio Vale Verde",
    cidade: "Petrolina",
    estado: "PE",
    areaHa: 22,
    cultura: "Fruticultura",
    categoriaEstoque: "defensivo",
  },
  {
    email: "valida10.produtor@afuagro.com.br",
    name: "João Validação",
    profile: "produtor",
    fazenda: "Fazenda Atlântico",
    cidade: "Ilhéus",
    estado: "BA",
    areaHa: 67,
    cultura: "Cacau",
    categoriaEstoque: "fertilizante",
  },
];

function createCallerCtx(user: User): TrpcContext {
  return {
    user,
    req: {
      protocol: "http",
      headers: { "user-agent": "seed-validacao-10", "x-forwarded-for": "127.0.0.1" },
    } as unknown as TrpcContext["req"],
    res: {
      clearCookie: () => undefined,
      cookie: () => undefined,
    } as unknown as TrpcContext["res"],
  };
}

async function seedOne(spec: SeedUser): Promise<{ email: string; password: string; created: boolean }> {
  const { getDb } = await import("../server/db");
  const { users } = await import("../drizzle/schema");
  const db = await getDb();
  if (!db) throw new Error("DATABASE_URL / DB indisponível");

  const existing = await db.select().from(users).where(eq(users.email, spec.email)).limit(1);
  if (existing[0]) {
    return { email: spec.email, password: SHARED_PASSWORD, created: false };
  }

  const { createUserWithEmail } = await import("../server/db-auth");
  const { ensurePersonalOrganization } = await import("../server/db-organizations");

  const created = await createUserWithEmail({
    email: spec.email,
    password: SHARED_PASSWORD,
    name: spec.name,
    profile: spec.profile,
  });
  await ensurePersonalOrganization(created.userId);

  // Marca e-mail verificado para login sem atrito na validação
  await db.update(users).set({ emailVerified: true }).where(eq(users.id, created.userId));

  const userRows = await db.select().from(users).where(eq(users.id, created.userId)).limit(1);
  const user = userRows[0]!;
  const caller = appRouter.createCaller(createCallerCtx(user));

  const propriedadeId = await caller.coreData.propriedades.create({
    nome: spec.fazenda,
    cidade: spec.cidade,
    estado: spec.estado,
    tamanhoArea: spec.areaHa,
    tipoProducao: "graos",
  });

  const terrenoId = await caller.coreData.terrenos.create({
    propriedadeId,
    nome: `Talhão 1 — ${spec.cidade}`,
    area: Math.max(1, Math.round(spec.areaHa * 0.4)),
  });

  const cultivoId = await caller.coreData.cultivos.create({
    propriedadeId,
    terrenoId,
    nomeCultura: spec.cultura,
    status: "em_andamento",
    areaPlantada: Math.max(1, Math.round(spec.areaHa * 0.35)),
  });

  const tarefaId = await caller.coreData.tarefas.create({
    propriedadeId,
    terrenoId,
    culturaId: cultivoId,
    tipoOperacao: "monitoramento",
    titulo: `Monitoramento ${spec.cultura}`,
    dataPrevista: new Date().toISOString(),
    prioridade: "normal",
    responsavelUserId: created.userId,
  });

  await caller.coreData.tarefas.alocacoes.upsert({
    tarefaId,
    userId: created.userId,
    papelEquipe: spec.profile === "tecnico" ? "agronomo" : "operador",
    horasPlanejadas: 4,
  });

  const itemId = await caller.coreData.expansao.estoque.createItem({
    propriedadeId,
    nome: `Insumo ${spec.cultura}`,
    categoria: spec.categoriaEstoque,
    unidadeBase: "kg",
    saldoInicial: 200,
    estoqueMinimo: 20,
    fabricante: "AFU Validação",
  });

  await caller.coreData.expansao.estoque.movimento({
    itemId,
    propriedadeId,
    tipo: "entrada",
    quantidade: 50,
    motivo: "Seed validação",
  });

  await caller.coreData.expansao.custos.createOrcamento({
    propriedadeId,
    nomeSafra: `Safra ${spec.estado} Validação`,
    orcamentoPrevisto: spec.areaHa * 800,
  });

  await caller.coreData.expansao.custos.createCusto({
    propriedadeId,
    terrenoId,
    tarefaId,
    descricao: `Custo operacional ${spec.cultura}`,
    valor: 450,
    categoria: "insumo",
  });

  await caller.coreData.expansao.financeiro.create({
    propriedadeId,
    tipo: "receita",
    descricao: `Venda ${spec.cultura}`,
    valor: 3500,
  });

  await caller.coreData.expansao.maquinas.create({
    propriedadeId,
    nome: `Trator ${spec.fazenda.split(" ").slice(-1)[0]}`,
    tipo: "trator",
    horasUso: 120,
    status: "disponivel",
  });

  return { email: spec.email, password: SHARED_PASSWORD, created: true };
}

async function main() {
  console.log("\n=== Seed 10 usuários de validação ===\n");
  const rows: Array<{ email: string; password: string; created: boolean }> = [];
  for (const u of USERS) {
    try {
      const r = await seedOne(u);
      rows.push(r);
      console.log(`${r.created ? "CRIADO" : "JÁ EXISTIA"}  ${r.email}`);
    } catch (e: any) {
      console.error(`FALHA ${u.email}:`, e?.message ?? e);
      throw e;
    }
  }

  console.log("\n┌────┬────────────────────────────────────────┬─────────────┬──────────────────────────┐");
  console.log("│ #  │ E-mail                                 │ Senha       │ Perfil / Fazenda         │");
  console.log("├────┼────────────────────────────────────────┼─────────────┼──────────────────────────┤");
  USERS.forEach((u, i) => {
    const n = String(i + 1).padStart(2, " ");
    const email = u.email.padEnd(38);
    const perfil = `${u.profile} · ${u.fazenda}`.slice(0, 24).padEnd(24);
    console.log(`│ ${n} │ ${email} │ ${SHARED_PASSWORD} │ ${perfil} │`);
  });
  console.log("└────┴────────────────────────────────────────┴─────────────┴──────────────────────────┘");
  console.log(`\nSenha comum: ${SHARED_PASSWORD}`);
  console.log(`Novos: ${rows.filter((r) => r.created).length} · Já existiam: ${rows.filter((r) => !r.created).length}`);
  console.log("Web: http://localhost:8081  |  API: http://localhost:3000\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
