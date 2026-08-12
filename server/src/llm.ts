import OpenAI from "openai";
import { loadConfig } from "./config.js";
import { ReportSchema } from "./schemas.js";
import type { OracleFact } from "./engines/facts.js";
import {
  ORACLE_SYSTEM,
  buildUserPrompt,
  type OracleReport,
} from "./prompts/oracle.js";
import {
  canarySystemAppendix,
  mintCanary,
  outputContainsCanary,
} from "./parts/canary.js";
import { guardOracleReport } from "./parts/outputGuard.js";

export function extractJson(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("Model did not return JSON");
  }
}

export class LlmError extends Error {
  constructor(
    message: string,
    public readonly code: "ORACLE_TIMEOUT" | "ORACLE_UPSTREAM" | "NO_KEY"
  ) {
    super(message);
    this.name = "LlmError";
  }
}

function isRetryable(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as {
    status?: number;
    code?: string;
    name?: string;
    message?: string;
  };
  if (e.name === "APIConnectionTimeoutError") return false; // mapped to timeout
  if (e.status === 429) return true;
  if (typeof e.status === "number" && e.status >= 500) return true;
  if (e.code === "ECONNRESET" || e.code === "ETIMEDOUT") return true;
  const msg = String(e.message || "").toLowerCase();
  if (msg.includes("timeout") && e.name?.includes("Timeout")) return false;
  if (msg.includes("network") || msg.includes("fetch failed")) return true;
  return false;
}

function isTimeout(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { name?: string; message?: string; code?: string };
  if (e.name === "APIConnectionTimeoutError") return true;
  if (e.code === "ETIMEDOUT") return true;
  const msg = String(e.message || "").toLowerCase();
  return msg.includes("timeout") || e.name?.toLowerCase().includes("timeout") === true;
}

export async function callLlm(
  mood: string,
  facts: OracleFact[]
): Promise<{ report: OracleReport; attempts: number }> {
  const cfg = loadConfig();
  if (!cfg.xaiApiKey) {
    throw new LlmError("NO_KEY", "NO_KEY");
  }

  const client = new OpenAI({
    apiKey: cfg.xaiApiKey,
    baseURL: cfg.xaiBaseUrl,
    timeout: cfg.llmTimeoutMs,
    maxRetries: 0,
  });

  const maxAttempts = 1 + Math.max(0, cfg.llmMaxRetries);
  let lastErr: unknown;
  let attempts = 0;
  const canary = mintCanary();
  const system = ORACLE_SYSTEM + canarySystemAppendix(canary);

  for (let i = 0; i < maxAttempts; i++) {
    attempts = i + 1;
    try {
      const completion = await client.chat.completions.create({
        model: cfg.xaiModel,
        temperature: cfg.llmTemperature,
        max_tokens: cfg.llmMaxTokens,
        messages: [
          { role: "system", content: system },
          { role: "user", content: buildUserPrompt(mood, facts) },
        ],
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new LlmError("Empty model response", "ORACLE_UPSTREAM");
      const report = ReportSchema.parse(extractJson(content));
      if (outputContainsCanary(report, canary)) {
        throw new LlmError("Model leaked canary", "ORACLE_UPSTREAM");
      }
      const guard = guardOracleReport(report);
      if (!guard.ok) {
        throw new LlmError(`Output blocked: ${guard.reason}`, "ORACLE_UPSTREAM");
      }
      return { report, attempts };
    } catch (err) {
      lastErr = err;
      if (err instanceof LlmError) throw err;
      if (isTimeout(err)) {
        throw new LlmError("LLM timeout", "ORACLE_TIMEOUT");
      }
      // Zod / parse errors are not retryable
      if (err && typeof err === "object" && "issues" in err) {
        throw new LlmError("Invalid model JSON shape", "ORACLE_UPSTREAM");
      }
      if (i < maxAttempts - 1 && isRetryable(err)) {
        continue;
      }
      break;
    }
  }

  if (isTimeout(lastErr)) {
    throw new LlmError("LLM timeout", "ORACLE_TIMEOUT");
  }
  throw new LlmError("Upstream LLM failed", "ORACLE_UPSTREAM");
}
