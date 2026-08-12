import type { HealthResponse, OracleResponse } from "./types";
import { apiUrl, REQUEST_TIMEOUT_MS } from "./config";
import { safeParseOracleResponse } from "./schemas";

const TOKEN_KEY = "vibe.clientToken";

function getOrCreateClientToken(): string {
  try {
    let t = sessionStorage.getItem(TOKEN_KEY);
    if (!t && typeof crypto !== "undefined" && crypto.randomUUID) {
      t = crypto.randomUUID();
      sessionStorage.setItem(TOKEN_KEY, t);
    }
    return t || "00000000-0000-4000-8000-000000000000";
  } catch {
    return "00000000-0000-4000-8000-000000000000";
  }
}

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(apiUrl("/api/health"));
  if (!res.ok) throw new Error(`Health HTTP ${res.status}`);
  return res.json();
}

/** Server-rendered Satori OG PNG URL (share chain). */
export function buildOgUrl(input: {
  archetype: string;
  tagline: string;
  shareLine: string;
  confidence: number;
}): string {
  const q = new URLSearchParams({
    archetype: input.archetype.slice(0, 80),
    tagline: input.tagline.slice(0, 160),
    shareLine: input.shareLine.slice(0, 120),
    confidence: String(input.confidence),
  });
  return apiUrl(`/api/og?${q.toString()}`);
}

export async function fetchOgPng(input: {
  archetype: string;
  tagline: string;
  shareLine: string;
  confidence: number;
}): Promise<Blob> {
  const res = await fetch(buildOgUrl(input));
  if (!res.ok) throw new Error(`OG HTTP ${res.status}`);
  return res.blob();
}

export async function consultOracle(mood: string): Promise<OracleResponse> {
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(apiUrl("/api/oracle"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Client-Token": getOrCreateClientToken(),
      },
      body: JSON.stringify({ mood, drawCount: 3 }),
      signal: ctrl.signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const code = (err as { code?: string }).code;
      const msg =
        (err as { error?: string }).error || `Oracle HTTP ${res.status}`;
      throw new Error(code ? `${msg} (${code})` : msg);
    }

    const raw = await res.json();
    const parsed = safeParseOracleResponse(raw);
    if (!parsed.success || !parsed.data) {
      throw new Error(`Invalid oracle response: ${parsed.error || "shape"}`);
    }

    return parsed.data as OracleResponse;
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new Error("Oracle request timed out");
    }
    throw e;
  } finally {
    window.clearTimeout(timer);
  }
}
