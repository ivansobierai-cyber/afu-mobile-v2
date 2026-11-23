import type { Express, Request, Response, NextFunction } from "express";
import { RAILWAY_API_BASE_URL } from "../../constants/api-hosts";

/**
 * When API_UPSTREAM_URL is set (Hostinger SPA host without a working MySQL),
 * forward /api/* to the canonical Railway API so apex health/login aren't
 * served by a broken local Node process.
 *
 * Default unset = local handlers (Railway itself, local dev).
 */
export function getApiUpstreamBaseUrl(): string | undefined {
  const raw = process.env.API_UPSTREAM_URL?.trim();
  if (!raw) return undefined;
  return raw.replace(/\/$/, "");
}

/** Suggested production value for Hostinger Node when MySQL there is unavailable. */
export const DEFAULT_HOSTINGER_API_UPSTREAM = RAILWAY_API_BASE_URL;

function hopByHopHeaders(): Set<string> {
  return new Set([
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
    "host",
    "content-length",
  ]);
}

async function readRequestBody(req: Request): Promise<Buffer | undefined> {
  if (req.method === "GET" || req.method === "HEAD") return undefined;
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === "string") return Buffer.from(req.body);
  if (req.body != null && typeof req.body === "object") {
    return Buffer.from(JSON.stringify(req.body));
  }
  return undefined;
}

export function registerApiUpstreamProxy(app: Express): boolean {
  const upstream = getApiUpstreamBaseUrl();
  if (!upstream) return false;

  console.log(`[api] API_UPSTREAM_URL active → proxy /api/* to ${upstream}`);

  const skip = hopByHopHeaders();

  app.use("/api", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const targetUrl = `${upstream}${req.originalUrl}`;
      const headers: Record<string, string> = {};
      for (const [key, value] of Object.entries(req.headers)) {
        if (value == null) continue;
        if (skip.has(key.toLowerCase())) continue;
        headers[key] = Array.isArray(value) ? value.join(",") : value;
      }
      if (!headers.origin && req.headers.origin) {
        headers.origin = String(req.headers.origin);
      }

      const body = await readRequestBody(req);
      if (body && !headers["content-type"]) {
        headers["content-type"] = "application/json";
      }

      const upstreamRes = await fetch(targetUrl, {
        method: req.method,
        headers,
        body: body as BodyInit | undefined,
        redirect: "manual",
      });

      res.status(upstreamRes.status);
      upstreamRes.headers.forEach((value, key) => {
        if (skip.has(key.toLowerCase())) return;
        // Hostinger CORS middleware already set ACAO for browser clients.
        if (key.toLowerCase().startsWith("access-control-")) return;
        res.setHeader(key, value);
      });

      const buf = Buffer.from(await upstreamRes.arrayBuffer());
      res.send(buf);
    } catch (err) {
      console.error("[api] upstream proxy failed:", err);
      if (!res.headersSent) {
        res.status(502).json({
          ok: false,
          error: "API upstream unreachable",
          upstream,
        });
      } else {
        next(err);
      }
    }
  });

  return true;
}
