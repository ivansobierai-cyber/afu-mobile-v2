import "dotenv/config";
import { loginWithEmail } from "../server/db-auth";

async function main() {
  const emails = [
    "valida01.produtor@afuagro.com.br",
    "valida03.tecnico@afuagro.com.br",
    "valida06.admin@afuagro.com.br",
    "valida10.produtor@afuagro.com.br",
  ];
  for (const email of emails) {
    try {
      const u = await loginWithEmail(email, "Valid@1234");
      console.log("OK", email, "->", u.name);
    } catch (e: any) {
      console.log("FAIL", email, e?.message);
    }
  }
  process.exit(0);
}

main();
