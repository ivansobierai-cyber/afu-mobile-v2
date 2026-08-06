/**
 * FASE 2H — apontamento real de execução (server = autoridade).
 * NÃO movimenta estoque, NÃO calcula custo, NÃO sobrescreve o planejado.
 */
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import {
  estoqueItens,
  maquinasOperacionais,
  operacoesAgricolasApontamentoEvidencias,
  operacoesAgricolasApontamentoInsumos,
  operacoesAgricolasApontamentos,
  type OperacaoAgricolaRow,
  type OperacaoApontamentoRow,
} from "../drizzle/schema";
import {
  assertApontamentoHorarios,
  assertAreaExecutada,
  assertInsumoQuantidade,
  canCreateApontamentoForStatus,
  canEditApontamentoForStatus,
  isMinimalValidApontamento,
  type PlanejadoRealizadoResumo,
} from "../lib/operacoes/operacao-apontamento-rules";
import type { OperacaoAgricolaStatus } from "../lib/operacoes/operacao-agricola-status";
import {
  requireOperacaoInTenant,
  requireOrgPermission,
  requirePropertyInTenant,
  type TenantContext,
} from "./tenant-access";

export type ApontamentoInsumoInput = {
  estoqueItemId?: number | null;
  descricao?: string | null;
  quantidade: number;
  unidade: string;
};

export type ApontamentoEvidenciaInput = {
  nome: string;
  contentType?: string | null;
  url?: string | null;
  privateFileId?: number | null;
};

export type CreateApontamentoInput = {
  operacaoId: number;
  inicioReal: Date;
  fimReal?: Date | null;
  areaExecutada?: number | null;
  areaUnidade?: string | null;
  operadorUserId?: number | null;
  equipeTexto?: string | null;
  maquinaOperacionalId?: number | null;
  implementoTexto?: string | null;
  condicoesObservadas?: string | null;
  problemasPausas?: string | null;
  resultadoImediato?: "ok" | "parcial" | "problema" | null;
  observacoes?: string | null;
  insumos?: ApontamentoInsumoInput[];
  evidencias?: ApontamentoEvidenciaInput[];
  clientMutationId?: string;
};

export type UpdateApontamentoInput = {
  apontamentoId: number;
  expectedRevision: number;
  inicioReal?: Date;
  fimReal?: Date | null;
  areaExecutada?: number | null;
  areaUnidade?: string | null;
  operadorUserId?: number | null;
  equipeTexto?: string | null;
  maquinaOperacionalId?: number | null;
  implementoTexto?: string | null;
  condicoesObservadas?: string | null;
  problemasPausas?: string | null;
  resultadoImediato?: "ok" | "parcial" | "problema" | null;
  observacoes?: string | null;
  /** Se informado, substitui a coleção de insumos do apontamento. */
  insumos?: ApontamentoInsumoInput[];
  clientMutationId?: string;
};

export type ApontamentoComDetalhes = OperacaoApontamentoRow & {
  insumos: Array<typeof operacoesAgricolasApontamentoInsumos.$inferSelect>;
  evidencias: Array<typeof operacoesAgricolasApontamentoEvidencias.$inferSelect>;
};

async function resolveWritableSafraForOperacao(
  tenant: TenantContext,
  op: OperacaoAgricolaRow,
): Promise<void> {
  const { requireWritableSafraId, SAFRA_READ_ONLY } = await import("./db-safras");
  try {
    await requireWritableSafraId(tenant.organizationId, op.propriedadeId, op.safraId);
  } catch (e) {
    if (e instanceof TRPCError && e.message.includes(SAFRA_READ_ONLY)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `${SAFRA_READ_ONLY}: Safra encerrada — apontamento negado`,
      });
    }
    throw e;
  }
}

function denyNotFound(): never {
  throw new TRPCError({ code: "NOT_FOUND", message: "Recurso não encontrado" });
}

async function requireApontamentoInTenant(
  tenant: TenantContext,
  apontamentoId: number,
): Promise<OperacaoApontamentoRow> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
  const rows = await db
    .select()
    .from(operacoesAgricolasApontamentos)
    .where(
      and(
        eq(operacoesAgricolasApontamentos.id, apontamentoId),
        eq(operacoesAgricolasApontamentos.organizationId, tenant.organizationId),
      ),
    )
    .limit(1);
  if (!rows[0]) denyNotFound();
  return rows[0];
}

