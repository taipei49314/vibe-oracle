import type { Context, MiddlewareHandler, Next } from "hono";
import { getConnInfo } from "@hono/node-server/conninfo";
import { loadConfig, type AppConfig } from "../config.js";
import { hashIp, logJson } from "../log.js";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let liveInFlight = 0;
let ogInFlight = 0;

/** Test helper: clear all rate-limit / budget state. */
export function resetRateLimitState(): void {
  buckets.clear();
  liveInFlight = 0;
  ogInFlight = 0;
}

function prune(now: number): void {
  if (buckets.size < 2000) return;
  for (const [k, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(k);
  }
  // Hard cap: drop oldest-ish keys if still huge (spoof flood defense)
  if (buckets.size > 20_000) {
    let n = 0;
    for (const k of buckets.keys()) {
      buckets.delete(k);
      if (++n > 10_000) break;
    }
  }
}

function consume(
  key: string,
  max: number,
  windowMs: number
): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  prune(now);
  let b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + windowMs };
    buckets.set(key, b);
  }
  if (b.count >= max) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((b.resetAt - now) / 1000)),
    };
  }
  b.count += 1;
  return { ok: true, retryAfterSec: 0 };
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** IPv4 simple match for CIDR allowlists (proxy sockets). */
export function ipv4InCidr(ip: string, cidr: string): boolean {
  const [base, bitsStr] = cidr.split("/");
  if (!base || !bitsStr) return ip === cidr;
  const bits = Number(bitsStr);
  if (!Number.isFinite(bits) || bits < 0 || bits > 32) return false;
  const toInt = (s: string) => {
    const p = s.split(".").map(Number);
    if (p.length !== 4 || p.some((n) => n < 0 || n > 255 || !Number.isFinite(n)))
      return null;
    return ((p[0]! << 24) | (p[1]! << 16) | (p[2]! << 8) | p[3]!) >>> 0;
  };
  const ipN = toInt(ip);
  const baseN = toInt(base);
  if (ipN === null || baseN === null) return false;
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipN & mask) === (baseN & mask);
}

function socketRemote(c: Context): string | undefined {
  try {
    const info = getConnInfo(c);
    const addr = info?.remote?.address;
    if (addr && addr !== "") return addr;
  } catch {
    /* tests */
  }
  try {
    const incoming = (
      c.env as { incoming?: { socket?: { remoteAddress?: string } } }
    )?.incoming;
    const sock = incoming?.socket?.remoteAddress;
    if (sock) return sock;
  } catch {
    /* ignore */
  }
  return undefined;
}

function isTrustedSocket(remote: string | undefined, cfg: AppConfig): boolean {
  if (!cfg.trustedProxyCidrs.length) {
    // No CIDR list: headers are only trusted when TRUST_PROXY is on —
    // operator must ensure origin is not publicly reachable without CF.
    // We still require CF-only mode by default (see resolveIp).
    return true;
  }
  if (!remote) return false;
  // strip IPv6-mapped IPv4
  const ip = remote.startsWith("::ffff:") ? remote.slice(7) : remote;
  return cfg.trustedProxyCidrs.some(
    (cidr) => ip === cidr || ipv4InCidr(ip, cidr)
  );
}

/**
 * Resolve client IP for rate limiting.
 *
 * - TRUST_PROXY=false: socket/conninfo only — NEVER client headers.
 * - TRUST_PROXY=true + trustProxyMode=cf-only (default): ONLY CF-Connecting-IP,
 *   and only if socket is trusted (when TRUSTED_PROXY_CIDRS set) or no CIDR list.
 * - TRUST_PROXY=true + trustProxyMode=headers: CF → XFF → X-Real-Ip (legacy; avoid).
 */
