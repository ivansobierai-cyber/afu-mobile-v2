/**
 * WP-04 — revisão técnica de diagnóstico IA (aprovar / corrigir / rejeitar).
 * Não apaga o laudo original; guarda parecer e correção em colunas aditivas.
 * Se já houver tarefa vinculada (WP-03), anexa nota à instrução (nunca apaga).
 */
import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import {
  diagnosticosIa,
  tarefasOperacionais,
  type DiagnosticoIa,
} from "../drizzle/schema";
import type { TenantContext } from "./tenant-access";
import { writeAuditLog } from "./private-files";
import { sendPushToUsuario } from "./services/push-delivery";
import { findTarefaByLegadoDiagnosticoId } from "./db-diagnostico-tarefa-bridge";
import {
  appendNotaToInstrucoes,
  buildNotaRevisaoParaTarefa,
  mapAcaoRevisaoToStatus,
  shouldBlockTarefaOnDescartar,
  type DiagnosticoAcaoRevisao,
  type DiagnosticoStatusRevisao,
} from "../lib/diagnostico-revisao";

export type RevisarDiagnosticoInput = {
  diagnosticoId: number;
  acao: DiagnosticoAcaoRevisao;
  /** Obrigatório para corrigir e descartar; opcional ao confirmar. */
  parecerTecnico?: string;
  /** Obrigatório quando acao = corrigir. */
  recomendacaoCorrigida?: string;
};

export type TarefaImpactoRevisao = {
  tarefaId: number;
  updated: boolean;
  flaggedNeedsReview: boolean;
  status: string;
  statusChanged: boolean;
};

export type RevisarDiagnosticoResult = {
  id: number;
  statusRevisao: DiagnosticoStatusRevisao;
  revisadoEm: Date | null;
  revisadoPorUserId: number | null;
  parecerTecnico: string | null;
  recomendacaoCorrigida: string | null;
  /** Tarefa já vinculada ao laudo, se existir e tiver sido tocada. */
  tarefaImpacto: TarefaImpactoRevisao | null;
};

function requireNonEmpty(label: string, value: string | undefined): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `${label} é obrigatório`,
    });
  }
  return trimmed;
}

/**
 * Aplica revisão técnica no diagnóstico da organização ativa.
 * Audita em audit_logs (com valores anteriores) e notifica o produtor (push best-effort).
 */
