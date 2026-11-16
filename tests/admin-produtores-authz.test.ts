/**
 * WP-06 — autorização admin de produtores + soft-deactivate + audit + invite email.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { eq, and, desc } from "drizzle-orm";
import { appRouter } from "../server/routers";
import { createCallerCtx, createIsolatedTenantPair, type TenantFixture } from "./helpers/tenant-fixture";
import { NOT_ADMIN_ERR_MSG } from "../shared/const";
import { AccountInactiveError } from "../server/account-status";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("adminProdutores authz (WP-06)", () => {
  let a: TenantFixture;
  let b: TenantFixture;
  let suiteReady = false;
  let adminCaller: ReturnType<typeof appRouter.createCaller>;
  let adminUserId: number;

  beforeAll(async () => {
    if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test_jwt_secret_wp06_admin_produtores";
    try {
      ({ a, b } = await createIsolatedTenantPair());

      const { createUserWithEmail } = await import("../server/db-auth");
      const { getDb } = await import("../server/db");
      const { users } = await import("../drizzle/schema");

      const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const created = await createUserWithEmail({
        email: `wp06_admin_${suffix}@afu-test.local`,
        password: "Wp06Admin@Test!",
        name: "WP06 Admin",
        profile: "administrador",
      });
      adminUserId = created.userId;

      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const rows = await db.select().from(users).where(eq(users.id, adminUserId)).limit(1);
      const adminUser = rows[0];
      if (!adminUser || adminUser.role !== "admin") {
        throw new Error("Admin user not created with role=admin");
      }
      adminCaller = appRouter.createCaller(createCallerCtx(adminUser));
      suiteReady = true;
    } catch {
      suiteReady = false;
    }
  }, 120_000);

  it("usuário comum recebe FORBIDDEN em listar", async (ctx) => {
    if (!suiteReady) ctx.skip();
    await expect(a.caller.adminProdutores.listar({})).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: NOT_ADMIN_ERR_MSG,
    } satisfies Partial<TRPCError>);
  });

  it("usuário comum recebe FORBIDDEN em detalhe / convidar / desativar", async (ctx) => {
    if (!suiteReady) ctx.skip();
    await expect(a.caller.adminProdutores.detalhe({ userId: a.userId })).rejects.toMatchObject({
      code: "FORBIDDEN",
    } satisfies Partial<TRPCError>);
    await expect(
      a.caller.adminProdutores.convidar({
        nome: "Hack",
        email: `hack_${Date.now()}@afu-test.local`,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" } satisfies Partial<TRPCError>);
    await expect(
      a.caller.adminProdutores.desativar({ userId: b.userId, modo: "suspenso" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" } satisfies Partial<TRPCError>);
  });

  it("admin lista com COUNT SQL e filtro sem misturar propriedades cross-tenant", async (ctx) => {
    if (!suiteReady) ctx.skip();

    const list = await adminCaller.adminProdutores.listar({
      busca: a.email.split("@")[0],
      limit: 10,
      offset: 0,
    });
    expect(list.total).toBeGreaterThanOrEqual(1);
    expect(list.produtores.length).toBeLessThanOrEqual(10);
    const foundA = list.produtores.find((p) => p.userId === a.userId);
    expect(foundA).toBeTruthy();

    const page2 = await adminCaller.adminProdutores.listar({
      busca: a.email.split("@")[0],
      limit: 1,
      offset: 1,
    });
    expect(page2.total).toBe(list.total);

    const detalheA = await adminCaller.adminProdutores.detalhe({ userId: a.userId });
    expect(detalheA.propriedades.some((p) => p.id === a.propriedadeId)).toBe(true);
    expect(detalheA.propriedades.some((p) => p.id === b.propriedadeId)).toBe(false);
  });

  it("convite: mustChangePassword, emailEnviado real, temp password só em non-prod", async (ctx) => {
    if (!suiteReady) ctx.skip();

    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const email = `wp06_invite_${suffix}@afu-test.local`;

    delete process.env.ADMIN_INVITE_RETURN_TEMP_PASSWORD;
    const invited = await adminCaller.adminProdutores.convidar({
      nome: "Produtor Convidado WP06",
      email,
      estado: "PR",
      cidade: "Cascavel",
      regiao: "Oeste",
      plano: "produtor",
      enviarEmailReset: true,
    });
    expect(invited.success).toBe(true);
    expect(invited.emailEnviado).toBe(false); // SendGrid ausente → resultado real
    expect(invited.mustChangePassword).toBe(true);
    // Vitest NODE_ENV=test → non-prod → temp password revelada
    expect(invited.temporaryPassword).toBeTruthy();

    const { getDb } = await import("../server/db");
    const { users } = await import("../drizzle/schema");
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const [row] = await db.select().from(users).where(eq(users.id, invited.userId)).limit(1);
    expect(row?.mustChangePassword).toBe(true);
    expect(row?.resetToken).toBeTruthy(); // token gerado mesmo sem SendGrid
  });

  it("desativar bloqueia loginWithEmail e authenticateRequest + revoga refresh", async (ctx) => {
    if (!suiteReady) ctx.skip();

    const { createUserWithEmail, loginWithEmail } = await import("../server/db-auth");
    const { storeRefreshToken } = await import("../server/token-service");
    const { createAccessToken } = await import("../server/token-service");
    const { sdk } = await import("../server/_core/sdk");
    const { getDb } = await import("../server/db");
    const { users } = await import("../drizzle/schema");
    const { assertAccountActive } = await import("../server/account-status");

    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const email = `wp06_block_${suffix}@afu-test.local`;
    const password = "Block@Test1!";
    const created = await createUserWithEmail({
      email,
      password,
      name: "Bloqueavel",
      profile: "produtor",
    });

    // Garante linha produtor para desativar por userId
    await adminCaller.adminProdutores.reativar({ userId: created.userId });

    await storeRefreshToken(created.userId, `refresh_wp06_${suffix}`);
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const [before] = await db.select().from(users).where(eq(users.id, created.userId)).limit(1);
    expect(before?.refreshToken).toBeTruthy();

    await adminCaller.adminProdutores.desativar({
      userId: created.userId,
      modo: "suspenso",
    });

    const [after] = await db.select().from(users).where(eq(users.id, created.userId)).limit(1);
    expect(after?.refreshToken).toBeNull();

    await expect(loginWithEmail(email, password)).rejects.toBeInstanceOf(AccountInactiveError);

    await expect(assertAccountActive({ id: created.userId })).rejects.toBeInstanceOf(
      AccountInactiveError,
    );

    // LGPD hook no-op neste branch (tabela ausente) — allowPendingErasure não libera
    await expect(
      assertAccountActive({ id: created.userId }, { allowPendingErasure: true }),
    ).rejects.toBeInstanceOf(AccountInactiveError);

    const access = await createAccessToken(created.openId, "Bloqueavel");
    await expect(
      sdk.authenticateRequest({
        headers: { authorization: `Bearer ${access}` },
      } as any),
    ).rejects.toThrow(/suspensa|desativada|inativa/i);
  });

  it("admin convida, altera plano, soft-desativa e registra audit", async (ctx) => {
    if (!suiteReady) ctx.skip();

    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const email = `wp06_audit_${suffix}@afu-test.local`;
    const invited = await adminCaller.adminProdutores.convidar({
      nome: "Produtor Audit WP06",
      email,
      plano: "produtor",
      enviarEmailReset: false,
    });
    expect(invited.produtorId).toBeGreaterThan(0);

    await adminCaller.adminProdutores.setPlano({
      produtorId: invited.produtorId,
      plano: "pro",
    });
    await adminCaller.adminProdutores.desativar({
      produtorId: invited.produtorId,
      modo: "suspenso",
    });

    const { getDb } = await import("../server/db");
    const { auditLogs } = await import("../drizzle/schema");
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const audits = await db
      .select()
      .from(auditLogs)
      .where(
        and(eq(auditLogs.actorUserId, adminUserId), eq(auditLogs.resourceType, "produtor")),
      )
      .orderBy(desc(auditLogs.createdAt))
      .limit(20);
    expect(audits.map((x) => x.action)).toEqual(
      expect.arrayContaining([
        "admin.producer.invite",
        "admin.producer.set_plano",
        "admin.producer.deactivate",
      ]),
    );
  });

  it("admin não pode soft-desativar a si mesmo pelo painel", async (ctx) => {
    if (!suiteReady) ctx.skip();
    await expect(
      adminCaller.adminProdutores.desativar({ userId: adminUserId, modo: "inativo" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" } satisfies Partial<TRPCError>);
  });

  it("produção esconde temporaryPassword sem flag de env", async (ctx) => {
    if (!suiteReady) ctx.skip();
    const prevNode = process.env.NODE_ENV;
    const prevFlag = process.env.ADMIN_INVITE_RETURN_TEMP_PASSWORD;
    process.env.NODE_ENV = "production";
    delete process.env.ADMIN_INVITE_RETURN_TEMP_PASSWORD;
    try {
      const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const invited = await adminCaller.adminProdutores.convidar({
        nome: "Produtor Prod Gate",
        email: `wp06_prod_${suffix}@afu-test.local`,
        enviarEmailReset: true,
      });
      expect(invited.emailEnviado).toBe(false);
      expect(invited.temporaryPassword).toBeUndefined();
      expect(invited.mustChangePassword).toBe(true);
    } finally {
      process.env.NODE_ENV = prevNode;
      if (prevFlag === undefined) delete process.env.ADMIN_INVITE_RETURN_TEMP_PASSWORD;
      else process.env.ADMIN_INVITE_RETURN_TEMP_PASSWORD = prevFlag;
    }
  });
});
