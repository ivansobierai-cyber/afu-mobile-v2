import type { PropertyWeather, WeatherAlert, WeatherCurrent, WeatherDailyForecast } from "@/shared/weather";

const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";
const CACHE_TTL_MS = 10 * 60 * 1000;

interface CacheEntry {
  data: PropertyWeather;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

interface OpenMeteoResponse {
  current?: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    precipitation: number;
    wind_speed_10m: number;
    weather_code: number;
  };
  daily?: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    weather_code: number[];
  };
}

export function describeWeatherCode(code: number): string {
  if (code === 0) return "Céu limpo";
  if (code <= 3) return "Parcialmente nublado";
  if (code <= 48) return "Neblina";
  if (code <= 57) return "Garoa";
  if (code <= 67) return "Chuva";
  if (code <= 77) return "Neve";
  if (code <= 82) return "Pancadas de chuva";
  if (code <= 86) return "Pancadas de neve";
  if (code <= 99) return "Tempestade";
  return "Condição variável";
}

export function buildAgroAlerts(
  current: WeatherCurrent,
  daily: WeatherDailyForecast[],
): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  const today = daily[0];
  const tomorrow = daily[1];

  if (today && today.tempMin <= 2) {
    alerts.push({
      type: "frost",
      severity: "warning",
      message: `Risco de geada: mínima prevista de ${today.tempMin.toFixed(0)}°C hoje.`,
    });
  } else if (tomorrow && tomorrow.tempMin <= 2) {
    alerts.push({
      type: "frost",
      severity: "info",
      message: `Atenção: mínima de ${tomorrow.tempMin.toFixed(0)}°C prevista para amanhã.`,
    });
  }

  if (today && today.tempMax >= 35) {
    alerts.push({
      type: "heat",
      severity: "warning",
      message: `Calor intenso: máxima de ${today.tempMax.toFixed(0)}°C hoje. Reforce irrigação.`,
    });
  }

  if (today && today.precipitationSum >= 20) {
    alerts.push({
      type: "rain",
      severity: "warning",
      message: `Chuva forte prevista: ${today.precipitationSum.toFixed(0)} mm hoje.`,
    });
  } else if (today && today.precipitationSum >= 10) {
    alerts.push({
      type: "rain",
      severity: "info",
      message: `Chuva moderada: ${today.precipitationSum.toFixed(0)} mm previstos hoje.`,
    });
  }

  if (current.windSpeed >= 40) {
    alerts.push({
      type: "wind",
      severity: "warning",
      message: `Vento forte: ${current.windSpeed.toFixed(0)} km/h. Evite pulverização.`,
    });
  } else if (current.windSpeed >= 25) {
    alerts.push({
      type: "wind",
      severity: "info",
      message: `Vento moderado: ${current.windSpeed.toFixed(0)} km/h.`,
    });
  }

  return alerts;
}

function cacheKey(latitude: number, longitude: number): string {
  return `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
}

function mapResponse(
  data: OpenMeteoResponse,
  latitude: number,
  longitude: number,
  locationName?: string,
): PropertyWeather {
  if (!data.current || !data.daily) {
    throw new Error("Resposta incompleta da API meteorológica");
  }

  const current: WeatherCurrent = {
    temperature: data.current.temperature_2m,
    humidity: data.current.relative_humidity_2m,
    precipitation: data.current.precipitation,
    windSpeed: data.current.wind_speed_10m,
    weatherCode: data.current.weather_code,
    weatherLabel: describeWeatherCode(data.current.weather_code),
    time: data.current.time,
  };

  const daily: WeatherDailyForecast[] = data.daily.time.map((date, index) => {
    const weatherCode = data.daily!.weather_code[index] ?? 0;
    return {
      date,
      tempMin: data.daily!.temperature_2m_min[index] ?? 0,
      tempMax: data.daily!.temperature_2m_max[index] ?? 0,
      precipitationSum: data.daily!.precipitation_sum[index] ?? 0,
      weatherCode,
      weatherLabel: describeWeatherCode(weatherCode),
    };
  });

  const alerts = buildAgroAlerts(current, daily);

  return {
    latitude,
    longitude,
    locationName,
    current,
    daily,
    alerts,
    fetchedAt: new Date().toISOString(),
  };
}

export async function fetchPropertyWeather(
  latitude: number,
  longitude: number,
  locationName?: string,
): Promise<PropertyWeather> {
  const key = cacheKey(latitude, longitude);
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return {
      ...cached.data,
      locationName: locationName ?? cached.data.locationName,
    };
  }

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    timezone: "America/Sao_Paulo",
    forecast_days: "5",
    current: "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum",
  });

  const response = await fetch(`${OPEN_METEO_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Falha ao consultar clima (${response.status})`);
  }

  const data = (await response.json()) as OpenMeteoResponse;
  const weather = mapResponse(data, latitude, longitude, locationName);

  cache.set(key, { data: weather, expiresAt: Date.now() + CACHE_TTL_MS });
  return weather;
}

export function clearWeatherCache(): void {
  cache.clear();
}
