/**
 * WP-05 — inventário de formulários core que devem usar a fila offline.
 * Garante que os pontos de mutação restantes não voltem a chamar tRPC direto.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(__dirname, "..");

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("WP-05 offline forms inventory", () => {
  const queuedScreens = [
    "app/(tabs)/propriedades.tsx",
    "app/(tabs)/cultivos.tsx",
    "app/cultivos/[id].tsx",
    "app/propriedades/terrenos.tsx",
    "app/mais/calendario.tsx",
    "components/propriedade-cultivo-create-modal.tsx",
    "components/propriedade-tarefas-panel.tsx",
    "components/eventos/evento-detail-modal.tsx",
    "components/cultivos/cultivo-ops-ia-custos.tsx",
    "app/propriedades/[id].tsx",
  ] as const;

  it("telas/forms core usam useRunCoreMutation ou queueMutation", () => {
    for (const file of queuedScreens) {
      const src = read(file);
      const usesQueue =
        src.includes("useRunCoreMutation") || src.includes("queueMutation");
      expect(usesQueue, `${file} deve enfileirar via fila core`).toBe(true);
    }
  });

  it("delete de propriedade não usa mutate direto", () => {
    for (const file of [
      "app/(tabs)/propriedades.tsx",
      "app/propriedades/[id].tsx",
    ] as const) {
      const src = read(file);
      expect(src).not.toMatch(/propriedades\.delete\.useMutation/);
      expect(src).toMatch(/runMutation\("propriedade", "delete"/);
    }
  });

  it("evento detail e custos de cultivo não usam update.useMutation direto", () => {
    const evento = read("components/eventos/evento-detail-modal.tsx");
    expect(evento).not.toMatch(/calendario\.update\.useMutation/);
    expect(evento).toMatch(/runMutation\("evento", "update"/);

    const custos = read("components/cultivos/cultivo-ops-ia-custos.tsx");
    expect(custos).not.toMatch(/cultivos\.update\.useMutation/);
    expect(custos).toMatch(/runMutation\("cultivo", "update"/);
  });

  it("banner sync compartilhado via provider no root", () => {
    const layout = read("app/_layout.tsx");
    expect(layout).toMatch(/CoreOfflineSyncProvider/);
    expect(layout).toMatch(/CoreOfflineSyncManager/);
  });
});
