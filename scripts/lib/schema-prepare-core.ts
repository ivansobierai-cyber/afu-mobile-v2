/**
 * Preparação determinística do schema MySQL:
 * 1) drizzle-kit migrate (journal em drizzle/meta/_journal.json)
 * 2) scripts idempotentes fora do journal ou de reparo (manifesto ordenado)
 * 3) registro em afu_supplemental_migrations + verificação de invariantes
 */
import { spawnSync } from "node:child_process";
import mysql from "mysql2/promise";
import { columnExists, indexExists, tableExists } from "./mysql-ddl-helpers";

export const SUPPLEMENTAL_MIGRATIONS_TABLE = "afu_supplemental_migrations";

export type SchemaPrepareStep = {
  /** Identificador estável (não renumerar após aplicado em produção). */
  tag: string;
  /** Script npm em package.json */
  npmScript: string;
  /** true = falha de verificação bloqueia prepare/CI */
  required: boolean;
  verify: (conn: mysql.Connection) => Promise<void>;
};

async function verify0020Safras(conn: mysql.Connection): Promise<void> {
  if (!(await tableExists(conn, "safras"))) {
    throw new Error("0020_safras: tabela `safras` ausente");
  }
  if (!(await columnExists(conn, "culturas", "safraId"))) {
    throw new Error("0020_safras: coluna culturas.safraId ausente");
  }
}

async function verify0021Archive(conn: mysql.Connection): Promise<void> {
  for (const col of ["archivedAt", "archivedByUserId", "archiveMotivo"] as const) {
    if (!(await columnExists(conn, "propriedades", col))) {
      throw new Error(`0021_property_archive: coluna propriedades.${col} ausente`);
    }
  }
  if (!(await indexExists(conn, "propriedades_org_archived_idx"))) {
    throw new Error("0021_property_archive: índice propriedades_org_archived_idx ausente");
  }
}

async function verify0029CultivoFase(conn: mysql.Connection): Promise<void> {
  if (!(await tableExists(conn, "cultivo_fase_eventos"))) {
    throw new Error("0029_cultivo_fase_eventos: tabela cultivo_fase_eventos ausente");
  }
}

async function verify0030CultivosNotNull(conn: mysql.Connection): Promise<void> {
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT IS_NULLABLE AS n FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'culturas' AND COLUMN_NAME = 'safraId' LIMIT 1`,
  );
  if (String(rows[0]?.n ?? "YES").toUpperCase() === "YES") {
    throw new Error("0030_cultivos_not_null: culturas.safraId ainda nullable");
  }
}

async function verify0031EstoqueCusto(conn: mysql.Connection): Promise<void> {
  if (!(await columnExists(conn, "estoque_itens", "custoMedio"))) {
    throw new Error("0031_estoque_custo_medio: estoque_itens.custoMedio ausente");
  }
}

async function verify0032ProducaoReal(conn: mysql.Connection): Promise<void> {
  if (!(await columnExists(conn, "culturas", "producaoReal"))) {
    throw new Error("0032_culturas_producao_real: culturas.producaoReal ausente");
  }
}

async function verify0033EventosFiltros(conn: mysql.Connection): Promise<void> {
  if (!(await columnExists(conn, "calendario_cuidados", "safraId"))) {
    throw new Error("0033_calendario_eventos_filtros: calendario_cuidados.safraId ausente");
  }
}

async function verify0034EventosTipos(conn: mysql.Connection): Promise<void> {
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT COLUMN_TYPE AS t FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'calendario_cuidados'
       AND COLUMN_NAME = 'tipoAtividade' LIMIT 1`,
  );
  const colType = String(rows[0]?.t ?? "");
  if (!colType.includes("inspecao") || !colType.includes("laboratorio")) {
    throw new Error(
      "0034_calendario_tipos: ENUM tipoAtividade sem inspecao/laboratorio",
    );
  }
}

async function verify0035Automacoes(conn: mysql.Connection): Promise<void> {
  if (!(await columnExists(conn, "calendario_cuidados", "dependsOnEventoId"))) {
    throw new Error("0035_calendario_automacoes: dependsOnEventoId ausente");
  }
}

async function verify0036Produtividade(conn: mysql.Connection): Promise<void> {
  if (!(await tableExists(conn, "evento_anexos"))) {
    throw new Error("0036_calendario_produtividade: tabela evento_anexos ausente");
  }
}

async function verify0037Operacoes(conn: mysql.Connection): Promise<void> {
  if (!(await tableExists(conn, "operacoes_agricolas"))) {
    throw new Error("0037_operacoes_agricolas: tabela operacoes_agricolas ausente");
  }
  if (!(await indexExists(conn, "operacoes_evento_origem_unique"))) {
    throw new Error("0037_operacoes_agricolas: índice operacoes_evento_origem_unique ausente");
  }
}

async function verifyRepair0022(conn: mysql.Connection): Promise<void> {
  if (!(await columnExists(conn, "tarefas_operacionais", "responsavelUserId"))) {
    throw new Error("0022_tarefas_responsavel: responsavelUserId ausente");
  }
}

