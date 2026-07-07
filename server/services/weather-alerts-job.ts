import type { WeatherAlert } from "@/shared/weather";
import { fetchPropertyWeather } from "./open-meteo";
import { getPropriedadesComCoordenadas } from "../db";
import { sendPushToUsuario } from "./push-delivery";

const DEDUP_TTL_MS = 12 * 60 * 60 * 1000;
const sentAlerts = new Map<string, number>();

export function buildWeatherAlertDedupeKey(
  usuarioAfuId: number,
  propriedadeId: number,
  alertType: string,
  dateKey: string,
): string {
  return `${usuarioAfuId}:${propriedadeId}:${alertType}:${dateKey}`;
}

export function shouldSendWeatherAlert(key: string, now = Date.now()): boolean {
  const lastSent = sentAlerts.get(key);
  if (lastSent != null && now - lastSent < DEDUP_TTL_MS) {
    return false;
  }
  return true;
}

export function markWeatherAlertSent(key: string, now = Date.now()): void {
  sentAlerts.set(key, now);
  if (sentAlerts.size > 5000) {
    for (const [k, ts] of sentAlerts) {
      if (now - ts > DEDUP_TTL_MS) sentAlerts.delete(k);
    }
  }
}

export function clearWeatherAlertDedupCache(): void {
  sentAlerts.clear();
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function pickPushAlerts(alerts: WeatherAlert[]): WeatherAlert[] {
  return alerts.filter((a) => a.severity === "warning");
}

export interface WeatherAlertsJobResult {
  propriedades: number;
  pushesSent: number;
  skippedDedup: number;
  errors: number;
}

export async function runWeatherAlertsJob(): Promise<WeatherAlertsJobResult> {
  const result: WeatherAlertsJobResult = {
    propriedades: 0,
    pushesSent: 0,
    skippedDedup: 0,
    errors: 0,
  };

  const lista = await getPropriedadesComCoordenadas();
  result.propriedades = lista.length;
  const dateKey = todayKey();

  for (const prop of lista) {
    try {
      const weather = await fetchPropertyWeather(prop.latitude, prop.longitude, prop.nome);
      const pushAlerts = pickPushAlerts(weather.alerts);
      if (pushAlerts.length === 0) continue;

      for (const alert of pushAlerts) {
        const key = buildWeatherAlertDedupeKey(
          prop.usuarioAfuId,
          prop.propriedadeId,
          alert.type,
          dateKey,
        );
        if (!shouldSendWeatherAlert(key)) {
          result.skippedDedup += 1;
          continue;
        }

        const pushResult = await sendPushToUsuario(prop.usuarioAfuId, {
          title: `Clima — ${prop.nome}`,
          body: alert.message,
          data: {
            type: "weather_alert",
            propriedadeId: String(prop.propriedadeId),
            alertType: alert.type,
          },
          priority: "high",
        });

        if (pushResult.sent > 0) {
          markWeatherAlertSent(key);
          result.pushesSent += pushResult.sent;
        }
      }
    } catch (error) {
      result.errors += 1;
      console.warn(`[WeatherAlerts] Falha propriedade #${prop.propriedadeId}:`, error);
    }
  }

  return result;
}
