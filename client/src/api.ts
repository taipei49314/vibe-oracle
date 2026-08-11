import type { OracleResponse } from "./types";

export async function consultOracle(mood: string): Promise<OracleResponse> {
  const res = await fetch("/api/oracle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mood, drawCount: 3 }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Oracle HTTP ${res.status}`);
  }
  return res.json();
}
