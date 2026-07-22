import { describe, expect, it, beforeAll } from "vitest";
import {
  buildTenantStorageKey,
  parseTenantOrgFromKey,
  issueDownloadToken,
  verifyDownloadToken,
  DOWNLOAD_TOKEN_TTL_SEC,
} from "../server/private-files";
import {
  getReportCache,
  setReportCache,
  invalidateOrgReportCache,
  _clearReportCacheForTests,
} from "../server/report-cache";
import { reportFingerprint, buildReportHtml } from "../server/report-html";
import { TRPCError } from "@trpc/server";

describe("private-files keys (Etapa 6)", () => {
  it("buildTenantStorageKey prefixes org id", () => {
    const key = buildTenantStorageKey(42, "relatorio", "laudo.pdf");
    expect(key).toBe("org/42/relatorio/laudo.pdf");
    expect(parseTenantOrgFromKey(key)).toBe(42);
  });

  it("parseTenantOrgFromKey rejeita chave sem tenant", () => {
    expect(parseTenantOrgFromKey("generated/foo.png")).toBeNull();
    expect(parseTenantOrgFromKey("org/abc/x")).toBeNull();
  });
});

describe("download tokens", () => {
  beforeAll(() => {
    if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test_jwt_secret_etapa6";
  });

  it("emite e valida token; storageKey deve bater", async () => {
    const { token, expiresAt } = await issueDownloadToken({
      userId: 7,
      organizationId: 3,
      storageKey: "org/3/relatorio/a.html",
    });
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(DOWNLOAD_TOKEN_TTL_SEC).toBe(300);
    const payload = await verifyDownloadToken(token);
    expect(payload.userId).toBe(7);
    expect(payload.organizationId).toBe(3);
    expect(payload.storageKey).toBe("org/3/relatorio/a.html");
  });

  it("token inválido lança UNAUTHORIZED", async () => {
    await expect(verifyDownloadToken("not.a.jwt")).rejects.toBeInstanceOf(TRPCError);
  });
});

describe("report cache namespaced", () => {
  it("não devolve cache de outra organização", () => {
    _clearReportCacheForTests();
    setReportCache(1, "fp1", { html: "<p>A</p>", titulo: "A", tipo: "diagnostico" });
    expect(getReportCache(1, "fp1")?.html).toContain("A");
    expect(getReportCache(2, "fp1")).toBeNull();
    invalidateOrgReportCache(1);
    expect(getReportCache(1, "fp1")).toBeNull();
  });
});

describe("report html", () => {
  it("escapa HTML do conteúdo e carimba organização", () => {
    const html = buildReportHtml({
      tipo: "diagnostico",
      titulo: "Teste <script>",
      conteudo: JSON.stringify({ descricao: "<b>x</b>" }),
      dataEmissao: "18/07/2026",
      organizationLabel: "Org Demo",
    });
    expect(html).toContain("Org Demo");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(reportFingerprint({ tipo: "a", titulo: "b", conteudo: "c" })).toMatch(/^fp_/);
  });
});
