/**
 * Backfill de safras a partir de orcamentos_safra.nomeSafra + default atual.
 * Não escolhe silenciosamente em ambiguidade de nomes conflitantes entre orgs.
 * Registros operacionais sem safraId recebem a safra padrão da propriedade
 * (único candidato — não há ambiguidade de nome).
 *
 * Uso: npx tsx scripts/backfill-safras.ts
 * Relatório: docs/evidencias/safras-backfill-latest.json
 */
import "dotenv/config";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { and, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "../server/db";
import {
  atividadePropriedade,
  custosOperacao,
  culturas,
  ocorrenciasCampo,
  orcamentosSafra,
  propriedades,
  safras,
  tarefasOperacionais,
} from "../drizzle/schema";
import { createSafra, ensureDefaultSafra, listSafrasByPropriedade } from "../server/db-safras";
import { currentSafraLabel, safraLabelsMatch } from "../lib/propriedades/safra-label";

async function linkNullSafraId(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  table: {
    safraId: any;
    propriedadeId: any;
    organizationId?: any;
  },
  propriedadeId: number,
  organizationId: number,
  safraId: number,
): Promise<number> {
  const result = await db
    .update(table as any)
    .set({ safraId })
    .where(
      and(
        eq(table.propriedadeId, propriedadeId),
        isNull(table.safraId),
        table.organizationId
          ? eq(table.organizationId, organizationId)
          : sql`1=1`,
      ),
    );
  return Number((result as any)[0]?.affectedRows ?? 0);
}

async function main() {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  const props = await db
    .select({
      id: propriedades.id,
      organizationId: propriedades.organizationId,
    })
    .from(propriedades);

  let created = 0;
  let linkedOrcamentos = 0;
  let linkedCulturas = 0;
  let linkedTarefas = 0;
  let linkedOcorrencias = 0;
  let linkedCustos = 0;
  let linkedAtividades = 0;
  let ambiguous = 0;
  let skippedNoOrg = 0;
  const ambiguousRows: Array<{ propriedadeId: number; nome: string }> = [];

  for (const prop of props) {
    if (!prop.organizationId) {
      skippedNoOrg += 1;
      continue;
    }
    const orgId = prop.organizationId;

    const def = await ensureDefaultSafra({
      organizationId: orgId,
      propriedadeId: prop.id,
      nome: currentSafraLabel(),
    });

    const orcs = await db
      .select()
      .from(orcamentosSafra)
      .where(eq(orcamentosSafra.propriedadeId, prop.id));

    const names = new Set(
      orcs.map((o) => o.nomeSafra.trim()).filter((n) => n.length > 0),
    );

    for (const nome of names) {
      const list = await listSafrasByPropriedade(orgId, prop.id);
      let match = list.find((s) => safraLabelsMatch(s.nome, nome));
      if (!match) {
        const id = await createSafra({
          organizationId: orgId,
          propriedadeId: prop.id,
          nome,
          status: safraLabelsMatch(nome, currentSafraLabel()) ? "ativa" : "encerrada",
          isDefault: false,
        });
        created += 1;
        match = (await listSafrasByPropriedade(orgId, prop.id)).find((s) => s.id === id);
      }
      if (!match) {
        ambiguous += 1;
        ambiguousRows.push({ propriedadeId: prop.id, nome });
        continue;
      }
      const result = await db
        .update(orcamentosSafra)
        .set({ safraId: match.id })
        .where(
          and(
            eq(orcamentosSafra.propriedadeId, prop.id),
            eq(orcamentosSafra.nomeSafra, nome),
            isNull(orcamentosSafra.safraId),
          ),
        );
      linkedOrcamentos += Number((result as any)[0]?.affectedRows ?? 0);
    }

    // Operacionais sem pista de nome → safra padrão (único candidato; não é ambiguidade)
    linkedCulturas += await linkNullSafraId(db, culturas, prop.id, orgId, def.id);
    linkedTarefas += await linkNullSafraId(db, tarefasOperacionais, prop.id, orgId, def.id);
    linkedOcorrencias += await linkNullSafraId(db, ocorrenciasCampo, prop.id, orgId, def.id);
    linkedCustos += await linkNullSafraId(db, custosOperacao, prop.id, orgId, def.id);
    linkedAtividades += await linkNullSafraId(db, atividadePropriedade, prop.id, orgId, def.id);
  }

  const [orphanCulturas] = await db
    .select({ n: sql<number>`count(*)` })
    .from(culturas)
    .where(isNull(culturas.safraId));
  const [orphanTarefas] = await db
    .select({ n: sql<number>`count(*)` })
    .from(tarefasOperacionais)
    .where(isNull(tarefasOperacionais.safraId));
  const [orphanOcorrencias] = await db
    .select({ n: sql<number>`count(*)` })
    .from(ocorrenciasCampo)
    .where(isNull(ocorrenciasCampo.safraId));

  const report = {
    started: new Date().toISOString(),
    propriedades: props.length,
    skippedNoOrg,
    safrasCreated: created,
    linked: {
      orcamentos: linkedOrcamentos,
      culturas: linkedCulturas,
      tarefas: linkedTarefas,
      ocorrencias: linkedOcorrencias,
      custos: linkedCustos,
      atividades: linkedAtividades,
    },
    orphansRemaining: {
      culturas: Number(orphanCulturas?.n ?? 0),
      tarefas: Number(orphanTarefas?.n ?? 0),
      ocorrencias: Number(orphanOcorrencias?.n ?? 0),
    },
    ambiguous,
    ambiguousRows: ambiguousRows.slice(0, 50),
    totalSafras: (
      await db.select({ n: sql<number>`count(*)` }).from(safras)
    )[0]?.n,
    note: "Órfãos operacionais sem organizationId/propriedadeId válidos permanecem null e são excluídos do filtro por safra.",
  };

  const outDir = join(process.cwd(), "docs/evidencias");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "safras-backfill-latest.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
