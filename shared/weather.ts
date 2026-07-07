export interface WeatherCurrent {
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  weatherCode: number;
  weatherLabel: string;
  time: string;
}

export interface WeatherDailyForecast {
  date: string;
  tempMin: number;
  tempMax: number;
  precipitationSum: number;
  weatherCode: number;
  weatherLabel: string;
}

export type WeatherAlertType = "frost" | "heat" | "rain" | "wind";

export interface WeatherAlert {
  type: WeatherAlertType;
  severity: "info" | "warning";
  message: string;
}

export interface PropertyWeather {
  latitude: number;
  longitude: number;
  locationName?: string;
  current: WeatherCurrent;
  daily: WeatherDailyForecast[];
  alerts: WeatherAlert[];
  fetchedAt: string;
}