export function resolveIp(c: Context): string {
  const cfg = loadConfig();
  const remote = socketRemote(c);

  if (!cfg.trustProxy) {
    return remote || "direct-unknown";
  }

  if (!isTrustedSocket(remote, cfg)) {
    // Client connected directly (or unlisted hop) — ignore all spoofable headers
    return remote || "direct-unknown";
  }

  if (cfg.trustProxyMode === "cf-only") {
    const cf = c.req.header("cf-connecting-ip")?.trim();
    if (cf && /^[\w.:%-]+$/.test(cf) && cf.length <= 64) return cf;
    // Behind trusted hop but no CF header — fall back to socket, not XFF
    return remote || "direct-unknown";
  }

  // legacy "headers" mode
  const cf = c.req.header("cf-connecting-ip")?.trim();
  if (cf) return cf;
  const xff = c.req.header("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = c.req.header("x-real-ip")?.trim();
  if (real) return real;
  return remote || "direct-unknown";
}

function rateLimitResponse(
  c: Context,
  ip: string,
  retryAfterSec: number,
  code: string = "RATE_LIMITED"
) {
  const requestId = c.get("requestId") as string | undefined;
  logJson({
    level: "warn",
    msg: "rate_limit",
    requestId,
    code,
    ipHash: hashIp(ip),
  });
  c.header("Retry-After", String(retryAfterSec));
  return c.json(
    {
      error: "Rate limit exceeded",
      code,
      requestId,
      retryAfterSec,
    },
    429
  );
}

/**
 * Base rate limit for all /api/oracle traffic (demo, refused, live).
 */
export function rateLimitOracle(): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    const cfg = loadConfig();
    const ip = resolveIp(c);
    const windowMs = cfg.rateLimitWindowMs;

    const ipHit = consume(`ip:${ip}`, cfg.rateLimitMaxIp, windowMs);
    if (!ipHit.ok) {
      return rateLimitResponse(c, ip, ipHit.retryAfterSec);
    }

    const tok = c.req.header("x-client-token");
    if (tok && UUID_RE.test(tok)) {
      const tokHit = consume(`tok:${tok}`, cfg.rateLimitMaxToken, windowMs);
      if (!tokHit.ok) {
        return rateLimitResponse(c, ip, tokHit.retryAfterSec);
      }
    }

    await next();
  };
}

/**
 * Rate limit + in-flight cap for expensive OG PNG renders.
 */
export function rateLimitOg(): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    const cfg = loadConfig();
    const ip = resolveIp(c);
    const windowMs = cfg.rateLimitWindowMs;

    const ipHit = consume(`ogip:${ip}`, cfg.ogRateLimitMaxIp, windowMs);
    if (!ipHit.ok) {
      return rateLimitResponse(c, ip, ipHit.retryAfterSec, "OG_RATE_LIMITED");
    }

    if (ogInFlight >= cfg.ogMaxInflight) {
      return rateLimitResponse(c, ip, 2, "OG_RATE_LIMITED");
    }
    ogInFlight += 1;
    try {
      await next();
    } finally {
      ogInFlight = Math.max(0, ogInFlight - 1);
    }
  };
}

export type LiveBudgetResult =
  | { ok: true; release: () => void }
  | { ok: false; retryAfterSec: number };

/**
 * Consume per-IP live + process-global live window budgets and in-flight slot.
 * Call ONLY when about to invoke the LLM (after content policy allow).
 */
export function acquireLiveBudget(ip: string): LiveBudgetResult {
  const cfg = loadConfig();
  const windowMs = cfg.rateLimitWindowMs;

  const liveIp = consume(
    `liveip:${ip}`,
    cfg.rateLimitMaxLiveIp,
    windowMs
  );
  if (!liveIp.ok) {
    return { ok: false, retryAfterSec: liveIp.retryAfterSec };
  }

  const global = consume(
    `liveglobal`,
    cfg.globalLiveMaxPerWindow,
    windowMs
  );
  if (!global.ok) {
    return { ok: false, retryAfterSec: global.retryAfterSec };
  }

  if (liveInFlight >= cfg.llmMaxInflight) {
    return { ok: false, retryAfterSec: 2 };
  }
  liveInFlight += 1;

  let released = false;
  return {
    ok: true,
    release: () => {
      if (released) return;
      released = true;
      liveInFlight = Math.max(0, liveInFlight - 1);
    },
  };
}

export function getLiveInFlight(): number {
  return liveInFlight;
}

export function getOgInFlight(): number {
  return ogInFlight;
}
