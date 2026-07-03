/**
 * db-auth.ts — Helpers de banco de dados para Autenticação e Controle de Acesso
 */
import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { users, usuariosAfu } from "../drizzle/schema";
import type { InsertUsuarioAfu, UserPublic } from "../drizzle/schema";
import * as crypto from 'crypto';

let _db: ReturnType<typeof drizzle> | null = null;

async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[db-auth] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type UsuarioCompleto = {
  userId: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: "user" | "admin";
  lastSignedIn: Date;
  userCreatedAt: Date;
  perfilId: number | null;
  tipoUsuario: "administrador" | "tecnico" | "produtor" | "parceiro" | "comprador" | null;
  status: "ativo" | "inativo" | "suspenso" | null;
  telefone: string | null;
  cargo: string | null;
  registroProfissional: string | null;
  perfilCreatedAt: Date | null;
};

// ─── Listagem e Busca ─────────────────────────────────────────────────────────

export async function listarUsuariosCompletos(opts?: {
  busca?: string;
  role?: "user" | "admin";
  status?: "ativo" | "inativo" | "suspenso";
  limit?: number;
  offset?: number;
}): Promise<UsuarioCompleto[]> {
  const db = await getDb();
  if (!db) return [];

  const allUsers = await db
    .select()
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(opts?.limit ?? 100)
    .offset(opts?.offset ?? 0);

  const allPerfis = await db.select().from(usuariosAfu);
  const perfilMap = new Map(allPerfis.map((p) => [p.userId, p]));

  let result: UsuarioCompleto[] = allUsers.map((u) => {
    const perfil = perfilMap.get(u.id) ?? null;
    return {
      userId: u.id,
      openId: u.openId ?? '',
      name: u.name,
      email: u.email,
      loginMethod: u.loginMethod,
      role: u.role,
      lastSignedIn: u.lastSignedIn,
      userCreatedAt: u.createdAt,
      perfilId: perfil?.id ?? null,
      tipoUsuario: perfil?.tipoUsuario ?? null,
      status: perfil?.status ?? null,
      telefone: perfil?.telefone ?? null,
      cargo: perfil?.cargo ?? null,
      registroProfissional: perfil?.registroProfissional ?? null,
      perfilCreatedAt: perfil?.createdAt ?? null,
    };
  });

  if (opts?.busca) {
    const q = opts.busca.toLowerCase();
    result = result.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        (u.openId ?? '').toLowerCase().includes(q),
    );
  }
  if (opts?.role) result = result.filter((u) => u.role === opts.role);
  if (opts?.status) result = result.filter((u) => u.status === opts.status);

  return result;
}

export async function getUsuarioCompletoById(userId: number): Promise<UsuarioCompleto | null> {
  const db = await getDb();
  if (!db) return null;

  const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (userRows.length === 0) return null;
  const u = userRows[0];

  const perfilRows = await db.select().from(usuariosAfu).where(eq(usuariosAfu.userId, userId)).limit(1);
  const perfil = perfilRows[0] ?? null;

  return {
    userId: u.id,
    openId: u.openId ?? '',
    name: u.name,
    email: u.email,
    loginMethod: u.loginMethod,
    role: u.role,
    lastSignedIn: u.lastSignedIn,
    userCreatedAt: u.createdAt,
    perfilId: perfil?.id ?? null,
    tipoUsuario: perfil?.tipoUsuario ?? null,
    status: perfil?.status ?? null,
    telefone: perfil?.telefone ?? null,
    cargo: perfil?.cargo ?? null,
    registroProfissional: perfil?.registroProfissional ?? null,
    perfilCreatedAt: perfil?.createdAt ?? null,
  };
}

// ─── Atualização de Role ──────────────────────────────────────────────────────

export async function setUserRole(userId: number, role: "user" | "admin"): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// ─── Gestão de Perfil AFU ─────────────────────────────────────────────────────

export async function setStatusPerfilAfu(
  perfilId: number,
  status: "ativo" | "inativo" | "suspenso",
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(usuariosAfu).set({ status }).where(eq(usuariosAfu.id, perfilId));
}

export async function setTipoUsuarioAfu(
  perfilId: number,
  tipoUsuario: InsertUsuarioAfu["tipoUsuario"],
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(usuariosAfu).set({ tipoUsuario }).where(eq(usuariosAfu.id, perfilId));
}

