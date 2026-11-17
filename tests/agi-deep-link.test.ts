import { describe, expect, it } from "vitest";
import { buildAgiCompanionDeepLink, buildAgiDeepLink } from "../lib/agi-deep-link";

describe("agi deep links", () => {
  it("buildAgiDeepLink usa scheme afuagi", () => {
    expect(buildAgiDeepLink("dashboard")).toBe("afuagi://dashboard");
    expect(buildAgiDeepLink("plant")).toBe("afuagi://plant");
  });

  it("buildAgiCompanionDeepLink usa afuagro://agi", () => {
    expect(buildAgiCompanionDeepLink("chat")).toBe("afuagro://agi/chat");
  });
});
