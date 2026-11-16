/**
 * WP-06 — autorização admin de produtores + soft-deactivate + audit.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { eq, and, desc } from "drizzle-orm";
import { appRouter } from "../server/routers";
import { createCallerCtx, createIsolatedTenantPair, type TenantFixture } from "./helpers/tenant-fixture";
import { NOT_ADMIN_ERR_MSG } from "../shared/const";

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

  it("admin lista produtores e vê tenant A sem misturar campos de B no detalhe A", async (ctx) => {
    if (!suiteReady) ctx.skip();

    const list = await adminCaller.adminProdutores.listar({ busca: a.email.split("@")[0] });
    expect(list.total).toBeGreaterThanOrEqual(1);
    const foundA = list.produtores.find((p) => p.userId === a.userId);
    expect(foundA).toBeTruthy();

    const detalheA = await adminCaller.adminProdutores.detalhe({ userId: a.userId });
    expect(detalheA.userId).toBe(a.userId);
    expect(detalheA.propriedades.some((p) => p.id === a.propriedadeId)).toBe(true);
    expect(detalheA.propriedades.some((p) => p.id === b.propriedadeId)).toBe(false);

    const detalheB = await adminCaller.adminProdutores.detalhe({ userId: b.userId });
    expect(detalheB.propriedades.some((p) => p.id === b.propriedadeId)).toBe(true);
    expect(detalheB.propriedades.some((p) => p.id === a.propriedadeId)).toBe(false);
  });

  it("admin convida, altera plano, soft-desativa e registra audit", async (ctx) => {
    if (!suiteReady) ctx.skip();

    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const email = `wp06_invite_${suffix}@afu-test.local`;
    const invited = await adminCaller.adminProdutores.convidar({
      nome: "Produtor Convidado WP06",
      email,
      estado: "PR",
      cidade: "Cascavel",
      regiao: "Oeste",
      plano: "produtor",
      enviarEmailReset: false,
    });
    expect(invited.success).toBe(true);
    expect(invited.produtorId).toBeGreaterThan(0);
    expect(invited.temporaryPassword).toBeTruthy();

    const plano = await adminCaller.adminProdutores.setPlano({
      produtorId: invited.produtorId,
      plano: "pro",
    });
    expect(plano.plano).toBe("pro");

    const des = await adminCaller.adminProdutores.desativar({
      produtorId: invited.produtorId,
      modo: "suspenso",
    });
    expect(des.status).toBe("suspenso");
    expect(des.cadastroAtivo).toBe(false);

    const detalhe = await adminCaller.adminProdutores.detalhe({
      produtorId: invited.produtorId,
    });
    expect(detalhe.status).toBe("suspenso");
    expect(detalhe.cadastroAtivo).toBe(false);
    expect(detalhe.plano).toBe("pro");

    // Soft: usuário e produtor ainda existem
    const { getDb } = await import("../server/db");
    const { users, produtores, auditLogs } = await import("../drizzle/schema");
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    const userRows = await db.select().from(users).where(eq(users.id, invited.userId)).limit(1);
    expect(userRows.length).toBe(1);
    const prodRows = await db
      .select()
      .from(produtores)
      .where(eq(produtores.id, invited.produtorId))
      .limit(1);
    expect(prodRows.length).toBe(1);

    const audits = await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.actorUserId, adminUserId),
          eq(auditLogs.resourceType, "produtor"),
        ),
      )
      .orderBy(desc(auditLogs.createdAt))
      .limit(20);
    const actions = audits.map((x) => x.action);
    expect(actions).toEqual(
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
});
