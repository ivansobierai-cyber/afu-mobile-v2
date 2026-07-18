/**
 * Fixtures isoladas para Etapa 10 — dois tenants (A/B) em MySQL local.
 */
import { expect } from "vitest";
import type { TrpcContext } from "../../server/_core/context";
import type { User } from "../../drizzle/schema";
import { appRouter } from "../../server/routers";

export type TenantFixture = {
  label: "A" | "B";
  userId: number;
  openId: string;
  email: string;
  perfilId: number;
  organizationId: number;
  membershipId: number;
  propriedadeId: number;
  terrenoId: number;
  relatorioId: number;
  storageKey: string;
  user: User;
  caller: ReturnType<typeof appRouter.createCaller>;
};

function uniqueSuffix(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createCallerCtx(user: User): TrpcContext {
  return {
    user,
    req: {
      protocol: "http",
      headers: { "user-agent": "etapa10-vitest", "x-forwarded-for": "127.0.0.1" },
    } as TrpcContext["req"],
    res: {
      clearCookie: () => undefined,
      cookie: () => undefined,
    } as TrpcContext["res"],
  };
}

async function createOneTenant(label: "A" | "B"): Promise<TenantFixture> {
  const suffix = uniqueSuffix();
  const email = `etapa10_${label.toLowerCase()}_${suffix}@afu-test.local`;

  const { createUserWithEmail } = await import("../../server/db-auth");
  const { ensurePersonalOrganization } = await import("../../server/db-organizations");
  const { getDb, createRelatorio } = await import("../../server/db");
  const { registerPrivateFile, buildTenantStorageKey } = await import(
    "../../server/private-files"
  );
  const { users, usuariosAfu, organizationMemberships } = await import(
    "../../drizzle/schema"
  );
  const { eq, and } = await import("drizzle-orm");

  const created = await createUserWithEmail({
    email,
    password: "Etapa10@Test!",
    name: `Etapa10 Tenant ${label}`,
    profile: "produtor",
  });

  const { organizationId } = await ensurePersonalOrganization(created.userId);

  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  const perfilRows = await db
    .select()
    .from(usuariosAfu)
    .where(eq(usuariosAfu.userId, created.userId))
    .limit(1);
  const perfil = perfilRows[0];
  if (!perfil) throw new Error("Perfil AFU não criado");

  const membershipRows = await db
    .select()
    .from(organizationMemberships)
    .where(
      and(
        eq(organizationMemberships.userId, created.userId),
        eq(organizationMemberships.organizationId, organizationId),
      ),
    )
    .limit(1);
  const membershipId = membershipRows[0]?.id;
  if (!membershipId) throw new Error("Membership não criado");

  const userRows = await db.select().from(users).where(eq(users.id, created.userId)).limit(1);
  const user = userRows[0];
  if (!user) throw new Error("User row missing");

  const caller = appRouter.createCaller(createCallerCtx(user));

  const propriedadeId = await caller.coreData.propriedades.create({
    nome: `Fazenda ${label} ${suffix}`,
    cidade: "Teste",
    estado: "PR",
    tamanhoArea: 12,
    tipoProducao: "graos",
  });

  const terrenoId = await caller.coreData.terrenos.create({
    propriedadeId,
    nome: `Talhao ${label}`,
    area: 5,
  });

  const storageKey = buildTenantStorageKey(
    organizationId,
    "relatorio",
    `laudo_${label}_${suffix}.html`,
  );
  await registerPrivateFile({
    organizationId,
    storageKey,
    category: "relatorio",
    contentType: "text/html",
    originalName: `laudo_${label}.html`,
    sizeBytes: 32,
    createdByUserId: created.userId,
  });

  const relatorioId = await createRelatorio({
    titulo: `Relatorio ${label}`,
    tipoRelatorio: "diagnostico",
    usuarioId: perfil.id,
    organizationId,
    status: "emitido",
    arquivoPdfUrl: `/manus-storage/${storageKey}`,
    conteudo: JSON.stringify({ org: label, propriedadeId }),
  } as any);

  return {
    label,
    userId: created.userId,
    openId: created.openId,
    email,
    perfilId: perfil.id,
    organizationId,
    membershipId,
    propriedadeId,
    terrenoId,
    relatorioId,
    storageKey,
    user,
    caller,
  };
}

export async function createIsolatedTenantPair(): Promise<{
  a: TenantFixture;
  b: TenantFixture;
}> {
  const a = await createOneTenant("A");
  const b = await createOneTenant("B");
  if (a.organizationId === b.organizationId) {
    throw new Error("Fixtures A/B devem ter organizations distintas");
  }
  return { a, b };
}

/** Assert operação cross-tenant falha sem vazar existência (NOT_FOUND preferido). */
export async function expectTenantDenied(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
    throw new Error("Esperava negação cross-tenant, mas a operação sucedeu");
  } catch (e: unknown) {
    if (e instanceof Error && e.message.startsWith("Esperava negação")) throw e;
    const err = e as { code?: string; message?: string };
    expect(["NOT_FOUND", "FORBIDDEN", "UNAUTHORIZED"]).toContain(err.code);
    if (err.code === "NOT_FOUND") {
      expect(String(err.message)).toMatch(/não encontrado|nao encontrado|Recurso|Arquivo/i);
    }
    return `${err.code}:${err.message}`;
  }
}