async function validateMaquinaInProperty(
  tenant: TenantContext,
  propriedadeId: number,
  maquinaId: number | null | undefined,
): Promise<void> {
  if (maquinaId == null) return;
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
  const rows = await db
    .select()
    .from(maquinasOperacionais)
    .where(
      and(
        eq(maquinasOperacionais.id, maquinaId),
        eq(maquinasOperacionais.propriedadeId, propriedadeId),
      ),
    )
    .limit(1);
  const row = rows[0];
  if (!row) denyNotFound();
  if (row.organizationId != null && row.organizationId !== tenant.organizationId) {
    denyNotFound();
  }
}

async function validateEstoqueItemInProperty(
  tenant: TenantContext,
  propriedadeId: number,
  itemId: number | null | undefined,
): Promise<void> {
  if (itemId == null) return;
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
  const rows = await db
    .select()
    .from(estoqueItens)
    .where(
      and(eq(estoqueItens.id, itemId), eq(estoqueItens.propriedadeId, propriedadeId)),
    )
    .limit(1);
  const row = rows[0];
  if (!row) denyNotFound();
  if (row.organizationId != null && row.organizationId !== tenant.organizationId) {
    denyNotFound();
  }
}

function validateInsumosPayload(insumos: ApontamentoInsumoInput[] | undefined): void {
  if (!insumos) return;
  for (const i of insumos) {
    assertInsumoQuantidade(i.quantidade, i.unidade ?? "");
    if (i.estoqueItemId == null && !i.descricao?.trim()) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "INVALID_APONTAMENTO_INSUMO: informe estoqueItemId ou descricao",
      });
    }
  }
}

function validatePayloadCore(input: {
  inicioReal: Date;
  fimReal?: Date | null;
  areaExecutada?: number | null;
  areaUnidade?: string | null;
}): void {
  try {
    assertApontamentoHorarios(input.inicioReal, input.fimReal ?? null);
    assertAreaExecutada(input.areaExecutada ?? null, input.areaUnidade ?? "ha");
  } catch (e: unknown) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: e instanceof Error ? e.message : "INVALID_APONTAMENTO",
    });
  }
}

async function loadInsumosEvidencias(
  organizationId: number,
  apontamentoIds: number[],
): Promise<{
  insumosByApont: Map<number, Array<typeof operacoesAgricolasApontamentoInsumos.$inferSelect>>;
  evidByApont: Map<number, Array<typeof operacoesAgricolasApontamentoEvidencias.$inferSelect>>;
}> {
  const insumosByApont = new Map<
    number,
    Array<typeof operacoesAgricolasApontamentoInsumos.$inferSelect>
  >();
  const evidByApont = new Map<
    number,
    Array<typeof operacoesAgricolasApontamentoEvidencias.$inferSelect>
  >();
  if (apontamentoIds.length === 0) return { insumosByApont, evidByApont };

  const db = await getDb();
  if (!db) return { insumosByApont, evidByApont };

  const insumos = await db
    .select()
    .from(operacoesAgricolasApontamentoInsumos)
    .where(
      and(
        eq(operacoesAgricolasApontamentoInsumos.organizationId, organizationId),
        inArray(operacoesAgricolasApontamentoInsumos.apontamentoId, apontamentoIds),
      ),
    );
  for (const row of insumos) {
    const list = insumosByApont.get(row.apontamentoId) ?? [];
    list.push(row);
    insumosByApont.set(row.apontamentoId, list);
  }

  const evidencias = await db
    .select()
    .from(operacoesAgricolasApontamentoEvidencias)
    .where(
      and(
        eq(operacoesAgricolasApontamentoEvidencias.organizationId, organizationId),
        inArray(operacoesAgricolasApontamentoEvidencias.apontamentoId, apontamentoIds),
      ),
    );
  for (const row of evidencias) {
    const list = evidByApont.get(row.apontamentoId) ?? [];
    list.push(row);
    evidByApont.set(row.apontamentoId, list);
  }

  return { insumosByApont, evidByApont };
}

