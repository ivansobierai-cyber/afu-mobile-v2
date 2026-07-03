import type { User } from "../../drizzle/schema";
import { DEV_USER_OPEN_ID, isAuthDisabled } from "../../shared/dev-auth";
import { createUsuarioAfu, getUserByOpenId, getUsuarioAfuByUserId, upsertUser } from "../db";

const FALLBACK_DEV_USER: User = {
  id: 1,
  openId: DEV_USER_OPEN_ID,
  name: "Desenvolvedor AFU",
  email: "dev@afu.local",
  passwordHash: null,
  loginMethod: "email",
  role: "admin",
  emailVerified: true,
  resetToken: null,
  resetTokenExpiry: null,
  refreshToken: null,
  refreshTokenExpiry: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

/**
 * Garante um usuário admin de desenvolvimento quando auth está desativada.
 */
export async function ensureDevUser(): Promise<User | null> {
  if (!isAuthDisabled()) return null;

  try {
    let user = await getUserByOpenId(DEV_USER_OPEN_ID);

    if (!user) {
      await upsertUser({
        openId: DEV_USER_OPEN_ID,
        name: "Desenvolvedor AFU",
        email: "dev@afu.local",
        loginMethod: "email",
        role: "admin",
        lastSignedIn: new Date(),
      });
      user = await getUserByOpenId(DEV_USER_OPEN_ID);
    }

    if (!user) return FALLBACK_DEV_USER;

    const perfil = await getUsuarioAfuByUserId(user.id);
    if (!perfil) {
      await createUsuarioAfu({
        userId: user.id,
        nome: "Desenvolvedor AFU",
        email: "dev@afu.local",
        tipoUsuario: "administrador",
        status: "ativo",
      });
    }

    return user;
  } catch (error) {
    console.warn("[DevAuth] Using in-memory dev user:", error);
    return FALLBACK_DEV_USER;
  }
}
