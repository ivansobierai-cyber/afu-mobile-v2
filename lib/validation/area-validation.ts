/**
 * area-validation.ts — Validação de Área Plantada
 *
 * Funções para validar se a área plantada não excede a área do terreno
 */

/**
 * Interface para resultado de validação
 */
export interface AreaValidationResult {
  isValid: boolean;
  message: string;
  areaDisponivel: number;
  areaUsada: number;
  areaPlantada: number;
  percentualUso: number;
}

/**
 * Converte valor decimal para número
 */
function toNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value);
  if (typeof value === 'object' && value.toNumber) return value.toNumber();
  return 0;
}

/**
 * Valida se a área plantada não excede a área do terreno
 *
 * @param areaTerreno - Área total do terreno em hectares
 * @param areaPlantadaAtual - Área que será plantada agora
 * @param areaPlantadaExistente - Soma das áreas já plantadas no terreno
 * @returns Resultado da validação
 *
 * @example
 * const result = validatePlantedArea(10, 5, 3);
 * // { isValid: true, areaDisponivel: 2, ... }
 */
export function validatePlantedArea(
  areaTerreno: any,
  areaPlantadaAtual: any,
  areaPlantadaExistente: any = 0
): AreaValidationResult {
  const terreno = toNumber(areaTerreno);
  const atual = toNumber(areaPlantadaAtual);
  const existente = toNumber(areaPlantadaExistente);

  // Validar valores
  if (terreno <= 0) {
    return {
      isValid: false,
      message: 'Área do terreno deve ser maior que 0',
      areaDisponivel: 0,
      areaUsada: existente,
      areaPlantada: atual,
      percentualUso: 0,
    };
  }

  if (atual < 0) {
    return {
      isValid: false,
      message: 'Área plantada não pode ser negativa',
      areaDisponivel: terreno - existente,
      areaUsada: existente,
      areaPlantada: atual,
      percentualUso: (existente / terreno) * 100,
    };
  }

  if (existente < 0) {
    return {
      isValid: false,
      message: 'Soma de áreas existentes não pode ser negativa',
      areaDisponivel: terreno,
      areaUsada: existente,
      areaPlantada: atual,
      percentualUso: 0,
    };
  }

  // Calcular totais
  const areaTotal = existente + atual;
  const disponivelAntes = terreno - existente;
  const areaDisponivel = terreno - areaTotal;
  const percentualUso = (areaTotal / terreno) * 100;

  // Validar se cabe
  if (areaTotal > terreno) {
    const excesso = areaTotal - terreno;
    return {
      isValid: false,
      message: `Área plantada (${areaTotal.toFixed(2)} ha) excede a área do terreno (${terreno.toFixed(2)} ha) em ${excesso.toFixed(2)} ha. Disponível: ${disponivelAntes.toFixed(2)} ha`,
      areaDisponivel: disponivelAntes,
      areaUsada: existente,
      areaPlantada: atual,
      percentualUso,
    };
  }

  // Validação bem-sucedida
  return {
    isValid: true,
    message: `Plantio registrado com sucesso. Área usada: ${areaTotal.toFixed(2)} ha de ${terreno.toFixed(2)} ha (${percentualUso.toFixed(1)}%). Disponível para plantio: ${disponivelAntes.toFixed(2)} ha`,
    areaDisponivel,
    areaUsada: existente,
    areaPlantada: atual,
    percentualUso,
  };
}

/**
 * Valida se a área plantada está dentro de um limite de segurança
 *
 * @param areaTerreno - Área total do terreno
 * @param areaPlantadaTotal - Soma de todas as áreas plantadas
 * @param limiteSeguranca - Percentual máximo de uso (0-100, padrão 95%)
 * @returns Resultado da validação
 *
 * @example
 * const result = validateSafetyMargin(10, 9.5, 95);
 * // { isValid: true, ... }
 */
export function validateSafetyMargin(
  areaTerreno: any,
  areaPlantadaTotal: any,
  limiteSeguranca: number = 95
): AreaValidationResult {
  const terreno = toNumber(areaTerreno);
  const total = toNumber(areaPlantadaTotal);

  const percentualUso = (total / terreno) * 100;
  const areaDisponivel = terreno - total;

  if (percentualUso > limiteSeguranca) {
    return {
      isValid: false,
      message: `Uso de ${percentualUso.toFixed(1)}% do terreno excede o limite de segurança de ${limiteSeguranca}%. Recomenda-se deixar margem de segurança.`,
      areaDisponivel,
      areaUsada: total,
      areaPlantada: 0,
      percentualUso,
    };
  }

  return {
    isValid: true,
    message: `Uso de ${percentualUso.toFixed(1)}% está dentro do limite de segurança (${limiteSeguranca}%)`,
    areaDisponivel,
    areaUsada: total,
    areaPlantada: 0,
    percentualUso,
  };
}

