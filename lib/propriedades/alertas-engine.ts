/**
 * Etapa 4 — motor determinístico de alertas da propriedade.
 * Não usa IA: regras explícitas com fonte e gravidade.
 */

import type { TarefaStatus } from "./tarefa-status";
import { STATUS_ABERTOS } from "./tarefa-status";

export type AlertaGravidade = "info" | "atencao" | "alto" | "critico";

export type AlertaPropriedade = {
  id: string;
  titulo: string;
  motivo: string;
  fonte: string;
  gravidade: AlertaGravidade;
  acaoRecomendada: string;
  entidadeTipo: "tarefa" | "cultivo" | "estoque" | "geometria" | "ocorrencia" | "custo";
  entidadeId?: number;
  createdAt: string;
};

type TarefaLike = {
  id: number;
  titulo: string;
  status: string;
  prioridade: string;
  dataPrevista: Date | string;
};

type CultivoLike = {
  id: number;
  nomeCultura: string;
  status: string | null;
  terrenoId: number | null;
  faseAtual: string | null;
};

type EstoqueLike = {
  id: number;
  nome: string;
  saldo: string | number;
  estoqueMinimo: string | number | null;
};

type OrcamentoLike = {
  id: number;
  nomeSafra: string;
  orcamentoPrevisto: string | number;
  custoRealizado: string | number;
};

type OcorrenciaLike = {
  id: number;
  titulo: string;
  status: string;
  severidade: string | null;
  createdAt: Date | string;
};

export type AlertasInput = {
  tarefas: TarefaLike[];
  cultivos: CultivoLike[];
  estoque: EstoqueLike[];
  orcamentos: OrcamentoLike[];
  ocorrencias: OcorrenciaLike[];
  temGeometriaPropriedade: boolean;
  now?: Date;
};

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function gerarAlertas(input: AlertasInput): AlertaPropriedade[] {
  const now = input.now ?? new Date();
  const today = startOfDay(now);
  const alertas: AlertaPropriedade[] = [];

  for (const t of input.tarefas) {
    const status = t.status as TarefaStatus;
    if (!STATUS_ABERTOS.includes(status)) continue;
    const data = new Date(t.dataPrevista);
    if (data < today) {
      alertas.push({
        id: `tarefa-atrasada-${t.id}`,
        titulo: `Tarefa atrasada: ${t.titulo}`,
        motivo: `Prevista para ${data.toLocaleDateString("pt-BR")} e ainda em ${status}.`,
        fonte: "tarefas_operacionais.dataPrevista",
        gravidade: t.prioridade === "critica" ? "critico" : t.prioridade === "alta" ? "alto" : "atencao",
        acaoRecomendada: "Abrir Operações e iniciar ou reagendar a tarefa.",
        entidadeTipo: "tarefa",
        entidadeId: t.id,
        createdAt: now.toISOString(),
      });
    }
    if (status === "bloqueada") {
      alertas.push({
        id: `tarefa-bloqueada-${t.id}`,
        titulo: `Tarefa bloqueada: ${t.titulo}`,
        motivo: "Status bloqueada impede execução.",
        fonte: "tarefas_operacionais.status",
        gravidade: "alto",
        acaoRecomendada: "Desbloquear ou cancelar com motivo.",
        entidadeTipo: "tarefa",
        entidadeId: t.id,
        createdAt: now.toISOString(),
      });
    }
  }

  for (const c of input.cultivos) {
    if (c.status === "em_andamento" && !c.terrenoId) {
      alertas.push({
        id: `cultivo-sem-talhao-${c.id}`,
        titulo: `Cultivo sem talhão: ${c.nomeCultura}`,
        motivo: "Cultivo ativo sem talhão vinculado.",
        fonte: "culturas.terrenoId",
        gravidade: "atencao",
        acaoRecomendada: "Editar cultivo e associar um talhão.",
        entidadeTipo: "cultivo",
        entidadeId: c.id,
        createdAt: now.toISOString(),
      });
    }
  }

  for (const e of input.estoque) {
    const saldo = Number(e.saldo);
    const min = Number(e.estoqueMinimo ?? 0);
    if (Number.isFinite(saldo) && Number.isFinite(min) && saldo <= min) {
      alertas.push({
        id: `estoque-minimo-${e.id}`,
        titulo: `Estoque baixo: ${e.nome}`,
        motivo: `Saldo ${saldo} ≤ mínimo ${min}.`,
        fonte: "estoque_itens.saldo",
        gravidade: saldo <= 0 ? "critico" : "atencao",
        acaoRecomendada: "Registrar entrada de insumo no estoque agrícola.",
        entidadeTipo: "estoque",
        entidadeId: e.id,
        createdAt: now.toISOString(),
      });
    }
  }

  for (const o of input.orcamentos) {
    const previsto = Number(o.orcamentoPrevisto);
    const realizado = Number(o.custoRealizado);
    if (previsto > 0 && realizado > previsto) {
      alertas.push({
        id: `orcamento-estouro-${o.id}`,
        titulo: `Custo acima do orçamento: ${o.nomeSafra}`,
        motivo: `Realizado R$ ${realizado.toFixed(2)} > previsto R$ ${previsto.toFixed(2)}.`,
        fonte: "orcamentos_safra",
        gravidade: "alto",
        acaoRecomendada: "Revisar custos e versionar orçamento.",
        entidadeTipo: "custo",
        entidadeId: o.id,
        createdAt: now.toISOString(),
      });
    }
  }

  for (const oc of input.ocorrencias) {
    if (oc.status === "aberta" || oc.status === "em_acompanhamento") {
      const sev = oc.severidade ?? "media";
      alertas.push({
        id: `ocorrencia-aberta-${oc.id}`,
        titulo: `Ocorrência aberta: ${oc.titulo}`,
        motivo: `Status ${oc.status}, severidade ${sev}.`,
        fonte: "ocorrencias_campo",
        gravidade: sev === "critica" ? "critico" : sev === "alta" ? "alto" : "atencao",
        acaoRecomendada: "Converter em tarefa ou registrar acompanhamento.",
        entidadeTipo: "ocorrencia",
        entidadeId: oc.id,
        createdAt: now.toISOString(),
      });
    }
  }

  if (!input.temGeometriaPropriedade) {
    alertas.push({
      id: "geometria-ausente",
      titulo: "Perímetro da propriedade não mapeado",
      motivo: "Sem geometria GeoJSON cadastrada.",
      fonte: "propriedades.geometriaGeoJson",
      gravidade: "info",
      acaoRecomendada: "Desenhar ou importar perímetro na aba Mapa.",
      entidadeTipo: "geometria",
      createdAt: now.toISOString(),
    });
  }

  const rank: Record<AlertaGravidade, number> = {
    critico: 0,
    alto: 1,
    atencao: 2,
    info: 3,
  };
  return alertas.sort((a, b) => rank[a.gravidade] - rank[b.gravidade]);
}