async function attachDetails(
  organizationId: number,
  rows: OperacaoApontamentoRow[],
): Promise<ApontamentoComDetalhes[]> {
  const { insumosByApont, evidByApont } = await loadInsumosEvidencias(
    organizationId,
    rows.map((r) => r.id),
  );
  return rows.map((r) => ({
    ...r,
    insumos: insumosByApont.get(r.id) ?? [],
    evidencias: evidByApont.get(r.id) ?? [],
  }));
}

export async function listApontamentosByOperacao(
  tenant: TenantContext,
  operacaoId: number,
): Promise<ApontamentoComDetalhes[]> {
  requireOrgPermission(tenant, "operations.read");
  await requireOperacaoInTenant(tenant, operacaoId);
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(operacoesAgricolasApontamentos)
    .where(
      and(
        eq(operacoesAgricolasApontamentos.organizationId, tenant.organizationId),
        eq(operacoesAgricolasApontamentos.operacaoAgricolaId, operacaoId),
      ),
    )
    .orderBy(asc(operacoesAgricolasApontamentos.inicioReal));
  return attachDetails(tenant.organizationId, rows);
}

export async function getApontamentoById(
  tenant: TenantContext,
  apontamentoId: number,
): Promise<ApontamentoComDetalhes> {
  requireOrgPermission(tenant, "operations.read");
  const row = await requireApontamentoInTenant(tenant, apontamentoId);
  await requireOperacaoInTenant(tenant, row.operacaoAgricolaId);
  const [detailed] = await attachDetails(tenant.organizationId, [row]);
  return detailed!;
}

function parseTimestamp(value: Date | string): Date {
  if (value instanceof Date) return value;
  // mysql2/drizzle às vezes devolve "YYYY-MM-DD HH:mm:ss" sem TZ — tratar como UTC.
  const raw = value.trim();
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(raw)) {
    return new Date(raw.replace(" ", "T") + "Z");
  }
  return new Date(raw);
}

function tsKey(value: Date | string | null | undefined): number | null {
  if (value == null) return null;
  const d = parseTimestamp(value);
  if (Number.isNaN(d.getTime())) return null;
  // MySQL TIMESTAMP costuma truncar ms — comparar em segundos.
  return Math.floor(d.getTime() / 1000);
}

function numKey(value: number | string | null | undefined): string {
  if (value == null || value === "") return "";
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "";
  // DECIMAL(12,2) / leitura MySQL pode voltar "2.50" vs 2.5
  return n.toFixed(3);
}

