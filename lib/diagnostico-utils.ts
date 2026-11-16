import type { DiagnosticoIa } from "@/drizzle/schema";
import {
  resolveRecomendacoesEfetivas,
  STATUS_REVISAO_LABELS,
  type DiagnosticoStatusRevisao,
} from "@/lib/diagnostico-revisao";

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
  propriedadeId?: number | null;
  safraId?: number | null;
  parteAnalisada: string;
  sintomas?: string;
  imagemUrl?: string | null;
  status: string;
  /** WP-04 — status da revisão técnica (independente do status de processamento). */
  statusRevisao: DiagnosticoStatusRevisao;
  statusRevisaoLabel: string;
  revisadoEm?: string | null;
  revisadoPorUserId?: number | null;
  parecerTecnico?: string | null;
  recomendacaoCorrigida?: string | null;
  recomendacaoOriginal?: string | null;
  resultado: DiagnosticoResultado;
  createdAt: string;
};

function asStatusRevisao(value: string | null | undefined): DiagnosticoStatusRevisao {
  if (
    value === "pendente" ||
    value === "revisado" ||
    value === "confirmado" ||
    value === "descartado"
  ) {
    return value;
  }
  return "pendente";
}

export function mapDbDiagnostico(row: DiagnosticoIa): DiagnosticoView {
  let parsed: Partial<DiagnosticoResultado & { culturaNome?: string; sintomas?: string }> = {};
  if (row.resultado) {
    try {
      parsed = JSON.parse(row.resultado);
    } catch {
      parsed = {};
    }
  }

  const recomendacoesIa = Array.isArray(parsed.recomendacoes)
    ? parsed.recomendacoes
    : row.recomendacao
      ? row.recomendacao.split("; ").filter(Boolean)
      : [];

  const statusRevisao = asStatusRevisao(row.statusRevisao);
  const efetivas = resolveRecomendacoesEfetivas({
    statusRevisao,
    recomendacaoCorrigida: row.recomendacaoCorrigida,
    recomendacoesIa,
    recomendacaoIaTexto: row.recomendacao,
  });

  return {
    id: row.id,
    culturaNome: parsed.culturaNome ?? row.sintomasInformados ?? "—",
    cultivoId: row.culturaId ?? undefined,
    propriedadeId: row.propriedadeId ?? null,
    safraId: row.safraId ?? null,
    parteAnalisada: row.partePlanta ?? "folha",
    sintomas: parsed.sintomas ?? row.sintomasInformados ?? undefined,
    imagemUrl: row.imagemUrl,
    status: row.resultado ? "concluido" : statusRevisao,
    statusRevisao,
    statusRevisaoLabel: STATUS_REVISAO_LABELS[statusRevisao],
    revisadoEm: row.revisadoEm
      ? new Date(row.revisadoEm).toISOString()
      : null,
    revisadoPorUserId: row.revisadoPorUserId ?? null,
    parecerTecnico: row.parecerTecnico ?? null,
    recomendacaoCorrigida: row.recomendacaoCorrigida ?? null,
    recomendacaoOriginal: row.recomendacao ?? null,
    resultado: {
      problema: parsed.problema ?? row.pragaProvavel ?? row.doencaProvavel ?? "Diagnóstico",
      tipo: parsed.tipo ?? (row.pragaProvavel ? "praga" : row.doencaProvavel ? "doenca" : "outro"),
      confianca: parsed.confianca ?? row.confiancaIa ?? 0,
      severidade: parsed.severidade ?? row.gravidade ?? "leve",
      descricao: parsed.descricao ?? row.recomendacao ?? "",
      recomendacoes: efetivas.recomendacoes,
      agenteCausal: parsed.agenteCausal,
      observacoesTecnicas: parsed.observacoesTecnicas,
    },
    createdAt: row.dataDiagnostico
      ? new Date(row.dataDiagnostico).toISOString()
      : new Date().toISOString(),
  };
}
