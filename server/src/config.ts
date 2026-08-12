/**
 * Central env parsing for VibeOracle server.
 * All process.env reads for feature flags should go through loadConfig().
 */

export type SecureHeadersProfile = "same-site" | "cross-origin";

export type AppConfig = {
  nodeEnv: string;
  port: number;
  xaiApiKey: string;
  xaiBaseUrl: string;
  xaiModel: string;
  allowDemoWithoutKey: boolean;
  publicDemo: boolean;
  corsOrigins: string[];
  bodyLimitBytes: number;
  moodMaxChars: number;
  moodMinChars: number;
  rateLimitWindowMs: number;
  rateLimitMaxIp: number;
  rateLimitMaxToken: number;
  rateLimitMaxLiveIp: number;
  /** Process-wide live LLM calls per window (all IPs). */
  globalLiveMaxPerWindow: number;
  /** Max concurrent in-flight live LLM calls. */
  llmMaxInflight: number;
  llmTimeoutMs: number;
  llmMaxRetries: number;
  llmMaxTokens: number;
  llmTemperature: number;
  allowClientSeed: boolean;
  allowClientDate: boolean;
  healthExposeKeyStatus: boolean;
  trustProxy: boolean;
  /**
   * When trustProxy is true:
   * - cf-only (default): only CF-Connecting-IP; never XFF/X-Real-Ip
   * - headers: legacy CF → XFF → X-Real-Ip (avoid on public origins)
   */
  trustProxyMode: "cf-only" | "headers";
  /** If non-empty, proxy headers only trusted when socket IP is in these CIDRs. */
  trustedProxyCidrs: string[];
  ogRateLimitMaxIp: number;
  ogMaxInflight: number;
  logIpSalt: string;
  contentRefuseMode: "soft";
  secureHeadersProfile: SecureHeadersProfile;
};

export function envBool(name: string, defaultValue: boolean): boolean {
  const v = process.env[name];
  if (v === undefined || v === "") return defaultValue;
  if (v === "true" || v === "1") return true;
  if (v === "false" || v === "0") return false;
  return defaultValue;
}

export function envInt(name: string, defaultValue: number): number {
  const v = process.env[name];
  if (v === undefined || v === "") return defaultValue;
  const n = Number(v);
  return Number.isFinite(n) ? n : defaultValue;
}

export function envCSV(name: string, defaultValue: string[]): string[] {
  const v = process.env[name];
  if (v === undefined) return defaultValue;
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const DEFAULT_CORS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

let cached: AppConfig | null = null;

export function loadConfig(force = false): AppConfig {
  if (cached && !force) return cached;

  const nodeEnv = process.env.NODE_ENV || "development";
  const isProd = nodeEnv === "production";

  let corsOrigins = envCSV("CORS_ORIGINS", DEFAULT_CORS);
  if (corsOrigins.length === 0) {
    if (isProd) {
      throw new Error(
        "CORS_ORIGINS is empty in production — refuse to boot with open/empty CORS"
      );
    }
    corsOrigins = [...DEFAULT_CORS];
  }

  const xaiApiKey = process.env.XAI_API_KEY?.trim() || "";
  const publicDemo = envBool("PUBLIC_DEMO", false);

  const profileRaw = (process.env.SECURE_HEADERS_PROFILE || "same-site").trim();
  const secureHeadersProfile: SecureHeadersProfile =
    profileRaw === "cross-origin" ? "cross-origin" : "same-site";

  // Never derive salt from API key (R7) — use dedicated env or static dev default.
  const logIpSalt = process.env.LOG_IP_SALT?.trim() || "dev-ip-salt-not-a-secret";

  cached = {
    nodeEnv,
    port: envInt("PORT", 8787),
    xaiApiKey,
    xaiBaseUrl: process.env.XAI_BASE_URL || "https://api.x.ai/v1",
    xaiModel: process.env.XAI_MODEL || "grok-4.5",
    allowDemoWithoutKey: envBool("ALLOW_DEMO_WITHOUT_KEY", true),
    publicDemo,
    corsOrigins,
    bodyLimitBytes: envInt("BODY_LIMIT_BYTES", 8192),
    moodMaxChars: envInt("MOOD_MAX_CHARS", 500),
    moodMinChars: envInt("MOOD_MIN_CHARS", 3),
    rateLimitWindowMs: envInt("RATE_LIMIT_WINDOW_MS", 60_000),
    rateLimitMaxIp: envInt("RATE_LIMIT_MAX_IP", 20),
    rateLimitMaxToken: envInt("RATE_LIMIT_MAX_TOKEN", 30),
    rateLimitMaxLiveIp: envInt("RATE_LIMIT_MAX_LIVE_IP", 5),
    globalLiveMaxPerWindow: envInt("GLOBAL_LIVE_MAX_PER_WINDOW", 30),
    llmMaxInflight: envInt("LLM_MAX_INFLIGHT", 3),
    llmTimeoutMs: envInt("LLM_TIMEOUT_MS", 12_000),
    llmMaxRetries: envInt("LLM_MAX_RETRIES", 1),
    llmMaxTokens: envInt("LLM_MAX_TOKENS", 900),
    llmTemperature: Number(process.env.LLM_TEMPERATURE || "0.9") || 0.9,
    allowClientSeed: envBool("ALLOW_CLIENT_SEED", false),
    allowClientDate: envBool("ALLOW_CLIENT_DATE", false),
    healthExposeKeyStatus: envBool(
      "HEALTH_EXPOSE_KEY_STATUS",
      !isProd
    ),
    trustProxy: envBool("TRUST_PROXY", false),
    trustProxyMode:
      (process.env.TRUST_PROXY_MODE || "cf-only").trim() === "headers"
        ? "headers"
        : "cf-only",
    trustedProxyCidrs: envCSV("TRUSTED_PROXY_CIDRS", []),
    ogRateLimitMaxIp: envInt("OG_RATE_LIMIT_MAX_IP", 30),
    ogMaxInflight: envInt("OG_MAX_INFLIGHT", 2),
    logIpSalt,
    contentRefuseMode: "soft",
    secureHeadersProfile,
  };

  return cached;
}

/** Reset cache (tests only). */
export function resetConfigCache(): void {
  cached = null;
}

/** Env-level: would this process call xAI for live oracle? */
export function wouldCallLiveLlm(cfg: AppConfig = loadConfig()): boolean {
  return Boolean(cfg.xaiApiKey) && !cfg.publicDemo;
}

export type ModeCapability = "live" | "demo" | "none";

export function modeCapability(cfg: AppConfig = loadConfig()): ModeCapability {
  if (cfg.publicDemo) return "demo";
  if (cfg.xaiApiKey) return "live";
  if (cfg.allowDemoWithoutKey) return "demo";
  return "none";
}