function strKey(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function areaUnitKey(value: string | null | undefined): string {
  return strKey(value) || "ha";
}

function sameTs(a: Date | string | null | undefined, b: Date | string | null | undefined): boolean {
  const ka = tsKey(a);
  const kb = tsKey(b);
  if (ka == null && kb == null) return true;
  if (ka == null || kb == null) return false;
  return Math.abs(ka - kb) <= 1;
}

function insumosFingerprint(insumos: ApontamentoInsumoInput[] | undefined): string {
  const list = (insumos ?? [])
    .map((i) =>
      [
        i.estoqueItemId ?? "",
        strKey(i.descricao),
        numKey(i.quantidade),
        strKey(i.unidade),
      ].join("|"),
    )
    .sort();
  return list.join(";");
}

function evidenciasFingerprint(evidencias: ApontamentoEvidenciaInput[] | undefined): string {
  const list = (evidencias ?? [])
    .map((e) => [strKey(e.nome), strKey(e.url), e.privateFileId ?? ""].join("|"))
    .sort();
  return list.join(";");
}

async function loadInsumosFingerprintForApontamento(
  organizationId: number,
  apontamentoId: number,
): Promise<string> {
  const db = await getDb();
  if (!db) return "";
  const rows = await db
    .select()
    .from(operacoesAgricolasApontamentoInsumos)
    .where(
      and(
        eq(operacoesAgricolasApontamentoInsumos.organizationId, organizationId),
        eq(operacoesAgricolasApontamentoInsumos.apontamentoId, apontamentoId),
      ),
    );
  return insumosFingerprint(
    rows.map((r) => ({
      estoqueItemId: r.estoqueItemId,
      descricao: r.descricao,
      quantidade: Number(r.quantidade),
      unidade: r.unidade,
    })),
  );
}

async function loadEvidenciasFingerprintForApontamento(
  organizationId: number,
  apontamentoId: number,
): Promise<string> {
  const db = await getDb();
  if (!db) return "";
  const rows = await db
    .select()
    .from(operacoesAgricolasApontamentoEvidencias)
    .where(
      and(
        eq(operacoesAgricolasApontamentoEvidencias.organizationId, organizationId),
        eq(operacoesAgricolasApontamentoEvidencias.apontamentoId, apontamentoId),
      ),
    );
  return evidenciasFingerprint(
    rows.map((r) => ({
      nome: r.nome,
      url: r.url,
      privateFileId: r.privateFileId,
    })),
  );
}

async function assertIdempotentCreateReplay(
  existing: OperacaoApontamentoRow,
  input: CreateApontamentoInput,
): Promise<void> {
  const sameCore =
    sameTs(existing.inicioReal, input.inicioReal) &&
    sameTs(existing.fimReal, input.fimReal ?? null) &&
    numKey(existing.areaExecutada) === numKey(input.areaExecutada ?? null) &&
    areaUnitKey(existing.areaUnidade) === areaUnitKey(input.areaUnidade) &&
    strKey(existing.equipeTexto) === strKey(input.equipeTexto) &&
    strKey(existing.implementoTexto) === strKey(input.implementoTexto) &&
    strKey(existing.observacoes) === strKey(input.observacoes) &&
    strKey(existing.condicoesObservadas) === strKey(input.condicoesObservadas) &&
    strKey(existing.problemasPausas) === strKey(input.problemasPausas) &&
    (existing.maquinaOperacionalId ?? null) === (input.maquinaOperacionalId ?? null) &&
    (existing.resultadoImediato ?? "ok") === (input.resultadoImediato ?? "ok");

  if (!sameCore) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "clientMutationId já registrado com payload incompatível",
    });
  }

  if (input.insumos) {
    const stored = await loadInsumosFingerprintForApontamento(
      existing.organizationId,
      existing.id,
    );
    if (stored !== insumosFingerprint(input.insumos)) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "clientMutationId já registrado com payload incompatível",
      });
    }
  }

  if (input.evidencias) {
    const stored = await loadEvidenciasFingerprintForApontamento(
      existing.organizationId,
      existing.id,
    );
    if (stored !== evidenciasFingerprint(input.evidencias)) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "clientMutationId já registrado com payload incompatível",
      });
    }
  }
}

