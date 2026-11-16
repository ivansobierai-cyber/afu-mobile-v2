/**
 * WP-03 — ponte diagnóstico IA ↔ tarefa operacional (legadoDiagnosticoId).
 * Não apaga diagnósticos, tarefas ou histórico.
 */
import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import {
  diagnosticosIa,
  tarefasOperacionais,
  type DiagnosticoIa,
  type TarefaOperacional,
} from "../drizzle/schema";
import type { TenantContext } from "./tenant-access";
import {
  assertRelatedIdsInTenant,
  requireWritablePropertyInTenant,
} from "./tenant-access";
import { requireWritableSafraId } from "./db-safras";
import {
  buildInstrucoesTarefaFromDiagnostico,
  buildTituloTarefaFromDiagnostico,
  mapDiagnosticoGravidadeToPrioridade,
  mapDiagnosticoTipoToTipoOperacao,
} from "../lib/operacoes/diagnostico-tarefa-map";

export async function findTarefaByLegadoDiagnosticoId(
  organizationId: number,
  diagnosticoId: number,
): Promise<TarefaOperacional | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(tarefasOperacionais)
    .where(
      and(
        eq(tarefasOperacionais.organizationId, organizationId),
        eq(tarefasOperacionais.legadoDiagnosticoId, diagnosticoId),
      ),
    )
    .limit(1);
  return rows[0];
}

function parseResultadoJson(resultado: string | null | undefined): {
  problema?: string;
  tipo?: string;
  severidade?: string;
  recomendacoes: string[];
  observacoesTecnicas?: string;
} {
  if (!resultado) return { recomendacoes: [] };
  try {
    const parsed = JSON.parse(resultado) as Record<string, unknown>;
    const recomendacoes = Array.isArray(parsed.recomendacoes)
      ? (parsed.recomendacoes as unknown[]).filter((r): r is string => typeof r === "string")
      : [];
    return {
      problema: typeof parsed.problema === "string" ? parsed.problema : undefined,
      tipo: typeof parsed.tipo === "string" ? parsed.tipo : undefined,
      severidade: typeof parsed.severidade === "string" ? parsed.severidade : undefined,
      recomendacoes,
      observacoesTecnicas:
        typeof parsed.observacoesTecnicas === "string"
          ? parsed.observacoesTecnicas
          : undefined,
    };
  } catch {
    return { recomendacoes: [] };
  }
}

export type CreateTarefaFromDiagnosticoInput = {
  diagnosticoId: number;
  titulo?: string;
  dataPrevista?: string;
  /** Índice 0-based da recomendação a enfatizar (opcional). */
  recomendacaoIndex?: number;
  safraId?: number;
  terrenoId?: number;
};

/**
 * Cria tarefa a partir do laudo/recomendações. Idempotente via UNIQUE(legadoDiagnosticoId).
 */
export async function createTarefaFromDiagnostico(
  tenant: TenantContext,
  input: CreateTarefaFromDiagnosticoInput,
): Promise<{ tarefaId: number; diagnosticoId: number; created: boolean }> {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
  }

  const rows = await db
    .select()
    .from(diagnosticosIa)
    .where(
      and(
        eq(diagnosticosIa.id, input.diagnosticoId),
        eq(diagnosticosIa.organizationId, tenant.organizationId),
      ),
    )
    .limit(1);
  const diag = rows[0] as DiagnosticoIa | undefined;
  if (!diag) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Diagnóstico não encontrado" });
  }
  if (diag.propriedadeId == null) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Diagnóstico sem propriedade não gera tarefa vinculada",
    });
  }

  await requireWritablePropertyInTenant(tenant, diag.propriedadeId);

  // Terreno/safra/cultura devem pertencer à mesma propriedade do laudo.
  await assertRelatedIdsInTenant(tenant, {
    propriedadeId: diag.propriedadeId,
    safraId: input.safraId ?? diag.safraId ?? undefined,
    terrenoId: input.terrenoId,
    culturaId: diag.culturaId ?? undefined,
  });

  const existing = await findTarefaByLegadoDiagnosticoId(
    tenant.organizationId,
    diag.id,
  );
  if (existing) {
    return { tarefaId: existing.id, diagnosticoId: diag.id, created: false };
  }

  const parsed = parseResultadoJson(diag.resultado);
  const tipo =
    parsed.tipo ??
    (diag.pragaProvavel ? "praga" : diag.doencaProvavel ? "doenca" : "outro");
  const gravidade = parsed.severidade ?? diag.gravidade ?? "leve";
  const recomendacoes =
    parsed.recomendacoes.length > 0
      ? parsed.recomendacoes
      : diag.recomendacao
        ? diag.recomendacao.split("; ").filter(Boolean)
        : [];

  const recomendacaoIndex =
    input.recomendacaoIndex != null &&
    input.recomendacaoIndex >= 0 &&
    input.recomendacaoIndex < recomendacoes.length
      ? input.recomendacaoIndex
      : undefined;

  const safra = await requireWritableSafraId(
    tenant.organizationId,
    diag.propriedadeId,
    input.safraId ?? diag.safraId ?? null,
  );

  const titulo =
    input.titulo?.trim() ||
    buildTituloTarefaFromDiagnostico({
      problema: parsed.problema ?? diag.pragaProvavel ?? diag.doencaProvavel,
      recomendacaoIndex,
      recomendacaoTexto:
        recomendacaoIndex != null ? recomendacoes[recomendacaoIndex] : undefined,
    });

  const instrucoes = buildInstrucoesTarefaFromDiagnostico({
    diagnosticoId: diag.id,
    recomendacoes,
    recomendacaoIndex,
    observacoesTecnicas: parsed.observacoesTecnicas,
  });

  try {
    const result = await db.insert(tarefasOperacionais).values({
      usuarioId: tenant.perfilId,
      organizationId: tenant.organizationId,
      propriedadeId: diag.propriedadeId,
      safraId: safra.id,
      terrenoId: input.terrenoId ?? null,
      culturaId: diag.culturaId ?? null,
      tipoOperacao: mapDiagnosticoTipoToTipoOperacao(tipo),
      titulo,
      instrucoes,
      prioridade: mapDiagnosticoGravidadeToPrioridade(gravidade),
      status: "planejada",
      dataPrevista: input.dataPrevista ? new Date(input.dataPrevista) : new Date(),
      origem: "diagnostico",
      legadoDiagnosticoId: diag.id,
    });
    const tarefaId = Number(result[0].insertId);
    return { tarefaId, diagnosticoId: diag.id, created: true };
  } catch (e: any) {
    // Corrida: UNIQUE(legadoDiagnosticoId) — retorna a existente.
    if (e?.code === "ER_DUP_ENTRY" || e?.errno === 1062) {
      const again = await findTarefaByLegadoDiagnosticoId(
        tenant.organizationId,
        diag.id,
      );
      if (again) {
        return { tarefaId: again.id, diagnosticoId: diag.id, created: false };
      }
    }
    throw e;
  }
}
