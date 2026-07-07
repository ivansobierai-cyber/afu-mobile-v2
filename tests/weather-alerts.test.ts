import { describe, expect, it, beforeEach } from "vitest";
import {
  buildWeatherAlertDedupeKey,
  clearWeatherAlertDedupCache,
  markWeatherAlertSent,
  shouldSendWeatherAlert,
} from "../server/services/weather-alerts-job";

describe("weather alerts dedup", () => {
  beforeEach(() => {
    clearWeatherAlertDedupCache();
  });

  it("builds stable dedupe key", () => {
    const key = buildWeatherAlertDedupeKey(1, 42, "frost", "2026-07-07");
    expect(key).toBe("1:42:frost:2026-07-07");
  });

  it("blocks duplicate within TTL window", () => {
    const key = buildWeatherAlertDedupeKey(2, 10, "rain", "2026-07-07");
    const now = Date.now();
    expect(shouldSendWeatherAlert(key, now)).toBe(true);
    markWeatherAlertSent(key, now);
    expect(shouldSendWeatherAlert(key, now + 1000)).toBe(false);
  });

  it("allows resend after TTL", () => {
    const key = buildWeatherAlertDedupeKey(3, 11, "wind", "2026-07-07");
    const now = Date.now();
    markWeatherAlertSent(key, now);
    expect(shouldSendWeatherAlert(key, now + 13 * 60 * 60 * 1000)).toBe(true);
  });
});