export async function createApontamento(
  tenant: TenantContext,
  input: CreateApontamentoInput,
): Promise<{ apontamentoId: number; revision: number; idempotentReplay: boolean }> {
  requireOrgPermission(tenant, "operations.write");
  const op = await requireOperacaoInTenant(tenant, input.operacaoId);
  await resolveWritableSafraForOperacao(tenant, op);

  const status = op.status as OperacaoAgricolaStatus;
  if (!canCreateApontamentoForStatus(status)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `APONTAMENTO_STATUS_DENIED: não é possível registrar execução em status ${status}`,
    });
  }

  validatePayloadCore(input);
  validateInsumosPayload(input.insumos);
  await validateMaquinaInProperty(tenant, op.propriedadeId, input.maquinaOperacionalId);
  for (const i of input.insumos ?? []) {
    await validateEstoqueItemInProperty(tenant, op.propriedadeId, i.estoqueItemId);
  }

  const talhaoId = op.terrenoId ?? null;

  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

  if (input.clientMutationId) {
    const existing = await db
      .select()
      .from(operacoesAgricolasApontamentos)
      .where(
        and(
          eq(operacoesAgricolasApontamentos.operacaoAgricolaId, op.id),
          eq(operacoesAgricolasApontamentos.clientMutationId, input.clientMutationId),
        ),
      )
      .limit(1);
    if (existing[0]) {
      await assertIdempotentCreateReplay(existing[0], input);
      return {
        apontamentoId: existing[0].id,
        revision: existing[0].revision ?? 0,
        idempotentReplay: true,
      };
    }
  }

  try {
    const result = await db.transaction(async (tx) => {
      const inserted = await tx.insert(operacoesAgricolasApontamentos).values({
        organizationId: tenant.organizationId,
        propriedadeId: op.propriedadeId,
        safraId: op.safraId ?? null,
        operacaoAgricolaId: op.id,
        talhaoId,
        inicioReal: input.inicioReal,
        fimReal: input.fimReal ?? null,
        areaExecutada:
          input.areaExecutada != null ? String(input.areaExecutada) : null,
        areaUnidade: input.areaUnidade?.trim() || "ha",
        operadorUserId: input.operadorUserId ?? tenant.userId,
        equipeTexto: input.equipeTexto?.trim() || null,
        maquinaOperacionalId: input.maquinaOperacionalId ?? null,
        implementoTexto: input.implementoTexto?.trim() || null,
        condicoesObservadas: input.condicoesObservadas?.trim() || null,
        problemasPausas: input.problemasPausas?.trim() || null,
        resultadoImediato: input.resultadoImediato ?? "ok",
        observacoes: input.observacoes?.trim() || null,
        revision: 0,
        clientMutationId: input.clientMutationId ?? null,
        createdByUserId: tenant.userId,
        updatedByUserId: tenant.userId,
      });
      const apontamentoId = inserted[0].insertId;

      for (const i of input.insumos ?? []) {
        await tx.insert(operacoesAgricolasApontamentoInsumos).values({
          organizationId: tenant.organizationId,
          apontamentoId,
          estoqueItemId: i.estoqueItemId ?? null,
          descricao: i.descricao?.trim() || null,
          quantidade: String(i.quantidade),
          unidade: i.unidade.trim(),
          createdByUserId: tenant.userId,
        });
      }

      for (const e of input.evidencias ?? []) {
        if (!e.nome.trim()) continue;
        await tx.insert(operacoesAgricolasApontamentoEvidencias).values({
          organizationId: tenant.organizationId,
          apontamentoId,
          nome: e.nome.trim(),
          contentType: e.contentType ?? null,
          url: e.url ?? null,
          privateFileId: e.privateFileId ?? null,
          createdByUserId: tenant.userId,
        });
      }

      return apontamentoId;
    });

    return { apontamentoId: result, revision: 0, idempotentReplay: false };
  } catch (e: unknown) {
    if (e instanceof TRPCError) throw e;
    const err = e as { code?: string };
    if (err.code === "ER_DUP_ENTRY" && input.clientMutationId) {
      const replay = await db
        .select()
        .from(operacoesAgricolasApontamentos)
        .where(
          and(
            eq(operacoesAgricolasApontamentos.operacaoAgricolaId, op.id),
            eq(operacoesAgricolasApontamentos.clientMutationId, input.clientMutationId),
          ),
        )
        .limit(1);
      if (replay[0]) {
        await assertIdempotentCreateReplay(replay[0], input);
        return {
          apontamentoId: replay[0].id,
          revision: replay[0].revision ?? 0,
          idempotentReplay: true,
        };
      }
    }
    throw e;
  }
}

