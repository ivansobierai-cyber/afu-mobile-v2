/**
 * Aplica migração 0024 (estoque agrícola inteligente) de forma idempotente.
 * Passo 1 Etapa 7 — depósitos, lotes, reservas + colunas tenant em itens/movimentos.
 */
import "dotenv/config";
import mysql from "mysql2/promise";

async function columnExists(
  conn: mysql.Connection,
  table: string,
  column: string,
): Promise<boolean> {
  const [rows] = await conn.query<any[]>(
    `SELECT 1 FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [table, column],
  );
  return rows.length > 0;
}

async function indexExists(
  conn: mysql.Connection,
  table: string,
  name: string,
): Promise<boolean> {
  const [rows] = await conn.query<any[]>(
    `SELECT 1 FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ? LIMIT 1`,
    [table, name],
  );
  return rows.length > 0;
}

async function addColumnIfMissing(
  conn: mysql.Connection,
  table: string,
  column: string,
  ddl: string,
) {
  if (!(await columnExists(conn, table, column))) {
    await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN ${ddl}`);
    console.log(`+ ${table}.${column}`);
  }
}

async function addIndexIfMissing(
  conn: mysql.Connection,
  table: string,
  name: string,
  ddl: string,
) {
  if (!(await indexExists(conn, table, name))) {
    await conn.query(ddl);
    console.log(`+ ${name}`);
  }
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required");
  const conn = await mysql.createConnection(url);
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS estoque_depositos (
        id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
        organizationId int NOT NULL,
        propriedadeId int NOT NULL,
        nome varchar(120) NOT NULL,
        descricao text NULL,
        createdByUserId int NULL,
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("+ estoque_depositos");

    await conn.query(`
      CREATE TABLE IF NOT EXISTS estoque_lotes (
        id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
        organizationId int NOT NULL,
        propriedadeId int NOT NULL,
        itemId int NOT NULL,
        depositoId int NULL,
        codigo varchar(80) NOT NULL,
        validade timestamp NULL,
        quantidadeInicial decimal(14,3) NOT NULL DEFAULT 0,
        bloqueado tinyint(1) NOT NULL DEFAULT 0,
        createdByUserId int NULL,
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("+ estoque_lotes");

    await conn.query(`
      CREATE TABLE IF NOT EXISTS estoque_reservas (
        id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
        organizationId int NOT NULL,
        propriedadeId int NOT NULL,
        itemId int NOT NULL,
        loteId int NULL,
        tarefaId int NULL,
        quantidade decimal(14,3) NOT NULL,
        statusReservaEstoque enum('ativa','consumida','liberada','cancelada') NOT NULL DEFAULT 'ativa',
        createdByUserId int NULL,
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("+ estoque_reservas");

    // Tabelas criadas com nome legado `status` → alinhar ao Drizzle (`statusReservaEstoque`)
    if (
      (await columnExists(conn, "estoque_reservas", "status")) &&
      !(await columnExists(conn, "estoque_reservas", "statusReservaEstoque"))
    ) {
      await conn.query(
        `ALTER TABLE estoque_reservas CHANGE COLUMN status statusReservaEstoque enum('ativa','consumida','liberada','cancelada') NOT NULL DEFAULT 'ativa'`,
      );
      console.log("~ estoque_reservas.status → statusReservaEstoque");
    }

    // Colunas enum reais no MySQL = nome Drizzle (categoriaEstoque / tipoMovimentoEstoque)
    await conn.query(`
      ALTER TABLE estoque_itens
      MODIFY COLUMN categoriaEstoque enum(
        'fertilizante','defensivo','herbicida','fungicida','inseticida',
        'semente','combustivel','peca','ferramenta','outro'
      ) NOT NULL DEFAULT 'outro'
    `);
    console.log("~ estoque_itens.categoriaEstoque");

    await addColumnIfMissing(conn, "estoque_itens", "depositoId", "depositoId int NULL");
    await addColumnIfMissing(conn, "estoque_itens", "fabricante", "fabricante varchar(120) NULL");
    await addColumnIfMissing(conn, "estoque_itens", "observacoes", "observacoes text NULL");
    await addColumnIfMissing(conn, "estoque_itens", "createdByUserId", "createdByUserId int NULL");

    await conn.query(`
      ALTER TABLE estoque_movimentos
      MODIFY COLUMN tipoMovimentoEstoque enum(
        'entrada','saida','reserva','consumo','ajuste','perda','transferencia'
      ) NOT NULL
    `);
    console.log("~ estoque_movimentos.tipoMovimentoEstoque");

    await addColumnIfMissing(conn, "estoque_movimentos", "organizationId", "organizationId int NULL");
    await addColumnIfMissing(conn, "estoque_movimentos", "propriedadeId", "propriedadeId int NULL");
    await addColumnIfMissing(conn, "estoque_movimentos", "loteId", "loteId int NULL");
    await addColumnIfMissing(conn, "estoque_movimentos", "depositoId", "depositoId int NULL");
    await addColumnIfMissing(conn, "estoque_movimentos", "createdByUserId", "createdByUserId int NULL");
    await addColumnIfMissing(
      conn,
      "estoque_movimentos",
      "updatedAt",
      "updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
    );

    // Backfill tenant nos movimentos legados
    await conn.query(`
      UPDATE estoque_movimentos m
      INNER JOIN estoque_itens i ON i.id = m.itemId
      SET m.organizationId = COALESCE(m.organizationId, i.organizationId),
          m.propriedadeId = COALESCE(m.propriedadeId, i.propriedadeId),
          m.createdByUserId = COALESCE(m.createdByUserId, m.usuarioId)
      WHERE m.organizationId IS NULL OR m.propriedadeId IS NULL OR m.createdByUserId IS NULL
    `);
    console.log("~ estoque_movimentos backfill tenant");

    await addIndexIfMissing(
      conn,
      "estoque_depositos",
      "estoque_depositos_org_idx",
      "CREATE INDEX estoque_depositos_org_idx ON estoque_depositos (organizationId)",
    );
    await addIndexIfMissing(
      conn,
      "estoque_depositos",
      "estoque_depositos_org_prop_idx",
      "CREATE INDEX estoque_depositos_org_prop_idx ON estoque_depositos (organizationId, propriedadeId)",
    );
    await addIndexIfMissing(
      conn,
      "estoque_itens",
      "estoque_itens_org_prop_idx",
      "CREATE INDEX estoque_itens_org_prop_idx ON estoque_itens (organizationId, propriedadeId)",
    );
    await addIndexIfMissing(
      conn,
      "estoque_lotes",
      "estoque_lotes_org_idx",
      "CREATE INDEX estoque_lotes_org_idx ON estoque_lotes (organizationId)",
    );
    await addIndexIfMissing(
      conn,
      "estoque_lotes",
      "estoque_lotes_org_prop_idx",
      "CREATE INDEX estoque_lotes_org_prop_idx ON estoque_lotes (organizationId, propriedadeId)",
    );
    await addIndexIfMissing(
      conn,
      "estoque_lotes",
      "estoque_lotes_item_idx",
      "CREATE INDEX estoque_lotes_item_idx ON estoque_lotes (itemId)",
    );
    await addIndexIfMissing(
      conn,
      "estoque_reservas",
      "estoque_reservas_org_idx",
      "CREATE INDEX estoque_reservas_org_idx ON estoque_reservas (organizationId)",
    );
    await addIndexIfMissing(
      conn,
      "estoque_reservas",
      "estoque_reservas_org_prop_idx",
      "CREATE INDEX estoque_reservas_org_prop_idx ON estoque_reservas (organizationId, propriedadeId)",
    );
    await addIndexIfMissing(
      conn,
      "estoque_reservas",
      "estoque_reservas_tarefa_idx",
      "CREATE INDEX estoque_reservas_tarefa_idx ON estoque_reservas (tarefaId)",
    );
    await addIndexIfMissing(
      conn,
      "estoque_reservas",
      "estoque_reservas_item_idx",
      "CREATE INDEX estoque_reservas_item_idx ON estoque_reservas (itemId)",
    );
    await addIndexIfMissing(
      conn,
      "estoque_movimentos",
      "estoque_movimentos_org_idx",
      "CREATE INDEX estoque_movimentos_org_idx ON estoque_movimentos (organizationId)",
    );
    await addIndexIfMissing(
      conn,
      "estoque_movimentos",
      "estoque_movimentos_item_idx",
      "CREATE INDEX estoque_movimentos_item_idx ON estoque_movimentos (itemId)",
    );
    await addIndexIfMissing(
      conn,
      "estoque_movimentos",
      "estoque_movimentos_tarefa_idx",
      "CREATE INDEX estoque_movimentos_tarefa_idx ON estoque_movimentos (tarefaId)",
    );

    console.log("0024 estoque inteligente OK");
  } finally {
    await conn.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
