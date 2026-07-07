import { describe, expect, it } from "vitest";
import { buildAgroAlerts, describeWeatherCode } from "@/server/services/open-meteo";
import type { WeatherCurrent, WeatherDailyForecast } from "@/shared/weather";

describe("weather service", () => {
  it("describeWeatherCode traduz códigos WMO", () => {
    expect(describeWeatherCode(0)).toBe("Céu limpo");
    expect(describeWeatherCode(3)).toBe("Parcialmente nublado");
    expect(describeWeatherCode(61)).toBe("Chuva");
    expect(describeWeatherCode(95)).toBe("Tempestade");
  });

  it("buildAgroAlerts detecta geada, calor e chuva", () => {
    const current: WeatherCurrent = {
      temperature: 18,
      humidity: 70,
      precipitation: 0,
      windSpeed: 12,
      weatherCode: 1,
      weatherLabel: "Parcialmente nublado",
      time: "2026-07-07T08:00",
    };
    const daily: WeatherDailyForecast[] = [
      {
        date: "2026-07-07",
        tempMin: 1,
        tempMax: 36,
        precipitationSum: 22,
        weatherCode: 61,
        weatherLabel: "Chuva",
      },
    ];

    const alerts = buildAgroAlerts(current, daily);
    expect(alerts.some((a) => a.type === "frost")).toBe(true);
    expect(alerts.some((a) => a.type === "heat")).toBe(true);
    expect(alerts.some((a) => a.type === "rain")).toBe(true);
  });

  it("buildAgroAlerts detecta vento forte", () => {
    const current: WeatherCurrent = {
      temperature: 24,
      humidity: 50,
      precipitation: 0,
      windSpeed: 45,
      weatherCode: 0,
      weatherLabel: "Céu limpo",
      time: "2026-07-07T08:00",
    };

    const alerts = buildAgroAlerts(current, []);
    expect(alerts.some((a) => a.type === "wind" && a.severity === "warning")).toBe(true);
  });
});
