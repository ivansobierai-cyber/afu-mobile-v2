/**
 * WP-04 — revisão técnica de diagnóstico IA (aprovar / corrigir / rejeitar).
 * Não apaga o laudo original; guarda parecer e correção em colunas aditivas.
 */
import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import {
  diagnosticosIa,
  type DiagnosticoIa,
} from "../drizzle/schema";
import type { TenantContext } from "./tenant-access";
import { writeAuditLog } from "./private-files";
import { sendPushToUsuario } from "./services/push-delivery";
import {
  mapAcaoRevisaoToStatus,
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

export type RevisarDiagnosticoResult = {
  id: number;
  statusRevisao: DiagnosticoStatusRevisao;
  revisadoEm: Date | null;
  revisadoPorUserId: number | null;
  parecerTecnico: string | null;
  recomendacaoCorrigida: string | null;
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
 * Audita em audit_logs e notifica o produtor (push best-effort).
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

  const statusRevisao = mapAcaoRevisaoToStatus(input.acao);
  let parecerTecnico: string | null = (input.parecerTecnico ?? "").trim() || null;
  let recomendacaoCorrigida: string | null =
    (input.recomendacaoCorrigida ?? "").trim() || null;

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
      recomendacaoCorrigida = null;
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

  await writeAuditLog({
    organizationId: tenant.organizationId,
    actorUserId: tenant.userId,
    action: `diagnostico.revisao.${input.acao}`,
    resourceType: "diagnostico_ia",
    resourceId: String(diag.id),
    meta: JSON.stringify({
      from: diag.statusRevisao ?? "pendente",
      to: statusRevisao,
      acao: input.acao,
      hasParecer: Boolean(parecerTecnico),
      hasCorrecao: Boolean(recomendacaoCorrigida),
      orgRole: tenant.orgRole,
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
    void sendPushToUsuario(diag.usuarioId, {
      title: "Revisão técnica do diagnóstico",
      body: `Seu diagnóstico #${diag.id} foi ${statusLabel} pelo técnico.`,
      data: {
        type: "diagnostico_revisao",
        diagnosticoId: String(diag.id),
        statusRevisao,
      },
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