export async function upsertPerfilAfu(
  userId: number,
  data: Omit<InsertUsuarioAfu, "userId">,
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(usuariosAfu).where(eq(usuariosAfu.userId, userId)).limit(1);

  if (existing.length > 0) {
    await db.update(usuariosAfu).set({ ...data, updatedAt: new Date() }).where(eq(usuariosAfu.userId, userId));
    return existing[0].id;
  } else {
    const result = await db.insert(usuariosAfu).values({ ...data, userId });
    return result[0].insertId;
  }
}

// ─── Autenticação com E-mail/Senha ───

/**
 * Hash de senha usando PBKDF2
 */
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      const hash = `${salt}:${derivedKey.toString('hex')}`;
      resolve(hash);
    });
  });
}

/**
 * Verificar senha contra hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(':');
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(key === derivedKey.toString('hex'));
    });
  });
}

/**
 * Criar novo usuário com e-mail e senha
 */
export async function createUserWithEmail(data: {
  email: string;
  password: string;
  name: string;
  profile: 'produtor' | 'tecnico' | 'administrador';
}): Promise<{ userId: number; email: string; name: string; openId: string }> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    // Hash da senha
    const passwordHash = await hashPassword(data.password);

    // Gerar openId único para usuários de e-mail
    const openId = `email_${crypto.randomUUID()}`;

    // Criar usuário base
    const result = await db.insert(users).values({
      openId,
      email: data.email,
      name: data.name,
      passwordHash,
      loginMethod: 'email',
      emailVerified: false,
      role: 'user',
    });

    const userId = Number(result[0].insertId);

    // Criar perfil AFU
    await db.insert(usuariosAfu).values({
      userId,
      nome: data.name,
      email: data.email,
      tipoUsuario: data.profile,
      status: 'ativo',
    });

    return {
      userId,
      openId,
      email: data.email,
      name: data.name,
    };
  } catch (error) {
    console.error('[db-auth] Erro ao criar usuário:', error);
    throw error;
  }
}

/**
 * Fazer login com e-mail e senha
 */
export async function loginWithEmail(email: string, password: string): Promise<UserPublic> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  try {
    // Buscar usuário por e-mail
    const userRows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (userRows.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = userRows[0];

    // Verificar senha
    if (!user.passwordHash) {
      throw new Error('User does not have a password set');
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Se usuário não tem openId (criado antes da correção), gerar um
    let openId = user.openId;
    if (!openId) {
      openId = `email_${crypto.randomUUID()}`;
      await db.update(users).set({
        openId,
        lastSignedIn: new Date(),
      }).where(eq(users.id, user.id));
    } else {
      // Atualizar lastSignedIn
      await db.update(users).set({
        lastSignedIn: new Date(),
      }).where(eq(users.id, user.id));
    }

    // Retornar sem passwordHash, com openId atualizado
    const { passwordHash: _, ...userPublic } = { ...user, openId };
    return userPublic as UserPublic;
  } catch (error) {
    console.error('[db-auth] Erro ao fazer login:', error);
    throw error;
  }
}

/**
 * Verificar se e-mail já existe
 */
export async function emailExists(email: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const userRows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return userRows.length > 0;
  } catch (error) {
    console.error('[db-auth] Erro ao verificar e-mail:', error);
    return false;
  }
}

// ─── Estatísticas para Dashboard Admin ───────────────────────────────────────

export type EstatisticasUsuarios = {
  totalUsuarios: number;
  totalAdmins: number;
  totalAtivos: number;
  totalSuspensos: number;
  totalSemPerfil: number;
  porTipo: Record<string, number>;
};

export async function getEstatisticasUsuarios(): Promise<EstatisticasUsuarios> {
  const db = await getDb();
  if (!db) {
    return { totalUsuarios: 0, totalAdmins: 0, totalAtivos: 0, totalSuspensos: 0, totalSemPerfil: 0, porTipo: {} };
  }

  const allUsers = await db.select().from(users);
  const allPerfis = await db.select().from(usuariosAfu);
  const perfilUserIds = new Set(allPerfis.map((p) => p.userId));

  const porTipo: Record<string, number> = {};
  for (const p of allPerfis) {
    porTipo[p.tipoUsuario] = (porTipo[p.tipoUsuario] ?? 0) + 1;
  }

  return {
    totalUsuarios: allUsers.length,
    totalAdmins: allUsers.filter((u) => u.role === "admin").length,
    totalAtivos: allPerfis.filter((p) => p.status === "ativo").length,
    totalSuspensos: allPerfis.filter((p) => p.status === "suspenso").length,
    totalSemPerfil: allUsers.filter((u) => !perfilUserIds.has(u.id)).length,
    porTipo,
  };
}