async function verifyRepair0023(conn: mysql.Connection): Promise<void> {
  if (!(await tableExists(conn, "maquinas_operacionais"))) {
    throw new Error("0023_maquinas: tabela maquinas_operacionais ausente");
  }
}

async function verifyRepair0024(conn: mysql.Connection): Promise<void> {
  if (!(await tableExists(conn, "estoque_depositos"))) {
    throw new Error("0024_estoque: tabela estoque_depositos ausente");
  }
}

async function verifyRepair0025(conn: mysql.Connection): Promise<void> {
  if (!(await columnExists(conn, "custos_operacao", "terrenoId"))) {
    throw new Error("0025_centros_custo: custos_operacao.terrenoId ausente");
  }
}

async function verifyRepair0026(conn: mysql.Connection): Promise<void> {
  if (!(await tableExists(conn, "financeiro_lancamentos"))) {
    throw new Error("0026_financeiro: tabela financeiro_lancamentos ausente");
  }
}

async function verifyRepair0027(conn: mysql.Connection): Promise<void> {
  if (!(await tableExists(conn, "maquina_eventos"))) {
    throw new Error("0027_maquinas_controle: tabela maquina_eventos ausente");
  }
}

async function verifyRepair0028(conn: mysql.Connection): Promise<void> {
  if (!(await tableExists(conn, "tarefa_alocacoes"))) {
    throw new Error("0028_tarefa_alocacoes: tabela tarefa_alocacoes ausente");
  }
}

async function verifyRepair0018_0019(conn: mysql.Connection): Promise<void> {
  if (!(await tableExists(conn, "sync_conflicts"))) {
    throw new Error("0018_0019_sync_ai: tabela sync_conflicts ausente");
  }
  if (!(await columnExists(conn, "organizations", "aiAllowModelImprovement"))) {
    throw new Error("0018_0019_sync_ai: organizations.aiAllowModelImprovement ausente");
  }
}

/**
 * Ordem canônica após `drizzle-kit migrate`.
 * 0020/0021 não estão no journal (gap entre 0019 e 0022).
 * 0022–0028 estão no journal; scripts de reparo são idempotentes se migrate falhou parcialmente.
 * 0029–0036 só existem como apply scripts.
 */
export const SCHEMA_PREPARE_STEPS: SchemaPrepareStep[] = [
  {
    tag: "0018_0019_sync_ai_repair",
    npmScript: "db:sync-ai:apply",
    required: true,
    verify: verifyRepair0018_0019,
  },
  {
    tag: "0020_safras",
    npmScript: "db:safras:apply",
    required: true,
    verify: verify0020Safras,
  },
  {
    tag: "0021_property_archive",
    npmScript: "db:archive:apply",
    required: true,
    verify: verify0021Archive,
  },
  {
    tag: "0022_tarefas_responsavel_repair",
    npmScript: "db:tarefas-responsavel:apply",
    required: true,
    verify: verifyRepair0022,
  },
  {
    tag: "0023_maquinas_repair",
    npmScript: "db:maquinas:apply",
    required: true,
    verify: verifyRepair0023,
  },
  {
    tag: "0024_estoque_repair",
    npmScript: "db:estoque:apply",
    required: true,
    verify: verifyRepair0024,
  },
  {
    tag: "0025_centros_custo_repair",
    npmScript: "db:centros-custo:apply",
    required: true,
    verify: verifyRepair0025,
  },
  {
    tag: "0026_financeiro_repair",
    npmScript: "db:financeiro:apply",
    required: true,
    verify: verifyRepair0026,
  },
  {
    tag: "0027_maquinas_controle_repair",
    npmScript: "db:maquinas-controle:apply",
    required: true,
    verify: verifyRepair0027,
  },
  {
    tag: "0028_tarefa_alocacoes_repair",
    npmScript: "db:equipe:apply",
    required: true,
    verify: verifyRepair0028,
  },
  {
    tag: "0029_cultivo_fase_eventos",
    npmScript: "db:cultivo-fase:apply",
    required: true,
    verify: verify0029CultivoFase,
  },
  {
    tag: "0030_cultivos_safra_talhao_not_null",
    npmScript: "db:cultivos-not-null:apply",
    required: false,
    verify: verify0030CultivosNotNull,
  },
  {
    tag: "0031_estoque_custo_medio",
    npmScript: "db:estoque-custo:apply",
    required: true,
    verify: verify0031EstoqueCusto,
  },
  {
    tag: "0032_culturas_producao_real",
    npmScript: "db:producao-real:apply",
    required: true,
    verify: verify0032ProducaoReal,
  },
  {
    tag: "0033_calendario_eventos_filtros",
    npmScript: "db:eventos-filtros:apply",
    required: true,
    verify: verify0033EventosFiltros,
  },
  {
    tag: "0034_calendario_tipos_inteligentes",
    npmScript: "db:eventos-tipos:apply",
    required: true,
    verify: verify0034EventosTipos,
  },
  {
    tag: "0035_calendario_automacoes",
    npmScript: "db:eventos-automacoes:apply",
    required: true,
    verify: verify0035Automacoes,
  },
  {
    tag: "0036_calendario_produtividade",
    npmScript: "db:eventos-produtividade:apply",
    required: true,
    verify: verify0036Produtividade,
  },
  {
    tag: "0037_operacoes_agricolas",
    npmScript: "db:operacoes:apply",
    required: true,
    verify: verify0037Operacoes,
  },
];

