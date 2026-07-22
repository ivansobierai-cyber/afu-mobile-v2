/**
 * Gera HTML de laudo/relatório (Etapa 6 — conteúdo filtrado no servidor).
 * Não inclui dados de outras organizações; o caller deve passar só payload autorizado.
 */

export type ReportTipo =
  | "diagnostico"
  | "analise_fitotecnica"
  | "historico_propriedade"
  | "recomendacao"
  | "certificado";

export type ReportHtmlInput = {
  tipo: ReportTipo;
  titulo: string;
  propriedadeNome?: string;
  culturaNome?: string;
  conteudo: string;
  responsavel?: string;
  dataEmissao: string;
  /** Carimbo de isolamento (aparece no rodapé; não é dado de outro tenant) */
  organizationLabel?: string;
};

export function buildReportHtml(input: ReportHtmlInput): string {
  const { tipo, titulo, propriedadeNome, culturaNome, conteudo, responsavel, dataEmissao } =
    input;

  let dadosConteudo: Record<string, unknown> = {};
  try {
    dadosConteudo = JSON.parse(conteudo);
  } catch {
    dadosConteudo = { texto: conteudo };
  }

  const tipoLabels: Record<string, string> = {
    diagnostico: "Laudo de Diagnóstico Fitossanitário",
    analise_fitotecnica: "Laudo de Análise Fitotécnica",
    historico_propriedade: "Histórico da Propriedade",
    recomendacao: "Relatório de Recomendações Agrícolas",
    certificado: "Certificado de Qualidade",
  };

  const orgNote = input.organizationLabel
    ? `<p>Organização: ${escapeHtml(input.organizationLabel)}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; margin: 40px; color: #1a1a1a; }
  .header { border-bottom: 3px solid #2D6A4F; padding-bottom: 20px; margin-bottom: 30px; }
  .logo { font-size: 28px; font-weight: bold; color: #2D6A4F; }
  .subtitle { font-size: 14px; color: #666; margin-top: 4px; }
  .tipo-badge { background: #2D6A4F; color: white; padding: 6px 14px; border-radius: 20px; font-size: 12px; display: inline-block; margin-top: 10px; }
  h1 { font-size: 22px; color: #1a1a1a; margin-bottom: 6px; }
  h2 { font-size: 16px; color: #2D6A4F; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-top: 24px; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0; }
  .meta-item label { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
  .meta-item value { font-size: 14px; font-weight: 600; color: #1a1a1a; display: block; margin-top: 2px; }
  .section { margin-bottom: 24px; }
  .content-text { font-size: 14px; line-height: 1.7; color: #333; }
  .rec-list { list-style: none; padding: 0; }
  .rec-list li { padding: 10px 14px; background: #f0fdf4; border-left: 3px solid #2D6A4F; margin-bottom: 8px; font-size: 14px; border-radius: 0 6px 6px 0; }
  .alert-list li { background: #fff7ed; border-left-color: #D97706; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #888; text-align: center; }
</style>
</head>
<body>
  <div class="header">
    <div class="logo">AFU Agro</div>
    <div class="subtitle">Analisador Fitotécnico Universal — Sistema Fitotécnico Bio-Inteligente</div>
    <div class="tipo-badge">${tipoLabels[tipo] ?? tipo}</div>
  </div>

  <h1>${escapeHtml(titulo)}</h1>

  <div class="meta-grid">
    ${propriedadeNome ? `<div class="meta-item"><label>Propriedade</label><value>${escapeHtml(propriedadeNome)}</value></div>` : ""}
    ${culturaNome ? `<div class="meta-item"><label>Cultura</label><value>${escapeHtml(culturaNome)}</value></div>` : ""}
    <div class="meta-item"><label>Data de Emissão</label><value>${escapeHtml(dataEmissao)}</value></div>
    ${responsavel ? `<div class="meta-item"><label>Responsável Técnico</label><value>${escapeHtml(responsavel)}</value></div>` : ""}
  </div>

  ${dadosConteudo.interpretacao ? `
  <div class="section">
    <h2>Interpretação Técnica</h2>
    <p class="content-text">${escapeHtml(String(dadosConteudo.interpretacao))}</p>
  </div>` : ""}

  ${dadosConteudo.descricao ? `
  <div class="section">
    <h2>Descrição do Diagnóstico</h2>
    <p class="content-text">${escapeHtml(String(dadosConteudo.descricao))}</p>
  </div>` : ""}

  ${dadosConteudo.problema ? `
  <div class="section">
    <h2>Problema Identificado</h2>
    <p class="content-text"><strong>${escapeHtml(String(dadosConteudo.problema))}</strong></p>
    ${dadosConteudo.agenteCausal ? `<p class="content-text"><em>Agente causal: ${escapeHtml(String(dadosConteudo.agenteCausal))}</em></p>` : ""}
  </div>` : ""}

  ${Array.isArray(dadosConteudo.alertas) && (dadosConteudo.alertas as string[]).length > 0 ? `
  <div class="section">
    <h2>Alertas</h2>
    <ul class="rec-list alert-list">
      ${(dadosConteudo.alertas as string[]).map((a: string) => `<li>${escapeHtml(a)}</li>`).join("")}
    </ul>
  </div>` : ""}

  ${Array.isArray(dadosConteudo.recomendacoes) && (dadosConteudo.recomendacoes as string[]).length > 0 ? `
  <div class="section">
    <h2>Recomendações</h2>
    <ul class="rec-list">
      ${(dadosConteudo.recomendacoes as string[]).map((r: string) => `<li>${escapeHtml(r)}</li>`).join("")}
    </ul>
  </div>` : ""}

  ${dadosConteudo.observacoesTecnicas ? `
  <div class="section">
    <h2>Observações Técnicas</h2>
    <p class="content-text">${escapeHtml(String(dadosConteudo.observacoesTecnicas))}</p>
  </div>` : ""}

  ${dadosConteudo.texto && !dadosConteudo.interpretacao && !dadosConteudo.descricao ? `
  <div class="section">
    <p class="content-text">${escapeHtml(String(dadosConteudo.texto))}</p>
  </div>` : ""}

  <div class="footer">
    <p>Este documento foi gerado automaticamente pelo sistema AFU Agro.</p>
    ${orgNote}
    <p>AFU MVP 1.0 — Planta Saudável | ${escapeHtml(dataEmissao)}</p>
    <p><em>Este laudo é uma análise preliminar e não substitui a avaliação presencial de um profissional habilitado.</em></p>
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function reportFingerprint(input: {
  tipo: string;
  titulo: string;
  conteudo: string;
  propriedadeNome?: string;
}): string {
  const raw = `${input.tipo}|${input.titulo}|${input.propriedadeNome ?? ""}|${input.conteudo}`;
  let h = 0;
  for (let i = 0; i < raw.length; i++) h = (Math.imul(31, h) + raw.charCodeAt(i)) | 0;
  return `fp_${(h >>> 0).toString(16)}`;
}
