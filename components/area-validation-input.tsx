import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { AreaValidationAlert } from './area-validation-alert';
import { useAreaValidation } from '@/hooks/use-area-validation';

export interface AreaValidationInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  areaTerreno: number;
  areaPlantadaExistente?: number;
  onValidationChange?: (isValid: boolean) => void;
  editable?: boolean;
}

export function AreaValidationInput({
  label = 'Area Plantada (ha)',
  placeholder = '0.00',
  value,
  onChangeText,
  areaTerreno,
  areaPlantadaExistente = 0,
  onValidationChange,
  editable = true,
}: AreaValidationInputProps) {
  const [inputValue, setInputValue] = useState(value);

  const validation = useAreaValidation({
    areaTerreno,
    areaPlantadaExistente,
    onValidationChange: (result) => {
      onValidationChange?.(result.isValid);
    },
  });

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleChangeText = (text: string) => {
    setInputValue(text);
    onChangeText(text);

    const numValue = parseFloat(text) || 0;
    validation.setAreaPlantada(numValue);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.inputWrapper}>
        <TextInput
          style={[
            styles.input,
            !validation.isValid && styles.inputError,
          ]}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={inputValue}
          onChangeText={handleChangeText}
          keyboardType="decimal-pad"
          editable={editable}
        />
        <Text style={styles.unit}>ha</Text>
      </View>

      <AreaValidationAlert
        result={validation.validationResult}
        visible={true}
        showDetails={true}
      />

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Disponivel:</Text>
        <Text style={styles.infoValue}>
          {validation.areaDisponivel.toFixed(2)} ha
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Uso do terreno:</Text>
        <Text
          style={[
            styles.infoValue,
            { color: validation.usageColor },
          ]}
        >
          {validation.percentualUso.toFixed(1)}% ({validation.usageStatus})
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    paddingRight: 12,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1f2937',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  unit: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
});
