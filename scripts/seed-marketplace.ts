/**
 * scripts/seed-marketplace.ts — Popula catálogo demo do marketplace (idempotente)
 *
 * Uso: npm run seed:marketplace
 * Requer usuário demo (npm run seed) ou qualquer usuário AFU ativo.
 */
import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { getDb } from "../server/db";
import { users, usuariosAfu, produtosMarketplace } from "../drizzle/schema";

const DEMO_EMAIL = "demo@afuagro.com.br";

const CATALOGO = [
  {
    nomeProduto: "Semente de Soja BRS 1010 (saca 40kg)",
    categoria: "sementes" as const,
    descricao: "Semente certificada, alto vigor, tratamento industrial incluído.",
    preco: "890.00",
    estoque: "120.00",
    unidade: "saca",
  },
  {
    nomeProduto: "Milho verde (caixa 20kg)",
    categoria: "producao_propria" as const,
    descricao: "Colheita da semana, direto do produtor.",
    preco: "65.00",
    estoque: "40.00",
    unidade: "caixa",
  },
  {
    nomeProduto: "Fertilizante NPK 20-05-20 (saca 50kg)",
    categoria: "fertilizantes" as const,
    descricao: "Formulação balanceada para cobertura em grãos e hortaliças.",
    preco: "185.00",
    estoque: "200.00",
    unidade: "saca",
  },
  {
    nomeProduto: "Herbicida Glifosato 480g/L (20L)",
    categoria: "defensivos" as const,
    descricao: "Controle de plantas daninhas em pré-plantio e dessecação.",
    preco: "420.00",
    estoque: "35.00",
    unidade: "galão",
  },
  {
    nomeProduto: "Pulverizador costal 20L",
    categoria: "equipamentos" as const,
    descricao: "Bomba manual reforçada, bicos ajustáveis, ideal para áreas menores.",
    preco: "289.00",
    estoque: "15.00",
    unidade: "un",
  },
  {
    nomeProduto: "Análise de solo completa (por amostra)",
    categoria: "servicos" as const,
    descricao: "Coleta orientada + laudo com recomendação de calagem e adubação.",
    preco: "120.00",
    estoque: "999.00",
    unidade: "amostra",
  },
  {
    nomeProduto: "Calcário dolomítico PRNT 90%",
    categoria: "fertilizantes" as const,
    descricao: "Correção de acidez com fornecimento de Ca e Mg.",
    preco: "95.00",
    estoque: "500.00",
    unidade: "ton",
  },
  {
    nomeProduto: "Semente de Milho Híbrido (saca 60kg)",
    categoria: "sementes" as const,
    descricao: "Alto potencial produtivo, tolerância a pragas foliares.",
    preco: "780.00",
    estoque: "80.00",
    unidade: "saca",
  },
];

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("FALHA: DATABASE_URL não configurada ou banco indisponível.");
    process.exit(1);
  }

  const [user] = await db.select().from(users).where(eq(users.email, DEMO_EMAIL)).limit(1);
  if (!user) {
    console.error(`Usuário demo não encontrado (${DEMO_EMAIL}). Execute npm run seed primeiro.`);
    process.exit(1);
  }

  const [perfil] = await db
    .select()
    .from(usuariosAfu)
    .where(eq(usuariosAfu.userId, user.id))
    .limit(1);
  if (!perfil) {
    console.error("Perfil AFU do usuário demo não encontrado.");
    process.exit(1);
  }

  let inseridos = 0;
  let ignorados = 0;

  for (const item of CATALOGO) {
    const [existente] = await db
      .select()
      .from(produtosMarketplace)
      .where(
        and(
          eq(produtosMarketplace.vendedorId, perfil.id),
          eq(produtosMarketplace.nomeProduto, item.nomeProduto),
        ),
      )
      .limit(1);

    if (existente) {
      ignorados++;
      continue;
    }

    await db.insert(produtosMarketplace).values({
      vendedorId: perfil.id,
      ...item,
      status: "disponivel",
    });
    inseridos++;
  }

  console.log(`Marketplace seed concluído: ${inseridos} inseridos, ${ignorados} já existiam.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Erro no seed marketplace:", err);
  process.exit(1);
});
