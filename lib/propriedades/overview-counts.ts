/**
 * Contagens da visão geral — evita `0 || total` (zero ativo ≠ ausência de dados).
 */
export function resolveCultivosShortcutValue(opts: {
  /** Rótulo exibido no atalho */
  label: "Cultivos" | "Cultivos ativos";
  cultivosAtivos: number;
  cultivosCount: number;
}): number {
  if (opts.label === "Cultivos ativos") return opts.cultivosAtivos;
  return opts.cultivosCount;
}

export function adminMenuVisibility(capabilities: {
  canWriteProperty: boolean;
  canExport: boolean;
  canArchiveProperty?: boolean;
  canDeleteProperty: boolean;
}) {
  return {
    showEditar: capabilities.canWriteProperty,
    showExportar: capabilities.canExport,
    showArquivar: Boolean(capabilities.canArchiveProperty),
    /** Exclusão definitiva só com property.delete — preferir arquivar */
    showExcluir: capabilities.canDeleteProperty,
  };
}
