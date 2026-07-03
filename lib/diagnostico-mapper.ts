import type { Diagnostico, DiagnosticoResultado, PartePlanta } from "@/shared/types";

/** Linha retornada por `trpc.diagnostico.historico` (tabela diagnosticos_ia). */
export type DiagnosticoDbRow = {
  id: number;
  usuarioId: number | null;
  propriedadeId: number | null;
  culturaId: number | null;
  imagemUrl: string | null;
  partePlanta: string | null;
  sintomasInformados: string | null;
  resultado: string | null;
  pragaProvavel: string | null;
  doencaProvavel: string | null;
  deficienciaNutricional: string | null;
  gravidade: "saudavel" | "leve" | "moderada" | "grave" | "critica" | null;
  confiancaIa: number | null;
  recomendacao: string | null;
  statusRevisao: string | null;
  dataDiagnostico: Date | string;
};

type ResultadoJson = Partial<DiagnosticoResultado> & {
  culturaNome?: string;
  culturaChipId?: string;
  cultivoId?: number;
  cultivoNome?: string;
};

function parseResultadoJson(raw: string | null): ResultadoJson {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as ResultadoJson;
  } catch {
    return {};
  }
}

export function mapDiagnosticoFromDb(row: DiagnosticoDbRow): Diagnostico {
  const meta = parseResultadoJson(row.resultado);

  const recomendacoes =
    Array.isArray(meta.recomendacoes) && meta.recomendacoes.length > 0
      ? meta.recomendacoes
      : row.recomendacao
        ? row.recomendacao.split("; ").filter(Boolean)
        : [];

  const resultado: DiagnosticoResultado = {
    problema: meta.problema ?? row.pragaProvavel ?? row.doencaProvavel ?? "Sem diagnóstico",
    tipo: meta.tipo ?? "outro",
    confianca: meta.confianca ?? row.confiancaIa ?? 0,
    severidade: meta.severidade ?? (row.gravidade && row.gravidade !== "saudavel" ? row.gravidade : "leve"),
    descricao: meta.descricao ?? "",
    recomendacoes,
    agenteCausal: meta.agenteCausal,
    observacoesTecnicas: meta.observacoesTecnicas,
  };

  if (resultado.tipo === "saudavel" || row.gravidade === "saudavel") {
    resultado.severidade = resultado.severidade === "leve" ? "leve" : resultado.severidade;
  }

  const createdAt =
    row.dataDiagnostico instanceof Date
      ? row.dataDiagnostico.toISOString()
      : new Date(row.dataDiagnostico).toISOString();

  return {
    id: String(row.id),
    culturaId: meta.culturaChipId,
    culturaNome: meta.culturaNome ?? "",
    cultivoId: meta.cultivoId != null ? String(meta.cultivoId) : row.culturaId != null ? String(row.culturaId) : undefined,
    cultivoNome: meta.cultivoNome,
    parteAnalisada: (row.partePlanta as PartePlanta) ?? "folha",
    sintomas: row.sintomasInformados ?? undefined,
    imagemUrl: row.imagemUrl ?? "",
    status: "concluido",
    resultado,
    createdAt,
  };
}

export function buildDiagnosticoFromAnalise(opts: {
  id: number | string;
  analise: DiagnosticoResultado;
  culturaChipId: string;
  culturaNome: string;
  parte: PartePlanta;
  sintomas?: string;
  imagemUrl?: string;
  cultivoId?: number;
  cultivoNome?: string;
}): Diagnostico {
  const now = new Date().toISOString();
  return {
    id: String(opts.id),
    culturaId: opts.culturaChipId,
    culturaNome: opts.culturaNome,
    cultivoId: opts.cultivoId != null ? String(opts.cultivoId) : undefined,
    cultivoNome: opts.cultivoNome,
    parteAnalisada: opts.parte,
    sintomas: opts.sintomas,
    imagemUrl: opts.imagemUrl ?? "",
    status: "concluido",
    resultado: opts.analise,
    createdAt: now,
    updatedAt: now,
  };
}
