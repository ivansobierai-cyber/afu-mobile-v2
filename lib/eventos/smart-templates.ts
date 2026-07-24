/**
 * Etapa 3 — Eventos inteligentes: templates agronômicos por tipo de operação.
 * Pré-preenchem título, prioridade, recorrência sugerida e dicas.
 */

export type SmartEventTemplate = {
  id: string;
  tipoAtividade:
    | "plantio"
    | "irrigacao"
    | "adubacao"
    | "pulverizacao"
    | "monitoramento"
    | "colheita"
    | "analise"
    | "manutencao"
    | "inspecao"
    | "laboratorio"
    | "outro";
  label: string;
  tituloSugerido: string;
  prioridade: "baixa" | "normal" | "alta" | "critica";
  recorrencia: "nenhuma" | "diaria" | "semanal" | "quinzenal" | "mensal";
  descricaoHint: string;
  color: string;
  icon: string;
};

export const SMART_EVENT_TEMPLATES: SmartEventTemplate[] = [
  {
    id: "plantio",
    tipoAtividade: "plantio",
    label: "Plantio",
    tituloSugerido: "Plantio / semeadura",
    prioridade: "alta",
    recorrencia: "nenhuma",
    descricaoHint: "Registrar variedade, densidade, profundidade e condições do solo.",
    color: "#38A169",
    icon: "leaf.fill",
  },
  {
    id: "irrigacao",
    tipoAtividade: "irrigacao",
    label: "Irrigação",
    tituloSugerido: "Irrigação programada",
    prioridade: "normal",
    recorrencia: "diaria",
    descricaoHint: "Definir lâmina (mm), turno e setor/talhão irrigado.",
    color: "#3B82F6",
    icon: "drop.fill",
  },
  {
    id: "pulverizacao",
    tipoAtividade: "pulverizacao",
    label: "Pulverização",
    tituloSugerido: "Pulverização / aplicação",
    prioridade: "alta",
    recorrencia: "nenhuma",
    descricaoHint: "Produto, dose, carência, condições climáticas e EPI.",
    color: "#0EA5E9",
    icon: "sparkles",
  },
  {
    id: "adubacao",
    tipoAtividade: "adubacao",
    label: "Adubação",
    tituloSugerido: "Adubação / nutrição",
    prioridade: "normal",
    recorrencia: "nenhuma",
    descricaoHint: "Fórmula NPK, dose/ha e modo de aplicação.",
    color: "#D97706",
    icon: "leaf.fill",
  },
  {
    id: "colheita",
    tipoAtividade: "colheita",
    label: "Colheita",
    tituloSugerido: "Colheita",
    prioridade: "critica",
    recorrencia: "nenhuma",
    descricaoHint: "Umidade alvo, logística e estimativa de produtividade.",
    color: "#2D6A4F",
    icon: "scalemass.fill",
  },
  {
    id: "inspecao",
    tipoAtividade: "inspecao",
    label: "Inspeção",
    tituloSugerido: "Inspeção de lavoura",
    prioridade: "alta",
    recorrencia: "semanal",
    descricaoHint: "Pontos de monitoramento, pragas/doenças e nível de dano.",
    color: "#8B5CF6",
    icon: "eye.fill",
  },
  {
    id: "manutencao",
    tipoAtividade: "manutencao",
    label: "Manutenção",
    tituloSugerido: "Manutenção de equipamento",
    prioridade: "normal",
    recorrencia: "mensal",
    descricaoHint: "Máquina/implemento, horímetro e peças substituídas.",
    color: "#6B7C6E",
    icon: "wrench.fill",
  },
  {
    id: "laboratorio",
    tipoAtividade: "laboratorio",
    label: "Laboratório",
    tituloSugerido: "Coleta / envio laboratorial",
    prioridade: "alta",
    recorrencia: "nenhuma",
    descricaoHint: "Tipo de amostra (solo/folha/água), laboratório e prazo.",
    color: "#1565C0",
    icon: "flask.fill",
  },
];

export function getSmartTemplate(id: string): SmartEventTemplate | undefined {
  return SMART_EVENT_TEMPLATES.find((t) => t.id === id);
}
