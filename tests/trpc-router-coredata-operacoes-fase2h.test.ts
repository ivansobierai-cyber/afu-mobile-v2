import { describe, expect, it } from "vitest";
import { appRouter } from "@/server/routers";
import { coreDataRouter } from "@/server/routers/core-data-router";
import { operacoesRouter } from "@/server/routers/operacoes-router";
import type { TrpcContext } from "@/server/_core/context";

function minimalCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("tRPC router wiring (FASE 2H)", () => {
  it("registra createApontamento em operacoesRouter", () => {
    const record = (operacoesRouter as { _def: { record: Record<string, unknown> } })._def.record;
    expect(record.createApontamento).toBeDefined();
    expect((record.createApontamento as { _def: { type: string } })._def.type).toBe("mutation");
  });

  it("monta coreData.operacoes com createApontamento", () => {
    const operacoes = (coreDataRouter as { _def: { record: Record<string, unknown> } })._def.record
      .operacoes as { createApontamento?: unknown };
    expect(operacoes?.createApontamento).toBeDefined();
  });

  it("expõe coreData.operacoes.createApontamento no caller do appRouter", () => {
    const caller = appRouter.createCaller(minimalCtx());
    expect(typeof caller.coreData.operacoes.createApontamento).toBe("function");
    expect(typeof caller.coreData.operacoes.listApontamentos).toBe("function");
    expect(typeof caller.coreData.operacoes.updateApontamento).toBe("function");
  });
});
