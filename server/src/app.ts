import { Hono } from "hono";
import { cors } from "hono/cors";
import { bodyLimit } from "hono/body-limit";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { loadConfig, modeCapability, type AppConfig } from "./config.js";
import { runOracle, LlmError, RateLimitedError } from "./oracle.js";
import { createOracleRequestSchema } from "./schemas.js";
import {
  rateLimitOg,
  rateLimitOracle,
  resolveIp,
} from "./middleware/rateLimit.js";
import { hashIp, logJson } from "./log.js";
import { moodCodePointLength } from "./schemas.js";

export type ErrorCode =
  | "INVALID_JSON"
  | "MOOD_REQUIRED"
  | "MOOD_TOO_LONG"
  | "PAYLOAD_TOO_LARGE"
  | "RATE_LIMITED"
  | "NO_KEY"
  | "ORACLE_TIMEOUT"
  | "ORACLE_UPSTREAM"
  | "VALIDATION_FAILED"
  | "INTERNAL";

function buildSecureHeaders(cfg: AppConfig) {
  const isProd = cfg.nodeEnv === "production";
  const corp =
    cfg.secureHeadersProfile === "cross-origin"
      ? ("cross-origin" as const)
      : ("same-site" as const);

  return secureHeaders({
    xFrameOptions: "DENY",
    xContentTypeOptions: "nosniff",
    referrerPolicy: "no-referrer",
    crossOriginResourcePolicy: corp,
    crossOriginOpenerPolicy: "same-origin",
    strictTransportSecurity: isProd
      ? "max-age=31536000; includeSubDomains"
      : false,
    contentSecurityPolicy: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
    permissionsPolicy: {
      camera: [],
      microphone: [],
      geolocation: [],
    },
  });
}

