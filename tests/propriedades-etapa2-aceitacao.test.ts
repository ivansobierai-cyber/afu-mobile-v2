/**
 * Aceite consolidado — correção Etapa 2 do painel (etapas 1–9).
 * Roda sem MySQL (contratos puros). Integração com DB fica em safras-entity.
 */
import { describe, expect, it } from "vitest";
import { adminMenuVisibility, resolveCultivosShortcutValue } from "@/lib/propriedades/overview-counts";
import {
  confirmNameMatches,
  resolveCanRegister,
  resolveSafraBannerKind,
  resolveWorkspaceMode,
  resolveWorkspaceSafra,
  type WorkspaceSafra,
} from "@/lib/propriedades/property-workspace";
import { buildCompleteness, filterRowsBySafraId } from "@/lib/propriedades/safra-filter";
import {
  buildCultivoDetailHref,
  buildPropertyEditHref,
  buildPropertyReturnHref,
  buildTerrenosManageHref,
  parsePropertyReturnParams,
  resolvePanelQueryUiStatus,
  resolveRegistrarTarget,
} from "@/lib/propriedades/registrar-flow";
import { roleHasPermission } from "@/lib/security/org-roles";

const safras: WorkspaceSafra[] = [
  { id: 1, nome: "2024/25", status: "encerrada", isDefault: false },
  { id: 2, nome: "2025/26", status: "ativa", isDefault: true },
];

describe("aceitação painel propriedades (Etapa 10 / correção Etapa 2)", () => {
  describe("regra central — histórico vs filtro parcial", () => {
    it("não libera histórico sem filtragem completa", () => {
      expect(
        resolveWorkspaceMode({ safraStatus: "encerrada", filterComplete: false }),
      ).toBe("current");
      expect(
        resolveSafraBannerKind({ safraStatus: "encerrada", filterComplete: false }),
      ).toBe("partial_period");
    });

    it("libera histórico só com complete + encerrada/arquivada", () => {
      expect(
        resolveWorkspaceMode({ safraStatus: "encerrada", filterComplete: true }),
      ).toBe("historical");
      expect(
        resolveSafraBannerKind({ safraStatus: "arquivada", filterComplete: true }),
      ).toBe("historical");
      expect(
        resolveSafraBannerKind({ safraStatus: "ativa", filterComplete: true }),
      ).toBe("none");
    });

    it("bloqueia + Registrar em modo histórico", () => {
      expect(
        resolveCanRegister({
          mode: "historical",
          canWriteProperty: true,
          canWriteOperations: true,
        }),
      ).toBe(false);
      expect(
        resolveCanRegister({
          mode: "current",
          canWriteProperty: false,
          canWriteOperations: true,
        }),
      ).toBe(true);
    });
  });

  describe("workspace + filtro safra", () => {
    it("URL inválida não mistura safras", () => {
      const { safra, invalidUrl } = resolveWorkspaceSafra({ safras, urlSafraId: 999 });
      expect(invalidUrl).toBe(true);
      expect(safra).toBeNull();
    });

    it("filtra órfãos e marca completeness partial", () => {
      const rows = [{ safraId: 2 }, { safraId: null }, { safraId: 1 }];
      const r = filterRowsBySafraId(rows, 2);
      expect(r.matched).toHaveLength(1);
      expect(r.orphans).toBe(1);
      expect(
        buildCompleteness({ safraId: 2, orphanCounts: { tarefas: 1 } }).status,
      ).toBe("partial");
    });
  });

  describe("+ Registrar contextual", () => {
    it("mapeia ações para aba/formulário", () => {
      expect(resolveRegistrarTarget("tarefa").tab).toBe("operacoes");
      expect(resolveRegistrarTarget("ocorrencia").maisSection).toBe("monitoramento");
      expect(resolveRegistrarTarget("cultivo").tab).toBe("cultivos");
      expect(resolveRegistrarTarget("talhao").externalRoute).toBe("terrenos");
    });

    it("preserva returnTab/safraId no talhão", () => {
      const href = buildTerrenosManageHref({
        propriedadeId: 1,
        safraId: 2,
        returnTab: "talhoes",
        openCreate: true,
      });
      expect(href).toContain("openCreate=1");
      expect(href).toContain("safraId=2");
    });
  });

  describe("navegação de retorno", () => {
    it("edit e cultivo voltam ao painel", () => {
      expect(buildPropertyEditHref({ propriedadeId: 9, tab: "mais", safraId: 2 })).toContain(
        "returnTo=propriedade",
      );
      expect(
        buildCultivoDetailHref({
          cultivoId: 3,
          propriedadeId: 9,
          tab: "cultivos",
          safraId: 2,
        }),
      ).toContain("returnTab=cultivos");
      expect(
        parsePropertyReturnParams({
          propriedadeId: "9",
          returnTab: "mapa",
          safraId: "2",
        }),
      ).toEqual({ propriedadeId: 9, tab: "mapa", safraId: 2 });
      expect(buildPropertyReturnHref({ propriedadeId: 9, tab: "mapa", safraId: 2 })).toBe(
        "/propriedades/9?tab=mapa&safraId=2",
      );
    });
  });

  describe("RBAC + exclusão tipada", () => {
    it("auditor não arquiva/exclui; proprietário exclui", () => {
      expect(roleHasPermission("auditor", "property.archive")).toBe(false);
      expect(roleHasPermission("auditor", "property.delete")).toBe(false);
      expect(roleHasPermission("proprietario", "property.delete")).toBe(true);
      const vis = adminMenuVisibility({
        canWriteProperty: true,
        canExport: true,
        canArchiveProperty: true,
        canDeleteProperty: false,
      });
      expect(vis.showArquivar).toBe(true);
      expect(vis.showExcluir).toBe(false);
    });

    it("confirmNome exige match exato (trim)", () => {
      expect(confirmNameMatches("Fazenda X", "Fazenda X")).toBe(true);
      expect(confirmNameMatches("Fazenda X", "  Fazenda X  ")).toBe(true);
      expect(confirmNameMatches("Fazenda X", "fazenda x")).toBe(false);
    });
  });

  describe("estados de UI", () => {
    it("atalho Cultivos não confunde 0 ativos com vazio", () => {
      expect(
        resolveCultivosShortcutValue({
          label: "Cultivos",
          cultivosAtivos: 0,
          cultivosCount: 4,
        }),
      ).toBe(4);
    });

    it("prioridade offline > loading > error > empty", () => {
      expect(
        resolvePanelQueryUiStatus({ isOnline: false, isEmpty: true }),
      ).toBe("offline");
      expect(resolvePanelQueryUiStatus({ isLoading: true })).toBe("loading");
      expect(resolvePanelQueryUiStatus({ isError: true })).toBe("error");
      expect(resolvePanelQueryUiStatus({ isEmpty: true })).toBe("empty");
      expect(resolvePanelQueryUiStatus({})).toBe("ready");
    });
  });
});
