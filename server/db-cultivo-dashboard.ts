/**
 * Cultivos V2 Etapa 3 — agregação do dashboard operacional do cultivo.
 */
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "./db";
import { getTarefasByPropriedade, getPropriedadeById } from "./db";
import { listCultivoFaseEventos } from "./db-cultivo-fase";
import {
  diagnosticosIa,
  ocorrenciasCampo,
  type Cultura,
} from "../drizzle/schema";
import { cultivoFaseProgress } from "../lib/cultivos/cultivo-workspace";
import { STATUS_ABERTOS, type TarefaStatus } from "../lib/propriedades/tarefa-status";

const OPEN_OCORRENCIA = ["aberta", "em_acompanhamento"] as const;

function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
}

function parseCoord(value: string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

export type CultivoDashboard = {
  cultivo: {
    id: number;
    nomeCultura: string;
    variedade: string | null;
    status: string | null;
    faseAtual: string | null;
    faseIndex: number;
    faseProgress: number;
    areaPlantadaHa: number | null;
    dataPlantio: string | null;
    previsaoColheita: string | null;
    producaoEstimada: number | null;
    unidadeProducao: string | null;
    safraId: number | null;
    terrenoId: number | null;
    propriedadeId: number;
  };
  diasAposPlantio: number | null;
  saudePercent: number;
  saudeMotivo: string;
  clima: {
    available: boolean;
    latitude: number | null;
    longitude: number | null;
    message?: string;
  };
  proximaTarefa: {
    id: number;
    titulo: string;
    status: string;
    dataPrevista: string | Date;
    tipoOperacao: string | null;
  } | null;
  ultimaInspecao: {
    id: number;
    titulo: string;
    categoria: string;
    severidade: string | null;
    createdAt: string | Date;
  } | null;
  ultimoDiagnostico: {
    id: number;
    pragaProvavel: string | null;
    doencaProvavel: string | null;
    dataDiagnostico: string | Date | null;
  } | null;
  alertas: { tipo: string; mensagem: string; severidade: "info" | "warning" | "critical" }[];
  faseEventosCount: number;
};

function computeSaude(params: {
  ocorrenciasAbertas: number;
  ocorrenciasCriticas: number;
  diagnosticosRecentes: number;
}): { percent: number; motivo: string } {
  let score = 100;
  const parts: string[] = [];
  if (params.ocorrenciasCriticas > 0) {
    score -= Math.min(40, params.ocorrenciasCriticas * 20);
    parts.push(`${params.ocorrenciasCriticas} ocorrência(s) crítica(s)`);
  }
  if (params.ocorrenciasAbertas > 0) {
    score -= Math.min(30, params.ocorrenciasAbertas * 8);
    parts.push(`${params.ocorrenciasAbertas} ocorrência(s) aberta(s)`);
  }
  if (params.diagnosticosRecentes > 2) {
    score -= 10;
    parts.push("vários diagnósticos recentes");
  }
  score = Math.max(0, Math.min(100, score));
  return {
    percent: score,
    motivo: parts.length ? parts.join("; ") : "Sem alertas ativos no cultivo",
  };
}

export async function buildCultivoDashboard(
  organizationId: number,
  cultura: Cultura,
): Promise<CultivoDashboard> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [tarefas, ocorrencias, diagnosticos, faseEventos, prop] = await Promise.all([
    getTarefasByPropriedade(cultura.propriedadeId),
    db
      .select()
      .from(ocorrenciasCampo)
      .where(
        and(
          eq(ocorrenciasCampo.organizationId, organizationId),
          eq(ocorrenciasCampo.culturaId, cultura.id),
        ),
      )
      .orderBy(desc(ocorrenciasCampo.createdAt)),
    db
      .select()
      .from(diagnosticosIa)
      .where(
        and(
          eq(diagnosticosIa.organizationId, organizationId),
          eq(diagnosticosIa.culturaId, cultura.id),
        ),
      )
      .orderBy(desc(diagnosticosIa.dataDiagnostico)),
    listCultivoFaseEventos(organizationId, cultura.id),
    getPropriedadeById(cultura.propriedadeId),
  ]);

  const tarefasCultivo = tarefas.filter((t) => t.culturaId === cultura.id);
  const abertas = tarefasCultivo
    .filter((t) => STATUS_ABERTOS.includes(t.status as TarefaStatus))
    .sort(
      (a, b) =>
        new Date(a.dataPrevista).getTime() - new Date(b.dataPrevista).getTime(),
    );
  const proxima = abertas[0] ?? null;

  const ocorrenciasAbertas = ocorrencias.filter((o) =>
    (OPEN_OCORRENCIA as readonly string[]).includes(o.status),
  );
  const ocorrenciasCriticas = ocorrenciasAbertas.filter(
    (o) => o.severidade === "critica" || o.severidade === "alta",
  );
  const since30 = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const diagRecentes = diagnosticos.filter(
    (d) => d.dataDiagnostico && new Date(d.dataDiagnostico).getTime() >= since30,
  );

  const saude = computeSaude({
    ocorrenciasAbertas: ocorrenciasAbertas.length,
    ocorrenciasCriticas: ocorrenciasCriticas.length,
    diagnosticosRecentes: diagRecentes.length,
  });

  const fase = cultivoFaseProgress(cultura.faseAtual);
  const plantio = cultura.dataPlantio ? new Date(cultura.dataPlantio) : null;
  const dap = plantio && !Number.isNaN(plantio.getTime())
    ? daysBetween(plantio, new Date())
    : null;

  const lat = parseCoord(prop?.latitude ?? null);
  const lng = parseCoord(prop?.longitude ?? null);

  const alertas: CultivoDashboard["alertas"] = [];
  if (!cultura.terrenoId) {
    alertas.push({
      tipo: "talhao",
      mensagem: "Cultivo sem talhão vinculado",
      severidade: "warning",
    });
  }
  if (!cultura.safraId) {
    alertas.push({
      tipo: "safra",
      mensagem: "Cultivo sem safra vinculada",
      severidade: "warning",
    });
  }
  if (ocorrenciasCriticas.length > 0) {
    alertas.push({
      tipo: "ocorrencia",
      mensagem: `${ocorrenciasCriticas.length} ocorrência(s) de alta severidade`,
      severidade: "critical",
    });
  }
  const atrasadas = abertas.filter((t) => new Date(t.dataPrevista) < new Date());
  if (atrasadas.length > 0) {
    alertas.push({
      tipo: "tarefa",
      mensagem: `${atrasadas.length} tarefa(s) atrasada(s)`,
      severidade: "warning",
    });
  }

  const ultimaOc = ocorrencias[0] ?? null;
  const ultimoDiag = diagnosticos[0] ?? null;

  return {
    cultivo: {
      id: cultura.id,
      nomeCultura: cultura.nomeCultura,
      variedade: cultura.variedade,
      status: cultura.status,
      faseAtual: cultura.faseAtual,
      faseIndex: fase.index,
      faseProgress: fase.progress,
      areaPlantadaHa: cultura.areaPlantada != null ? Number(cultura.areaPlantada) : null,
      dataPlantio: cultura.dataPlantio
        ? String(cultura.dataPlantio).slice(0, 10)
        : null,
      previsaoColheita: cultura.previsaoColheita
        ? String(cultura.previsaoColheita).slice(0, 10)
        : null,
      producaoEstimada:
        cultura.producaoEstimada != null ? Number(cultura.producaoEstimada) : null,
      unidadeProducao: cultura.unidadeProducao,
      safraId: cultura.safraId,
      terrenoId: cultura.terrenoId,
      propriedadeId: cultura.propriedadeId,
    },
    diasAposPlantio: dap,
    saudePercent: saude.percent,
    saudeMotivo: saude.motivo,
    clima: {
      available: lat != null && lng != null,
      latitude: lat,
      longitude: lng,
      message:
        lat != null && lng != null
          ? undefined
          : "Propriedade sem GPS — cadastre coordenadas para ver o clima",
    },
    proximaTarefa: proxima
      ? {
          id: proxima.id,
          titulo: proxima.titulo,
          status: proxima.status,
          dataPrevista: proxima.dataPrevista,
          tipoOperacao: proxima.tipoOperacao ?? null,
        }
      : null,
    ultimaInspecao: ultimaOc
      ? {
          id: ultimaOc.id,
          titulo: ultimaOc.titulo,
          categoria: ultimaOc.categoria,
          severidade: ultimaOc.severidade,
          createdAt: ultimaOc.createdAt,
        }
      : null,
    ultimoDiagnostico: ultimoDiag
      ? {
          id: ultimoDiag.id,
          pragaProvavel: ultimoDiag.pragaProvavel,
          doencaProvavel: ultimoDiag.doencaProvavel,
          dataDiagnostico: ultimoDiag.dataDiagnostico,
        }
      : null,
    alertas,
    faseEventosCount: faseEventos.length,
  };
}

/** Helper para testes unitários da heurística de saúde. */
export function __testComputeSaude(
  ocorrenciasAbertas: number,
  ocorrenciasCriticas: number,
  diagnosticosRecentes: number,
) {
  return computeSaude({
    ocorrenciasAbertas,
    ocorrenciasCriticas,
    diagnosticosRecentes,
  });
}