export function createApp() {
  const boot = loadConfig();
  const app = new Hono();

  app.use("*", requestId());
  app.use("*", (c, next) => buildSecureHeaders(loadConfig())(c, next));

  app.use(
    "*",
    cors({
      origin: (origin) => {
        const cfg = loadConfig();
        if (!origin) return undefined;
        if (cfg.corsOrigins.includes(origin)) return origin;
        return null;
      },
      allowMethods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ["Content-Type", "X-Request-Id", "X-Client-Token"],
      exposeHeaders: ["Retry-After", "X-Request-Id"],
      maxAge: 86400,
    })
  );

  app.use(
    "*",
    bodyLimit({
      maxSize: boot.bodyLimitBytes,
      onError: (c) => {
        const rid = c.get("requestId") as string | undefined;
        return c.json(
          {
            error: "Payload too large",
            code: "PAYLOAD_TOO_LARGE" as ErrorCode,
            requestId: rid,
          },
          413
        );
      },
    })
  );

  app.get("/api/health", (c) => {
    const cfg = loadConfig();
    const cap = modeCapability(cfg);
    const body: Record<string, unknown> = {
      ok: true,
      name: "VibeOracle",
      version: "0.1.0",
      modeCapability: cap,
      demoAllowed: cfg.allowDemoWithoutKey || cfg.publicDemo,
      publicDemo: cfg.publicDemo,
    };
    if (cfg.healthExposeKeyStatus) {
      body.hasKey = Boolean(cfg.xaiApiKey);
    }
    return c.json(body);
  });

  app.get("/api/ready", (c) => {
    const cfg = loadConfig();
    const cap = modeCapability(cfg);
    if (cap === "none") {
      return c.json({ ok: false, modeCapability: cap }, 503);
    }
    return c.json({ ok: true, modeCapability: cap });
  });

  /**
   * Satori OG / share PNG — query params, no LLM.
   * GET /api/og?archetype=&tagline=&shareLine=&confidence=
   */
  app.get("/api/og", rateLimitOg(), async (c) => {
    const requestId = (c.get("requestId") as string) || "unknown";
    try {
      const { renderOgPng } = await import("./og/render.js");
      const archetype = String(c.req.query("archetype") || "VibeOracle").slice(
        0,
        80
      );
      const tagline = String(c.req.query("tagline") || "pure vibe").slice(
        0,
        160
      );
      const shareLine = String(
        c.req.query("shareLine") || "A theatrical reading."
      ).slice(0, 120);
      const confidence = Number(c.req.query("confidence") || "84");
      const png = await renderOgPng({
        archetype,
        tagline,
        shareLine,
        confidence: Number.isFinite(confidence) ? confidence : 84,
      });
      return new Response(new Uint8Array(png), {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          // private: avoid shared CDN caching of user-controlled text cards
          "Cache-Control": "private, max-age=60",
          "X-Request-Id": requestId,
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logJson({
        level: "error",
        msg: "og",
        requestId,
        code: "INTERNAL",
        detail: msg.slice(0, 120),
      });
      return c.json(
        {
          error: "OG render failed",
          code: "INTERNAL" as ErrorCode,
          requestId,
        },
        500
      );
    }
  });

  app.post("/api/oracle", rateLimitOracle(), async (c) => {
    const requestId = (c.get("requestId") as string) || "unknown";
    const started = Date.now();
    const ip = resolveIp(c);

    let raw: unknown;
    try {
      raw = await c.req.json();
    } catch {
      return c.json(
        {
          error: "Invalid JSON body",
          code: "INVALID_JSON" as ErrorCode,
          requestId,
        },
        400
      );
    }

    const parsed = createOracleRequestSchema().safeParse(raw);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || "VALIDATION_FAILED";
      if (msg === "MOOD_REQUIRED") {
        return c.json(
          {
            error: "mood is required (min code points after normalize)",
            code: "MOOD_REQUIRED" as ErrorCode,
            requestId,
          },
          400
        );
      }
      if (msg === "MOOD_TOO_LONG") {
        return c.json(
          {
            error: "mood exceeds max length",
            code: "MOOD_TOO_LONG" as ErrorCode,
            requestId,
          },
          400
        );
      }
      return c.json(
        {
          error: "Validation failed",
          code: "VALIDATION_FAILED" as ErrorCode,
          requestId,
        },
        400
      );
    }

    const body = parsed.data;
    try {
      const result = await runOracle(
        {
          mood: body.mood,
          seed: body.seed,
          drawCount: body.drawCount,
          date: body.date,
        },
        { requestId, ip }
      );

      logJson({
        msg: "oracle",
        requestId,
        mode: result.mode,
        code: null,
        ipHash: hashIp(ip),
        moodLen: moodCodePointLength(body.mood),
        latencyMs: Date.now() - started,
        policy: result.meta.policy?.category ?? null,
      });

      return c.json(result);
    } catch (err) {
      if (err instanceof RateLimitedError) {
        logJson({
          level: "warn",
          msg: "oracle",
          requestId,
          code: "RATE_LIMITED",
          ipHash: hashIp(ip),
          moodLen: moodCodePointLength(body.mood),
          latencyMs: Date.now() - started,
        });
        c.header("Retry-After", String(err.retryAfterSec));
        return c.json(
          {
            error: "Rate limit exceeded",
            code: "RATE_LIMITED" as ErrorCode,
            requestId,
            retryAfterSec: err.retryAfterSec,
          },
          429
        );
      }
      if (err instanceof LlmError) {
        logJson({
          level: "error",
          msg: "oracle",
          requestId,
          code: err.code,
          ipHash: hashIp(ip),
          moodLen: moodCodePointLength(body.mood),
          latencyMs: Date.now() - started,
        });
        if (err.code === "NO_KEY") {
          return c.json(
            {
              error: "XAI_API_KEY missing and demo mode disabled",
              code: "NO_KEY" as ErrorCode,
              requestId,
            },
            503
          );
        }
        return c.json(
          {
            error:
              err.code === "ORACLE_TIMEOUT"
                ? "Oracle timed out"
                : "Oracle upstream failed",
            code: err.code as ErrorCode,
            requestId,
          },
          503
        );
      }

      const msg = err instanceof Error ? err.message : String(err);
      if (msg === "MOOD_REQUIRED") {
        return c.json(
          {
            error: "mood is required (min code points after normalize)",
            code: "MOOD_REQUIRED" as ErrorCode,
            requestId,
          },
          400
        );
      }
      if (msg === "NO_KEY") {
        return c.json(
          {
            error: "XAI_API_KEY missing and demo mode disabled",
            code: "NO_KEY" as ErrorCode,
            requestId,
          },
          503
        );
      }

      logJson({
        level: "error",
        msg: "oracle",
        requestId,
        code: "INTERNAL",
        ipHash: hashIp(ip),
        latencyMs: Date.now() - started,
      });
      // Never leak upstream detail / stacks
      return c.json(
        {
          error: "Oracle failed",
          code: "INTERNAL" as ErrorCode,
          requestId,
        },
        500
      );
    }
  });

  return app;
}
