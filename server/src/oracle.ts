import { drawCards } from "./engines/deck.js";
import { daySeed } from "./engines/dayseed.js";
import { buildFacts } from "./engines/facts.js";
import {
  demoReport,
  type OracleReport,
} from "./prompts/oracle.js";
import { loadConfig } from "./config.js";
import { callLlm, extractJson, LlmError } from "./llm.js";
import { evaluateContentPolicy } from "./policy/contentPolicy.js";
import { refuseReport } from "./policy/refuseReport.js";
import { ReportSchema } from "./schemas.js";
import { moodCodePointLength } from "./schemas.js";
import { acquireLiveBudget } from "./middleware/rateLimit.js";

export { ReportSchema, extractJson, LlmError };

export type OracleRequest = {
  mood: string;
  seed?: string;
  drawCount?: number;
  date?: string;
};

export type OracleMeta = {
  requestId: string;
  day: string;
  confidenceLabel: "theatrical";
  policy?: { category: string };
  seedIgnored?: boolean;
};

export type OracleResponse = {
  mode: "live" | "demo" | "refused";
  seed: string;
  ritual: ReturnType<typeof drawCards>;
  facts: ReturnType<typeof buildFacts>;
  report: OracleReport;
  meta: OracleMeta;
};

export function resolveSeed(
  mood: string,
  seed: string | undefined,
  now = new Date(),
  allowClientSeed = loadConfig().allowClientSeed
): { seed: string; seedIgnored: boolean } {
  if (allowClientSeed && seed?.trim()) {
    return { seed: seed.trim().slice(0, 64), seedIgnored: false };
  }
  const day = now.toISOString().slice(0, 10);
  return {
    seed: `${day}::${mood.slice(0, 80)}`,
    seedIgnored: Boolean(seed?.trim()),
  };
}

export function resolveDay(
  date: string | undefined,
  allowClientDate = loadConfig().allowClientDate
): { date: string | undefined; dateIgnored: boolean } {
  if (allowClientDate && date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { date, dateIgnored: false };
  }
  return {
    date: undefined,
    dateIgnored: Boolean(date && /^\d{4}-\d{2}-\d{2}$/.test(date)),
  };
}

export type RunOracleOptions = {
  requestId: string;
  /** Client IP for live budget (after policy allow only). */
  ip?: string;
  now?: Date;
};

export class RateLimitedError extends Error {
  constructor(public readonly retryAfterSec: number) {
    super("RATE_LIMITED");
    this.name = "RateLimitedError";
  }
}

/**
 * Policy runs before any live budget charge.
 * Live IP + global + in-flight budgets apply only when calling the LLM.
 */
export async function runOracle(
  input: OracleRequest,
  options: RunOracleOptions
): Promise<OracleResponse> {
  const cfg = loadConfig();
  const mood = input.mood;
  if (!mood || moodCodePointLength(mood) < cfg.moodMinChars) {
    throw new Error("MOOD_REQUIRED");
  }

  const now = options.now ?? new Date();
  const { seed, seedIgnored } = resolveSeed(
    mood,
    input.seed,
    now,
    cfg.allowClientSeed
  );
  const { date: clientDate, dateIgnored } = resolveDay(
    input.date,
    cfg.allowClientDate
  );

  const ritual = drawCards(seed, input.drawCount ?? 3);
  const day = daySeed(clientDate);
  const facts = buildFacts(mood, ritual, day.date, seed);

  const baseMeta: OracleMeta = {
    requestId: options.requestId,
    day: day.date,
    confidenceLabel: "theatrical",
  };
  if (seedIgnored || dateIgnored) {
    baseMeta.seedIgnored = true;
  }

  // Content policy BEFORE any LLM / live budget (R5)
  const policy = evaluateContentPolicy(mood);
  if (policy.action === "refuse") {
    const report = refuseReport(policy.category, mood, facts);
    ReportSchema.parse(report);
    return {
      mode: "refused",
      seed,
      ritual,
      facts,
      report,
      meta: {
        ...baseMeta,
        policy: { category: policy.category },
      },
    };
  }

  if (cfg.publicDemo) {
    return {
      mode: "demo",
      seed,
      ritual,
      facts,
      report: demoReport(mood, facts, seed),
      meta: baseMeta,
    };
  }

  const hasKey = Boolean(cfg.xaiApiKey);

  if (!hasKey) {
    if (!cfg.allowDemoWithoutKey) {
      throw new Error("NO_KEY");
    }
    return {
      mode: "demo",
      seed,
      ritual,
      facts,
      report: demoReport(mood, facts, seed),
      meta: baseMeta,
    };
  }

  // Live path — charge live budgets only here
  const ip = options.ip || "direct-unknown";
  const budget = acquireLiveBudget(ip);
  if (!budget.ok) {
    throw new RateLimitedError(budget.retryAfterSec);
  }

  try {
    const { report } = await callLlm(mood, facts);
    return {
      mode: "live",
      seed,
      ritual,
      facts,
      report,
      meta: baseMeta,
    };
  } finally {
    budget.release();
  }
}
