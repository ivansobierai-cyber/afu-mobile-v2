/**
 * Etapa 3 — preenche organizationId nas tabelas privadas + relatório de órfãos.
 *
 * Ordem:
 * 1) Garante org pessoal (Etapa 2)
 * 2) Contagens BEFORE
 * 3) Backfill por relações (produtor → propriedade → filhos; usuário → org)
 * 4) Relatório de órfãos
 * 5) Contagens AFTER (nenhuma linha apagada)
 *
 * Uso: npx tsx scripts/backfill-organization-id.ts
 */
import "dotenv/config";
import { sql } from "drizzle-orm";
import { getDb } from "../server/db";
import { backfillPersonalOrganizations } from "../server/db-organizations";

type CountRow = { c: number };

async function count(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, table: string) {
  const rows = await db.execute(sql.raw(`SELECT COUNT(*) AS c FROM \`${table}\``));
  const r = (rows as any)[0] as CountRow[] | CountRow;
  if (Array.isArray(r)) return Number(r[0]?.c ?? 0);
  return Number((r as any)?.c ?? (rows as any)[0]?.[0]?.c ?? 0);
}

async function countNullOrg(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  table: string,
) {
  const rows = await db.execute(
    sql.raw(`SELECT COUNT(*) AS c FROM \`${table}\` WHERE organizationId IS NULL`),
  );
  const r = (rows as any)[0] as CountRow[] | CountRow;
  if (Array.isArray(r)) return Number(r[0]?.c ?? 0);
  return Number((r as any)?.c ?? 0);
}

async function exec(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, q: string) {
  await db.execute(sql.raw(q));
}

const TABLES = [
  "propriedades",
  "terrenos",
  "culturas",
  "diagnosticos_ia",
  "analises_fitotecnicas",
  "relatorios",
  "calendario_cuidados",
  "tarefas_operacionais",
  "sensores",
  "ocorrencias_campo",
  "estoque_itens",
  "orcamentos_safra",
  "custos_operacao",
  "atividade_propriedade",
] as const;

async function main() {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  console.log("[e3] ensure personal organizations…");
  const orgs = await backfillPersonalOrganizations();
  console.log(`[e3] orgs processados=${orgs.processed} criados=${orgs.created}`);

  const before: Record<string, number> = {};
  for (const t of TABLES) before[t] = await count(db, t);
  before.produtores = await count(db, "produtores");
  before.organizations = await count(db, "organizations");
  console.log("[e3] contagens BEFORE", before);

  // 1) propriedades ← produtores.organizationId
  await exec(
    db,
    `UPDATE propriedades p
     INNER JOIN produtores pr ON pr.id = p.produtorId
     SET p.organizationId = pr.organizationId
     WHERE p.organizationId IS NULL AND pr.organizationId IS NOT NULL`,
  );

  // 2) terrenos / culturas / sensores / tarefas / ocorrencias / estoque / orcamentos / custos / atividade ← propriedades
  const viaProp = [
    "terrenos",
    "culturas",
    "sensores",
    "tarefas_operacionais",
    "ocorrencias_campo",
    "estoque_itens",
    "orcamentos_safra",
    "custos_operacao",
    "atividade_propriedade",
    "calendario_cuidados",
    "diagnosticos_ia",
    "analises_fitotecnicas",
  ] as const;
  for (const t of viaProp) {
    await exec(
      db,
      `UPDATE \`${t}\` c
       INNER JOIN propriedades p ON p.id = c.propriedadeId
       SET c.organizationId = p.organizationId
       WHERE c.organizationId IS NULL AND p.organizationId IS NOT NULL`,
    );
  }

  // 3) diagnosticos / analises / calendario / relatorios sem propriedade → org do usuário (produtor)
  for (const t of ["diagnosticos_ia", "analises_fitotecnicas", "calendario_cuidados", "relatorios"] as const) {
    await exec(
      db,
      `UPDATE \`${t}\` d
       INNER JOIN produtores pr ON pr.usuarioId = d.usuarioId
       SET d.organizationId = pr.organizationId
       WHERE d.organizationId IS NULL AND pr.organizationId IS NOT NULL`,
    );
  }

  // 4) tarefas ainda nulas via produtor do criador
  await exec(
    db,
    `UPDATE tarefas_operacionais t
     INNER JOIN produtores pr ON pr.usuarioId = t.usuarioId
     SET t.organizationId = pr.organizationId
     WHERE t.organizationId IS NULL AND pr.organizationId IS NOT NULL`,
  );

  const orphans: Record<string, number> = {};
  let totalOrphans = 0;
  for (const t of TABLES) {
    const n = await countNullOrg(db, t);
    orphans[t] = n;
    totalOrphans += n;
  }

  const after: Record<string, number> = {};
  for (const t of TABLES) after[t] = await count(db, t);
  after.produtores = await count(db, "produtores");
  after.organizations = await count(db, "organizations");

  const lost: string[] = [];
  for (const t of Object.keys(before)) {
    if (after[t] !== before[t]) lost.push(`${t}: ${before[t]} → ${after[t]}`);
  }

  const filled: Record<string, number> = {};
  for (const t of TABLES) {
    filled[t] = after[t] - orphans[t];
  }

  const report = {
    generatedAt: new Date().toISOString(),
    before,
    after,
    filledWithOrganizationId: filled,
    orphans,
    totalOrphans,
    rowCountChanged: lost,
    dataLoss: lost.length > 0,
    ok: lost.length === 0,
  };

  console.log(JSON.stringify(report, null, 2));

  const fs = await import("fs");
  const path = "docs/SEGURANCA_ETAPA3_ORFAOS_REPORT.json";
  fs.writeFileSync(path, JSON.stringify(report, null, 2));
  console.log(`[e3] relatório escrito em ${path}`);

  if (report.dataLoss) {
    console.error("[e3] FALHA: contagens mudaram — possível perda de dados");
    process.exit(2);
  }
  console.log(`[e3] OK — nenhuma linha perdida; órfãos restantes=${totalOrphans}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
