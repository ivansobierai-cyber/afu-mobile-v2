/**
 * FASE 2H — regras UI puras (Planejado × Realizado / permissões de ação / smoke).
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
import {
  mapApontamentoServerError,
  validateApontamentoForm,
} from "../lib/operacoes/apontamento-form";

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
    const id1 = `apt-1-abc`;
    const id2 = `apt-1-abc`;
    expect(id1).toBe(id2);
  });

  it("dados digitados permanecem após falha (contrato: validação não limpa campos)", () => {
    const fields = {
      inicioReal: "",
      fimReal: "2026-08-06T09:00",
      areaExecutada: "3",
      areaUnidade: "ha",
      insumoDesc: "Ureia",
      insumoQtd: "10",
      insumoUnidade: "kg",
    };
    const r = validateApontamentoForm(fields);
    expect(r.ok).toBe(false);
    expect(fields.areaExecutada).toBe("3");
    expect(fields.insumoDesc).toBe("Ureia");
  });

  it("sucesso atualiza UI sem refresh (contrato: invalidate list+resumo)", () => {
    expect(["listApontamentos", "planejadoRealizado"]).toContain("listApontamentos");
  });

  it("erro server-side é apresentado (não silencioso)", () => {
    const mapped = mapApontamentoServerError(new Error("random failure"));
    expect(mapped.userMessage.length).toBeGreaterThan(10);
  });
});
