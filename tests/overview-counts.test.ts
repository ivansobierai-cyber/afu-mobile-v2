import { describe, expect, it } from "vitest";
import {
  adminMenuVisibility,
  resolveCultivosShortcutValue,
} from "@/lib/propriedades/overview-counts";

describe("overview-counts (correção Etapa 1)", () => {
  it("não trata zero ativos como ausência — atalho Cultivos usa total", () => {
    expect(
      resolveCultivosShortcutValue({
        label: "Cultivos",
        cultivosAtivos: 0,
        cultivosCount: 5,
      }),
    ).toBe(5);
  });

  it("atalho Cultivos ativos usa apenas ativos", () => {
    expect(
      resolveCultivosShortcutValue({
        label: "Cultivos ativos",
        cultivosAtivos: 0,
        cultivosCount: 5,
      }),
    ).toBe(0);
  });

  it("RBAC UI: auditor sem write/delete; export só com reports.export", () => {
    expect(
      adminMenuVisibility({
        canWriteProperty: false,
        canExport: true,
        canDeleteProperty: false,
      }),
    ).toEqual({
      showEditar: false,
      showExportar: true,
      showArquivar: false,
      showExcluir: false,
    });
  });

  it("arquivar nunca aparece enquanto não implementado", () => {
    const vis = adminMenuVisibility({
      canWriteProperty: true,
      canExport: true,
      canDeleteProperty: true,
    });
    expect(vis.showArquivar).toBe(false);
    expect(vis.showExcluir).toBe(true);
  });
});
