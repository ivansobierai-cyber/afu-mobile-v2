import { describe, expect, it } from "vitest";
import {
  buildCultivoDetailHref,
  buildCultivosCreateHref,
  buildPropertyEditHref,
  buildPropertyReturnHref,
  buildTerrenosManageHref,
  parsePropertyReturnParams,
  resolvePanelQueryUiStatus,
  resolveRegistrarTarget,
} from "@/lib/propriedades/registrar-flow";

describe("registrar-flow (Etapa 6)", () => {
  it("abre formulário de tarefa na aba operações", () => {
    expect(resolveRegistrarTarget("tarefa")).toEqual({
      tab: "operacoes",
      openCreate: true,
    });
  });

  it("abre formulário de ocorrência em Mais → monitoramento", () => {
    expect(resolveRegistrarTarget("ocorrencia")).toEqual({
      tab: "mais",
      maisSection: "monitoramento",
      openCreate: true,
    });
  });

  it("abre formulário de cultivo na aba cultivos", () => {
    expect(resolveRegistrarTarget("cultivo")).toEqual({
      tab: "cultivos",
      openCreate: true,
    });
  });

  it("envia talhão para rota externa com openCreate", () => {
    expect(resolveRegistrarTarget("talhao")).toEqual({
      tab: null,
      externalRoute: "terrenos",
      openCreate: true,
    });
  });

  it("preserva returnTab e safraId no href de talhões", () => {
    const href = buildTerrenosManageHref({
      propriedadeId: 12,
      safraId: 34,
      returnTab: "talhoes",
      openCreate: true,
    });
    expect(href).toContain("propriedadeId=12");
    expect(href).toContain("safraId=34");
    expect(href).toContain("returnTab=talhoes");
    expect(href).toContain("openCreate=1");
  });

  it("monta retorno à propriedade com tab e safraId", () => {
    expect(
      buildPropertyReturnHref({ propriedadeId: 7, tab: "talhoes", safraId: 9 }),
    ).toBe("/propriedades/7?tab=talhoes&safraId=9");
  });

  it("monta deep link de cultivos com contexto", () => {
    const href = buildCultivosCreateHref({
      propriedadeId: 3,
      safraId: 5,
      returnTab: "cultivos",
    });
    expect(href).toContain("propriedadeId=3");
    expect(href).toContain("safraId=5");
    expect(href).toContain("openCreate=1");
    expect(href).toContain("returnTab=cultivos");
  });
});

describe("navigation return (Etapa 8)", () => {
  it("monta edição com returnTo + tab + safraId", () => {
    const href = buildPropertyEditHref({
      propriedadeId: 10,
      tab: "mapa",
      safraId: 2,
    });
    expect(href).toContain("editId=10");
    expect(href).toContain("returnTo=propriedade");
    expect(href).toContain("returnTab=mapa");
    expect(href).toContain("safraId=2");
  });

  it("monta detalhe de cultivo com retorno", () => {
    const href = buildCultivoDetailHref({
      cultivoId: 55,
      propriedadeId: 10,
      tab: "cultivos",
      safraId: 3,
    });
    expect(href).toBe("/cultivos/55?propriedadeId=10&returnTab=cultivos&safraId=3");
  });

  it("parseia params de retorno", () => {
    expect(
      parsePropertyReturnParams({
        propriedadeId: "10",
        returnTab: "operacoes",
        safraId: "4",
      }),
    ).toEqual({ propriedadeId: 10, tab: "operacoes", safraId: 4 });
    expect(parsePropertyReturnParams({})).toBeNull();
  });
});

describe("panel query UI status (Etapa 9)", () => {
  it("prioriza offline sobre empty", () => {
    expect(
      resolvePanelQueryUiStatus({ isOnline: false, isEmpty: true, isLoading: false }),
    ).toBe("offline");
  });

  it("respeita loading e error", () => {
    expect(resolvePanelQueryUiStatus({ isLoading: true })).toBe("loading");
    expect(resolvePanelQueryUiStatus({ isError: true })).toBe("error");
    expect(resolvePanelQueryUiStatus({ isEmpty: true })).toBe("empty");
    expect(resolvePanelQueryUiStatus({})).toBe("ready");
  });
});
