import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("build-web-preview demo login default", () => {
  it("defaults EXPO_PUBLIC_SHOW_DEMO_LOGIN to 0 (never 1)", () => {
    const source = readFileSync(
      resolve(__dirname, "../scripts/build-web-preview.mjs"),
      "utf8",
    );
    expect(source).toMatch(/EXPO_PUBLIC_SHOW_DEMO_LOGIN\s*=\s*[\s\S]*?\?\?\s*"0"/);
    expect(source).not.toMatch(/\?\?\s*"1"/);
  });
});
