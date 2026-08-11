import { Hono } from "hono";
import { cors } from "hono/cors";
import { runOracle } from "./oracle.js";

export function createApp() {
  const app = new Hono();

  app.use(
    "*",
    cors({
      origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
      allowMethods: ["GET", "POST", "OPTIONS"],
    })
  );

  app.get("/api/health", (c) =>
    c.json({
      ok: true,
      name: "VibeOracle",
      version: "0.1.0",
      hasKey: Boolean(process.env.XAI_API_KEY),
      demoAllowed: (process.env.ALLOW_DEMO_WITHOUT_KEY ?? "true") !== "false",
    })
  );

  app.post("/api/oracle", async (c) => {
    let body: { mood?: string; seed?: string; drawCount?: number; date?: string };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    try {
      const result = await runOracle({
        mood: body.mood ?? "",
        seed: body.seed,
        drawCount: body.drawCount,
        date: body.date,
      });
      return c.json(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === "MOOD_REQUIRED") {
        return c.json({ error: "mood is required (min 3 chars)" }, 400);
      }
      if (msg === "NO_KEY") {
        return c.json(
          { error: "XAI_API_KEY missing and demo mode disabled" },
          503
        );
      }
      console.error(err);
      return c.json({ error: "Oracle failed", detail: msg }, 500);
    }
  });

  return app;
}
