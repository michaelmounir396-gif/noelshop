import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth.js";
import { publicPlatformScript } from "./publicConfig.js";
import { appRouter } from "../routers.js";
import { createContext } from "./context.js";

// Static serving lives in index.ts so the Vercel function never loads Vite.
export function createApp() {
  const app = express();

  // Vercel's function payload limit is 4.5 MB. Media is uploaded directly to
  // object storage; API requests only need a small JSON body.
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.get("/api/platform/config.js", (_req, res) => {
    res.set("Cache-Control", "no-store").type("application/javascript").send(publicPlatformScript());
  });
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  return app;
}
