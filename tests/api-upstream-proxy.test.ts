import { describe, expect, it } from "vitest";
import {
  DEFAULT_HOSTINGER_API_UPSTREAM,
  getApiUpstreamBaseUrl,
} from "../server/_core/api-upstream-proxy";
import { diagnoseDatabaseUrlFormat } from "../server/db-health";

describe("getApiUpstreamBaseUrl", () => {
  it("returns undefined when unset", () => {
    const prev = process.env.API_UPSTREAM_URL;
    delete process.env.API_UPSTREAM_URL;
    expect(getApiUpstreamBaseUrl()).toBeUndefined();
    if (prev !== undefined) process.env.API_UPSTREAM_URL = prev;
  });

  it("strips trailing slash", () => {
    const prev = process.env.API_UPSTREAM_URL;
    process.env.API_UPSTREAM_URL =
      "https://afu-mobile-v2-production.up.railway.app/";
    expect(getApiUpstreamBaseUrl()).toBe(
      "https://afu-mobile-v2-production.up.railway.app",
    );
    if (prev !== undefined) process.env.API_UPSTREAM_URL = prev;
    else delete process.env.API_UPSTREAM_URL;
  });

  it("documents Railway as the Hostinger default upstream", () => {
    expect(DEFAULT_HOSTINGER_API_UPSTREAM).toBe(
      "https://afu-mobile-v2-production.up.railway.app",
    );
  });
});

describe("diagnoseDatabaseUrlFormat", () => {
  it("accepts a normal mysql URL", () => {
    expect(
      diagnoseDatabaseUrlFormat("mysql://afu:pass@127.0.0.1:3306/afu_mobile"),
    ).toBeNull();
  });

  it("rejects quoted URLs", () => {
    expect(
      diagnoseDatabaseUrlFormat('"mysql://afu:pass@127.0.0.1:3306/afu_mobile"'),
    ).toMatch(/aspas/i);
  });

  it("rejects non-mysql schemes", () => {
    expect(diagnoseDatabaseUrlFormat("postgres://x")).toMatch(/mysql/i);
  });
});
