/**
 * Cultivos V2 Etapa 7 — resumo IA heurístico (explicável, sem LLM obrigatório).
 */
import type { Cultura } from "../drizzle/schema";
import { buildCultivoDashboard } from "./db-cultivo-dashboard";

export type CultivoIaResumo = {
  saudePercent: number;
  riscoNivel: "baixo" | "moderado" | "alto" | "critico";
  riscoMotivo: string;
  recomendacoes: { prioridade: number; texto: string; origem: string }[];
  alertasPriorizados: { mensagem: string; severidade: string; tipo: string }[];
  ultimoDiagnostico: {
    id: number;
    resumo: string;
  } | null;
};

export async function buildCultivoIaResumo(
  organizationId: number,
  cultura: Cultura,
): Promise<CultivoIaResumo> {
  const dash = await buildCultivoDashboard(organizationId, cultura);
  const saude = dash.saudePercent;

  let riscoNivel: CultivoIaResumo["riscoNivel"] = "baixo";
  if (saude < 40) riscoNivel = "critico";
  else if (saude < 55) riscoNivel = "alto";
  else if (saude < 75) riscoNivel = "moderado";

  const recomendacoes: CultivoIaResumo["recomendacoes"] = [];
  let prio = 1;

  if (dash.alertas.some((a) => a.tipo === "ocorrencia")) {
    recomendacoes.push({
      prioridade: prio++,
      texto: "Priorize vistoria nas ocorrências de alta severidade deste cultivo.",
      origem: "ocorrencias",
    });
  }
  if (dash.alertas.some((a) => a.tipo === "tarefa")) {
    recomendacoes.push({
      prioridade: prio++,
      texto: "Há tarefas atrasadas — atualize status ou reagende a operação.",
      origem: "tarefas",
    });
  }
  if (!dash.proximaTarefa && cultura.status === "em_andamento") {
    recomendacoes.push({
      prioridade: prio++,
      texto: "Nenhuma operação aberta: planeje monitoramento ou trato cultural.",
      origem: "operacoes",
    });
  }
  if (dash.ultimoDiagnostico) {
    const label =
      dash.ultimoDiagnostico.pragaProvavel ||
      dash.ultimoDiagnostico.doencaProvavel ||
      "achado recente";
    recomendacoes.push({
      prioridade: prio++,
      texto: `Último diagnóstico sugere atenção a: ${label}.`,
      origem: "diagnostico",
    });
  }
  if (recomendacoes.length === 0) {
    recomendacoes.push({
      prioridade: 1,
      texto: "Cultivo sem alertas ativos. Mantenha o calendário de monitoramento.",
      origem: "baseline",
    });
  }

  const alertasPriorizados = [...dash.alertas].sort((a, b) => {
    const rank = (s: string) =>
      s === "critical" ? 0 : s === "warning" ? 1 : 2;
    return rank(a.severidade) - rank(b.severidade);
  });

  return {
    saudePercent: saude,
    riscoNivel,
    riscoMotivo: dash.saudeMotivo,
    recomendacoes,
    alertasPriorizados,
    ultimoDiagnostico: dash.ultimoDiagnostico
      ? {
          id: dash.ultimoDiagnostico.id,
          resumo:
            dash.ultimoDiagnostico.pragaProvavel ||
            dash.ultimoDiagnostico.doencaProvavel ||
            "Diagnóstico registrado",
        }
      : null,
  };
}
