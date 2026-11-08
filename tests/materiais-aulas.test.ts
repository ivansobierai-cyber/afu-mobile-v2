import { describe, expect, it } from "vitest";
import { aulaDoMaterial, linkPublicavel } from "../lib/materiais-aulas";

describe("aulas dos materiais didáticos", () => {
  it("encontra a aula pelo título cadastrado, com ou sem acento", () => {
    expect(aulaDoMaterial("Guia de Manejo Integrado de Pragas na Soja")?.secoes.length).toBe(3);
    expect(aulaDoMaterial("Checklist de Plantio — Safra de Grãos")?.secoes[0]?.itens.length).toBeGreaterThan(0);
    expect(aulaDoMaterial("Interpretação de Análise de Solo")).not.toBeNull();
    expect(aulaDoMaterial("Irrigação por Gotejamento na Prática")).not.toBeNull();
  });

  it("ignora material sem roteiro embutido", () => {
    expect(aulaDoMaterial("Outro assunto")).toBeNull();
    expect(aulaDoMaterial(null)).toBeNull();
  });

  it("só publica link http(s) real", () => {
    expect(linkPublicavel("https://example.com/videos/gotejamento")).toBeNull();
    expect(linkPublicavel("")).toBeNull();
    expect(linkPublicavel("nota-interna")).toBeNull();
    expect(linkPublicavel("https://cdn.afuagro.tech/aulas/mip-soja.pdf")).toBe(
      "https://cdn.afuagro.tech/aulas/mip-soja.pdf",
    );
  });

  it("marca disponível só com aula ou link real", () => {
    const disponivel = (titulo: string, videoUrl?: string | null, arquivoUrl?: string | null) =>
      !!(linkPublicavel(videoUrl) || linkPublicavel(arquivoUrl) || aulaDoMaterial(titulo));

    expect(disponivel("Guia de Manejo Integrado de Pragas na Soja")).toBe(true);
    expect(disponivel("Irrigação por Gotejamento na Prática", "https://example.com/x")).toBe(true);
    expect(disponivel("Sem aula", "https://example.com/x")).toBe(false);
    expect(disponivel("Sem aula", "https://cdn.afuagro.tech/a.pdf")).toBe(true);
  });
});
