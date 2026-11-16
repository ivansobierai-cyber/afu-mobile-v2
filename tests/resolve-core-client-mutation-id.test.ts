import { describe, expect, it } from "vitest";
import { resolveCoreClientMutationId } from "@/lib/offline/core-mutation-queue";

describe("resolveCoreClientMutationId (WP-05)", () => {
  it("reusa clientMutationId estável do payload", () => {
    expect(
      resolveCoreClientMutationId({
        titulo: "X",
        clientMutationId: "tarefa_abc12345",
      }),
    ).toBe("tarefa_abc12345");
  });

  it("ignora ids curtos demais e gera fallback", () => {
    const id = resolveCoreClientMutationId({ clientMutationId: "short" }, "live");
    expect(id.startsWith("live_")).toBe(true);
    expect(id.length).toBeGreaterThanOrEqual(8);
  });

  it("trunca ids longos em 64 chars", () => {
    const long = `cm_${"x".repeat(80)}`;
    expect(resolveCoreClientMutationId({ clientMutationId: long }).length).toBe(64);
  });
});