/** Etapa 10 — catálogo mínimo de métricas com fórmula/fonte */
export type MetricaDefinicao = {
  id: string;
  nome: string;
  unidade: string;
  formula: string;
  fonte: string;
  tipo: "medida" | "calculada" | "estimada";
};

export const METRICAS_CATALOGO: MetricaDefinicao[] = [
  {
    id: "tarefas_abertas",
    nome: "Tarefas abertas",
    unidade: "un",
    formula: "count(tarefas WHERE status IN abertos)",
    fonte: "tarefas_operacionais",
    tipo: "calculada",
  },
  {
    id: "tarefas_atrasadas",
    nome: "Tarefas atrasadas",
    unidade: "un",
    formula: "count(tarefas abertas com dataPrevista < hoje)",
    fonte: "tarefas_operacionais",
    tipo: "calculada",
  },
  {
    id: "area_talhoes_ha",
    nome: "Área em talhões",
    unidade: "ha",
    formula: "sum(terrenos.area)",
    fonte: "terrenos",
    tipo: "medida",
  },
  {
    id: "custo_ha",
    nome: "Custo por hectare",
    unidade: "BRL/ha",
    formula: "sum(custos) / area_talhoes_ha",
    fonte: "custos_operacao + terrenos",
    tipo: "calculada",
  },
  {
    id: "ocorrencias_abertas",
    nome: "Ocorrências abertas",
    unidade: "un",
    formula: "count(ocorrencias abertas)",
    fonte: "ocorrencias_campo",
    tipo: "calculada",
  },
  {
    id: "estoque_itens_criticos",
    nome: "Itens abaixo do mínimo",
    unidade: "un",
    formula: "count(itens saldo <= minimo)",
    fonte: "estoque_itens",
    tipo: "calculada",
  },
];
