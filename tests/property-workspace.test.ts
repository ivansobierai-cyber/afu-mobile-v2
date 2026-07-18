import { describe, expect, it } from "vitest";
import {
  resolveWorkspaceMode,
  resolveWorkspaceSafra,
  type WorkspaceSafra,
} from "@/lib/propriedades/property-workspace";
import { buildCompleteness, filterRowsBySafraId } from "@/lib/propriedades/safra-filter";

const safras: WorkspaceSafra[] = [
  { id: 1, nome: "Safra 2025/26", status: "encerrada", isDefault: false },
  { id: 2, nome: "Safra 2026/27", status: "ativa", isDefault: true },
];

describe("property workspace (correção Etapa 3)", () => {
  it("prioriza safraId da URL quando válido", () => {
    const { safra, invalidUrl } = resolveWorkspaceSafra({ safras, urlSafraId: 1 });
    expect(safra?.id).toBe(1);
    expect(invalidUrl).toBe(false);
  });

  it("marca URL inválida e cai sem safra até correção", () => {
    const { safra, invalidUrl } = resolveWorkspaceSafra({ safras, urlSafraId: 999 });
    expect(safra).toBeNull();
    expect(invalidUrl).toBe(true);
  });

  it("usa default/ativa na ausência de URL", () => {
    const { safra } = resolveWorkspaceSafra({ safras, urlSafraId: null });
    expect(safra?.id).toBe(2);
  });

  it("não ativa mode historical sem filtragem completa", () => {
    expect(
      resolveWorkspaceMode({ safraStatus: "encerrada", filterComplete: false }),
    ).toBe("current");
    expect(
      resolveWorkspaceMode({ safraStatus: "encerrada", filterComplete: true }),
    ).toBe("historical");
    expect(resolveWorkspaceMode({ safraStatus: "ativa", filterComplete: true })).toBe(
      "current",
    );
  });
});

describe("safra filter (correção Etapa 4)", () => {
  it("exclui órfãos e outras safras", () => {
    const rows = [{ safraId: 2 }, { safraId: null }, { safraId: 1 }, { safraId: 2 }];
    const r = filterRowsBySafraId(rows, 2);
    expect(r.matched).toHaveLength(2);
    expect(r.orphans).toBe(1);
    expect(r.otherSafras).toBe(1);
  });

  it("completeness partial com órfãos", () => {
    const c = buildCompleteness({
      safraId: 2,
      orphanCounts: { tarefas: 1, cultivos: 0 },
    });
    expect(c.status).toBe("partial");
    expect(c.missing).toContain("tarefas");
  });

  it("completeness complete sem órfãos", () => {
    const c = buildCompleteness({
      safraId: 2,
      orphanCounts: { tarefas: 0, cultivos: 0 },
    });
    expect(c.status).toBe("complete");
  });
});