export async function updateApontamento(
  tenant: TenantContext,
  input: UpdateApontamentoInput,
): Promise<{ apontamentoId: number; revision: number }> {
  requireOrgPermission(tenant, "operations.write");
  const row = await requireApontamentoInTenant(tenant, input.apontamentoId);
  const op = await requireOperacaoInTenant(tenant, row.operacaoAgricolaId);
  await resolveWritableSafraForOperacao(tenant, op);

  const status = op.status as OperacaoAgricolaStatus;
  if (!canEditApontamentoForStatus(status)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `APONTAMENTO_STATUS_DENIED: apontamento imutável em status ${status}`,
    });
  }

  if (input.expectedRevision !== (row.revision ?? 0)) {
    throw new TRPCError({
      code: "CONFLICT",
      message: `Conflito de revisão: esperado ${input.expectedRevision}, servidor ${row.revision ?? 0}`,
    });
  }

  const inicioReal = input.inicioReal ?? new Date(row.inicioReal);
  const fimReal =
    input.fimReal !== undefined
      ? input.fimReal
      : row.fimReal
        ? new Date(row.fimReal)
        : null;
  const areaExecutada =
    input.areaExecutada !== undefined
      ? input.areaExecutada
      : row.areaExecutada != null
        ? Number(row.areaExecutada)
        : null;
  const areaUnidade =
    input.areaUnidade !== undefined ? input.areaUnidade : row.areaUnidade;

  validatePayloadCore({ inicioReal, fimReal, areaExecutada, areaUnidade });
  validateInsumosPayload(input.insumos);
  await validateMaquinaInProperty(
    tenant,
    op.propriedadeId,
    input.maquinaOperacionalId !== undefined
      ? input.maquinaOperacionalId
      : row.maquinaOperacionalId,
  );
  for (const i of input.insumos ?? []) {
    await validateEstoqueItemInProperty(tenant, op.propriedadeId, i.estoqueItemId);
  }

  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

  const nextRevision = (row.revision ?? 0) + 1;

  await db.transaction(async (tx) => {
    const locked = await tx
      .select()
      .from(operacoesAgricolasApontamentos)
      .where(
        and(
          eq(operacoesAgricolasApontamentos.id, row.id),
          eq(operacoesAgricolasApontamentos.organizationId, tenant.organizationId),
          eq(operacoesAgricolasApontamentos.revision, row.revision ?? 0),
        ),
      )
      .limit(1);
    if (!locked[0]) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Apontamento alterado por outra sessão; atualize e tente novamente",
      });
    }

    await tx
      .update(operacoesAgricolasApontamentos)
      .set({
        inicioReal,
        fimReal,
        areaExecutada: areaExecutada != null ? String(areaExecutada) : null,
        areaUnidade: areaUnidade?.trim() || "ha",
        operadorUserId:
          input.operadorUserId !== undefined ? input.operadorUserId : row.operadorUserId,
        equipeTexto:
          input.equipeTexto !== undefined
            ? input.equipeTexto?.trim() || null
            : row.equipeTexto,
        maquinaOperacionalId:
          input.maquinaOperacionalId !== undefined
            ? input.maquinaOperacionalId
            : row.maquinaOperacionalId,
        implementoTexto:
          input.implementoTexto !== undefined
            ? input.implementoTexto?.trim() || null
            : row.implementoTexto,
        condicoesObservadas:
          input.condicoesObservadas !== undefined
            ? input.condicoesObservadas?.trim() || null
            : row.condicoesObservadas,
        problemasPausas:
          input.problemasPausas !== undefined
            ? input.problemasPausas?.trim() || null
            : row.problemasPausas,
        resultadoImediato:
          input.resultadoImediato !== undefined
            ? input.resultadoImediato
            : row.resultadoImediato,
        observacoes:
          input.observacoes !== undefined
            ? input.observacoes?.trim() || null
            : row.observacoes,
        revision: nextRevision,
        updatedByUserId: tenant.userId,
      })
      .where(
        and(
          eq(operacoesAgricolasApontamentos.id, row.id),
          eq(operacoesAgricolasApontamentos.organizationId, tenant.organizationId),
        ),
      );

    if (input.insumos) {
      await tx
        .delete(operacoesAgricolasApontamentoInsumos)
        .where(
          and(
            eq(operacoesAgricolasApontamentoInsumos.apontamentoId, row.id),
            eq(operacoesAgricolasApontamentoInsumos.organizationId, tenant.organizationId),
          ),
        );
      for (const i of input.insumos) {
        await tx.insert(operacoesAgricolasApontamentoInsumos).values({
          organizationId: tenant.organizationId,
          apontamentoId: row.id,
          estoqueItemId: i.estoqueItemId ?? null,
          descricao: i.descricao?.trim() || null,
          quantidade: String(i.quantidade),
          unidade: i.unidade.trim(),
          createdByUserId: tenant.userId,
        });
      }
    }
  });

  return { apontamentoId: row.id, revision: nextRevision };
}

export async function addApontamentoEvidencia(
  tenant: TenantContext,
  input: { apontamentoId: number } & ApontamentoEvidenciaInput,
): Promise<number> {
  requireOrgPermission(tenant, "operations.write");
  const row = await requireApontamentoInTenant(tenant, input.apontamentoId);
  const op = await requireOperacaoInTenant(tenant, row.operacaoAgricolaId);
  await resolveWritableSafraForOperacao(tenant, op);
  const status = op.status as OperacaoAgricolaStatus;
  if (!canEditApontamentoForStatus(status) && !canCreateApontamentoForStatus(status)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `APONTAMENTO_STATUS_DENIED: evidência imutável em status ${status}`,
    });
  }
  if (!input.nome.trim()) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Nome da evidência obrigatório" });
  }

  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

  if (input.privateFileId != null) {
    const { privateFiles } = await import("../drizzle/schema");
    const fileRows = await db
      .select()
      .from(privateFiles)
      .where(
        and(
          eq(privateFiles.id, input.privateFileId),
          eq(privateFiles.organizationId, tenant.organizationId),
        ),
      )
      .limit(1);
    if (!fileRows[0]) denyNotFound();
  }

  const result = await db.insert(operacoesAgricolasApontamentoEvidencias).values({
    organizationId: tenant.organizationId,
    apontamentoId: row.id,
    nome: input.nome.trim(),
    contentType: input.contentType ?? null,
    url: input.url ?? null,
    privateFileId: input.privateFileId ?? null,
    createdByUserId: tenant.userId,
  });
  return result[0].insertId;
}

