/**
 * Manual parity with server ReportSchema (keep in sync).
 * Client has no Zod dependency — lightweight validators.
 */

export type OracleMode = "live" | "demo" | "refused";

export type OracleReport = {
  archetype: { name: string; tagline: string };
  actions: [string, string, string];
  taboo: string;
  report: string;
  confidenceTheater: number;
  shareLine: string;
};

export type OracleMeta = {
  requestId: string;
  day: string;
  confidenceLabel: "theatrical";
  policy?: { category: string };
  seedIgnored?: boolean;
};

function isString(v: unknown, min: number, max: number): v is string {
  return typeof v === "string" && v.length >= min && v.length <= max;
}

export function safeParseReport(data: unknown): {
  success: boolean;
  data?: OracleReport;
  error?: string;
} {
  if (!data || typeof data !== "object") {
    return { success: false, error: "report not object" };
  }
  const r = data as Record<string, unknown>;
  const arch = r.archetype as Record<string, unknown> | undefined;
  if (!arch || typeof arch !== "object") {
    return { success: false, error: "archetype" };
  }
  if (!isString(arch.name, 2, 80) || !isString(arch.tagline, 2, 160)) {
    return { success: false, error: "archetype fields" };
  }
  if (!Array.isArray(r.actions) || r.actions.length !== 3) {
    return { success: false, error: "actions" };
  }
  for (const a of r.actions) {
    if (!isString(a, 2, 240)) return { success: false, error: "action len" };
  }
  if (!isString(r.taboo, 2, 240)) return { success: false, error: "taboo" };
  if (!isString(r.report, 40, 2500)) return { success: false, error: "report" };
  if (!isString(r.shareLine, 2, 120)) return { success: false, error: "shareLine" };
  const conf = r.confidenceTheater;
  if (typeof conf !== "number" || !Number.isInteger(conf) || conf < 72 || conf > 92) {
    return { success: false, error: "confidenceTheater" };
  }
  return {
    success: true,
    data: {
      archetype: { name: arch.name, tagline: arch.tagline },
      actions: r.actions as [string, string, string],
      taboo: r.taboo,
      report: r.report,
      confidenceTheater: conf,
      shareLine: r.shareLine,
    },
  };
}

export function safeParseOracleResponse(data: unknown): {
  success: boolean;
  data?: {
    mode: OracleMode;
    seed: string;
    ritual: unknown[];
    facts: unknown[];
    report: OracleReport;
    meta: OracleMeta;
  };
  error?: string;
} {
  if (!data || typeof data !== "object") {
    return { success: false, error: "body" };
  }
  const b = data as Record<string, unknown>;
  if (b.mode !== "live" && b.mode !== "demo" && b.mode !== "refused") {
    return { success: false, error: "mode" };
  }
  if (typeof b.seed !== "string") return { success: false, error: "seed" };
  if (!Array.isArray(b.ritual) || !Array.isArray(b.facts)) {
    return { success: false, error: "ritual/facts" };
  }
  const rep = safeParseReport(b.report);
  if (!rep.success || !rep.data) {
    return { success: false, error: rep.error || "report" };
  }
  const meta = b.meta as Record<string, unknown> | undefined;
  if (!meta || typeof meta !== "object") {
    return { success: false, error: "meta" };
  }
  if (typeof meta.requestId !== "string" || typeof meta.day !== "string") {
    return { success: false, error: "meta fields" };
  }
  if (meta.confidenceLabel !== "theatrical") {
    return { success: false, error: "confidenceLabel" };
  }
  return {
    success: true,
    data: {
      mode: b.mode,
      seed: b.seed,
      ritual: b.ritual,
      facts: b.facts,
      report: rep.data,
      meta: meta as unknown as OracleMeta,
    },
  };
}
