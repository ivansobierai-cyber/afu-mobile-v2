/**
 * Cultivos V2 Etapa 4 — timeline unificada de eventos do cultivo.
 */
import { and, desc, eq } from "drizzle-orm";
import { getDb, getTarefasByPropriedade } from "./db";
import { listCultivoFaseEventos } from "./db-cultivo-fase";
import {
  diagnosticosIa,
  ocorrenciasCampo,
  type Cultura,
} from "../drizzle/schema";

export type CultivoTimelineTipo =
  | "plantio"
  | "fase"
  | "tarefa"
  | "ocorrencia"
  | "diagnostico"
  | "colheita"
  | "encerramento";

export type CultivoTimelineEvent = {
  id: string;
  tipo: CultivoTimelineTipo;
  titulo: string;
  descricao?: string | null;
  data: string;
  meta?: Record<string, string | number | null | undefined>;
};

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export async function buildCultivoTimeline(
  organizationId: number,
  cultura: Cultura,
): Promise<CultivoTimelineEvent[]> {
  const db = await getDb();
  if (!db) return [];

  const events: CultivoTimelineEvent[] = [];

  const plantioIso = toIso(cultura.dataPlantio);
  if (plantioIso) {
    events.push({
      id: `plantio-${cultura.id}`,
      tipo: "plantio",
      titulo: "Plantio",
      descricao: cultura.nomeCultura,
      data: plantioIso,
    });
  }

  const fases = await listCultivoFaseEventos(organizationId, cultura.id, {
    order: "asc",
  });
  for (const f of fases) {
    const iso = toIso(f.dataEvento);
    if (!iso) continue;
    events.push({
      id: `fase-${f.id}`,
      tipo: "fase",
      titulo: `Fase: ${(f.faseNova ?? "").replace(/_/g, " ")}`,
      descricao: f.faseAnterior
        ? `De ${(f.faseAnterior ?? "").replace(/_/g, " ")}`
        : "Início do registro fenológico",
      data: iso,
      meta: { origem: f.origem },
    });
  }

  const tarefas = (await getTarefasByPropriedade(cultura.propriedadeId)).filter(
    (t) => t.culturaId === cultura.id,
  );
  for (const t of tarefas) {
    const iso = toIso(t.dataPrevista ?? t.createdAt);
    if (!iso) continue;
    events.push({
      id: `tarefa-${t.id}`,
      tipo: "tarefa",
      titulo: t.titulo,
      descricao: `${t.tipoOperacao ?? "operacao"} · ${t.status}`,
      data: iso,
      meta: { status: t.status, tarefaId: t.id },
    });
  }

  const ocorrencias = await db
    .select()
    .from(ocorrenciasCampo)
    .where(
      and(
        eq(ocorrenciasCampo.organizationId, organizationId),
        eq(ocorrenciasCampo.culturaId, cultura.id),
      ),
    )
    .orderBy(desc(ocorrenciasCampo.createdAt));

  for (const o of ocorrencias) {
    const iso = toIso(o.createdAt);
    if (!iso) continue;
    events.push({
      id: `ocorrencia-${o.id}`,
      tipo: "ocorrencia",
      titulo: o.titulo,
      descricao: `${o.categoria} · ${o.status}`,
      data: iso,
      meta: { severidade: o.severidade, ocorrenciaId: o.id },
    });
  }

  const diagnosticos = await db
    .select()
    .from(diagnosticosIa)
    .where(
      and(
        eq(diagnosticosIa.organizationId, organizationId),
        eq(diagnosticosIa.culturaId, cultura.id),
      ),
    )
    .orderBy(desc(diagnosticosIa.dataDiagnostico));

  for (const d of diagnosticos) {
    const iso = toIso(d.dataDiagnostico);
    if (!iso) continue;
    events.push({
      id: `diagnostico-${d.id}`,
      tipo: "diagnostico",
      titulo: "Diagnóstico IA",
      descricao:
        d.pragaProvavel || d.doencaProvavel || "Análise registrada",
      data: iso,
      meta: { diagnosticoId: d.id },
    });
  }

  if (cultura.status === "colhido") {
    const iso =
      toIso(cultura.previsaoColheita) ??
      toIso(cultura.updatedAt) ??
      new Date().toISOString();
    events.push({
      id: `colheita-${cultura.id}`,
      tipo: "colheita",
      titulo: "Colheita",
      descricao: "Status: colhido",
      data: iso,
    });
  }

  if (cultura.status === "perdido") {
    const iso = toIso(cultura.updatedAt) ?? new Date().toISOString();
    events.push({
      id: `encerramento-${cultura.id}`,
      tipo: "encerramento",
      titulo: "Encerramento",
      descricao: "Status: perdido",
      data: iso,
    });
  }

  events.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  return events;
}
