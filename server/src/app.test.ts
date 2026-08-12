import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { resetConfigCache } from "./config.js";
import { resetRateLimitState } from "./middleware/rateLimit.js";

const ENV_KEYS = [
  "XAI_API_KEY",
  "ALLOW_DEMO_WITHOUT_KEY",
  "PUBLIC_DEMO",
  "ALLOW_CLIENT_SEED",
  "ALLOW_CLIENT_DATE",
  "HEALTH_EXPOSE_KEY_STATUS",
  "CORS_ORIGINS",
  "RATE_LIMIT_MAX_IP",
  "RATE_LIMIT_MAX_LIVE_IP",
  "BODY_LIMIT_BYTES",
] as const;

function snapshotEnv() {
  const s: Record<string, string | undefined> = {};
  for (const k of ENV_KEYS) s[k] = process.env[k];
  return s;
}

function restoreEnv(s: Record<string, string | undefined>) {
  for (const [k, v] of Object.entries(s)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  resetConfigCache();
  resetRateLimitState();
}

describe("HTTP API", () => {
  let snap: Record<string, string | undefined>;

  beforeEach(() => {
    snap = snapshotEnv();
    delete process.env.XAI_API_KEY;
    process.env.ALLOW_DEMO_WITHOUT_KEY = "true";
    process.env.PUBLIC_DEMO = "false";
    process.env.ALLOW_CLIENT_SEED = "false";
    process.env.ALLOW_CLIENT_DATE = "false";
    process.env.HEALTH_EXPOSE_KEY_STATUS = "true";
    process.env.RATE_LIMIT_MAX_IP = "1000";
    process.env.RATE_LIMIT_MAX_LIVE_IP = "1000";
    resetConfigCache();
    resetRateLimitState();
  });

  afterEach(() => {
    restoreEnv(snap);
  });

  it("GET /api/health", async () => {
    const app = createApp();
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.name).toBe("VibeOracle");
    expect(body.modeCapability).toBe("demo");
    expect(body.publicDemo).toBe(false);
    expect(body.hasKey).toBe(false);
  });

  it("GET /api/ready ok in demo", async () => {
    const app = createApp();
    const res = await app.request("/api/ready");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("GET /api/ready 503 when none", async () => {
    process.env.ALLOW_DEMO_WITHOUT_KEY = "false";
    delete process.env.XAI_API_KEY;
    resetConfigCache();
    const app = createApp();
    const res = await app.request("/api/ready");
    expect(res.status).toBe(503);
  });

  it("POST /api/oracle validates mood short", async () => {
    const app = createApp();
    const res = await app.request("/api/oracle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mood: "no" }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("MOOD_REQUIRED");
    expect(body.requestId).toBeTruthy();
    expect(body.detail).toBeUndefined();
  });

  it("POST /api/oracle rejects mood too long", async () => {
    const app = createApp();
    const mood = "x".repeat(501);
    const res = await app.request("/api/oracle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mood }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("MOOD_TOO_LONG");
  });

  it("POST /api/oracle demo happy path with meta", async () => {
    process.env.ALLOW_CLIENT_SEED = "true";
    process.env.ALLOW_CLIENT_DATE = "true";
    resetConfigCache();
    const app = createApp();
    const res = await app.request("/api/oracle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mood: "I feel stuck between two futures",
        seed: "http-test-seed",
        date: "2026-08-11",
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.mode).toBe("demo");
    expect(body.ritual).toHaveLength(3);
    expect(body.report.archetype.name).toBeTruthy();
    expect(body.report.actions).toHaveLength(3);
    expect(body.report.confidenceTheater).toBeGreaterThanOrEqual(72);
    expect(body.report.confidenceTheater).toBeLessThanOrEqual(92);
    expect(body.meta.confidenceLabel).toBe("theatrical");
    expect(body.meta.requestId).toBeTruthy();
    expect(body.meta.day).toBe("2026-08-11");
  });

  it("POST /api/oracle ignores client seed by default", async () => {
    process.env.ALLOW_CLIENT_SEED = "false";
    resetConfigCache();
    const app = createApp();
    const res = await app.request("/api/oracle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mood: "I feel stuck between two futures",
        seed: "should-be-ignored-seed-xyz",
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.seed).not.toBe("should-be-ignored-seed-xyz");
    expect(body.meta.seedIgnored).toBe(true);
  });

  it("POST /api/oracle soft refuse for crisis", async () => {
    const app = createApp();
    const res = await app.request("/api/oracle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mood: "I want to kill myself tonight please help",
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.mode).toBe("refused");
    expect(body.ritual).toHaveLength(3);
    expect(body.meta.policy.category).toBe("crisis");
    expect(body.report.archetype.name).toBe("Boundary Keeper");
  });

  it("POST /api/oracle rejects invalid JSON", async () => {
    const app = createApp();
    const res = await app.request("/api/oracle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{not-json",
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("INVALID_JSON");
  });

  it("POST /api/oracle invalid drawCount", async () => {
    const app = createApp();
    const res = await app.request("/api/oracle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mood: "I feel stuck between two futures",
        drawCount: 9,
      }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("VALIDATION_FAILED");
  });

  it("CORS does not reflect evil origin", async () => {
    const app = createApp();
    const res = await app.request("/api/health", {
      headers: { Origin: "https://evil.example" },
    });
    const acao = res.headers.get("Access-Control-Allow-Origin");
    expect(acao).not.toBe("https://evil.example");
    expect(acao).not.toBe("http://localhost:5173");
  });

  it("CORS allows allowlisted origin", async () => {
    const app = createApp();
    const res = await app.request("/api/health", {
      headers: { Origin: "http://localhost:5173" },
    });
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
      "http://localhost:5173"
    );
  });

  it("sets security headers", async () => {
    const app = createApp();
    const res = await app.request("/api/health");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("PUBLIC_DEMO + key never returns live", async () => {
    process.env.PUBLIC_DEMO = "true";
    process.env.XAI_API_KEY = "fake-key";
    resetConfigCache();
    const app = createApp();
    const health = await (await app.request("/api/health")).json();
    expect(health.publicDemo).toBe(true);
    expect(health.modeCapability).toBe("demo");

    const res = await app.request("/api/oracle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mood: "I feel stuck between two futures",
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.mode).toBe("demo");
  });

  it("hides hasKey when HEALTH_EXPOSE_KEY_STATUS=false", async () => {
    process.env.HEALTH_EXPOSE_KEY_STATUS = "false";
    process.env.XAI_API_KEY = "secret";
    resetConfigCache();
    const app = createApp();
    const body = await (await app.request("/api/health")).json();
    expect(body.hasKey).toBeUndefined();
  });
});