export async function getPlanejadoRealizadoResumo(
  tenant: TenantContext,
  operacaoId: number,
): Promise<PlanejadoRealizadoResumo> {
  requireOrgPermission(tenant, "operations.read");
  const op = await requireOperacaoInTenant(tenant, operacaoId);
  await requirePropertyInTenant(tenant, op.propriedadeId);

  let areaHa: number | null = null;
  if (op.terrenoId) {
    const { getTerrenoById } = await import("./db");
    const terreno = await getTerrenoById(op.terrenoId);
    if (terreno && terreno.organizationId === tenant.organizationId) {
      areaHa = terreno.area != null ? Number(terreno.area) : null;
    }
  }

  const apontamentos = await listApontamentosByOperacao(tenant, operacaoId);
  let areaTotal = 0;
  let hasArea = false;
  let areaUnidade: string | null = null;
  let inicioMin: Date | null = null;
  let fimMax: Date | null = null;
  const operadores: PlanejadoRealizadoResumo["realizado"]["operadores"] = [];
  const maquinas: PlanejadoRealizadoResumo["realizado"]["maquinas"] = [];
  const insumos: PlanejadoRealizadoResumo["realizado"]["insumos"] = [];

  for (const a of apontamentos) {
    if (a.areaExecutada != null) {
      areaTotal += Number(a.areaExecutada);
      hasArea = true;
      areaUnidade = a.areaUnidade ?? areaUnidade;
    }
    const ini = new Date(a.inicioReal);
    if (!inicioMin || ini < inicioMin) inicioMin = ini;
    if (a.fimReal) {
      const fim = new Date(a.fimReal);
      if (!fimMax || fim > fimMax) fimMax = fim;
    }
    operadores.push({ userId: a.operadorUserId, equipeTexto: a.equipeTexto });
    maquinas.push({
      maquinaOperacionalId: a.maquinaOperacionalId,
      implementoTexto: a.implementoTexto,
    });
    for (const i of a.insumos) {
      insumos.push({
        estoqueItemId: i.estoqueItemId,
        descricao: i.descricao,
        quantidade: String(i.quantidade),
        unidade: i.unidade,
      });
    }
  }

  return {
    planejado: {
      dataPrevista: op.dataPrevista,
      talhaoId: op.terrenoId ?? null,
      areaHa,
    },
    realizado: {
      apontamentosCount: apontamentos.length,
      areaExecutadaTotal: hasArea ? areaTotal : null,
      areaUnidade,
      inicioRealMin: inicioMin,
      fimRealMax: fimMax,
      operadores,
      maquinas,
      insumos,
    },
  };
}

/** Usado pela transição 2G → concluida (sem backfill). */
export async function operacaoHasMinimalValidApontamento(
  organizationId: number,
  operacaoId: number,
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const rows = await db
    .select()
    .from(operacoesAgricolasApontamentos)
    .where(
      and(
        eq(operacoesAgricolasApontamentos.organizationId, organizationId),
        eq(operacoesAgricolasApontamentos.operacaoAgricolaId, operacaoId),
      ),
    );
  return rows.some((r) =>
    isMinimalValidApontamento({
      inicioReal: r.inicioReal,
      fimReal: r.fimReal,
      createdByUserId: r.createdByUserId,
    }),
  );
}

/** Contagem auxiliar — não cria movimento de estoque. */
export async function countApontamentoInsumos(organizationId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db
    .select({ c: sql<number>`count(*)` })
    .from(operacoesAgricolasApontamentoInsumos)
    .where(eq(operacoesAgricolasApontamentoInsumos.organizationId, organizationId));
  return Number(rows[0]?.c ?? 0);
}
