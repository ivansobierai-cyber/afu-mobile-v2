/**
 * Etapa 9 — logger com redação de senhas, tokens e documentos.
 */

const SECRET_KEY =
  /(password|passwd|senha|token|authorization|bearer|cookie|secret|api[_-]?key|refresh|jwt|base64|imageBase64|documento|cpf|cnpj)/i;

const SECRET_VALUE =
  /(Bearer\s+[A-Za-z0-9\-._~+/]+=*|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|data:image\/[a-zA-Z+]+;base64,[A-Za-z0-9+/=]+)/g;

const MAX_STRING = 500;

export function redactString(value: string): string {
  let out = value.replace(SECRET_VALUE, "[REDACTED]");
  if (out.length > MAX_STRING) out = `${out.slice(0, MAX_STRING)}…[truncated]`;
  return out;
}

export function redactValue(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[MaxDepth]";
  if (value == null) return value;
  if (typeof value === "string") return redactString(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.slice(0, 50).map((v) => redactValue(v, depth + 1));
  if (typeof value === "object") {
    const src = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(src)) {
      if (SECRET_KEY.test(k)) {
        out[k] = "[REDACTED]";
        continue;
      }
      out[k] = redactValue(v, depth + 1);
    }
    return out;
  }
  return String(value);
}

type LogLevel = "debug" | "info" | "warn" | "error";

function emit(level: LogLevel, message: string, meta?: unknown): void {
  const safeMsg = redactString(message);
  const safeMeta = meta === undefined ? undefined : redactValue(meta);
  const line = safeMeta === undefined ? safeMsg : `${safeMsg} ${JSON.stringify(safeMeta)}`;
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const safeLogger = {
  debug: (message: string, meta?: unknown) => emit("debug", message, meta),
  info: (message: string, meta?: unknown) => emit("info", message, meta),
  warn: (message: string, meta?: unknown) => emit("warn", message, meta),
  error: (message: string, meta?: unknown) => emit("error", message, meta),
};
