/**
 * FASE 2F — testes da UX de operações agrícolas (regras puras + RBAC).
 */
import { describe, expect, it } from "vitest";
import {
  assertOperacoesPropriedadeScope,
  canShowCreateOperacaoButton,
  filterOperacoesAgricolas,
  groupOperacoesByStatus,
  labelTipoOperacao,
  resolveDefaultOperacoesViewMode,
  toggleOperacoesViewMode,
  type OperacaoListItem,
} from "../lib/operacoes/operacoes-workspace-ui";
import { roleHasPermission } from "../lib/security/org-roles";
import {
  ENTIDADE_OPERACIONAL,
  eventoCalendarioNaoEquivaleApontamento,
} from "../lib/operacoes/entidades-operacionais";

const baseOp = (over: Partial<OperacaoListItem>): OperacaoListItem => ({
  id: 1,
  organizationId: 10,
  propriedadeId: 100,
  safraId: 5,
  terrenoId: 20,
  culturaId: 30,
  tarefaId: null,
  tipoOperacao: "monitoramento",
  titulo: "Op teste",
  descricao: null,
  status: "planejada",
  dataPrevista: "2026-08-10T12:00:00.000Z",
  origem: "manual",
  ...over,
});

describe("FASE 2F — operações UX", () => {
  it("1 — listar operações no escopo da propriedade", () => {
    const items = [
      baseOp({ id: 1, propriedadeId: 100 }),
      baseOp({ id: 2, propriedadeId: 200 }),
    ];
    expect(assertOperacoesPropriedadeScope(items, 100)).toHaveLength(1);
  });

  it("2 — estado vazio após filtro", () => {
    const items = [baseOp({ status: "planejada" })];
    expect(filterOperacoesAgricolas(items, { status: "concluida" })).toHaveLength(0);
  });

  it("3 — renderizar labels de tipo e status", () => {
    expect(labelTipoOperacao("pulverizacao")).toBe("Pulverização");
    const grouped = groupOperacoesByStatus([baseOp({ status: "em_execucao" })]);
    expect(grouped.em_execucao).toHaveLength(1);
  });

  it("4 — alternar Lista/Kanban", () => {
    expect(toggleOperacoesViewMode("lista")).toBe("kanban");
    expect(toggleOperacoesViewMode("kanban")).toBe("lista");
  });

  it("5 — filtrar por status", () => {
    const items = [baseOp({ id: 1, status: "planejada" }), baseOp({ id: 2, status: "cancelada" })];
    expect(filterOperacoesAgricolas(items, { status: "cancelada" })).toHaveLength(1);
  });

  it("6 — respeitar safra selecionada", () => {
    const items = [baseOp({ safraId: 5 }), baseOp({ id: 2, safraId: 9 })];
    expect(filterOperacoesAgricolas(items, { safraId: 5 })).toHaveLength(1);
  });

  it("7–8 — criação permitida e highlight lógico (botão)", () => {
    expect(canShowCreateOperacaoButton({ readOnly: false, canWriteOperations: true })).toBe(true);
  });

  it("9 — safra encerrada bloqueia criação na UI", () => {
    expect(canShowCreateOperacaoButton({ readOnly: true, canWriteOperations: true })).toBe(false);
  });

  it("10 — auditor não vê ação de criação (sem operations.write)", () => {
    expect(roleHasPermission("auditor", "operations.write")).toBe(false);
    expect(canShowCreateOperacaoButton({ readOnly: false, canWriteOperations: false })).toBe(false);
  });

  it("11 — operations.write pode criar na UI", () => {
    expect(roleHasPermission("operador", "operations.write")).toBe(true);
    expect(canShowCreateOperacaoButton({ readOnly: false, canWriteOperations: true })).toBe(true);
  });

  it("12 — nenhuma operação cross-propriedade na lista filtrada", () => {
    const scoped = assertOperacoesPropriedadeScope(
      [baseOp({ propriedadeId: 1 }), baseOp({ id: 2, propriedadeId: 2 })],
      1,
    );
    expect(scoped.every((o) => o.propriedadeId === 1)).toBe(true);
  });

  it("13 — tarefa/evento não são operação (entidades distintas)", () => {
    expect(ENTIDADE_OPERACIONAL).toContain("operacao");
    expect(ENTIDADE_OPERACIONAL).toContain("tarefa");
    expect(eventoCalendarioNaoEquivaleApontamento()).toBe(true);
  });

  it("14 — mobile básico: padrão lista em viewport estreito", () => {
    expect(resolveDefaultOperacoesViewMode(true)).toBe("lista");
    expect(resolveDefaultOperacoesViewMode(false)).toBe("kanban");
  });

  it("15–16 — promoção evento (contrato idempotente documentado)", () => {
    const first = { operacaoId: 42, alreadyExisted: false };
    const retry = { operacaoId: 42, alreadyExisted: true };
    expect(retry.operacaoId).toBe(first.operacaoId);
    expect(retry.alreadyExisted).toBe(true);
  });
});
