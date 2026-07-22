/**
 * Backfill Etapa 2 — cria organização pessoal + membership para cada perfil AFU.
 * Uso: npx tsx scripts/backfill-organizations.ts
 */
import "dotenv/config";
import { backfillPersonalOrganizations } from "../server/db-organizations";

async function main() {
  const result = await backfillPersonalOrganizations();
  console.log(
    `[backfill-organizations] processados=${result.processed} criados=${result.created}`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
