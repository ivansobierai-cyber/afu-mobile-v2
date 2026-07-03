/**
 * useAreaValidation — Hook para Validação de Área Plantada
 *
 * Gerencia validação de área plantada em tempo real com feedback visual
 */

import { useState, useCallback, useEffect } from 'react';
import {
  validatePlantedArea,
  calculateAvailableArea,
  calculateUsagePercentage,
  getUsageColor,
  getUsageStatus,
  formatAlertMessage,
  AreaValidationResult,
} from '@/lib/validation/area-validation';

export interface UseAreaValidationOptions {
  areaTerreno: number;
  areaPlantadaExistente?: number;
  onValidationChange?: (result: AreaValidationResult) => void;
}

export interface UseAreaValidationState {
  areaPlantada: number;
  validationResult: AreaValidationResult | null;
  areaDisponivel: number;
  percentualUso: number;
  usageStatus: string;
  usageColor: string;
  isValid: boolean;
  alertMessage: string;
}

/**
 * Hook para validação de área plantada
 *
 * @param options - Opções de validação
 * @returns Estado e funções de validação
 *
 * @example
 * const validation = useAreaValidation({
 *   areaTerreno: 10,
 *   areaPlantadaExistente: 3,
 * });
 *
 * // Atualizar área plantada
 * validation.setAreaPlantada(5);
 *
 * // Verificar se é válido
 * if (validation.isValid) {
 *   // Salvar cultivo
 * }
 */
export function useAreaValidation(
  options: UseAreaValidationOptions
): UseAreaValidationState & {
  setAreaPlantada: (area: number) => void;
  validate: (area: number) => AreaValidationResult;
  reset: () => void;
} {
  const {
    areaTerreno,
    areaPlantadaExistente = 0,
    onValidationChange,
  } = options;

  const [areaPlantada, setAreaPlantada] = useState(0);
  const [validationResult, setValidationResult] = useState<AreaValidationResult | null>(null);

  // Validar quando área plantada muda
  const validate = useCallback(
    (area: number): AreaValidationResult => {
      const result = validatePlantedArea(
        areaTerreno,
        area,
        areaPlantadaExistente
      );

      setValidationResult(result);
      onValidationChange?.(result);

      return result;
    },
    [areaTerreno, areaPlantadaExistente, onValidationChange]
  );

  // Atualizar área plantada e validar
  const handleSetAreaPlantada = useCallback(
    (area: number) => {
      setAreaPlantada(area);
      validate(area);
    },
    [validate]
  );

  // Resetar estado
  const reset = useCallback(() => {
    setAreaPlantada(0);
    setValidationResult(null);
  }, []);

  // Validar na montagem
  useEffect(() => {
    validate(areaPlantada);
  }, [areaTerreno, areaPlantadaExistente]);

  // Calcular valores derivados
  const areaDisponivel = calculateAvailableArea(
    areaTerreno,
    areaPlantadaExistente
  );
  const percentualUso = calculateUsagePercentage(
    areaTerreno,
    areaPlantadaExistente + areaPlantada
  );
  const usageStatus = getUsageStatus(percentualUso);
  const usageColor = getUsageColor(percentualUso);
  const isValid = validationResult?.isValid ?? true;
  const alertMessage = validationResult
    ? formatAlertMessage(validationResult)
    : '';

  return {
    areaPlantada,
    setAreaPlantada: handleSetAreaPlantada,
    validationResult,
    areaDisponivel,
    percentualUso,
    usageStatus,
    usageColor,
    isValid,
    alertMessage,
    validate,
    reset,
  };
}

/**
 * Hook para gerenciar múltiplos cultivos em um terreno
 *
 * @param areaTerreno - Área total do terreno
 * @returns Estado e funções para múltiplos cultivos
 *
 * @example
 * const crops = useMultipleCropsValidation(10);
 *
 * // Adicionar cultivo
 * crops.addCrop({ nomeCultura: 'Milho', areaPlantada: 3 });
 *
 * // Verificar se pode adicionar mais
 * if (crops.canAddMore(2)) {
 *   crops.addCrop({ nomeCultura: 'Soja', areaPlantada: 2 });
 * }
 */
export function useMultipleCropsValidation(areaTerreno: number) {
  const [cultivos, setCultivos] = useState<
    Array<{ id: string; nomeCultura: string; areaPlantada: number }>
  >([]);

  const areaTotal = cultivos.reduce((sum, c) => sum + c.areaPlantada, 0);
  const areaDisponivel = Math.max(0, areaTerreno - areaTotal);
  const percentualUso = (areaTotal / areaTerreno) * 100;

  const addCrop = useCallback(
    (cultivo: Omit<typeof cultivos[0], 'id'>) => {
      const novoId = Date.now().toString();
      const novoCultivo = { ...cultivo, id: novoId };

      const validacao = validatePlantedArea(
        areaTerreno,
        cultivo.areaPlantada,
        areaTotal
      );

      if (validacao.isValid) {
        setCultivos((prev) => [...prev, novoCultivo]);
        return { success: true, cultivo: novoCultivo };
      }

      return { success: false, error: validacao.message };
    },
    [areaTerreno, areaTotal]
  );

  const removeCrop = useCallback((id: string) => {
    setCultivos((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const updateCrop = useCallback(
    (id: string, updates: Partial<typeof cultivos[0]>) => {
      const cultivo = cultivos.find((c) => c.id === id);
      if (!cultivo) return { success: false, error: 'Cultivo não encontrado' };

      const areaAtual = cultivo.areaPlantada;
      const areaOutros = areaTotal - areaAtual;
      const novaCrop = { ...cultivo, ...updates };

      const validacao = validatePlantedArea(
        areaTerreno,
        novaCrop.areaPlantada,
        areaOutros
      );

      if (validacao.isValid) {
        setCultivos((prev) =>
          prev.map((c) => (c.id === id ? novaCrop : c))
        );
        return { success: true, cultivo: novaCrop };
      }

      return { success: false, error: validacao.message };
    },
    [cultivos, areaTotal, areaTerreno]
  );

  const canAddMore = useCallback(
    (areaDesejada: number) => {
      return areaDesejada <= areaDisponivel;
    },
    [areaDisponivel]
  );

  const reset = useCallback(() => {
    setCultivos([]);
  }, []);

  return {
    cultivos,
    areaTotal,
    areaDisponivel,
    percentualUso,
    addCrop,
    removeCrop,
    updateCrop,
    canAddMore,
    reset,
  };
}
