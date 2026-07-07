/**
 * scripts/seed-comprador.ts — Usuário comprador demo para testar marketplace
 *
 * Uso: npm run seed:comprador
 * Idempotente: pula se comprador@afuagro.com.br já existir.
 *
 * Credenciais:
 *   e-mail: comprador@afuagro.com.br
 *   senha:  Demo@1234
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { getDb } from "../server/db";
import { hashPassword } from "../server/db-auth";
import { users, usuariosAfu } from "../drizzle/schema";

const COMPRADOR_EMAIL = "comprador@afuagro.com.br";
const COMPRADOR_PASSWORD = "Demo@1234";

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("FALHA: DATABASE_URL não configurada ou banco indisponível.");
    process.exit(1);
  }

  const existing = await db.select().from(users).where(eq(users.email, COMPRADOR_EMAIL)).limit(1);
  if (existing.length > 0) {
    console.log(`Comprador demo já existe (${COMPRADOR_EMAIL}). Nada a fazer.`);
    process.exit(0);
  }

  console.log("Criando usuário comprador demo...");
  const passwordHash = await hashPassword(COMPRADOR_PASSWORD);
  const [userResult] = await db.insert(users).values({
    openId: "email_comprador-afu-0001",
    name: "Comprador Demo",
    email: COMPRADOR_EMAIL,
    passwordHash,
    loginMethod: "email",
    role: "user",
    emailVerified: true,
  });
  const userId = userResult.insertId;

  await db.insert(usuariosAfu).values({
    userId,
    nome: "Comprador Demo",
    email: COMPRADOR_EMAIL,
    telefone: "(11) 98888-1111",
    tipoUsuario: "comprador",
    status: "ativo",
  });

  console.log("");
  console.log("Comprador demo criado!");
  console.log(`  Login: ${COMPRADOR_EMAIL} / ${COMPRADOR_PASSWORD}`);
  console.log("  Use esta conta para comprar produtos do vendedor demo@afuagro.com.br");
  process.exit(0);
}

main().catch((err) => {
  console.error("Erro no seed comprador:", err);
  process.exit(1);
});
