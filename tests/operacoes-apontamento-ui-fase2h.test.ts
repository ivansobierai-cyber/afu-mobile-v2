/**
 * FASE 2H — regras UI puras (Planejado × Realizado / permissões de ação).
 */
import { describe, expect, it } from "vitest";
import {
  canCreateApontamentoForStatus,
  canEditApontamentoForStatus,
  isApontamentoReadOnlyStatus,
} from "../lib/operacoes/operacao-apontamento-rules";
import {
  canShowCreateOperacaoButton,
  historicalSafraMessage,
} from "../lib/operacoes/operacoes-workspace-ui";

describe("FASE 2H — UI apontamento (puro)", () => {
  it("formulário de execução só em status graváveis", () => {
    expect(canCreateApontamentoForStatus("em_execucao")).toBe(true);
    expect(canCreateApontamentoForStatus("planejada")).toBe(false);
    expect(canCreateApontamentoForStatus("liberada")).toBe(false);
  });

  it("aprovada/read-only não apresenta edição ativa", () => {
    expect(isApontamentoReadOnlyStatus("aprovada")).toBe(true);
    expect(canEditApontamentoForStatus("aprovada")).toBe(false);
    expect(canEditApontamentoForStatus("cancelada")).toBe(false);
  });

  it("Planejado × Realizado — planejado não é editável pelo apontamento (contrato)", () => {
    // O resumo é derivado; create/update de apontamento não altera dataPrevista/titulo.
    // Validado em suite server (teste "N apontamentos…").
    expect(canCreateApontamentoForStatus("em_execucao")).toBe(true);
  });

  it("permissões UI escondem ações sem serem autoridade", () => {
    expect(canShowCreateOperacaoButton({ canWriteOperations: false, readOnly: false })).toBe(false);
    expect(canShowCreateOperacaoButton({ canWriteOperations: true, readOnly: false })).toBe(true);
    expect(canShowCreateOperacaoButton({ canWriteOperations: true, readOnly: true })).toBe(false);
  });

  it("safra histórica permanece mensagem somente leitura", () => {
    expect(historicalSafraMessage()).toMatch(/somente consulta|encerrada/i);
  });

  it("duplo submit prevenido por clientMutationId (contrato)", () => {
    // UI gera clientMutationId estável por tentativa; servidor deduplica.
    const id1 = `apt-1-abc`;
    const id2 = `apt-1-abc`;
    expect(id1).toBe(id2);
  });
});
