import "dotenv/config";
import express from "express";
import { createServer } from "http";
import fs from "fs";
import net from "net";
import path from "path";
import { fileURLToPath } from "url";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { registerScheduledRoutes, startWeatherAlertsScheduler } from "./scheduled-routes";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { getPublicStorageHealth } from "../storage-status";
import { getAuthDepsHealth } from "../db-health";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Enable CORS for all routes - reflect the request origin to support credentials
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    res.header("Access-Control-Allow-Credentials", "true");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerScheduledRoutes(app);

  const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "public");
  const webIndex = path.join(publicDir, "index.html");
  const hasWeb = fs.existsSync(webIndex);

  app.use((req, res, next) => {
    const host = (req.headers.host ?? "").split(":")[0];
    if (host === "www.afuagro.tech" || host === "app.afuagro.tech") {
      res.redirect(301, `https://afuagro.tech${req.originalUrl}`);
      return;
    }
    next();
  });

  if (!hasWeb) {
    app.get("/", (_req, res) => {
      res.json({
        service: "AFU Agro API",
        status: "ok",
        health: "/api/health",
        trpc: "/api/trpc",
      });
    });
  }

  app.get("/api/health", async (_req, res) => {
    const [storage, authDeps] = await Promise.all([
      getPublicStorageHealth(),
      getAuthDepsHealth(),
    ]);
    // Liveness permanece 200; `ready` indica se login/signup/DB estão operacionais.
    res.json({
      ok: true,
      ready: authDeps.ready,
      timestamp: Date.now(),
      database: authDeps.database,
      email: {
        provider: authDeps.email.provider,
        ready: authDeps.email.ready,
        apiKeyConfigured: authDeps.email.apiKeyConfigured,
        fromEmailConfigured: authDeps.email.fromEmailConfigured,
        appUrl: authDeps.email.appUrl,
      },
      storage: {
        backend: storage.backend,
        s3Configured: storage.s3Configured,
        forgeConfigured: storage.forgeConfigured,
        storageReady: storage.storageReady,
        forgePresignOk: storage.forgePresignOk,
        ...(storage.s3EnvPresent ? { s3EnvPresent: storage.s3EnvPresent } : {}),
        ...(storage.detail ? { storageHint: storage.detail } : {}),
      },
    });
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  if (hasWeb) {
    app.use(express.static(publicDir, { index: false }));
    app.use((req, res, next) => {
      if (req.method !== "GET" && req.method !== "HEAD") {
        next();
        return;
      }
      if (req.path === "/api" || req.path.startsWith("/api/")) {
        next();
        return;
      }
      res.sendFile(webIndex, (err) => {
        if (err) next(err);
      });
    });
  }

  const preferredPort = parseInt(process.env.PORT || "3000", 10);
  // Em PaaS (Railway/etc) PORT é obrigatório — não procurar porta alternativa.
  const port =
    process.env.PORT && process.env.NODE_ENV === "production"
      ? preferredPort
      : await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`[api] server listening on port ${port}`);
    startWeatherAlertsScheduler();
  });
}

startServer().catch(console.error);
