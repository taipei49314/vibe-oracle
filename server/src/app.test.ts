import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "./app.js";

describe("HTTP API", () => {
  const prevKey = process.env.XAI_API_KEY;
  const prevDemo = process.env.ALLOW_DEMO_WITHOUT_KEY;

  beforeEach(() => {
    delete process.env.XAI_API_KEY;
    process.env.ALLOW_DEMO_WITHOUT_KEY = "true";
  });

  afterEach(() => {
    if (prevKey === undefined) delete process.env.XAI_API_KEY;
    else process.env.XAI_API_KEY = prevKey;
    if (prevDemo === undefined) delete process.env.ALLOW_DEMO_WITHOUT_KEY;
    else process.env.ALLOW_DEMO_WITHOUT_KEY = prevDemo;
  });

  it("GET /api/health", async () => {
    const app = createApp();
    const res = await app.request("/api/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.name).toBe("VibeOracle");
  });

  it("POST /api/oracle validates mood", async () => {
    const app = createApp();
    const res = await app.request("/api/oracle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mood: "no" }),
    });
    expect(res.status).toBe(400);
  });

  it("POST /api/oracle demo happy path", async () => {
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
    expect(body.report.confidenceTheater).toBeGreaterThanOrEqual(88);
  });

  it("POST /api/oracle rejects invalid JSON", async () => {
    const app = createApp();
    const res = await app.request("/api/oracle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{not-json",
    });
    expect(res.status).toBe(400);
  });
});
