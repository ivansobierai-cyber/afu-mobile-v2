import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AreaValidationResult } from '@/lib/validation/area-validation';

export interface AreaValidationAlertProps {
  result: AreaValidationResult | null;
  visible?: boolean;
  showDetails?: boolean;
}

export function AreaValidationAlert({
  result,
  visible = true,
  showDetails = true,
}: AreaValidationAlertProps) {
  if (!result || !visible) return null;

  const isValid = result.isValid;
  const backgroundColor = isValid ? '#f0fdf4' : '#fef2f2';
  const borderColor = isValid ? '#86efac' : '#fca5a5';
  const textColor = isValid ? '#166534' : '#991b1b';
  const icon = isValid ? 'OK' : 'ALERTA';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor, borderColor },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.icon, { color: textColor }]}>{icon}</Text>
        <Text
          style={[
            styles.message,
            { color: textColor },
          ]}
          numberOfLines={2}
        >
          {result.message}
        </Text>
      </View>

      {showDetails && (
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: textColor }]}>
              Area plantada:
            </Text>
            <Text style={[styles.detailValue, { color: textColor }]}>
              {result.areaPlantada.toFixed(2)} ha
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: textColor }]}>
              Area usada:
            </Text>
            <Text style={[styles.detailValue, { color: textColor }]}>
              {result.areaUsada.toFixed(2)} ha
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: textColor }]}>
              Area disponivel:
            </Text>
            <Text style={[styles.detailValue, { color: textColor }]}>
              {result.areaDisponivel.toFixed(2)} ha
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: textColor }]}>
              Uso do terreno:
            </Text>
            <Text style={[styles.detailValue, { color: textColor }]}>
              {result.percentualUso.toFixed(1)}%
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  icon: {
    fontSize: 18,
    marginTop: 2,
  },
  message: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  details: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
  },
});
