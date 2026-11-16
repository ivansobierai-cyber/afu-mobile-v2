/**
 * WP-03 — mapeamentos puros diagnóstico IA → tarefa operacional.
 */

import type { TipoOperacaoTarefaPersistido } from "./legado-tipos";
import { TIPO_OPERACAO_TAREFA_PERSISTIDO } from "./legado-tipos";

export const DIAGNOSTICO_TIPOS = [
  "praga",
  "doenca",
  "deficiencia_nutricional",
  "estresse_ambiental",
  "saudavel",
  "outro",
] as const;

export type DiagnosticoTipo = (typeof DIAGNOSTICO_TIPOS)[number];

export const DIAGNOSTICO_GRAVIDADES = [
  "saudavel",
  "leve",
  "moderada",
  "grave",
  "critica",
] as const;

export type DiagnosticoGravidade = (typeof DIAGNOSTICO_GRAVIDADES)[number];

export const TAREFA_PRIORIDADES = ["baixa", "normal", "alta", "critica"] as const;
export type TarefaPrioridade = (typeof TAREFA_PRIORIDADES)[number];

const TIPO_PARA_OPERACAO: Record<DiagnosticoTipo, TipoOperacaoTarefaPersistido> = {
  praga: "monitoramento",
  doenca: "monitoramento",
  deficiencia_nutricional: "adubacao",
  estresse_ambiental: "vistoria",
  saudavel: "monitoramento",
  outro: "vistoria",
};

const GRAVIDADE_PARA_PRIORIDADE: Record<DiagnosticoGravidade, TarefaPrioridade> = {
  saudavel: "baixa",
  leve: "normal",
  moderada: "normal",
  grave: "alta",
  critica: "critica",
};

function isDiagnosticoTipo(value: string | null | undefined): value is DiagnosticoTipo {
  return value != null && (DIAGNOSTICO_TIPOS as readonly string[]).includes(value);
}

function isDiagnosticoGravidade(
  value: string | null | undefined,
): value is DiagnosticoGravidade {
  return value != null && (DIAGNOSTICO_GRAVIDADES as readonly string[]).includes(value);
}

/** tipo do laudo IA → tipoOperacao da tarefa. */
export function mapDiagnosticoTipoToTipoOperacao(
  tipo: string | null | undefined,
): TipoOperacaoTarefaPersistido {
  if (!isDiagnosticoTipo(tipo)) return "vistoria";
  return TIPO_PARA_OPERACAO[tipo];
}

/** gravidade/severidade do laudo → prioridade da tarefa. */
export function mapDiagnosticoGravidadeToPrioridade(
  gravidade: string | null | undefined,
): TarefaPrioridade {
  if (!isDiagnosticoGravidade(gravidade)) return "normal";
  return GRAVIDADE_PARA_PRIORIDADE[gravidade];
}

export function listDiagnosticoTarefaTipoMappings(): {
  tipo: DiagnosticoTipo;
  tipoOperacao: TipoOperacaoTarefaPersistido;
}[] {
  return DIAGNOSTICO_TIPOS.map((tipo) => ({
    tipo,
    tipoOperacao: TIPO_PARA_OPERACAO[tipo],
  }));
}

export function listDiagnosticoTarefaPrioridadeMappings(): {
  gravidade: DiagnosticoGravidade;
  prioridade: TarefaPrioridade;
}[] {
  return DIAGNOSTICO_GRAVIDADES.map((gravidade) => ({
    gravidade,
    prioridade: GRAVIDADE_PARA_PRIORIDADE[gravidade],
  }));
}

/** Título padrão da tarefa a partir do problema do laudo. */
export function buildTituloTarefaFromDiagnostico(opts: {
  problema?: string | null;
  recomendacaoIndex?: number | null;
  recomendacaoTexto?: string | null;
}): string {
  const base = (opts.problema ?? "").trim() || "Ação pós-diagnóstico";
  if (
    opts.recomendacaoIndex != null &&
    opts.recomendacaoIndex >= 0 &&
    opts.recomendacaoTexto
  ) {
    const short = opts.recomendacaoTexto.trim().slice(0, 80);
    return `Reco. ${opts.recomendacaoIndex + 1}: ${short || base}`.slice(0, 200);
  }
  return `Resolver: ${base}`.slice(0, 200);
}

/** Instruções com recomendações + disclaimer (IA não é certeza absoluta). */
export function buildInstrucoesTarefaFromDiagnostico(opts: {
  diagnosticoId: number;
  recomendacoes: string[];
  recomendacaoIndex?: number | null;
  observacoesTecnicas?: string | null;
}): string {
  const lines: string[] = [
    `Origem: diagnóstico IA #${opts.diagnosticoId}.`,
    "Confiança/IA não é certeza absoluta — confirme com técnico quando necessário.",
  ];

  if (
    opts.recomendacaoIndex != null &&
    opts.recomendacaoIndex >= 0 &&
    opts.recomendacaoIndex < opts.recomendacoes.length
  ) {
    lines.push(`Recomendação focada (#${opts.recomendacaoIndex + 1}):`);
    lines.push(opts.recomendacoes[opts.recomendacaoIndex]!);
  } else if (opts.recomendacoes.length > 0) {
    lines.push("Recomendações:");
    opts.recomendacoes.forEach((r, i) => {
      lines.push(`${i + 1}. ${r}`);
    });
  }

  if (opts.observacoesTecnicas?.trim()) {
    lines.push(`Observações técnicas: ${opts.observacoesTecnicas.trim()}`);
  }

  return lines.join("\n");
}

/** Garante que o tipoOperacao retornado é um valor persistível. */
export function assertTipoOperacaoTarefa(
  value: string,
): asserts value is TipoOperacaoTarefaPersistido {
  if (!(TIPO_OPERACAO_TAREFA_PERSISTIDO as readonly string[]).includes(value)) {
    throw new Error(`tipoOperacao inválido: ${value}`);
  }
}
