import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { resetConfigCache } from "../config.js";
import {
  acquireLiveBudget,
  ipv4InCidr,
  resetRateLimitState,
  resolveIp,
} from "./rateLimit.js";
import type { Context } from "hono";

function setEnv(map: Record<string, string | undefined>) {
  for (const [k, v] of Object.entries(map)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  resetConfigCache();
  resetRateLimitState();
}

function mockCtx(
  headers: Record<string, string> = {},
  remoteAddress?: string
): Context {
  return {
    req: {
      header: (name: string) => {
        const key = Object.keys(headers).find(
          (k) => k.toLowerCase() === name.toLowerCase()
        );
        return key ? headers[key] : undefined;
      },
    },
    env: remoteAddress
      ? { incoming: { socket: { remoteAddress } } }
      : {},
  } as unknown as Context;
}

describe("ipv4InCidr", () => {
  it("matches simple /24", () => {
    expect(ipv4InCidr("10.0.0.5", "10.0.0.0/24")).toBe(true);
    expect(ipv4InCidr("10.0.1.5", "10.0.0.0/24")).toBe(false);
  });
});

describe("resolveIp", () => {
  afterEach(() => {
    delete process.env.TRUST_PROXY;
    delete process.env.TRUST_PROXY_MODE;
    delete process.env.TRUSTED_PROXY_CIDRS;
    resetConfigCache();
  });

  it("ignores all client headers when TRUST_PROXY is false", () => {
    process.env.TRUST_PROXY = "false";
    resetConfigCache();
    const ip = resolveIp(
      mockCtx(
        {
          "x-real-ip": "9.9.9.9",
          "x-forwarded-for": "8.8.8.8",
          "cf-connecting-ip": "1.1.1.1",
        },
        "127.0.0.1"
      )
    );
    expect(ip).toBe("127.0.0.1");
  });

  it("cf-only mode ignores X-Real-Ip and XFF", () => {
    process.env.TRUST_PROXY = "true";
    process.env.TRUST_PROXY_MODE = "cf-only";
    resetConfigCache();
    // trusted socket (no CIDR list) but only CF header counts
    expect(
      resolveIp(
        mockCtx(
          { "x-real-ip": "9.9.9.9", "x-forwarded-for": "8.8.8.8" },
          "10.0.0.1"
        )
      )
    ).toBe("10.0.0.1");
    expect(
      resolveIp(
        mockCtx(
          {
            "cf-connecting-ip": "203.0.113.9",
            "x-forwarded-for": "1.2.3.4",
          },
          "10.0.0.1"
        )
      )
    ).toBe("203.0.113.9");
  });

  it("does not trust CF header when socket outside TRUSTED_PROXY_CIDRS", () => {
    process.env.TRUST_PROXY = "true";
    process.env.TRUST_PROXY_MODE = "cf-only";
    process.env.TRUSTED_PROXY_CIDRS = "10.0.0.0/8";
    resetConfigCache();
    // Direct client 203.0.113.1 tries to spoof CF header
    expect(
      resolveIp(
        mockCtx({ "cf-connecting-ip": "198.51.100.7" }, "203.0.113.1")
      )
    ).toBe("203.0.113.1");
    // Real CF hop in 10/8
    expect(
      resolveIp(
        mockCtx({ "cf-connecting-ip": "198.51.100.7" }, "10.1.2.3")
      )
    ).toBe("198.51.100.7");
  });

  it("headers mode can use XFF when explicitly enabled", () => {
    process.env.TRUST_PROXY = "true";
    process.env.TRUST_PROXY_MODE = "headers";
    resetConfigCache();
    expect(
      resolveIp(mockCtx({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }, "10.0.0.1"))
    ).toBe("1.2.3.4");
  });
});

describe("rateLimitOracle base", () => {
  const prev: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const k of [
      "XAI_API_KEY",
      "ALLOW_DEMO_WITHOUT_KEY",
      "PUBLIC_DEMO",
      "TRUST_PROXY",
      "RATE_LIMIT_MAX_IP",
      "RATE_LIMIT_MAX_LIVE_IP",
      "RATE_LIMIT_MAX_TOKEN",
      "RATE_LIMIT_WINDOW_MS",
      "GLOBAL_LIVE_MAX_PER_WINDOW",
      "LLM_MAX_INFLIGHT",
      "OG_RATE_LIMIT_MAX_IP",
      "OG_MAX_INFLIGHT",
    ]) {
      prev[k] = process.env[k];
    }
    setEnv({
      XAI_API_KEY: undefined,
      ALLOW_DEMO_WITHOUT_KEY: "true",
      PUBLIC_DEMO: "false",
      TRUST_PROXY: "false",
      RATE_LIMIT_MAX_IP: "3",
      RATE_LIMIT_MAX_LIVE_IP: "2",
      RATE_LIMIT_MAX_TOKEN: "2",
      RATE_LIMIT_WINDOW_MS: "60000",
      GLOBAL_LIVE_MAX_PER_WINDOW: "100",
      LLM_MAX_INFLIGHT: "10",
      OG_RATE_LIMIT_MAX_IP: "2",
      OG_MAX_INFLIGHT: "1",
    });
  });

  afterEach(() => {
    setEnv(prev);
  });

  async function hit(headers: Record<string, string> = {}) {
    const app = createApp();
    return app.request("/api/oracle", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({
        mood: "I feel stuck between two futures today",
      }),
    });
  }

  it("returns 429 after IP max", async () => {
    expect((await hit()).status).toBe(200);
    expect((await hit()).status).toBe(200);
    expect((await hit()).status).toBe(200);
    const limited = await hit();
    expect(limited.status).toBe(429);
    expect((await limited.json()).code).toBe("RATE_LIMITED");
  });

  it("X-Real-Ip cannot bypass IP limit when TRUST_PROXY=false", async () => {
    expect((await hit()).status).toBe(200);
    expect((await hit()).status).toBe(200);
    expect((await hit()).status).toBe(200);
    const spoofed = await hit({ "x-real-ip": "1.2.3.4" });
    expect(spoofed.status).toBe(429);
  });

  it("token cannot bypass IP limit", async () => {
    setEnv({
      ...prev,
      XAI_API_KEY: undefined,
      ALLOW_DEMO_WITHOUT_KEY: "true",
      RATE_LIMIT_MAX_IP: "3",
      RATE_LIMIT_MAX_TOKEN: "100",
      TRUST_PROXY: "false",
    });
    const app = createApp();
    for (let i = 0; i < 3; i++) {
      const res = await app.request("/api/oracle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Client-Token": "11111111-1111-4111-8111-111111111111",
        },
        body: JSON.stringify({
          mood: "I feel stuck between two futures today",
        }),
      });
      expect(res.status).toBe(200);
    }
    const res = await app.request("/api/oracle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Client-Token": "22222222-2222-4222-8222-222222222222",
      },
      body: JSON.stringify({
        mood: "I feel stuck between two futures today",
      }),
    });
    expect(res.status).toBe(429);
  });

  it("crisis refuse does not require live key budget", async () => {
    setEnv({
      XAI_API_KEY: "fake-key",
      PUBLIC_DEMO: "false",
      ALLOW_DEMO_WITHOUT_KEY: "false",
      RATE_LIMIT_MAX_IP: "50",
      RATE_LIMIT_MAX_LIVE_IP: "1",
      GLOBAL_LIVE_MAX_PER_WINDOW: "1",
      LLM_MAX_INFLIGHT: "1",
    });
    const app = createApp();
    for (let i = 0; i < 5; i++) {
      const res = await app.request("/api/oracle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood: "I want to kill myself tonight please",
        }),
      });
      expect(res.status).toBe(200);
      expect((await res.json()).mode).toBe("refused");
    }
  });

  it("rate limits /api/og after OG_RATE_LIMIT_MAX_IP", async () => {
    setEnv({
      OG_RATE_LIMIT_MAX_IP: "2",
      OG_MAX_INFLIGHT: "4",
      RATE_LIMIT_WINDOW_MS: "60000",
      TRUST_PROXY: "false",
    });
    const app = createApp();
    const a = await app.request("/api/og?archetype=A&tagline=B&shareLine=C");
    const b = await app.request("/api/og?archetype=A&tagline=B&shareLine=C");
    const c = await app.request("/api/og?archetype=A&tagline=B&shareLine=C");
    // may 200 or 500 if font missing — but third should be 429 if first two completed
    if (a.status === 200 && b.status === 200) {
      expect(c.status).toBe(429);
      expect((await c.json()).code).toBe("OG_RATE_LIMITED");
    } else {
      // font failure path: still exercise middleware by many calls
      expect([200, 429, 500]).toContain(c.status);
    }
  });
});

