/**
 * WP-04 — helpers puros de revisão técnica.
 */
import { describe, expect, it } from "vitest";
import {
  appendNotaToInstrucoes,
  buildNotaRevisaoParaTarefa,
  canCreateTarefaFromRevisaoStatus,
  mapAcaoRevisaoToStatus,
  resolveRecomendacoesEfetivas,
  shouldBlockTarefaOnDescartar,
  STATUS_REVISAO_LABELS,
  TAREFA_NEEDS_REVIEW_MARKER,
} from "@/lib/diagnostico-revisao";
import { roleHasPermission } from "@/lib/security/org-roles";

describe("WP-04 — mapeamentos revisão técnica", () => {
  it("ação → statusRevisao", () => {
    expect(mapAcaoRevisaoToStatus("confirmar")).toBe("confirmado");
    expect(mapAcaoRevisaoToStatus("corrigir")).toBe("revisado");
    expect(mapAcaoRevisaoToStatus("descartar")).toBe("descartado");
  });

  it("labels de status existem para todos os valores", () => {
    expect(STATUS_REVISAO_LABELS.pendente).toMatch(/revisão/i);
    expect(STATUS_REVISAO_LABELS.confirmado).toMatch(/confirmado/i);
    expect(STATUS_REVISAO_LABELS.revisado).toMatch(/corrigido/i);
    expect(STATUS_REVISAO_LABELS.descartado).toMatch(/rejeitado/i);
  });

  it("recomendação corrigida tem prioridade sobre IA", () => {
    const r = resolveRecomendacoesEfetivas({
      statusRevisao: "revisado",
      recomendacaoCorrigida: "Aplicar produto X; Isolar talhão",
      recomendacoesIa: ["Reco IA 1", "Reco IA 2"],
    });
    expect(r.fonte).toBe("corrigida");
    expect(r.recomendacoes).toEqual(["Aplicar produto X", "Isolar talhão"]);
  });

  it("sem correção usa recomendações da IA", () => {
    const r = resolveRecomendacoesEfetivas({
      statusRevisao: "pendente",
      recomendacaoCorrigida: null,
      recomendacoesIa: ["Monitorar"],
    });
    expect(r.fonte).toBe("ia");
    expect(r.recomendacoes).toEqual(["Monitorar"]);
  });

  it("descartado não gera tarefa; demais status sim", () => {
    expect(canCreateTarefaFromRevisaoStatus("descartado")).toBe(false);
    expect(canCreateTarefaFromRevisaoStatus("pendente")).toBe(true);
    expect(canCreateTarefaFromRevisaoStatus("confirmado")).toBe(true);
    expect(canCreateTarefaFromRevisaoStatus("revisado")).toBe(true);
  });

  it("RBAC diagnostics.review: agrônomo/gerente sim; operador/consultor/auditor não", () => {
    expect(roleHasPermission("agronomo", "diagnostics.review")).toBe(true);
    expect(roleHasPermission("gerente", "diagnostics.review")).toBe(true);
    expect(roleHasPermission("proprietario", "diagnostics.review")).toBe(true);
    expect(roleHasPermission("administrador", "diagnostics.review")).toBe(true);
    expect(roleHasPermission("operador", "diagnostics.review")).toBe(false);
    expect(roleHasPermission("consultor", "diagnostics.review")).toBe(false);
    expect(roleHasPermission("auditor", "diagnostics.review")).toBe(false);
  });

  it("appendNotaToInstrucoes preserva texto anterior", () => {
    const next = appendNotaToInstrucoes("Reco IA", "Nota técnica");
    expect(next).toContain("Reco IA");
    expect(next).toContain("Nota técnica");
    expect(appendNotaToInstrucoes(next, "Nota técnica")).toBe(next);
  });

  it("descartar marca needs-review e só bloqueia status abertos", () => {
    const nota = buildNotaRevisaoParaTarefa({
      acao: "descartar",
      parecerTecnico: "Falso positivo",
    });
    expect(nota).toContain(TAREFA_NEEDS_REVIEW_MARKER);
    expect(shouldBlockTarefaOnDescartar("planejada")).toBe(true);
    expect(shouldBlockTarefaOnDescartar("em_execucao")).toBe(true);
    expect(shouldBlockTarefaOnDescartar("concluida")).toBe(false);
    expect(shouldBlockTarefaOnDescartar("cancelada")).toBe(false);
  });
});