/**
 * Calcula a área disponível para plantio
 *
 * @param areaTerreno - Área total do terreno
 * @param areaPlantadaExistente - Soma das áreas já plantadas
 * @returns Área disponível em hectares
 *
 * @example
 * const disponivel = calculateAvailableArea(10, 3);
 * // 7
 */
export function calculateAvailableArea(
  areaTerreno: any,
  areaPlantadaExistente: any = 0
): number {
  const terreno = toNumber(areaTerreno);
  const existente = toNumber(areaPlantadaExistente);

  const disponivel = terreno - existente;
  return Math.max(0, disponivel);
}

/**
 * Calcula o percentual de uso do terreno
 *
 * @param areaTerreno - Área total do terreno
 * @param areaPlantadaTotal - Soma de todas as áreas plantadas
 * @returns Percentual de uso (0-100)
 *
 * @example
 * const percentual = calculateUsagePercentage(10, 7);
 * // 70
 */
export function calculateUsagePercentage(
  areaTerreno: any,
  areaPlantadaTotal: any = 0
): number {
  const terreno = toNumber(areaTerreno);
  const total = toNumber(areaPlantadaTotal);

  if (terreno <= 0) return 0;

  const percentual = (total / terreno) * 100;
  return Math.min(100, Math.max(0, percentual));
}

/**
 * Formata mensagem de alerta visual para exibição
 *
 * @param result - Resultado da validação
 * @returns Mensagem formatada
 *
 * @example
 * const msg = formatAlertMessage(result);
 * // "⚠️ Área plantada (8 ha) excede..."
 */
export function formatAlertMessage(result: AreaValidationResult): string {
  if (result.isValid) {
    return `✓ ${result.message}`;
  }

  return `⚠️ ${result.message}`;
}

/**
 * Retorna a cor do indicador de uso baseado no percentual
 *
 * @param percentualUso - Percentual de uso (0-100)
 * @returns Cor em formato hex ou nome
 *
 * @example
 * const cor = getUsageColor(50);
 * // '#10b981' (verde)
 */
export function getUsageColor(percentualUso: number): string {
  if (percentualUso <= 50) return '#10b981'; // Verde
  if (percentualUso <= 75) return '#f59e0b'; // Amarelo
  if (percentualUso <= 95) return '#f97316'; // Laranja
  return '#ef4444'; // Vermelho
}

/**
 * Retorna o status de uso do terreno
 *
 * @param percentualUso - Percentual de uso (0-100)
 * @returns Status em texto
 *
 * @example
 * const status = getUsageStatus(80);
 * // 'Alto'
 */
export function getUsageStatus(percentualUso: number): string {
  if (percentualUso <= 50) return 'Baixo';
  if (percentualUso <= 75) return 'Moderado';
  if (percentualUso <= 95) return 'Alto';
  return 'Crítico';
}

/**
 * Valida múltiplos cultivos em um terreno
 *
 * @param areaTerreno - Área total do terreno
 * @param cultivos - Array de cultivos com suas áreas
 * @returns Resultado da validação
 *
 * @example
 * const result = validateMultipleCrops(10, [
 *   { id: 1, area: 3 },
 *   { id: 2, area: 4 },
 *   { id: 3, area: 2 },
 * ]);
 * // { isValid: true, ... }
 */
export function validateMultipleCrops(
  areaTerreno: any,
  cultivos: Array<{ id?: number; area: any }>
): AreaValidationResult {
  const terreno = toNumber(areaTerreno);
  const areaTotal = cultivos.reduce((sum, c) => sum + toNumber(c.area), 0);

  return validatePlantedArea(terreno, 0, areaTotal);
}

/**
 * Sugere a área máxima que pode ser plantada
 *
 * @param areaTerreno - Área total do terreno
 * @param areaPlantadaExistente - Soma das áreas já plantadas
 * @param margemSeguranca - Margem de segurança (0-100, padrão 5%)
 * @returns Área máxima recomendada
 *
 * @example
 * const max = suggestMaximumArea(10, 3, 5);
 * // 6.65 (95% de 7 disponível)
 */
export function suggestMaximumArea(
  areaTerreno: any,
  areaPlantadaExistente: any = 0,
  margemSeguranca: number = 5
): number {
  const terreno = toNumber(areaTerreno);
  const existente = toNumber(areaPlantadaExistente);

  const disponivel = terreno - existente;
  const margem = (disponivel * margemSeguranca) / 100;

  return Math.max(0, disponivel - margem);
}
