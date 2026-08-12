import { z } from "zod";
import { loadConfig } from "./config.js";

/** NFC, strip C0 except tab/newline, trim. Security boundary for mood length. */
export function normalizeMood(raw: string): string {
  const stripped = [...raw.normalize("NFC")]
    .filter((ch) => {
      const c = ch.codePointAt(0)!;
      return c === 0x09 || c === 0x0a || c >= 0x20;
    })
    .join("");
  return stripped.trim();
}

export function moodCodePointLength(mood: string): number {
  return [...mood].length;
}

export function createMoodField() {
  const cfg = loadConfig();
  return z.string().transform((raw, ctx) => {
    const normalized = normalizeMood(raw);
    const cp = moodCodePointLength(normalized);
    if (cp < cfg.moodMinChars) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "MOOD_REQUIRED",
      });
      return z.NEVER;
    }
    if (cp > cfg.moodMaxChars) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "MOOD_TOO_LONG",
      });
      return z.NEVER;
    }
    return normalized;
  });
}

export function createOracleRequestSchema() {
  return z
    .object({
      mood: createMoodField(),
      seed: z.string().trim().min(1).max(64).optional(),
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional(),
      drawCount: z.literal(3).optional().default(3),
    })
    .strip();
}

/** Final theatrical range after honesty layer (PR4+). */
export const CONFIDENCE_MIN = 72;
export const CONFIDENCE_MAX = 92;

export const ReportSchema = z.object({
  archetype: z.object({
    name: z.string().min(2).max(80),
    tagline: z.string().min(2).max(160),
  }),
  actions: z.tuple([
    z.string().min(2).max(240),
    z.string().min(2).max(240),
    z.string().min(2).max(240),
  ]),
  taboo: z.string().min(2).max(240),
  report: z.string().min(40).max(2500),
  confidenceTheater: z.number().int().min(CONFIDENCE_MIN).max(CONFIDENCE_MAX),
  shareLine: z.string().min(2).max(120),
});

export type ReportSchemaType = z.infer<typeof ReportSchema>;
