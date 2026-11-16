import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(__dirname, "..");

describe("rotas públicas /privacidade e /termos", () => {
  it("usam Redirect estático (sem router.replace em useEffect)", () => {
    const privacidade = readFileSync(join(root, "app/privacidade.tsx"), "utf8");
    const termos = readFileSync(join(root, "app/termos.tsx"), "utf8");

    expect(privacidade).toContain("Redirect");
    expect(privacidade).toContain("/legal/privacidade");
    expect(privacidade).not.toMatch(/router\.replace/);
    expect(privacidade).not.toMatch(/useEffect/);

    expect(termos).toContain("Redirect");
    expect(termos).toContain("/legal/termos");
    expect(termos).not.toMatch(/router\.replace/);
    expect(termos).not.toMatch(/useEffect/);
  });
});
