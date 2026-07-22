/**
 * Preferências de alertas por usuário (dívida Plano Mestre 4.6).
 * Persistência local — crítico nunca é ocultado.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AlertaGravidade, AlertaPropriedade } from "./alertas-engine";

const GRAVIDADE_RANK: Record<AlertaGravidade, number> = {
  critico: 0,
  alto: 1,
  atencao: 2,
  info: 3,
};

export type AlertaPreferencias = {
  gravidadeMinima: AlertaGravidade;
  tiposOcultos: string[];
  snoozedIds: string[];
};

export const DEFAULT_ALERTA_PREFS: AlertaPreferencias = {
  gravidadeMinima: "info",
  tiposOcultos: [],
  snoozedIds: [],
};

export function alertaPrefsStorageKey(userId: number, organizationId: number): string {
  return `afu:alertaPrefs:u${userId}:o${organizationId}`;
}

export async function loadAlertaPreferencias(
  userId: number,
  organizationId: number,
): Promise<AlertaPreferencias> {
  try {
    const raw = await AsyncStorage.getItem(alertaPrefsStorageKey(userId, organizationId));
    if (!raw) return { ...DEFAULT_ALERTA_PREFS };
    const parsed = JSON.parse(raw) as Partial<AlertaPreferencias>;
    return {
      gravidadeMinima: parsed.gravidadeMinima ?? "info",
      tiposOcultos: Array.isArray(parsed.tiposOcultos) ? parsed.tiposOcultos : [],
      snoozedIds: Array.isArray(parsed.snoozedIds) ? parsed.snoozedIds : [],
    };
  } catch {
    return { ...DEFAULT_ALERTA_PREFS };
  }
}

export async function saveAlertaPreferencias(
  userId: number,
  organizationId: number,
  prefs: AlertaPreferencias,
): Promise<void> {
  await AsyncStorage.setItem(
    alertaPrefsStorageKey(userId, organizationId),
    JSON.stringify(prefs),
  );
}

/** Critico sempre passa; demais respeitam gravidade mínima, tipo e snooze. */
export function filtrarAlertasPorPreferencias(
  alertas: AlertaPropriedade[],
  prefs: AlertaPreferencias,
): AlertaPropriedade[] {
  const minRank = GRAVIDADE_RANK[prefs.gravidadeMinima] ?? 3;
  const ocultos = new Set(prefs.tiposOcultos);
  const snoozed = new Set(prefs.snoozedIds);
  return alertas.filter((a) => {
    if (a.gravidade === "critico") return true;
    if (snoozed.has(a.id)) return false;
    if (ocultos.has(a.entidadeTipo)) return false;
    return GRAVIDADE_RANK[a.gravidade] <= minRank;
  });
}
