/**
 * Etapa 5 — camada obrigatória de consultas protegidas (equivalente a RLS).
 *
 * MySQL 8 não oferece Row-Level Security. Toda leitura/escrita de tabelas
 * privadas DEVE passar por este módulo (ou helpers que delegam a ele).
 *
 * Regras:
 * - SELECT/UPDATE/DELETE sempre incluem `organizationId` no WHERE
 * - INSERT sempre carimba `organizationId` (falha se ausente)
 * - UPDATE não pode alterar `organizationId` (strip no payload)
 * - Cross-tenant → null / 0 rows / TRPC NOT_FOUND (sem vazar existência)
 */
import { and, eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import {
  propriedades,
  terrenos,
  culturas,
  diagnosticosIa,
  analisesFitotecnicas,
  relatorios,
  calendarioCuidados,
  tarefasOperacionais,
  sensores,
  ocorrenciasCampo,
  estoqueItens,
  orcamentosSafra,
  custosOperacao,
  atividadePropriedade,
  type InsertPropriedade,
  type InsertTerreno,
  type InsertCultura,
  type InsertDiagnosticoIa,
  type InsertAnaliseFitotecnica,
  type InsertRelatorio,
  type InsertCalendarioCuidado,
  type InsertTarefaOperacional,
  type InsertSensor,
  type InsertOcorrenciaCampo,
  type InsertEstoqueItem,
  type InsertOrcamentoSafra,
  type InsertCustoOperacao,
  type InsertAtividadePropriedade,
} from "../drizzle/schema";
/** Mesma mensagem da API — sem vazar existência cross-tenant */
export const TENANT_DB_NOT_FOUND = "Recurso não encontrado";

export type TenantScope = { organizationId: number };

/** Tabelas privadas cobertas pela defesa equivalente a RLS */
export const TENANT_PRIVATE_TABLES = [
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

function assertOrgId(organizationId: number): number {
  if (!Number.isFinite(organizationId) || organizationId <= 0) {
    throw new Error("TenantDb: organizationId inválido");
  }
  return organizationId;
}

/** Remove tentativa de mover registro entre organizações */
function stripOrg<T extends Record<string, unknown>>(data: T): Omit<T, "organizationId"> {
  const { organizationId: _drop, ...rest } = data;
  return rest as Omit<T, "organizationId">;
}

async function requireDb() {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
  }
  return db;
}

/**
 * Mutação tenant-scoped de baixo nível.
 * Retorna true se afetou ≥1 linha da organização.
 */
export async function tenantUpdateById(
  organizationId: number,
  table: {
    id: any;
    organizationId: any;
  },
  id: number,
  data: Record<string, unknown>,
): Promise<boolean> {
  const db = await requireDb();
  const orgId = assertOrgId(organizationId);
  const safe = stripOrg(data);
  const result = await db
    .update(table as any)
    .set(safe)
    .where(and(eq(table.id, id), eq(table.organizationId, orgId)));
  const affected = Number((result as any)[0]?.affectedRows ?? 0);
  return affected > 0;
}

export async function tenantDeleteById(
  organizationId: number,
  table: { id: any; organizationId: any },
  id: number,
): Promise<boolean> {
  const db = await requireDb();
  const orgId = assertOrgId(organizationId);
  const result = await db
    .delete(table as any)
    .where(and(eq(table.id, id), eq(table.organizationId, orgId)));
  const affected = Number((result as any)[0]?.affectedRows ?? 0);
  return affected > 0;
}

export async function tenantGetById<T>(
  organizationId: number,
  table: { id: any; organizationId: any },
  id: number,
): Promise<T | undefined> {
  const db = await requireDb();
  const orgId = assertOrgId(organizationId);
  const rows = await db
    .select()
    .from(table as any)
    .where(and(eq(table.id, id), eq(table.organizationId, orgId)))
    .limit(1);
  return rows[0] as T | undefined;
}

export function requireTenantRow<T>(row: T | undefined | null): T {
  if (row == null) {
    throw new TRPCError({ code: "NOT_FOUND", message: TENANT_DB_NOT_FOUND });
  }
  return row;
}

/** Exige organizationId em valores de insert (Etapa 5) */
export function requireInsertOrganizationId<T extends { organizationId?: number | null }>(
  data: T,
  resolved?: number | null,
): number {
  const orgId = data.organizationId ?? resolved ?? null;
  if (orgId == null || !Number.isFinite(orgId) || orgId <= 0) {
    throw new Error("TenantDb: organizationId obrigatório no INSERT de tabela privada");
  }
  return orgId;
}

/**
 * Repositório tenant-scoped — API preferida para routers/serviços.
 */
export function createTenantDb(organizationId: number) {
  const orgId = assertOrgId(organizationId);

  return {
    organizationId: orgId,

    // ── Propriedades ──────────────────────────────────────────────────────
    async listPropriedades() {
      const db = await requireDb();
      return db
        .select()
        .from(propriedades)
        .where(eq(propriedades.organizationId, orgId));
    },
    async getPropriedade(id: number) {
      return tenantGetById<typeof propriedades.$inferSelect>(orgId, propriedades, id);
    },
    async requirePropriedade(id: number) {
      return requireTenantRow(await this.getPropriedade(id));
    },
    async updatePropriedade(id: number, data: Partial<InsertPropriedade>) {
      return tenantUpdateById(orgId, propriedades, id, data as any);
    },
    async deletePropriedade(id: number) {
      return tenantDeleteById(orgId, propriedades, id);
    },

    // ── Terrenos ──────────────────────────────────────────────────────────
    async listTerrenosByPropriedade(propriedadeId: number) {
      const db = await requireDb();
      return db
        .select()
        .from(terrenos)
        .where(
          and(eq(terrenos.propriedadeId, propriedadeId), eq(terrenos.organizationId, orgId)),
        );
    },
    async getTerreno(id: number) {
      return tenantGetById<typeof terrenos.$inferSelect>(orgId, terrenos, id);
    },
    async requireTerreno(id: number) {
      return requireTenantRow(await this.getTerreno(id));
    },
    async updateTerreno(id: number, data: Partial<InsertTerreno>) {
      return tenantUpdateById(orgId, terrenos, id, data as any);
    },
    async deleteTerreno(id: number) {
      return tenantDeleteById(orgId, terrenos, id);
    },

    // ── Culturas ──────────────────────────────────────────────────────────
    async listCulturas() {
      const db = await requireDb();
      return db
        .select()
        .from(culturas)
        .where(eq(culturas.organizationId, orgId))
        .orderBy(desc(culturas.createdAt));
    },
    async listCulturasByPropriedade(propriedadeId: number) {
      const db = await requireDb();
      return db
        .select()
        .from(culturas)
        .where(
          and(eq(culturas.propriedadeId, propriedadeId), eq(culturas.organizationId, orgId)),
        );
    },
    async getCultura(id: number) {
      return tenantGetById<typeof culturas.$inferSelect>(orgId, culturas, id);
    },
    async requireCultura(id: number) {
      return requireTenantRow(await this.getCultura(id));
    },
    async updateCultura(id: number, data: Partial<InsertCultura>) {
      return tenantUpdateById(orgId, culturas, id, data as any);
    },
    async deleteCultura(id: number) {
      return tenantDeleteById(orgId, culturas, id);
    },

    // ── Relatórios / análises / diagnósticos / calendário / tarefas ─────
    async getRelatorio(id: number) {
      return tenantGetById<typeof relatorios.$inferSelect>(orgId, relatorios, id);
    },
    async requireRelatorio(id: number) {
      return requireTenantRow(await this.getRelatorio(id));
    },
    async listRelatorios() {
      const db = await requireDb();
      return db
        .select()
        .from(relatorios)
        .where(eq(relatorios.organizationId, orgId))
        .orderBy(desc(relatorios.dataEmissao));
    },
    async updateRelatorio(id: number, data: Partial<InsertRelatorio>) {
      return tenantUpdateById(orgId, relatorios, id, data as any);
    },
    async deleteRelatorio(id: number) {
      return tenantDeleteById(orgId, relatorios, id);
    },

    async getAnalise(id: number) {
      return tenantGetById<typeof analisesFitotecnicas.$inferSelect>(
        orgId,
        analisesFitotecnicas,
        id,
      );
    },
    async requireAnalise(id: number) {
      return requireTenantRow(await this.getAnalise(id));
    },
    async listAnalises() {
      const db = await requireDb();
      return db
        .select()
        .from(analisesFitotecnicas)
        .where(eq(analisesFitotecnicas.organizationId, orgId))
        .orderBy(desc(analisesFitotecnicas.dataAnalise));
    },
    async deleteAnalise(id: number) {
      return tenantDeleteById(orgId, analisesFitotecnicas, id);
    },

    async listDiagnosticos() {
      const db = await requireDb();
      return db
        .select()
        .from(diagnosticosIa)
        .where(eq(diagnosticosIa.organizationId, orgId))
        .orderBy(desc(diagnosticosIa.dataDiagnostico));
    },
    async getDiagnostico(id: number) {
      return tenantGetById<typeof diagnosticosIa.$inferSelect>(orgId, diagnosticosIa, id);
    },
    async requireDiagnostico(id: number) {
      return requireTenantRow(await this.getDiagnostico(id));
    },
    async updateDiagnostico(id: number, data: Partial<InsertDiagnosticoIa>) {
      return tenantUpdateById(orgId, diagnosticosIa, id, data as any);
    },

    async getEvento(id: number) {
      return tenantGetById<typeof calendarioCuidados.$inferSelect>(
        orgId,
        calendarioCuidados,
        id,
      );
    },
    async requireEvento(id: number) {
      return requireTenantRow(await this.getEvento(id));
    },
    async listEventos() {
      const db = await requireDb();
      return db
        .select()
        .from(calendarioCuidados)
        .where(eq(calendarioCuidados.organizationId, orgId))
        .orderBy(calendarioCuidados.dataProgramada);
    },
    async updateEvento(id: number, data: Partial<InsertCalendarioCuidado>) {
      return tenantUpdateById(orgId, calendarioCuidados, id, data as any);
    },
    async deleteEvento(id: number) {
      return tenantDeleteById(orgId, calendarioCuidados, id);
    },

    async getTarefa(id: number) {
      return tenantGetById<typeof tarefasOperacionais.$inferSelect>(
        orgId,
        tarefasOperacionais,
        id,
      );
    },
    async requireTarefa(id: number) {
      return requireTenantRow(await this.getTarefa(id));
    },
    async listTarefasByPropriedade(propriedadeId: number) {
      const db = await requireDb();
      return db
        .select()
        .from(tarefasOperacionais)
        .where(
          and(
            eq(tarefasOperacionais.propriedadeId, propriedadeId),
            eq(tarefasOperacionais.organizationId, orgId),
          ),
        )
        .orderBy(tarefasOperacionais.dataPrevista);
    },
    async updateTarefa(id: number, data: Partial<InsertTarefaOperacional>) {
      return tenantUpdateById(orgId, tarefasOperacionais, id, data as any);
    },

    // ── Expansão ──────────────────────────────────────────────────────────
    async getOcorrencia(id: number) {
      return tenantGetById<typeof ocorrenciasCampo.$inferSelect>(orgId, ocorrenciasCampo, id);
    },
    async requireOcorrencia(id: number) {
      return requireTenantRow(await this.getOcorrencia(id));
    },
    async updateOcorrencia(id: number, data: Partial<InsertOcorrenciaCampo>) {
      return tenantUpdateById(orgId, ocorrenciasCampo, id, data as any);
    },
    async listOcorrencias(propriedadeId: number) {
      const db = await requireDb();
      return db
        .select()
        .from(ocorrenciasCampo)
        .where(
          and(
            eq(ocorrenciasCampo.propriedadeId, propriedadeId),
            eq(ocorrenciasCampo.organizationId, orgId),
          ),
        )
        .orderBy(desc(ocorrenciasCampo.createdAt));
    },

    async getEstoqueItem(id: number) {
      return tenantGetById<typeof estoqueItens.$inferSelect>(orgId, estoqueItens, id);
    },
    async listEstoque(propriedadeId: number) {
      const db = await requireDb();
      return db
        .select()
        .from(estoqueItens)
        .where(
          and(eq(estoqueItens.propriedadeId, propriedadeId), eq(estoqueItens.organizationId, orgId)),
        );
    },

    async listOrcamentos(propriedadeId: number) {
      const db = await requireDb();
      return db
        .select()
        .from(orcamentosSafra)
        .where(
          and(
            eq(orcamentosSafra.propriedadeId, propriedadeId),
            eq(orcamentosSafra.organizationId, orgId),
          ),
        );
    },
    async listCustos(propriedadeId: number) {
      const db = await requireDb();
      return db
        .select()
        .from(custosOperacao)
        .where(
          and(
            eq(custosOperacao.propriedadeId, propriedadeId),
            eq(custosOperacao.organizationId, orgId),
          ),
        )
        .orderBy(desc(custosOperacao.dataCusto));
    },
    async listAtividades(propriedadeId: number, limit = 30) {
      const db = await requireDb();
      return db
        .select()
        .from(atividadePropriedade)
        .where(
          and(
            eq(atividadePropriedade.propriedadeId, propriedadeId),
            eq(atividadePropriedade.organizationId, orgId),
          ),
        )
        .orderBy(desc(atividadePropriedade.createdAt))
        .limit(limit);
    },

    async listSensores(propriedadeId: number) {
      const db = await requireDb();
      return db
        .select()
        .from(sensores)
        .where(and(eq(sensores.propriedadeId, propriedadeId), eq(sensores.organizationId, orgId)));
    },

    /** KPIs do dashboard — sempre filtrados pela org */
    async dashboardStats(perfilUsuarioId?: number) {
      const db = await requireDb();
      const [props, cults, diags, anals, rels, evts] = await Promise.all([
        db.select().from(propriedades).where(eq(propriedades.organizationId, orgId)),
        db
          .select()
          .from(culturas)
          .where(and(eq(culturas.organizationId, orgId), eq(culturas.status, "em_andamento"))),
        db
          .select()
          .from(diagnosticosIa)
          .where(eq(diagnosticosIa.organizationId, orgId)),
        db
          .select()
          .from(analisesFitotecnicas)
          .where(eq(analisesFitotecnicas.organizationId, orgId)),
        db.select().from(relatorios).where(eq(relatorios.organizationId, orgId)),
        db
          .select()
          .from(calendarioCuidados)
          .where(
            and(
              eq(calendarioCuidados.organizationId, orgId),
              eq(calendarioCuidados.status, "pendente"),
            ),
          ),
      ]);
      void perfilUsuarioId;
      return {
        propriedades: props.length,
        culturas: cults.length,
        diagnosticos: diags.length,
        analises: anals.length,
        relatorios: rels.length,
        eventos: evts.length,
      };
    },
  };
}

export type TenantDb = ReturnType<typeof createTenantDb>;

/** Atalho a partir do contexto de API */
export function tenantDbFrom(scope: TenantScope): TenantDb {
  return createTenantDb(scope.organizationId);
}

// Re-export insert types used by callers that stamp via requireInsertOrganizationId
export type {
  InsertPropriedade,
  InsertTerreno,
  InsertCultura,
  InsertDiagnosticoIa,
  InsertAnaliseFitotecnica,
  InsertRelatorio,
  InsertCalendarioCuidado,
  InsertTarefaOperacional,
  InsertSensor,
  InsertOcorrenciaCampo,
  InsertEstoqueItem,
  InsertOrcamentoSafra,
  InsertCustoOperacao,
  InsertAtividadePropriedade,
};
