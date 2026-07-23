/**
 * Etapa 7 Passo 1 — estrutura estoque: org obrigatória + isolamento por propriedade.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { createIsolatedTenantPair, type TenantFixture } from "./helpers/tenant-fixture";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("Etapa 7 Passo 1 — estrutura estoque", () => {
  let a: TenantFixture;
  let b: TenantFixture;

  beforeAll(async () => {
    if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test_jwt_estoque_p1";
    ({ a, b } = await createIsolatedTenantPair());
  }, 120_000);

  it("createItem exige organizationId e unidade padrão", async () => {
    const id = await a.caller.coreData.expansao.estoque.createItem({
      propriedadeId: a.propriedadeId,
      nome: "Ureia 45%",
      categoria: "fertilizante",
      estoqueMinimo: 10,
      fabricante: "Demo Agro",
    });
    expect(id).toBeGreaterThan(0);

    const { getDb } = await import("../server/db");
    const { estoqueItens } = await import("../drizzle/schema");
    const db = await getDb();
    expect(db).toBeTruthy();
    const rows = await db!.select().from(estoqueItens).where(eq(estoqueItens.id, id)).limit(1);
    expect(rows[0]?.organizationId).toBe(a.organizationId);
    expect(rows[0]?.propriedadeId).toBe(a.propriedadeId);
    expect(rows[0]?.unidadeBase).toBe("kg");
    expect(rows[0]?.createdByUserId).toBe(a.userId);
  });

  it("list estoque não vaza itens de outra propriedade/org", async () => {
    await b.caller.coreData.expansao.estoque.createItem({
      propriedadeId: b.propriedadeId,
      nome: "Insumo B secreto",
      categoria: "defensivo",
    });
    const listA = await a.caller.coreData.expansao.estoque.list({
      propriedadeId: a.propriedadeId,
    });
    expect(listA.every((i) => i.propriedadeId === a.propriedadeId)).toBe(true);
    expect(listA.every((i) => i.organizationId === a.organizationId)).toBe(true);
    expect(listA.some((i) => i.nome === "Insumo B secreto")).toBe(false);
  });

  it("A não registra movimento em item de B", async () => {
    const itemB = await b.caller.coreData.expansao.estoque.createItem({
      propriedadeId: b.propriedadeId,
      nome: "Item cross",
      saldoInicial: 5,
    });
    await expect(
      a.caller.coreData.expansao.estoque.movimento({
        itemId: itemB,
        propriedadeId: a.propriedadeId,
        tipo: "saida",
        quantidade: 1,
      }),
    ).rejects.toBeInstanceOf(TRPCError);
  });

  it("tabelas depósito/lote/reserva existem e aceitam insert com org+prop", async () => {
    const { getDb } = await import("../server/db");
    const { estoqueDepositos, estoqueLotes, estoqueReservas, estoqueItens } = await import(
      "../drizzle/schema"
    );
    const db = await getDb();
    expect(db).toBeTruthy();

    const dep = await db!.insert(estoqueDepositos).values({
      organizationId: a.organizationId,
      propriedadeId: a.propriedadeId,
      nome: "Galpão A",
      createdByUserId: a.userId,
    });
    const depositoId = dep[0].insertId;

    const itemRows = await db!
      .select()
      .from(estoqueItens)
      .where(eq(estoqueItens.propriedadeId, a.propriedadeId))
      .limit(1);
    const itemId = itemRows[0]?.id;
    expect(itemId).toBeTruthy();

    const lote = await db!.insert(estoqueLotes).values({
      organizationId: a.organizationId,
      propriedadeId: a.propriedadeId,
      itemId: itemId!,
      depositoId,
      codigo: `LOTE-${Date.now()}`,
      quantidadeInicial: "100.000",
      createdByUserId: a.userId,
    });
    expect(lote[0].insertId).toBeGreaterThan(0);

    const reserva = await db!.insert(estoqueReservas).values({
      organizationId: a.organizationId,
      propriedadeId: a.propriedadeId,
      itemId: itemId!,
      quantidade: "2.000",
      status: "ativa",
      createdByUserId: a.userId,
    });
    expect(reserva[0].insertId).toBeGreaterThan(0);
  });
});
