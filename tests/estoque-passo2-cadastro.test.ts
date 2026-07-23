/**
 * Etapa 7 Passo 2 — cadastro de insumos: categorias + unidade padrão obrigatória.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createIsolatedTenantPair, type TenantFixture } from "./helpers/tenant-fixture";

const hasDb = Boolean(process.env.DATABASE_URL);

const CATEGORIAS = [
  "fertilizante",
  "defensivo",
  "herbicida",
  "fungicida",
  "inseticida",
  "semente",
  "combustivel",
  "peca",
  "ferramenta",
  "outro",
] as const;

describe.skipIf(!hasDb)("Etapa 7 Passo 2 — cadastro insumos", () => {
  let a: TenantFixture;

  beforeAll(async () => {
    if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test_jwt_estoque_p2";
    ({ a } = await createIsolatedTenantPair());
  }, 120_000);

  it("persiste categoria, unidade, mínimo, fabricante e observações", async () => {
    const id = await a.caller.coreData.expansao.estoque.createItem({
      propriedadeId: a.propriedadeId,
      nome: "Glifosato 480",
      categoria: "herbicida",
      unidadeBase: "L",
      estoqueMinimo: 5,
      fabricante: "AgroChem",
      observacoes: "Armazenar coberto",
    });
    expect(id).toBeGreaterThan(0);

    const { getDb } = await import("../server/db");
    const { estoqueItens } = await import("../drizzle/schema");
    const db = await getDb();
    const rows = await db!.select().from(estoqueItens).where(eq(estoqueItens.id, id)).limit(1);
    expect(rows[0]?.categoria).toBe("herbicida");
    expect(rows[0]?.unidadeBase).toBe("L");
    expect(Number(rows[0]?.estoqueMinimo)).toBe(5);
    expect(rows[0]?.fabricante).toBe("AgroChem");
    expect(rows[0]?.observacoes).toBe("Armazenar coberto");
    expect(rows[0]?.organizationId).toBe(a.organizationId);
  });

  it("aceita todas as categorias do plano", async () => {
    for (const categoria of CATEGORIAS) {
      const id = await a.caller.coreData.expansao.estoque.createItem({
        propriedadeId: a.propriedadeId,
        nome: `Item ${categoria}`,
        categoria,
        unidadeBase: "kg",
      });
      expect(id).toBeGreaterThan(0);
    }
  });

  it("sempre grava unidade padrão (default kg quando omitida)", async () => {
    const id = await a.caller.coreData.expansao.estoque.createItem({
      propriedadeId: a.propriedadeId,
      nome: "Semente sem unidade explícita",
      categoria: "semente",
    });
    const { getDb } = await import("../server/db");
    const { estoqueItens } = await import("../drizzle/schema");
    const db = await getDb();
    const rows = await db!.select().from(estoqueItens).where(eq(estoqueItens.id, id)).limit(1);
    expect(rows[0]?.unidadeBase).toBeTruthy();
    expect(String(rows[0]?.unidadeBase).trim().length).toBeGreaterThan(0);
  });

  it("rejeita unidade vazia no servidor", async () => {
    await expect(
      a.caller.coreData.expansao.estoque.createItem({
        propriedadeId: a.propriedadeId,
        nome: "Sem unidade",
        unidadeBase: "   ",
      }),
    ).rejects.toThrow();
  });
});