export async function revisarDiagnostico(
  tenant: TenantContext,
  input: RevisarDiagnosticoInput,
): Promise<RevisarDiagnosticoResult> {
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

  const previous = {
    statusRevisao: diag.statusRevisao ?? "pendente",
    parecerTecnico: diag.parecerTecnico ?? null,
    recomendacaoCorrigida: diag.recomendacaoCorrigida ?? null,
    revisadoPorUserId: diag.revisadoPorUserId ?? null,
    revisadoPorPerfilId: diag.revisadoPorPerfilId ?? null,
    revisadoEm: diag.revisadoEm
      ? new Date(diag.revisadoEm).toISOString()
      : null,
  };

  const statusRevisao = mapAcaoRevisaoToStatus(input.acao);
  let parecerTecnico: string | null = (input.parecerTecnico ?? "").trim() || null;
  // Nunca apagar correção anterior no descartar — só deixa de ser a efetiva via status.
  let recomendacaoCorrigida: string | null =
    (input.recomendacaoCorrigida ?? "").trim() || previous.recomendacaoCorrigida;

  switch (input.acao) {
    case "confirmar":
      // parecer opcional; não exige correção
      break;
    case "corrigir":
      recomendacaoCorrigida = requireNonEmpty(
        "recomendacaoCorrigida",
        input.recomendacaoCorrigida,
      );
      parecerTecnico = requireNonEmpty("parecerTecnico", input.parecerTecnico);
      break;
    case "descartar":
      parecerTecnico = requireNonEmpty("parecerTecnico", input.parecerTecnico);
      // mantém recomendacaoCorrigida prévia (se houver)
      recomendacaoCorrigida = previous.recomendacaoCorrigida;
      break;
    default: {
      const _exhaustive: never = input.acao;
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Ação inválida: ${_exhaustive}`,
      });
    }
  }

  const revisadoEm = new Date();

  await db
    .update(diagnosticosIa)
    .set({
      statusRevisao,
      revisadoPorUserId: tenant.userId,
      revisadoPorPerfilId: tenant.perfilId,
      revisadoEm,
      parecerTecnico,
      recomendacaoCorrigida,
    })
    .where(
      and(
        eq(diagnosticosIa.id, diag.id),
        eq(diagnosticosIa.organizationId, tenant.organizationId),
      ),
    );

  // Tarefa já criada a partir da IA: anexa nota (corrigir) e/ou sinaliza revisão (descartar).
  let tarefaImpacto: TarefaImpactoRevisao | null = null;
  const linked = await findTarefaByLegadoDiagnosticoId(
    tenant.organizationId,
    diag.id,
  );
  if (linked && (input.acao === "corrigir" || input.acao === "descartar" || input.acao === "confirmar")) {
    const nota = buildNotaRevisaoParaTarefa({
      acao: input.acao,
      parecerTecnico,
      recomendacaoCorrigida:
        input.acao === "corrigir" ? recomendacaoCorrigida : null,
      revisadoEm,
    });
    const nextInstrucoes = appendNotaToInstrucoes(linked.instrucoes, nota);
    const shouldBlock =
      input.acao === "descartar" && shouldBlockTarefaOnDescartar(linked.status);
    const nextStatus = shouldBlock ? "bloqueada" : linked.status;

    const instrucoesChanged = nextInstrucoes !== (linked.instrucoes ?? "");
    const statusChanged = nextStatus !== linked.status;

    if (instrucoesChanged || statusChanged) {
      await db
        .update(tarefasOperacionais)
        .set({
          instrucoes: nextInstrucoes,
          ...(statusChanged ? { status: nextStatus as typeof linked.status } : {}),
        })
        .where(
          and(
            eq(tarefasOperacionais.id, linked.id),
            eq(tarefasOperacionais.organizationId, tenant.organizationId),
          ),
        );
    }

    tarefaImpacto = {
      tarefaId: linked.id,
      updated: instrucoesChanged || statusChanged,
      flaggedNeedsReview: input.acao === "descartar",
      status: nextStatus,
      statusChanged,
    };
  }

  await writeAuditLog({
    organizationId: tenant.organizationId,
    actorUserId: tenant.userId,
    action: `diagnostico.revisao.${input.acao}`,
    resourceType: "diagnostico_ia",
    resourceId: String(diag.id),
    meta: JSON.stringify({
      from: previous.statusRevisao,
      to: statusRevisao,
      acao: input.acao,
      orgRole: tenant.orgRole,
      // Conteúdo anterior preservado (re-review não perde parecer/correção).
      previous: {
        statusRevisao: previous.statusRevisao,
        parecerTecnico: previous.parecerTecnico,
        recomendacaoCorrigida: previous.recomendacaoCorrigida,
        revisadoPorUserId: previous.revisadoPorUserId,
        revisadoPorPerfilId: previous.revisadoPorPerfilId,
        revisadoEm: previous.revisadoEm,
      },
      next: {
        parecerTecnico,
        recomendacaoCorrigida,
        revisadoPorUserId: tenant.userId,
        revisadoPorPerfilId: tenant.perfilId,
        revisadoEm: revisadoEm.toISOString(),
      },
      tarefaImpacto,
    }),
  });

  // Notifica o produtor dono do laudo (best-effort; push pode não estar configurado).
  if (diag.usuarioId != null && diag.usuarioId !== tenant.perfilId) {
    const statusLabel =
      statusRevisao === "confirmado"
        ? "confirmado"
        : statusRevisao === "revisado"
          ? "corrigido"
          : "rejeitado";
    const pushData: Record<string, string> = {
      type: "diagnostico_revisao",
      diagnosticoId: String(diag.id),
      statusRevisao,
      flaggedNeedsReview: tarefaImpacto?.flaggedNeedsReview ? "1" : "0",
    };
    if (tarefaImpacto) {
      pushData.tarefaId = String(tarefaImpacto.tarefaId);
    }
    void sendPushToUsuario(diag.usuarioId, {
      title: "Revisão técnica do diagnóstico",
      body: `Seu diagnóstico #${diag.id} foi ${statusLabel} pelo técnico.`,
      data: pushData,
      priority: "default",
    });
  }

  return {
    id: diag.id,
    statusRevisao,
    revisadoEm,
    revisadoPorUserId: tenant.userId,
    parecerTecnico,
    recomendacaoCorrigida,
    tarefaImpacto,
  };
}

export async function listDiagnosticosPendentesRevisao(
  organizationId: number,
  limit = 50,
): Promise<DiagnosticoIa[]> {
  const db = await getDb();
  if (!db) return [];
  const capped = Math.min(Math.max(limit, 1), 100);
  return db
    .select()
    .from(diagnosticosIa)
    .where(
      and(
        eq(diagnosticosIa.organizationId, organizationId),
        eq(diagnosticosIa.statusRevisao, "pendente"),
      ),
    )
    .orderBy(desc(diagnosticosIa.dataDiagnostico))
    .limit(capped);
}

export async function getDiagnosticoRevisao(
  organizationId: number,
  diagnosticoId: number,
): Promise<DiagnosticoIa | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(diagnosticosIa)
    .where(
      and(
        eq(diagnosticosIa.id, diagnosticoId),
        eq(diagnosticosIa.organizationId, organizationId),
      ),
    )
    .limit(1);
  return rows[0];
}
