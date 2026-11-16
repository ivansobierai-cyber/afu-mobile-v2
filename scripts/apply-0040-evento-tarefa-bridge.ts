/**
 * WP-02 — backfill idempotente: eventos com propriedade sem tarefa vinculada.
 * Não apaga nem altera eventos existentes; só cria tarefas faltantes.
 */
import "dotenv/config";
import mysql from "mysql2/promise";

async function indexExists(conn: mysql.Connection, name: string) {
  const [rows] = await conn.query<any[]>(
    `SELECT 1 FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND INDEX_NAME = ? LIMIT 1`,
    [name],
  );
  return rows.length > 0;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required");
  const conn = await mysql.createConnection(url);
  try {
    if (!(await indexExists(conn, "tarefas_operacionais_legadoEventoId_unique"))) {
      // Nome histórico pode variar; tenta criar unique se a coluna existir sem índice.
      try {
        await conn.query(
          `ALTER TABLE tarefas_operacionais
           ADD UNIQUE INDEX tarefas_operacionais_legadoEventoId_unique (legadoEventoId)`,
        );
        console.log("+ unique legadoEventoId");
      } catch (e: any) {
        if (e?.code !== "ER_DUP_KEYNAME" && e?.errno !== 1061) {
          // Já pode existir com outro nome — segue para backfill.
          console.warn("aviso índice legadoEventoId:", e?.message ?? e);
        }
      }
    }

    const [result] = await conn.query<any>(
      `INSERT INTO tarefas_operacionais (
         usuarioId, organizationId, propriedadeId, terrenoId, culturaId, safraId,
         responsavelUserId, tipoOperacao, titulo, instrucoes, prioridade, status,
         dataPrevista, origem, legadoEventoId, createdAt, updatedAt
       )
       SELECT
         COALESCE(c.usuarioId, 0),
         c.organizationId,
         c.propriedadeId,
         c.terrenoId,
         c.culturaId,
         c.safraId,
         c.responsavelUserId,
         CASE c.tipoAtividade
           WHEN 'inspecao' THEN 'vistoria'
           WHEN 'laboratorio' THEN 'analise'
           WHEN 'plantio' THEN 'plantio'
           WHEN 'irrigacao' THEN 'irrigacao'
           WHEN 'adubacao' THEN 'adubacao'
           WHEN 'pulverizacao' THEN 'pulverizacao'
           WHEN 'monitoramento' THEN 'monitoramento'
           WHEN 'colheita' THEN 'colheita'
           WHEN 'analise' THEN 'analise'
           WHEN 'manutencao' THEN 'manutencao'
           ELSE 'outro'
         END,
         c.titulo,
         c.descricao,
         COALESCE(c.prioridade, 'normal'),
         CASE c.status
           WHEN 'em_andamento' THEN 'em_execucao'
           WHEN 'concluido' THEN 'concluida'
           WHEN 'cancelado' THEN 'cancelada'
           ELSE 'planejada'
         END,
         c.dataProgramada,
         'calendario_legado',
         c.id,
         c.createdAt,
         c.updatedAt
       FROM calendario_cuidados c
       LEFT JOIN tarefas_operacionais t ON t.legadoEventoId = c.id
       WHERE c.propriedadeId IS NOT NULL
         AND c.organizationId IS NOT NULL
         AND t.id IS NULL`,
    );

    const affected = Number(result?.affectedRows ?? 0);
    console.log(`+ backfill tarefas a partir de eventos: ${affected}`);
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
