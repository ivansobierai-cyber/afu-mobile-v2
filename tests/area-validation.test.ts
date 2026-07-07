import { describe, it, expect } from 'vitest';
import {
  validatePlantedArea,
  calculateAvailableArea,
  calculateUsagePercentage,
  getUsageColor,
  getUsageStatus,
  validateSafetyMargin,
  suggestMaximumArea,
  validateMultipleCrops,
} from '../lib/validation/area-validation';

describe('Area Validation', () => {
  describe('validatePlantedArea', () => {
    it('deve validar area plantada dentro do limite', () => {
      const result = validatePlantedArea(10, 5, 0);
      expect(result.isValid).toBe(true);
      expect(result.areaDisponivel).toBe(5);
      expect(result.percentualUso).toBe(50);
    });

    it('deve rejeitar area plantada que excede o limite', () => {
      const result = validatePlantedArea(10, 6, 5);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('excede');
    });

    it('deve calcular corretamente com area existente', () => {
      const result = validatePlantedArea(10, 3, 5);
      expect(result.isValid).toBe(true);
      expect(result.areaUsada).toBe(5);
      expect(result.areaPlantada).toBe(3);
      expect(result.percentualUso).toBe(80);
    });

    it('deve rejeitar area negativa', () => {
      const result = validatePlantedArea(10, -1, 0);
      expect(result.isValid).toBe(false);
    });

    it('deve rejeitar terreno com area zero', () => {
      const result = validatePlantedArea(0, 5, 0);
      expect(result.isValid).toBe(false);
    });

    it('deve permitir uso de 100% do terreno', () => {
      const result = validatePlantedArea(10, 10, 0);
      expect(result.isValid).toBe(true);
      expect(result.percentualUso).toBe(100);
    });

    it('deve rejeitar uso acima de 100%', () => {
      const result = validatePlantedArea(10, 5.1, 5);
      expect(result.isValid).toBe(false);
    });
  });

  describe('calculateAvailableArea', () => {
    it('deve calcular area disponivel corretamente', () => {
      const disponivel = calculateAvailableArea(10, 3);
      expect(disponivel).toBe(7);
    });

    it('deve retornar 0 quando terreno esta cheio', () => {
      const disponivel = calculateAvailableArea(10, 10);
      expect(disponivel).toBe(0);
    });

    it('deve retornar area total quando nada plantado', () => {
      const disponivel = calculateAvailableArea(10, 0);
      expect(disponivel).toBe(10);
    });

    it('deve retornar 0 para valores negativos', () => {
      const disponivel = calculateAvailableArea(10, 15);
      expect(disponivel).toBe(0);
    });
  });

  describe('calculateUsagePercentage', () => {
    it('deve calcular percentual corretamente', () => {
      const percentual = calculateUsagePercentage(10, 5);
      expect(percentual).toBe(50);
    });

    it('deve retornar 0 para terreno vazio', () => {
      const percentual = calculateUsagePercentage(10, 0);
      expect(percentual).toBe(0);
    });

    it('deve retornar 100 para terreno cheio', () => {
      const percentual = calculateUsagePercentage(10, 10);
      expect(percentual).toBe(100);
    });

    it('deve limitar a 100%', () => {
      const percentual = calculateUsagePercentage(10, 15);
      expect(percentual).toBe(100);
    });

    it('deve retornar 0 para terreno com area zero', () => {
      const percentual = calculateUsagePercentage(0, 5);
      expect(percentual).toBe(0);
    });
  });

  describe('getUsageColor', () => {
    it('deve retornar verde para uso baixo', () => {
      expect(getUsageColor(25)).toBe('#10b981');
      expect(getUsageColor(50)).toBe('#10b981');
    });

    it('deve retornar amarelo para uso moderado', () => {
      expect(getUsageColor(60)).toBe('#f59e0b');
      expect(getUsageColor(75)).toBe('#f59e0b');
    });

    it('deve retornar laranja para uso alto', () => {
      expect(getUsageColor(80)).toBe('#f97316');
      expect(getUsageColor(95)).toBe('#f97316');
    });

    it('deve retornar vermelho para uso critico', () => {
      expect(getUsageColor(96)).toBe('#ef4444');
      expect(getUsageColor(100)).toBe('#ef4444');
    });
  });

  describe('getUsageStatus', () => {
    it('deve retornar Baixo para uso ate 50%', () => {
      expect(getUsageStatus(25)).toBe('Baixo');
      expect(getUsageStatus(50)).toBe('Baixo');
    });

    it('deve retornar Moderado para uso 51-75%', () => {
      expect(getUsageStatus(60)).toBe('Moderado');
      expect(getUsageStatus(75)).toBe('Moderado');
    });

    it('deve retornar Alto para uso 76-95%', () => {
      expect(getUsageStatus(80)).toBe('Alto');
      expect(getUsageStatus(95)).toBe('Alto');
    });

    it('deve retornar Critico para uso acima de 95%', () => {
      expect(getUsageStatus(96)).toBe('Crítico');
      expect(getUsageStatus(100)).toBe('Crítico');
    });
  });

  describe('validateSafetyMargin', () => {
    it('deve validar dentro da margem de seguranca', () => {
      const result = validateSafetyMargin(10, 9, 95);
      expect(result.isValid).toBe(true);
    });

    it('deve rejeitar acima da margem de seguranca', () => {
      const result = validateSafetyMargin(10, 9.6, 95);
      expect(result.isValid).toBe(false);
    });

    it('deve usar margem padrao de 95%', () => {
      const result = validateSafetyMargin(10, 9.5);
      expect(result.isValid).toBe(true);
    });
  });

  describe('suggestMaximumArea', () => {
    it('deve sugerir area maxima com margem de seguranca', () => {
      const max = suggestMaximumArea(10, 0, 5);
      expect(max).toBe(9.5);
    });

    it('deve considerar area existente', () => {
      const max = suggestMaximumArea(10, 3, 5);
      expect(max).toBeCloseTo(6.65, 1);
    });

    it('deve retornar 0 quando terreno esta cheio', () => {
      const max = suggestMaximumArea(10, 10, 5);
      expect(max).toBe(0);
    });
  });

  describe('validateMultipleCrops', () => {
    it('deve validar multiplos cultivos', () => {
      const result = validateMultipleCrops(10, [
        { id: 1, area: 3 },
        { id: 2, area: 4 },
        { id: 3, area: 2 },
      ]);
      expect(result.isValid).toBe(true);
      expect(result.percentualUso).toBe(90);
    });

    it('deve rejeitar quando excede area do terreno', () => {
      const result = validateMultipleCrops(10, [
        { id: 1, area: 5 },
        { id: 2, area: 6 },
      ]);
      expect(result.isValid).toBe(false);
    });

    it('deve funcionar com cultivos sem id', () => {
      const result = validateMultipleCrops(10, [
        { area: 3 },
        { area: 4 },
      ]);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Casos Extremos', () => {
    it('deve lidar com valores decimais', () => {
      const result = validatePlantedArea(10.5, 5.25, 3.75);
      expect(result.isValid).toBe(true);
      expect(result.percentualUso).toBeCloseTo(85.71, 1);
    });

    it('deve lidar com strings numericas', () => {
      const result = validatePlantedArea('10', '5', '0');
      expect(result.isValid).toBe(true);
    });

    it('deve lidar com valores muito pequenos', () => {
      const result = validatePlantedArea(0.1, 0.05, 0);
      expect(result.isValid).toBe(true);
    });

    it('deve lidar com valores muito grandes', () => {
      const result = validatePlantedArea(1000, 500, 400);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Mensagens de Erro', () => {
    it('deve gerar mensagem clara para excesso', () => {
      const result = validatePlantedArea(10, 6, 5);
      expect(result.message).toContain('11');
      expect(result.message).toContain('10');
      expect(result.message).toContain('1');
    });

    it('deve incluir area disponivel na mensagem', () => {
      const result = validatePlantedArea(10, 8, 3);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('7');
    });
  });
});
