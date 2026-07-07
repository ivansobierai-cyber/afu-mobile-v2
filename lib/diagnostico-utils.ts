import type { DiagnosticoIa } from "@/drizzle/schema";

export type DiagnosticoResultado = {
  problema: string;
  tipo: string;
  confianca: number;
  severidade: string;
  descricao: string;
  recomendacoes: string[];
  agenteCausal?: string;
  observacoesTecnicas?: string;
};

export type DiagnosticoView = {
  id: number;
  culturaNome: string;
  cultivoId?: number;
  cultivoNome?: string;
  parteAnalisada: string;
  sintomas?: string;
  imagemUrl?: string | null;
  status: string;
  resultado: DiagnosticoResultado;
  createdAt: string;
};

export function mapDbDiagnostico(row: DiagnosticoIa): DiagnosticoView {
  let parsed: Partial<DiagnosticoResultado & { culturaNome?: string; sintomas?: string }> = {};
  if (row.resultado) {
    try {
      parsed = JSON.parse(row.resultado);
    } catch {
      parsed = {};
    }
  }

  const recomendacoes = Array.isArray(parsed.recomendacoes)
    ? parsed.recomendacoes
    : row.recomendacao
      ? row.recomendacao.split("; ").filter(Boolean)
      : [];

  return {
    id: row.id,
    culturaNome: parsed.culturaNome ?? row.sintomasInformados ?? "—",
    parteAnalisada: row.partePlanta ?? "folha",
    sintomas: parsed.sintomas ?? row.sintomasInformados ?? undefined,
    imagemUrl: row.imagemUrl,
    status: row.resultado ? "concluido" : (row.statusRevisao ?? "pendente"),
    resultado: {
      problema: parsed.problema ?? row.pragaProvavel ?? row.doencaProvavel ?? "Diagnóstico",
      tipo: parsed.tipo ?? (row.pragaProvavel ? "praga" : row.doencaProvavel ? "doenca" : "outro"),
      confianca: parsed.confianca ?? row.confiancaIa ?? 0,
      severidade: parsed.severidade ?? row.gravidade ?? "leve",
      descricao: parsed.descricao ?? row.recomendacao ?? "",
      recomendacoes,
      agenteCausal: parsed.agenteCausal,
      observacoesTecnicas: parsed.observacoesTecnicas,
    },
    createdAt: row.dataDiagnostico
      ? new Date(row.dataDiagnostico).toISOString()
      : new Date().toISOString(),
  };
}
