/**
 * WP-02 — espelhamento de status entre evento de calendário e tarefa operacional.
 * Funções puras (sem I/O) para testes de transição.
 */

import type { TipoOperacaoTarefaPersistido } from "./legado-tipos";
import { TIPO_OPERACAO_TAREFA_PERSISTIDO } from "./legado-tipos";

export const EVENTO_STATUS = [
  "pendente",
  "em_andamento",
  "concluido",
  "cancelado",
] as const;

export type EventoStatus = (typeof EVENTO_STATUS)[number];

export const TAREFA_STATUS_ESPELHO = [
  "planejada",
  "liberada",
  "em_execucao",
  "pausada",
  "concluida",
  "aprovada",
  "cancelada",
  "bloqueada",
] as const;

export type TarefaStatusEspelho = (typeof TAREFA_STATUS_ESPELHO)[number];

const EVENTO_PARA_TAREFA: Record<EventoStatus, TarefaStatusEspelho> = {
  pendente: "planejada",
  em_andamento: "em_execucao",
  concluido: "concluida",
  cancelado: "cancelada",
};

const TAREFA_PARA_EVENTO: Record<TarefaStatusEspelho, EventoStatus> = {
  planejada: "pendente",
  liberada: "pendente",
  bloqueada: "pendente",
  em_execucao: "em_andamento",
  pausada: "em_andamento",
  concluida: "concluido",
  aprovada: "concluido",
  cancelada: "cancelado",
};

export function isEventoStatus(value: string | null | undefined): value is EventoStatus {
  return value != null && (EVENTO_STATUS as readonly string[]).includes(value);
}

export function isTarefaStatusEspelho(
  value: string | null | undefined,
): value is TarefaStatusEspelho {
  return value != null && (TAREFA_STATUS_ESPELHO as readonly string[]).includes(value);
}

/** Evento → status canônico da tarefa vinculada. */
export function mapEventoStatusToTarefa(
  status: string | null | undefined,
): TarefaStatusEspelho {
  if (!isEventoStatus(status)) return "planejada";
  return EVENTO_PARA_TAREFA[status];
}

/** Tarefa → status do evento vinculado. */
export function mapTarefaStatusToEvento(
  status: string | null | undefined,
): EventoStatus {
  if (!isTarefaStatusEspelho(status)) return "pendente";
  return TAREFA_PARA_EVENTO[status];
}

/**
 * Decide se o espelhamento evento→tarefa deve alterar o status da tarefa.
 * Não rebaixa tarefas já em estados “avançados” não representáveis no calendário
 * (ex.: aprovada/liberada/bloqueada/pausada) quando o evento só reafirma o mesmo bucket.
 */
export function shouldApplyEventoStatusToTarefa(opts: {
  currentTarefaStatus: string;
  nextEventoStatus: string;
}): boolean {
  const mapped = mapEventoStatusToTarefa(opts.nextEventoStatus);
  if (opts.currentTarefaStatus === mapped) return false;

  const currentBucket = mapTarefaStatusToEvento(opts.currentTarefaStatus);
  if (
    isEventoStatus(opts.nextEventoStatus) &&
    currentBucket === opts.nextEventoStatus &&
    opts.currentTarefaStatus !== mapped
  ) {
    // Mesmo bucket (ex.: aprovada ↔ concluido): não rebaixa para concluida.
    return false;
  }
  return true;
}

/** tipoAtividade do evento → tipoOperacao da tarefa (ENUM distinto). */
export function mapTipoAtividadeEventoToTipoTarefa(
  tipoAtividade: string | null | undefined,
): TipoOperacaoTarefaPersistido {
  const raw = (tipoAtividade ?? "").trim();
  if (raw === "inspecao") return "vistoria";
  if (raw === "laboratorio") return "analise";
  if ((TIPO_OPERACAO_TAREFA_PERSISTIDO as readonly string[]).includes(raw)) {
    return raw as TipoOperacaoTarefaPersistido;
  }
  return "outro";
}

export function listEventoTarefaStatusMappings(): {
  evento: EventoStatus;
  tarefa: TarefaStatusEspelho;
}[] {
  return EVENTO_STATUS.map((evento) => ({
    evento,
    tarefa: EVENTO_PARA_TAREFA[evento],
  }));
}
