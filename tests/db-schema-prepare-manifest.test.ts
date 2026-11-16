import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  REQUIRED_PREPARE_TAGS,
  SCHEMA_PREPARE_STEPS,
} from "../scripts/lib/schema-prepare-core";

const pkg = JSON.parse(
  readFileSync(join(__dirname, "..", "package.json"), "utf8"),
) as { scripts: Record<string, string> };

describe("schema prepare manifest", () => {
  it("inclui 0020_safras e 0021_property_archive na ordem correta", () => {
    const tags = SCHEMA_PREPARE_STEPS.map((s) => s.tag);
    const i20 = tags.indexOf("0020_safras");
    const i21 = tags.indexOf("0021_property_archive");
    const i22 = tags.indexOf("0022_tarefas_responsavel_repair");
    expect(i20).toBeGreaterThanOrEqual(0);
    expect(i21).toBeGreaterThan(i20);
    expect(i22).toBeGreaterThan(i21);
  });

  it("marca 0020 e 0021 como obrigatórios", () => {
    expect(REQUIRED_PREPARE_TAGS).toContain("0020_safras");
    expect(REQUIRED_PREPARE_TAGS).toContain("0021_property_archive");
  });

  it("inclui 0040–0042 (WP-02 / WP-03 / WP-04) no manifesto", () => {
    const tags = SCHEMA_PREPARE_STEPS.map((s) => s.tag);
    const i40 = tags.indexOf("0040_evento_tarefa_bridge");
    const i41 = tags.indexOf("0041_diagnostico_tarefa_bridge");
    const i42 = tags.indexOf("0042_diagnostico_revisao_tecnica");
    expect(i40).toBeGreaterThanOrEqual(0);
    expect(i41).toBeGreaterThan(i40);
    expect(i42).toBeGreaterThan(i41);
    expect(REQUIRED_PREPARE_TAGS).toContain("0041_diagnostico_tarefa_bridge");
    expect(REQUIRED_PREPARE_TAGS).toContain("0042_diagnostico_revisao_tecnica");
  });

  it("cada passo referencia script npm existente", () => {
    for (const step of SCHEMA_PREPARE_STEPS) {
      expect(pkg.scripts[step.npmScript], step.tag).toBeTruthy();
    }
  });
});
