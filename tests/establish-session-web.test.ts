import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("react-native", () => ({
  Platform: { OS: "web" },
}));

vi.mock("@/constants/oauth", () => ({
  getApiBaseUrl: () => "https://afu-mobile-v2-production.up.railway.app",
}));

vi.mock("@/lib/_core/auth", () => ({
  getSessionToken: vi.fn(async () => "tok"),
  setSessionToken: vi.fn(),
  setRefreshToken: vi.fn(),
  setUserInfo: vi.fn(),
}));

describe("establishSession on web", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("is a no-op and does not fetch /api/auth/session", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.resetModules();
    const { establishSession } = await import("../lib/_core/api");
    const ok = await establishSession("access-token");
    expect(ok).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
