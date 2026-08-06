import { describe, expect, it } from "vitest";
import {
  ENTIDADE_OPERACIONAL,
  ENTIDADE_OPERACIONAL_META,
  eventoCalendarioNaoEquivaleApontamento,
  getEntidadeOperacionalMeta,
  tipoAgricolaNaoEquivaleApontamento,
  TIPO_ATIVIDADE_EVENTO_PERSISTIDO,
  TIPO_OPERACAO_TAREFA_PERSISTIDO,
  listarMapeamentosEvento,
  listarMapeamentosTarefa,
  mapTipoAtividadeToOperacao,
  mapTipoOperacaoTarefaToOperacao,
  TIPO_OPERACAO_AGRICOLA,
} from "../lib/operacoes";
import { assertTransition } from "../lib/propriedades/tarefa-status";

describe("FASE 2D — vocabulário operacional", () => {
  it("mapeamentos conhecidos evento → operação canônica", () => {
    expect(mapTipoAtividadeToOperacao("plantio")).toMatchObject({
      operacao: "plantio",
      legadoDesconhecido: false,
    });
    expect(mapTipoAtividadeToOperacao("inspecao")).toMatchObject({
      operacao: "vistoria",
      legado: "inspecao",
      legadoDesconhecido: false,
    });
    expect(mapTipoAtividadeToOperacao("laboratorio")).toMatchObject({
      operacao: "laboratorio",
      legadoDesconhecido: false,
    });
    expect(mapTipoAtividadeToOperacao("analise")).toMatchObject({
      operacao: "analise",
      legadoDesconhecido: false,
    });
  });

  it("mapeamentos conhecidos tarefa → operação canônica", () => {
    expect(mapTipoOperacaoTarefaToOperacao("vistoria")).toMatchObject({
      operacao: "vistoria",
      origem: "tarefa_tipo_operacao",
      legadoDesconhecido: false,
    });
    expect(mapTipoOperacaoTarefaToOperacao("analise")).toMatchObject({
      operacao: "analise",
      legadoDesconhecido: false,
    });
    expect(mapTipoOperacaoTarefaToOperacao("pulverizacao").operacao).toBe("pulverizacao");
  });

  it("cada valor legado de evento possui mapeamento explícito", () => {
    const rows = listarMapeamentosEvento();
    expect(rows).toHaveLength(TIPO_ATIVIDADE_EVENTO_PERSISTIDO.length);
    for (const row of rows) {
      expect(TIPO_OPERACAO_AGRICOLA).toContain(row.operacao);
    }
  });

  it("cada valor legado de tarefa possui mapeamento explícito", () => {
    const rows = listarMapeamentosTarefa();
    expect(rows).toHaveLength(TIPO_OPERACAO_TAREFA_PERSISTIDO.length);
    for (const row of rows) {
      expect(TIPO_OPERACAO_AGRICOLA).toContain(row.operacao);
    }
  });

  it("amostragem canônica não é inferida de analise/laboratorio (semântica legada distinta)", () => {
    const eventoRows = listarMapeamentosEvento();
    const tarefaRows = listarMapeamentosTarefa();
    expect(eventoRows.some((r) => r.operacao === "amostragem")).toBe(false);
    expect(tarefaRows.some((r) => r.operacao === "amostragem")).toBe(false);
    expect(mapTipoAtividadeToOperacao("analise").operacao).toBe("analise");
    expect(mapTipoAtividadeToOperacao("laboratorio").operacao).toBe("laboratorio");
  });

  it("valores desconhecidos → outro + legadoDesconhecido (sem inventar equivalência)", () => {
    const unknown = mapTipoAtividadeToOperacao("tipo_fantasma_xyz");
    expect(unknown.operacao).toBe("outro");
    expect(unknown.legadoDesconhecido).toBe(true);
    expect(unknown.legado).toBe("tipo_fantasma_xyz");

    const empty = mapTipoOperacaoTarefaToOperacao(null);
    expect(empty.operacao).toBe("outro");
    expect(empty.legadoDesconhecido).toBe(true);
  });

  it("separação Evento × Tarefa × Operação × Apontamento", () => {
    expect(ENTIDADE_OPERACIONAL).toEqual(["evento", "tarefa", "operacao", "apontamento"]);

    const tabelas = ENTIDADE_OPERACIONAL.map((e) => getEntidadeOperacionalMeta(e).tabelaPersistencia);
    expect(new Set(tabelas).size).toBeGreaterThanOrEqual(3);
    expect(getEntidadeOperacionalMeta("evento").tabelaPersistencia).toBe("calendario_cuidados");
    expect(getEntidadeOperacionalMeta("tarefa").tabelaPersistencia).toBe("tarefas_operacionais");
    expect(getEntidadeOperacionalMeta("apontamento").tabelaPersistencia).toBe("apontamentos_operacao");
    expect(getEntidadeOperacionalMeta("operacao").tabelaPersistencia).toBeNull();

    const definicoes = ENTIDADE_OPERACIONAL.map((e) => ENTIDADE_OPERACIONAL_META[e].definicao);
    expect(new Set(definicoes).size).toBe(ENTIDADE_OPERACIONAL.length);
  });

  it("evento/lembrete concluído não equivale a apontamento de execução", () => {
    expect(eventoCalendarioNaoEquivaleApontamento()).toBe(true);
    expect(tipoAgricolaNaoEquivaleApontamento()).toBe(true);
    const colheitaEvento = mapTipoAtividadeToOperacao("colheita");
    expect(colheitaEvento.operacao).toBe("colheita");
    expect(getEntidadeOperacionalMeta("apontamento").campoTipoLegado).toBeNull();
  });

  it("inspecao (evento) e vistoria (tarefa) convergem no canônico sem igualar ENUMs persistidos", () => {
    const fromEvento = mapTipoAtividadeToOperacao("inspecao");
    const fromTarefa = mapTipoOperacaoTarefaToOperacao("vistoria");
    expect(fromEvento.legado).toBe("inspecao");
    expect(fromTarefa.legado).toBe("vistoria");
    expect(fromEvento.operacao).toBe("vistoria");
    expect(fromTarefa.operacao).toBe("vistoria");
    expect(fromEvento.legado).not.toBe(fromTarefa.legado);
  });

  it("ausência de regressão — máquina de estados de tarefa inalterada", () => {
    expect(() => assertTransition("planejada", "liberada")).not.toThrow();
    expect(() => assertTransition("concluida", "aprovada")).not.toThrow();
  });
});
