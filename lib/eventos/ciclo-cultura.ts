/**
 * Etapa 4 — gera eventos sugeridos a partir do ciclo do cultivo.
 * Datas relativas a dataPlantio (ou hoje).
 */

import { toDateKey } from "./date-utils";

export type CicloEventoDraft = {
  tipoAtividade:
    | "plantio"
    | "irrigacao"
    | "adubacao"
    | "pulverizacao"
    | "inspecao"
    | "colheita"
    | "laboratorio";
  titulo: string;
  prioridade: "baixa" | "normal" | "alta" | "critica";
  recorrencia: "nenhuma" | "diaria" | "semanal" | "quinzenal" | "mensal";
  dataProgramada: string; // YYYY-MM-DD
  descricao: string;
  /** Índice do evento predecessor no array gerado (dependência). */
  dependsOnIndex?: number;
};

function addDays(base: Date, days: number): Date {
  const d = new Date(base.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

export type GerarCicloInput = {
  nomeCultura: string;
  dataPlantio?: Date | string | null;
  previsaoColheita?: Date | string | null;
};

/** Plano padrão de safra: plantio → irrigação → adubação → inspeções → pulverização → lab → colheita. */
export function gerarEventosDoCiclo(input: GerarCicloInput): CicloEventoDraft[] {
  const plantioBase = input.dataPlantio
    ? new Date(input.dataPlantio)
    : new Date();
  const start = Number.isNaN(plantioBase.getTime()) ? new Date() : plantioBase;
  const colheita = input.previsaoColheita
    ? new Date(input.previsaoColheita)
    : addDays(start, 120);
  const colheitaDate = Number.isNaN(colheita.getTime()) ? addDays(start, 120) : colheita;
  const nome = input.nomeCultura?.trim() || "Cultivo";

  const drafts: CicloEventoDraft[] = [
    {
      tipoAtividade: "plantio",
      titulo: `Plantio — ${nome}`,
      prioridade: "alta",
      recorrencia: "nenhuma",
      dataProgramada: toDateKey(start),
      descricao: "Marco inicial do ciclo gerado automaticamente.",
    },
    {
      tipoAtividade: "irrigacao",
      titulo: `Irrigação pós-plantio — ${nome}`,
      prioridade: "normal",
      recorrencia: "diaria",
      dataProgramada: toDateKey(addDays(start, 1)),
      descricao: "Turno inicial de irrigação após o plantio.",
      dependsOnIndex: 0,
    },
    {
      tipoAtividade: "adubacao",
      titulo: `Adubação de base — ${nome}`,
      prioridade: "normal",
      recorrencia: "nenhuma",
      dataProgramada: toDateKey(addDays(start, 7)),
      descricao: "Nutrição de estabelecimento.",
      dependsOnIndex: 0,
    },
    {
      tipoAtividade: "inspecao",
      titulo: `Inspeção vegetativa — ${nome}`,
      prioridade: "alta",
      recorrencia: "semanal",
      dataProgramada: toDateKey(addDays(start, 14)),
      descricao: "Monitoramento de pragas e desenvolvimento.",
      dependsOnIndex: 0,
    },
    {
      tipoAtividade: "pulverizacao",
      titulo: `Pulverização preventiva — ${nome}`,
      prioridade: "alta",
      recorrencia: "nenhuma",
      dataProgramada: toDateKey(addDays(start, 30)),
      descricao: "Janela sugerida — ajustar conforme clima e pressão.",
      dependsOnIndex: 3,
    },
    {
      tipoAtividade: "laboratorio",
      titulo: `Análise foliar — ${nome}`,
      prioridade: "alta",
      recorrencia: "nenhuma",
      dataProgramada: toDateKey(addDays(start, 45)),
      descricao: "Coleta para laboratório no terço médio do ciclo.",
      dependsOnIndex: 3,
    },
    {
      tipoAtividade: "colheita",
      titulo: `Colheita — ${nome}`,
      prioridade: "critica",
      recorrencia: "nenhuma",
      dataProgramada: toDateKey(colheitaDate),
      descricao: "Data prevista de colheita do cultivo.",
      dependsOnIndex: 0,
    },
  ];

  return drafts;
}
