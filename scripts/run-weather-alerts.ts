/**
 * Dispara job de alertas climáticos (geada, chuva forte, calor, vento).
 * Uso: npx tsx scripts/run-weather-alerts.ts
 */
import "dotenv/config";
import { runWeatherAlertsJob } from "../server/services/weather-alerts-job";

async function main() {
  console.log("\n=== AFU Weather Alerts Job ===\n");
  const result = await runWeatherAlertsJob();
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.errors > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
