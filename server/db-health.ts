/**
 * Probe leve de MySQL para /api/health — não altera dados.
 */
import mysql from "mysql2/promise";
import { getEmailServiceStatus } from "./email-service";

export type DatabaseHealth = {
  configured: boolean;
  reachable: boolean;
  detail?: string;
};

export type AuthDepsHealth = {
  database: DatabaseHealth;
  email: ReturnType<typeof getEmailServiceStatus> & { provider: "sendgrid" };
  ready: boolean;
};

let lastProbe: { at: number; result: DatabaseHealth } | null = null;
const PROBE_TTL_MS = 5_000;

export async function probeDatabaseHealth(opts?: {
  force?: boolean;
  timeoutMs?: number;
}): Promise<DatabaseHealth> {
  const now = Date.now();
  if (!opts?.force && lastProbe && now - lastProbe.at < PROBE_TTL_MS) {
    return lastProbe.result;
  }

  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    const result: DatabaseHealth = {
      configured: false,
      reachable: false,
      detail: "DATABASE_URL ausente",
    };
    lastProbe = { at: now, result };
    return result;
  }

  const timeoutMs = opts?.timeoutMs ?? 2_500;
  let conn: mysql.Connection | null = null;
  let connectPromise: Promise<mysql.Connection> | null = null;
  try {
    // createConnection(string) é o padrão do repo.
    connectPromise = mysql.createConnection(url);
    const timed = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`connect timeout after ${timeoutMs}ms`)), timeoutMs);
    });
    conn = await Promise.race([connectPromise, timed]);
    await conn.query("SELECT 1");
    const result: DatabaseHealth = { configured: true, reachable: true };
    lastProbe = { at: now, result };
    return result;
  } catch (error) {
    // Se o timeout ganhou a race, ainda feche a conexão que chegar depois.
    if (connectPromise) {
      void connectPromise
        .then((late) => late.end())
        .catch(() => undefined);
    }
    const detail = error instanceof Error ? error.message : String(error);
    const result: DatabaseHealth = {
      configured: true,
      reachable: false,
      detail: detail.slice(0, 180),
    };
    lastProbe = { at: now, result };
    return result;
  } finally {
    if (conn) {
      try {
        await conn.end();
      } catch {
        // ignore close errors
      }
    }
  }
}

export async function getAuthDepsHealth(): Promise<AuthDepsHealth> {
  const database = await probeDatabaseHealth();
  const emailStatus = getEmailServiceStatus();
  return {
    database,
    email: { ...emailStatus, provider: "sendgrid" },
    ready: database.reachable,
  };
}

/** Exposto para testes. */
export function __resetDbHealthCacheForTests() {
  lastProbe = null;
}
