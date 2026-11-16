/**
 * WP-03 — mapeamentos puros diagnóstico → tarefa.
 */
import { describe, expect, it } from "vitest";
import {
  buildInstrucoesTarefaFromDiagnostico,
  buildTituloTarefaFromDiagnostico,
  listDiagnosticoTarefaPrioridadeMappings,
  listDiagnosticoTarefaTipoMappings,
  mapDiagnosticoGravidadeToPrioridade,
  mapDiagnosticoTipoToTipoOperacao,
} from "../lib/operacoes/diagnostico-tarefa-map";

describe("WP-03 — mapeamentos diagnóstico → tarefa", () => {
  it("mapeia tipos do laudo para tipoOperacao", () => {
    expect(mapDiagnosticoTipoToTipoOperacao("praga")).toBe("monitoramento");
    expect(mapDiagnosticoTipoToTipoOperacao("doenca")).toBe("monitoramento");
    expect(mapDiagnosticoTipoToTipoOperacao("deficiencia_nutricional")).toBe("adubacao");
    expect(mapDiagnosticoTipoToTipoOperacao("estresse_ambiental")).toBe("vistoria");
    expect(mapDiagnosticoTipoToTipoOperacao("desconhecido")).toBe("vistoria");
  });

  it("mapeia gravidade para prioridade", () => {
    expect(mapDiagnosticoGravidadeToPrioridade("saudavel")).toBe("baixa");
    expect(mapDiagnosticoGravidadeToPrioridade("leve")).toBe("normal");
    expect(mapDiagnosticoGravidadeToPrioridade("moderada")).toBe("normal");
    expect(mapDiagnosticoGravidadeToPrioridade("grave")).toBe("alta");
    expect(mapDiagnosticoGravidadeToPrioridade("critica")).toBe("critica");
    expect(mapDiagnosticoGravidadeToPrioridade(undefined)).toBe("normal");
  });

  it("lista cobrem todos os literais", () => {
    expect(listDiagnosticoTarefaTipoMappings().length).toBeGreaterThanOrEqual(5);
    expect(listDiagnosticoTarefaPrioridadeMappings().length).toBe(5);
  });

  it("monta título e instruções com disclaimer", () => {
    const titulo = buildTituloTarefaFromDiagnostico({ problema: "Ferrugem asiática" });
    expect(titulo).toContain("Ferrugem");
    const instr = buildInstrucoesTarefaFromDiagnostico({
      diagnosticoId: 42,
      recomendacoes: ["Aplicar fungicida", "Monitorar talhão"],
      observacoesTecnicas: "Confirmar em campo",
    });
    expect(instr).toContain("#42");
    expect(instr).toContain("não é certeza absoluta");
    expect(instr).toContain("Aplicar fungicida");
    expect(instr).toContain("Confirmar em campo");
  });

  it("recomendacaoIndex enfatiza uma recomendação no título/instruções", () => {
    const titulo = buildTituloTarefaFromDiagnostico({
      problema: "Lagarta",
      recomendacaoIndex: 1,
      recomendacaoTexto: "Inspecionar bordadura",
    });
    expect(titulo).toMatch(/Reco\. 2/);
    const instr = buildInstrucoesTarefaFromDiagnostico({
      diagnosticoId: 7,
      recomendacoes: ["A", "B"],
      recomendacaoIndex: 1,
    });
    expect(instr).toContain("Recomendação focada (#2)");
    expect(instr).toContain("B");
    expect(instr).not.toContain("1. A");
  });
});