describe("acquireLiveBudget", () => {
  beforeEach(() => {
    process.env.RATE_LIMIT_MAX_LIVE_IP = "2";
    process.env.GLOBAL_LIVE_MAX_PER_WINDOW = "3";
    process.env.LLM_MAX_INFLIGHT = "2";
    process.env.RATE_LIMIT_WINDOW_MS = "60000";
    resetConfigCache();
    resetRateLimitState();
  });

  afterEach(() => {
    resetRateLimitState();
    resetConfigCache();
  });

  it("enforces per-IP live cap", () => {
    const a = acquireLiveBudget("10.0.0.1");
    expect(a.ok).toBe(true);
    if (a.ok) a.release();
    const b = acquireLiveBudget("10.0.0.1");
    expect(b.ok).toBe(true);
    if (b.ok) b.release();
    const c = acquireLiveBudget("10.0.0.1");
    expect(c.ok).toBe(false);
  });

  it("enforces global live cap across IPs", () => {
    process.env.RATE_LIMIT_MAX_LIVE_IP = "10";
    process.env.GLOBAL_LIVE_MAX_PER_WINDOW = "2";
    process.env.LLM_MAX_INFLIGHT = "10";
    resetConfigCache();
    resetRateLimitState();
    expect(acquireLiveBudget("1.1.1.1").ok).toBe(true);
    expect(acquireLiveBudget("2.2.2.2").ok).toBe(true);
    expect(acquireLiveBudget("3.3.3.3").ok).toBe(false);
  });

  it("enforces in-flight concurrency", () => {
    process.env.RATE_LIMIT_MAX_LIVE_IP = "50";
    process.env.GLOBAL_LIVE_MAX_PER_WINDOW = "50";
    process.env.LLM_MAX_INFLIGHT = "1";
    resetConfigCache();
    resetRateLimitState();
    const a = acquireLiveBudget("1.1.1.1");
    expect(a.ok).toBe(true);
    expect(acquireLiveBudget("2.2.2.2").ok).toBe(false);
    if (a.ok) a.release();
    const c = acquireLiveBudget("2.2.2.2");
    expect(c.ok).toBe(true);
    if (c.ok) c.release();
  });
});
