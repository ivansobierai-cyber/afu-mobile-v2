/**
 * FASE 2H — regras de apontamento real (separado do planejado).
 * Não movimenta estoque nem calcula custo.
 */
import type { OperacaoAgricolaStatus } from "./operacao-agricola-status";

export const APONTAMENTO_RESULTADO = ["ok", "parcial", "problema"] as const;
export type ApontamentoResultado = (typeof APONTAMENTO_RESULTADO)[number];

/** Status em que é permitido criar novo apontamento de execução. */
export function canCreateApontamentoForStatus(status: OperacaoAgricolaStatus): boolean {
  return status === "em_execucao" || status === "pausada" || status === "reaberta";
}

/** Status em que é permitido editar apontamento existente (antes da aprovação). */
export function canEditApontamentoForStatus(status: OperacaoAgricolaStatus): boolean {
  return (
    status === "em_execucao" ||
    status === "pausada" ||
    status === "concluida" ||
    status === "reaberta"
  );
}

export function isApontamentoReadOnlyStatus(status: OperacaoAgricolaStatus): boolean {
  return status === "aprovada" || status === "cancelada" || status === "bloqueada";
}

export type MinimalApontamentoCheck = {
  inicioReal: Date | string | null | undefined;
  fimReal?: Date | string | null | undefined;
  createdByUserId?: number | null;
};

/**
 * Apontamento mínimo válido para concluir operação (nova transição).
 * Exige início real + autoria. Se houver fim, inicio <= fim.
 */
export function isMinimalValidApontamento(a: MinimalApontamentoCheck): boolean {
  if (a.inicioReal == null) return false;
  const inicio = typeof a.inicioReal === "string" ? new Date(a.inicioReal) : a.inicioReal;
  if (!(inicio instanceof Date) || Number.isNaN(inicio.getTime())) return false;
  if (a.createdByUserId == null || a.createdByUserId <= 0) return false;
  if (a.fimReal != null) {
    const fim = typeof a.fimReal === "string" ? new Date(a.fimReal) : a.fimReal;
    if (!(fim instanceof Date) || Number.isNaN(fim.getTime())) return false;
    if (inicio.getTime() > fim.getTime()) return false;
  }
  return true;
}

export function assertApontamentoHorarios(
  inicioReal: Date,
  fimReal: Date | null | undefined,
): void {
  if (Number.isNaN(inicioReal.getTime())) {
    throw new Error("INVALID_APONTAMENTO_HORARIO: início inválido");
  }
  if (fimReal != null) {
    if (Number.isNaN(fimReal.getTime())) {
      throw new Error("INVALID_APONTAMENTO_HORARIO: fim inválido");
    }
    if (inicioReal.getTime() > fimReal.getTime()) {
      throw new Error("INVALID_APONTAMENTO_HORARIO: início deve ser ≤ fim");
    }
  }
}

export function assertAreaExecutada(area: number | null | undefined, unidade?: string | null): void {
  if (area == null) return;
  if (!(area >= 0) || Number.isNaN(area)) {
    throw new Error("INVALID_APONTAMENTO_AREA: área deve ser ≥ 0");
  }
  if (!unidade?.trim()) {
    throw new Error("INVALID_APONTAMENTO_AREA: unidade obrigatória quando há área");
  }
}

export function assertInsumoQuantidade(quantidade: number, unidade: string): void {
  if (!(quantidade > 0) || Number.isNaN(quantidade)) {
    throw new Error("INVALID_APONTAMENTO_INSUMO: quantidade deve ser > 0");
  }
  if (!unidade.trim()) {
    throw new Error("INVALID_APONTAMENTO_INSUMO: unidade obrigatória");
  }
}

export type PlanejadoRealizadoResumo = {
  planejado: {
    dataPrevista: Date | string | null;
    talhaoId: number | null;
    areaHa: number | null;
  };
  realizado: {
    apontamentosCount: number;
    areaExecutadaTotal: number | null;
    areaUnidade: string | null;
    inicioRealMin: Date | string | null;
    fimRealMax: Date | string | null;
    operadores: Array<{ userId: number | null; equipeTexto: string | null }>;
    maquinas: Array<{ maquinaOperacionalId: number | null; implementoTexto: string | null }>;
    insumos: Array<{
      estoqueItemId: number | null;
      descricao: string | null;
      quantidade: string;
      unidade: string;
    }>;
  };
};
