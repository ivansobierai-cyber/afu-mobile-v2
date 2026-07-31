import { describe, expect, it } from "vitest";
import {
  assertAnexoContentType,
  assertAnexoUploadSize,
  fileCategoryFromContentType,
  parseUploadBase64,
  sanitizeAnexoFilename,
} from "../lib/eventos/anexo-upload";
import {
  checklistProgress,
  newChecklistItem,
  parseChecklist,
  parseEtiquetas,
  serializeChecklist,
  serializeEtiquetas,
} from "../lib/eventos/produtividade";

describe("eventos produtividade", () => {
  it("serializa e parseia etiquetas", () => {
    const raw = serializeEtiquetas(["Urgente", "clima", "urgente"]);
    expect(parseEtiquetas(raw)).toEqual(["urgente", "clima"]);
  });

  it("serializa e parseia checklist", () => {
    const items = [newChecklistItem("Checar EPI"), newChecklistItem("Calibrar")];
    items[0]!.feito = true;
    const raw = serializeChecklist(items);
    const parsed = parseChecklist(raw);
    expect(parsed).toHaveLength(2);
    expect(checklistProgress(parsed)).toEqual({ done: 1, total: 2 });
  });

  it("parseEtiquetas tolera CSV legado", () => {
    expect(parseEtiquetas("praga, irrigacao")).toEqual(["praga", "irrigacao"]);
  });

  it("serializa lista vazia de etiquetas", () => {
    expect(serializeEtiquetas([])).toBe("[]");
    expect(parseEtiquetas("[]")).toEqual([]);
  });
});

describe("eventos anexo upload", () => {
  it("decodifica base64 com ou sem prefixo data URL", () => {
    const buf = Buffer.from("ok", "utf8");
    expect(parseUploadBase64(buf.toString("base64")).toString("utf8")).toBe("ok");
    expect(
      parseUploadBase64(`data:image/png;base64,${buf.toString("base64")}`).toString("utf8"),
    ).toBe("ok");
  });

  it("valida tamanho e tipo", () => {
    expect(() => assertAnexoUploadSize(0)).toThrow();
    expect(assertAnexoContentType("image/jpeg")).toBe("image/jpeg");
    expect(() => assertAnexoContentType("application/x-msdownload")).toThrow();
    expect(fileCategoryFromContentType("image/png")).toBe("foto");
    expect(fileCategoryFromContentType("application/pdf")).toBe("documento");
  });

  it("sanitiza nome de arquivo", () => {
    expect(sanitizeAnexoFilename("  foto/../x.jpg  ")).toBe("foto_.._x.jpg");
  });
});
