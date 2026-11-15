import { afterEach, describe, expect, it } from "vitest";
import { resolveWebAppUrl } from "../server/_core/web-app-url";

const envKeys = ["APP_URL", "EXPO_WEB_PREVIEW_URL", "EXPO_PACKAGER_PROXY_URL"] as const;

afterEach(() => {
  for (const key of envKeys) delete process.env[key];
});

describe("resolveWebAppUrl", () => {
  it("prefere APP_URL quando o site está na Hostinger", () => {
    process.env.APP_URL = "https://afuagro.tech/";
    process.env.EXPO_WEB_PREVIEW_URL = "https://preview.example";
    expect(resolveWebAppUrl({ host: "afuagro.tech", protocol: "https" })).toBe("https://afuagro.tech");
  });

  it("volta para o host da requisição quando não há URL configurada", () => {
    expect(
      resolveWebAppUrl({
        host: "afuagro.tech",
        protocol: "http",
        forwardedProto: "https",
      }),
    ).toBe("https://afuagro.tech/");
  });

  it("mantém o Metro local só em localhost", () => {
    expect(resolveWebAppUrl({ host: "localhost:3000", protocol: "http" })).toBe("http://localhost:8081");
  });
});
