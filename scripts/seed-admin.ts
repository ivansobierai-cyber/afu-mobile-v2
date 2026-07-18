/**
 * scripts/seed-admin.ts — Garante usuário admin demo (idempotente)
 *
 *   e-mail: admin@afuagro.com.br
 *   senha:  Demo@1234
 *   role:   admin
 *   perfil: administrador
 *
 * Uso: npx tsx scripts/seed-admin.ts
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { getDb } from "../server/db";
import { hashPassword } from "../server/db-auth";
import { users, usuariosAfu } from "../drizzle/schema";

const ADMIN_EMAIL = "admin@afuagro.com.br";
const ADMIN_PASSWORD = "Demo@1234";
const ADMIN_NAME = "Admin AFU";

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("FALHA: DATABASE_URL não configurada ou banco indisponível.");
    process.exit(1);
  }

  const passwordHash = await hashPassword(ADMIN_PASSWORD);
  const existing = await db.select().from(users).where(eq(users.email, ADMIN_EMAIL)).limit(1);

  if (existing.length > 0) {
    const user = existing[0];
    await db
      .update(users)
      .set({
        role: "admin",
        passwordHash,
        name: ADMIN_NAME,
        emailVerified: true,
        loginMethod: "email",
      })
      .where(eq(users.id, user.id));

    const perfil = await db
      .select()
      .from(usuariosAfu)
      .where(eq(usuariosAfu.userId, user.id))
      .limit(1);

    if (perfil.length === 0) {
      await db.insert(usuariosAfu).values({
        userId: user.id,
        nome: ADMIN_NAME,
        email: ADMIN_EMAIL,
        telefone: "(11) 90000-0001",
        tipoUsuario: "administrador",
        status: "ativo",
        cargo: "Administrador do sistema",
      });
    } else {
      await db
        .update(usuariosAfu)
        .set({
          tipoUsuario: "administrador",
          status: "ativo",
          nome: ADMIN_NAME,
          email: ADMIN_EMAIL,
          cargo: "Administrador do sistema",
        })
        .where(eq(usuariosAfu.userId, user.id));
    }

    console.log(`Admin atualizado: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
    process.exit(0);
  }

  const [userResult] = await db.insert(users).values({
    openId: "email_admin-afu-0001",
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    passwordHash,
    loginMethod: "email",
    role: "admin",
    emailVerified: true,
  });

  await db.insert(usuariosAfu).values({
    userId: userResult.insertId,
    nome: ADMIN_NAME,
    email: ADMIN_EMAIL,
    telefone: "(11) 90000-0001",
    tipoUsuario: "administrador",
    status: "ativo",
    cargo: "Administrador do sistema",
  });

  console.log(`Admin criado: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
