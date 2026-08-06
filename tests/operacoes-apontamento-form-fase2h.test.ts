/**
 * FASE 2H — validação de formulário / mensagens de erro (smoke UX).
 */
import { describe, expect, it } from "vitest";
import {
  firstApontamentoErrorMessage,
  mapApontamentoServerError,
  parseApontamentoDateTimeLocal,
  toApontamentoDateTimeLocalValue,
  validateApontamentoForm,
} from "../lib/operacoes/apontamento-form";

describe("FASE 2H — formulário apontamento (validação UX)", () => {
  it("formulário válido passa e produz Dates", () => {
    const r = validateApontamentoForm({
      inicioReal: "2026-08-06T08:30",
      fimReal: "2026-08-06T10:00",
      areaExecutada: "2,5",
      areaUnidade: "ha",
      insumoDesc: "",
      insumoQtd: "",
      insumoUnidade: "kg",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.inicioReal.toISOString()).toBeTruthy();
      expect(r.areaExecutada).toBe(2.5);
      expect(r.areaUnidade).toBe("ha");
    }
  });

  it("obrigatório ausente mostra mensagem", () => {
    const r = validateApontamentoForm({
      inicioReal: "",
      fimReal: "",
      areaExecutada: "",
      areaUnidade: "ha",
      insumoDesc: "",
      insumoQtd: "",
      insumoUnidade: "kg",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.inicioReal).toBe("Início real é obrigatório.");
      expect(firstApontamentoErrorMessage(r.errors)).toMatch(/Início real/);
    }
  });

  it("horário inválido mostra mensagem", () => {
    const r = validateApontamentoForm({
      inicioReal: "2026-08-06T10:00",
      fimReal: "2026-08-06T09:00",
      areaExecutada: "",
      areaUnidade: "ha",
      insumoDesc: "",
      insumoQtd: "",
      insumoUnidade: "kg",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.fimReal).toMatch(/não pode ser anterior/);
    }
  });

  it("quantidade/unidade inválida mostra mensagem", () => {
    const r = validateApontamentoForm({
      inicioReal: "2026-08-06T08:30",
      fimReal: "",
      areaExecutada: "",
      areaUnidade: "ha",
      insumoDesc: "Ureia",
      insumoQtd: "0",
      insumoUnidade: "",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.insumoQtd).toMatch(/maior que zero/);
      expect(r.errors.insumoUnidade).toMatch(/unidade do insumo/);
    }
  });

  it("área sem unidade mostra mensagem", () => {
    const r = validateApontamentoForm({
      inicioReal: "2026-08-06T08:30",
      fimReal: "",
      areaExecutada: "1",
      areaUnidade: "",
      insumoDesc: "",
      insumoQtd: "",
      insumoUnidade: "kg",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.areaUnidade).toMatch(/unidade da área/);
    }
  });

  it("parse datetime local sem segundos é estável", () => {
    const d = parseApontamentoDateTimeLocal("2026-08-06T08:30");
    expect(d).not.toBeNull();
    expect(Number.isNaN(d!.getTime())).toBe(false);
    const roundtrip = toApontamentoDateTimeLocalValue(d!);
    expect(roundtrip).toMatch(/^2026-08-06T08:30$/);
  });

  it("FORBIDDEN é apresentado corretamente", () => {
    const err = Object.assign(new Error("FORBIDDEN"), {
      data: { code: "FORBIDDEN" },
    });
    expect(mapApontamentoServerError(err).userMessage).toMatch(/permissão/);
  });

  it("safra encerrada mapeada", () => {
    const err = Object.assign(new Error("SAFRA_READ_ONLY: Safra encerrada — apontamento negado"), {
      data: { code: "FORBIDDEN" },
    });
    expect(mapApontamentoServerError(err).userMessage).toMatch(/safra está encerrada/);
  });

  it("CONFLICT é tratado", () => {
    const err = Object.assign(new Error("Conflito de revisão: esperado 0"), {
      data: { code: "CONFLICT" },
    });
    expect(mapApontamentoServerError(err).userMessage).toMatch(/outra sessão|Atualize/);
  });

  it("estado incompatível explicado", () => {
    const err = Object.assign(
      new Error("APONTAMENTO_STATUS_DENIED: não é possível registrar execução em status planejada"),
      { data: { code: "BAD_REQUEST" } },
    );
    expect(mapApontamentoServerError(err).userMessage).toMatch(/não permite novos apontamentos/);
  });

  it("erro inesperado não fica silencioso", () => {
    const mapped = mapApontamentoServerError(new Error("boom unexpected"));
    expect(mapped.userMessage).toMatch(/Não foi possível salvar/);
    expect(mapped.technicalLog).toContain("boom");
  });

  it("erro server-side de validação não vaza JSON Zod", () => {
    const mapped = mapApontamentoServerError(
      Object.assign(new Error('[{"code":"invalid_type","path":["inicioReal"]}]'), {
        data: { code: "BAD_REQUEST" },
      }),
    );
    expect(mapped.userMessage).not.toMatch(/invalid_type/);
    expect(mapped.userMessage).toMatch(/revise os campos/i);
  });

  it("insumo só com estoqueItemId + quantidade é válido", () => {
    const r = validateApontamentoForm({
      inicioReal: "2026-08-06T08:30",
      fimReal: "",
      areaExecutada: "",
      areaUnidade: "ha",
      insumoDesc: "",
      insumoQtd: "12",
      insumoUnidade: "kg",
      insumoEstoqueItemId: 42,
    });
    expect(r.ok).toBe(true);
  });
});