export const REQUIRED_PREPARE_TAGS = SCHEMA_PREPARE_STEPS.filter((s) => s.required).map(
  (s) => s.tag,
);

export async function ensureSupplementalMigrationsTable(conn: mysql.Connection): Promise<void> {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS ${SUPPLEMENTAL_MIGRATIONS_TABLE} (
      tag varchar(80) NOT NULL PRIMARY KEY,
      applied_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      source varchar(32) NOT NULL DEFAULT 'schema-prepare'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
}

export async function recordSupplementalMigration(
  conn: mysql.Connection,
  tag: string,
): Promise<void> {
  await conn.query(
    `INSERT INTO ${SUPPLEMENTAL_MIGRATIONS_TABLE} (tag, source)
     VALUES (?, 'schema-prepare')
     ON DUPLICATE KEY UPDATE applied_at = CURRENT_TIMESTAMP`,
    [tag],
  );
}

export async function hasSupplementalMigrationRecord(
  conn: mysql.Connection,
  tag: string,
): Promise<boolean> {
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT 1 FROM ${SUPPLEMENTAL_MIGRATIONS_TABLE} WHERE tag = ? LIMIT 1`,
    [tag],
  );
  return rows.length > 0;
}

function runNpmScript(script: string, cwd: string): void {
  const isWin = process.platform === "win32";
  const result = spawnSync(isWin ? "npm.cmd" : "npm", ["run", script], {
    cwd,
    encoding: "utf8",
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    throw new Error(
      `npm run ${script} falhou (exit ${result.status ?? "null"}): ${result.stderr?.slice(-500) ?? ""}`,
    );
  }
}

function runDrizzleMigrate(cwd: string): void {
  const isWin = process.platform === "win32";
  const result = spawnSync(
    isWin ? "npx.cmd" : "npx",
    ["drizzle-kit", "migrate"],
    {
      cwd,
      encoding: "utf8",
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    throw new Error(
      `drizzle-kit migrate falhou (exit ${result.status ?? "null"}): ${result.stderr?.slice(-800) ?? ""}`,
    );
  }
}

export type SchemaPrepareOptions = {
  cwd?: string;
  /** Pular drizzle-kit migrate (testes que já migraram). */
  skipDrizzleMigrate?: boolean;
  /** Só verificar invariantes + registros obrigatórios. */
  verifyOnly?: boolean;
};

export async function runSchemaPrepare(opts: SchemaPrepareOptions = {}): Promise<void> {
  const cwd = opts.cwd ?? process.cwd();
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL é obrigatório para db:schema:prepare");
  }

  if (!opts.verifyOnly && !opts.skipDrizzleMigrate) {
    console.log("[schema-prepare] drizzle-kit migrate…");
    runDrizzleMigrate(cwd);
  }

  const conn = await mysql.createConnection(url);
  try {
    await ensureSupplementalMigrationsTable(conn);

    if (opts.verifyOnly) {
      await verifySchemaInvariants(conn);
      return;
    }

    for (const step of SCHEMA_PREPARE_STEPS) {
      console.log(`[schema-prepare] ${step.tag} → npm run ${step.npmScript}`);
      try {
        runNpmScript(step.npmScript, cwd);
        await step.verify(conn);
        await recordSupplementalMigration(conn, step.tag);
        console.log(`[schema-prepare] ok ${step.tag}`);
      } catch (e) {
        if (!step.required) {
          console.warn(
            `[schema-prepare] passo opcional ignorado (${step.tag}):`,
            e instanceof Error ? e.message : e,
          );
          continue;
        }
        throw e;
      }
    }

    await verifySchemaInvariants(conn);
  } finally {
    await conn.end();
  }
}

/** Falha com mensagem clara se migration obrigatória não constar no registro ou invariante quebrar. */
export async function verifySchemaInvariants(conn: mysql.Connection): Promise<void> {
  await ensureSupplementalMigrationsTable(conn);

  for (const step of SCHEMA_PREPARE_STEPS) {
    if (!step.required) {
      continue;
    }
    await step.verify(conn);
    const recorded = await hasSupplementalMigrationRecord(conn, step.tag);
    if (!recorded) {
      throw new Error(
        `Migration obrigatória não registrada em ${SUPPLEMENTAL_MIGRATIONS_TABLE}: ${step.tag}. Rode npm run db:schema:prepare`,
      );
    }
  }
}

export async function backfillSupplementalRecordsFromSchema(
  conn: mysql.Connection,
): Promise<void> {
  await ensureSupplementalMigrationsTable(conn);
  for (const step of SCHEMA_PREPARE_STEPS) {
    try {
      await step.verify(conn);
      await recordSupplementalMigration(conn, step.tag);
    } catch {
      // schema ainda não tem este passo — não registrar
    }
  }
}
