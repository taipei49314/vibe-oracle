import OpenAI from "openai";
import { z } from "zod";
import { drawCards } from "./engines/deck.js";
import { daySeed } from "./engines/dayseed.js";
import { buildFacts } from "./engines/facts.js";
import {
  ORACLE_SYSTEM,
  buildUserPrompt,
  demoReport,
  type OracleReport,
} from "./prompts/oracle.js";

export const ReportSchema = z.object({
  archetype: z.object({
    name: z.string().min(2),
    tagline: z.string().min(2),
  }),
  actions: z.tuple([z.string(), z.string(), z.string()]),
  taboo: z.string().min(2),
  report: z.string().min(40),
  confidenceTheater: z.number().int().min(88).max(99),
  shareLine: z.string().min(2),
});

export type OracleRequest = {
  mood: string;
  seed?: string;
  drawCount?: number;
  date?: string;
};

export type OracleResponse = {
  mode: "live" | "demo";
  seed: string;
  ritual: ReturnType<typeof drawCards>;
  facts: ReturnType<typeof buildFacts>;
  report: OracleReport;
};

export function resolveSeed(mood: string, seed?: string, now = new Date()): string {
  if (seed && seed.trim()) return seed.trim();
  const day = now.toISOString().slice(0, 10);
  return `${day}::${mood.trim().slice(0, 80)}`;
}

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

async function callLlm(mood: string, facts: ReturnType<typeof buildFacts>): Promise<OracleReport> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error("NO_KEY");
  }

  const client = new OpenAI({
    apiKey,
    baseURL: process.env.XAI_BASE_URL || "https://api.x.ai/v1",
  });
  const model = process.env.XAI_MODEL || "grok-4.5";

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.9,
    messages: [
      { role: "system", content: ORACLE_SYSTEM },
      { role: "user", content: buildUserPrompt(mood, facts) },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("Empty model response");
  return ReportSchema.parse(extractJson(content));
}

/**
 * Demo only when there is no API key (and ALLOW_DEMO_WITHOUT_KEY).
 * If a key exists and the model fails, surface the error - do not silently fake success.
 */
export async function runOracle(input: OracleRequest): Promise<OracleResponse> {
  const mood = input.mood?.trim();
  if (!mood || mood.length < 3) {
    throw new Error("MOOD_REQUIRED");
  }

  const seed = resolveSeed(mood, input.seed);
  const ritual = drawCards(seed, input.drawCount ?? 3);
  const day = daySeed(input.date);
  const facts = buildFacts(mood, ritual, day);

  const allowDemo = (process.env.ALLOW_DEMO_WITHOUT_KEY ?? "true") !== "false";
  const hasKey = Boolean(process.env.XAI_API_KEY);

  if (!hasKey) {
    if (!allowDemo) {
      throw new Error("NO_KEY");
    }
    return {
      mode: "demo",
      seed,
      ritual,
      facts,
      report: demoReport(mood, facts),
    };
  }

  const report = await callLlm(mood, facts);
  return { mode: "live", seed, ritual, facts, report };
}
