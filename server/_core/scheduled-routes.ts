import type { Express, Request, Response } from "express";
import { runWeatherAlertsJob } from "../services/weather-alerts-job";

function isAuthorized(req: Request): boolean {
  const secret = process.env.SCHEDULED_TASK_SECRET;
  if (!secret) return false;
  const header = req.headers.authorization;
  if (header === `Bearer ${secret}`) return true;
  const query = req.query.secret;
  return typeof query === "string" && query === secret;
}

export function registerScheduledRoutes(app: Express): void {
  app.post("/api/scheduled/weather-alerts", async (req, res) => {
    if (!isAuthorized(req)) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }

    try {
      const result = await runWeatherAlertsJob();
      res.json({ ok: true, ...result });
    } catch (error) {
      console.error("[Scheduled] weather-alerts failed:", error);
      res.status(500).json({
        ok: false,
        error: error instanceof Error ? error.message : "Job failed",
      });
    }
  });

  app.get("/api/scheduled/weather-alerts/health", (_req: Request, res: Response) => {
    res.json({
      ok: true,
      enabled: process.env.WEATHER_ALERTS_ENABLED === "1",
      hasSecret: Boolean(process.env.SCHEDULED_TASK_SECRET),
    });
  });
}

export function startWeatherAlertsScheduler(): void {
  if (process.env.WEATHER_ALERTS_ENABLED !== "1") return;

  const intervalMs = Number(process.env.WEATHER_ALERTS_INTERVAL_MS ?? 6 * 60 * 60 * 1000);
  if (!Number.isFinite(intervalMs) || intervalMs < 60_000) {
    console.warn("[WeatherAlerts] Intervalo inválido — scheduler desativado");
    return;
  }

  const run = () => {
    void runWeatherAlertsJob().then((result) => {
      console.log(
        `[WeatherAlerts] Job concluído: ${result.pushesSent} push(es), ${result.skippedDedup} dedup, ${result.errors} erro(s)`,
      );
    });
  };

  console.log(`[WeatherAlerts] Scheduler ativo (intervalo ${Math.round(intervalMs / 60000)} min)`);
  setTimeout(run, 30_000);
  setInterval(run, intervalMs);
}
