/**
 * WP-02 — mapeamento puro de status evento ↔ tarefa.
 */
import { describe, expect, it } from "vitest";
import {
  listEventoTarefaStatusMappings,
  mapEventoStatusToTarefa,
  mapTarefaStatusToEvento,
  mapTipoAtividadeEventoToTipoTarefa,
  shouldApplyEventoStatusToTarefa,
} from "../lib/operacoes/evento-tarefa-status";

describe("WP-02 evento ↔ tarefa status", () => {
  it("mapeia os 4 status de evento para tarefa", () => {
    expect(mapEventoStatusToTarefa("pendente")).toBe("planejada");
    expect(mapEventoStatusToTarefa("em_andamento")).toBe("em_execucao");
    expect(mapEventoStatusToTarefa("concluido")).toBe("concluida");
    expect(mapEventoStatusToTarefa("cancelado")).toBe("cancelada");
    expect(listEventoTarefaStatusMappings()).toHaveLength(4);
  });

  it("mapeia status de tarefa de volta ao bucket do evento", () => {
    expect(mapTarefaStatusToEvento("planejada")).toBe("pendente");
    expect(mapTarefaStatusToEvento("liberada")).toBe("pendente");
    expect(mapTarefaStatusToEvento("bloqueada")).toBe("pendente");
    expect(mapTarefaStatusToEvento("em_execucao")).toBe("em_andamento");
    expect(mapTarefaStatusToEvento("pausada")).toBe("em_andamento");
    expect(mapTarefaStatusToEvento("concluida")).toBe("concluido");
    expect(mapTarefaStatusToEvento("aprovada")).toBe("concluido");
    expect(mapTarefaStatusToEvento("cancelada")).toBe("cancelado");
  });

  it("não rebaixa aprovada quando evento só confirma concluido", () => {
    expect(
      shouldApplyEventoStatusToTarefa({
        currentTarefaStatus: "aprovada",
        nextEventoStatus: "concluido",
      }),
    ).toBe(false);
    expect(
      shouldApplyEventoStatusToTarefa({
        currentTarefaStatus: "pausada",
        nextEventoStatus: "em_andamento",
      }),
    ).toBe(false);
    expect(
      shouldApplyEventoStatusToTarefa({
        currentTarefaStatus: "planejada",
        nextEventoStatus: "em_andamento",
      }),
    ).toBe(true);
    expect(
      shouldApplyEventoStatusToTarefa({
        currentTarefaStatus: "em_execucao",
        nextEventoStatus: "concluido",
      }),
    ).toBe(true);
  });

  it("mapeia tipos de atividade do evento para ENUM de tarefa", () => {
    expect(mapTipoAtividadeEventoToTipoTarefa("inspecao")).toBe("vistoria");
    expect(mapTipoAtividadeEventoToTipoTarefa("laboratorio")).toBe("analise");
    expect(mapTipoAtividadeEventoToTipoTarefa("pulverizacao")).toBe("pulverizacao");
    expect(mapTipoAtividadeEventoToTipoTarefa("tipo_desconhecido")).toBe("outro");
  });

  it("ida e volta evento→tarefa→evento preserva o bucket", () => {
    for (const { evento } of listEventoTarefaStatusMappings()) {
      const tarefa = mapEventoStatusToTarefa(evento);
      expect(mapTarefaStatusToEvento(tarefa)).toBe(evento);
    }
  });
});
