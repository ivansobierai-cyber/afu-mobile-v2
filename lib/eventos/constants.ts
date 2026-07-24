/** Constantes do módulo Eventos — alinhadas ao schema `calendario_cuidados`. */

export const TIPO_EVENTO = [
  { value: "plantio", label: "Plantio", color: "#38A169", icon: "leaf.fill" },
  { value: "irrigacao", label: "Irrigação", color: "#3B82F6", icon: "drop.fill" },
  { value: "adubacao", label: "Adubação", color: "#D97706", icon: "leaf.fill" },
  { value: "pulverizacao", label: "Pulverização", color: "#0EA5E9", icon: "sparkles" },
  { value: "monitoramento", label: "Monitoramento", color: "#8B5CF6", icon: "eye.fill" },
  { value: "inspecao", label: "Inspeção", color: "#7C3AED", icon: "eye.fill" },
  { value: "colheita", label: "Colheita", color: "#2D6A4F", icon: "scalemass.fill" },
  { value: "analise", label: "Análise", color: "#1565C0", icon: "doc.fill" },
  { value: "laboratorio", label: "Laboratório", color: "#1D4ED8", icon: "flask.fill" },
  { value: "manutencao", label: "Manutenção", color: "#6B7C6E", icon: "wrench.fill" },
  { value: "outro", label: "Outro", color: "#6B7C6E", icon: "circle.fill" },
] as const;

export type TipoEventoValue = (typeof TIPO_EVENTO)[number]["value"];

export const PRIORIDADES = [
  { value: "baixa", label: "Baixa", color: "#6B7C6E" },
  { value: "normal", label: "Normal", color: "#3B82F6" },
  { value: "alta", label: "Alta", color: "#D97706" },
  { value: "critica", label: "Crítica", color: "#E53E3E" },
] as const;

export type PrioridadeValue = (typeof PRIORIDADES)[number]["value"];

export const STATUS_FILTERS = [
  { id: "todos", label: "Todos" },
  { id: "pendente", label: "Pendentes" },
  { id: "concluido", label: "Concluídos" },
] as const;

export type StatusFilterId = (typeof STATUS_FILTERS)[number]["id"];

export const EVENTO_VIEWS = [
  { id: "calendario", label: "Mês", icon: "calendar" },
  { id: "semana", label: "Semana", icon: "calendar" },
  { id: "dia", label: "Dia", icon: "calendar" },
  { id: "agenda", label: "Agenda", icon: "list.bullet" },
  { id: "timeline", label: "Timeline", icon: "clock.fill" },
  { id: "kanban", label: "Kanban", icon: "square.grid.2x2.fill" },
] as const;

export type EventoViewId = (typeof EVENTO_VIEWS)[number]["id"];

export function getTipoInfo(tipo: string | null | undefined) {
  return TIPO_EVENTO.find((t) => t.value === tipo) ?? TIPO_EVENTO[TIPO_EVENTO.length - 1];
}

export function getPrioridadeInfo(prioridade: string | null | undefined) {
  return PRIORIDADES.find((p) => p.value === prioridade) ?? PRIORIDADES[1];
}
