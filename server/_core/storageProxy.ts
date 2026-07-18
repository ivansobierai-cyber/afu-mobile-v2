/**
 * Etapa 6 — proxy de storage autenticado + ACL por organização.
 * GET /manus-storage/* exige sessão Bearer/cookie OU ?token= (JWT download curto).
 */
import type { Express, Request, Response } from "express";
import { TRPCError } from "@trpc/server";
import { ENV } from "./env";
import { sdk } from "./sdk";
import {
  assertCanAccessStorageKey,
  verifyDownloadToken,
  writeAuditLog,
} from "../private-files";

function clientIp(req: Request): string | undefined {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string" && xf.length) return xf.split(",")[0]?.trim();
  return req.socket.remoteAddress;
}

async function authorizeDownload(
  req: Request,
  key: string,
): Promise<{ userId: number; organizationId: number; via: "session" | "token" }> {
  const qToken = typeof req.query.token === "string" ? req.query.token : undefined;
  if (qToken) {
    const payload = await verifyDownloadToken(qToken);
    if (payload.storageKey !== key) {
      const err = new Error("Token não corresponde ao arquivo");
      (err as any).status = 403;
      throw err;
    }
    // Revalida membership (usuário removido não baixa)
    await assertCanAccessStorageKey({
      userId: payload.userId,
      storageKey: key,
      permission: "reports.read",
    });
    return {
      userId: payload.userId,
      organizationId: payload.organizationId,
      via: "token",
    };
  }

  try {
    const user = await sdk.authenticateRequest(req);
    const access = await assertCanAccessStorageKey({
      userId: user.id,
      userRole: user.role,
      storageKey: key,
      permission: "reports.read",
    });
    return {
      userId: user.id,
      organizationId: access.organizationId,
      via: "session",
    };
  } catch (e: any) {
    if (e instanceof TRPCError || e?.code === "NOT_FOUND" || e?.code === "FORBIDDEN") {
      throw e;
    }
    const err = new Error(e?.message || "Não autenticado");
    (err as any).status = 401;
    throw err;
  }
}

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req: Request, res: Response) => {
    const key = ((req.params as Record<string, string>)[0] || "").replace(/^\/+/, "");
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    let auth: { userId: number; organizationId: number; via: string };
    try {
      auth = await authorizeDownload(req, key);
    } catch (e: any) {
      const status = e?.status === 403 ? 403 : e?.code === "FORBIDDEN" ? 403 : e?.code === "NOT_FOUND" ? 404 : 401;
      // TRPCError has .code
      const code = e?.code;
      const http =
        code === "NOT_FOUND"
          ? 404
          : code === "FORBIDDEN"
            ? 403
            : code === "UNAUTHORIZED"
              ? 401
              : status;
      res.set("Cache-Control", "no-store");
      res.status(http).send(http === 401 ? "Unauthorized" : "Forbidden");
      return;
    }

    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.set("Cache-Control", "no-store");
      res.status(503).send("Storage backend not configured");
      return;
    }

    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
      );
      forgeUrl.searchParams.set("path", key);

      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
      });

      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }

      const { url } = (await forgeResp.json()) as { url: string };
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }

      await writeAuditLog({
        organizationId: auth.organizationId || null,
        actorUserId: auth.userId,
        action: "file.download",
        resourceType: "storage_proxy",
        storageKey: key,
        ip: clientIp(req),
        userAgent: req.headers["user-agent"]?.slice(0, 255),
        meta: JSON.stringify({ via: auth.via }),
      });

      res.set("Cache-Control", "no-store, private");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}
