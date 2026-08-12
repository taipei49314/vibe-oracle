/**
 * Pluggable thin-engine registry.
 * Engines only stamp structured facts — never call LLMs or networks.
 */

import type { DrawnCard } from "./deck.js";
import { daySeed, type DaySeedFact } from "./dayseed.js";
import { weekdayTone, type WeekdayFact } from "./weekday.js";
import { castHexagram, type HexagramFact } from "./hexagram.js";
import { lunarPhase, type LunarFact } from "./lunar.js";

export type EngineContext = {
  mood: string;
  seed: string;
  cards: DrawnCard[];
  /** Resolved calendar day YYYY-MM-DD */
  date: string;
};

export type EngineFact =
  | DaySeedFact
  | WeekdayFact
  | HexagramFact
  | LunarFact
  | {
      kind: "ritual_card";
      id: string;
      name: string;
      position: string;
      orientation: string;
      reading: string;
      keywords: string[];
    }
  | {
      kind: "mood_echo";
      text: string;
      wordCount: number;
    }
  | {
      kind: string;
      [key: string]: unknown;
    };

export type ThinEngine = {
  id: string;
  description: string;
  run: (ctx: EngineContext) => EngineFact[];
};

const engines: ThinEngine[] = [];

export function registerEngine(engine: ThinEngine): void {
  if (engines.some((e) => e.id === engine.id)) {
    throw new Error(`Engine already registered: ${engine.id}`);
  }
  engines.push(engine);
}

export function listEngines(): readonly ThinEngine[] {
  return engines;
}

export function runAllEngines(ctx: EngineContext): EngineFact[] {
  return engines.flatMap((e) => e.run(ctx));
}

/** Built-in engines — call once at module load. */
export function registerBuiltinEngines(): void {
  if (engines.length > 0) return;

  registerEngine({
    id: "mood_echo",
    description: "Echo normalized mood into facts",
    run: (ctx) => [
      {
        kind: "mood_echo",
        text: ctx.mood.trim(),
        wordCount: ctx.mood.trim().split(/\s+/).filter(Boolean).length,
      },
    ],
  });

  registerEngine({
    id: "day_seed",
    description: "Digit-root day seed (1–9 tone)",
    run: (ctx) => [daySeed(ctx.date)],
  });

  registerEngine({
    id: "weekday_tone",
    description: "UTC weekday counsel",
    run: (ctx) => [weekdayTone(ctx.date)],
  });

  registerEngine({
    id: "ritual_deck",
    description: "Drawn ritual cards as facts",
    run: (ctx) =>
      ctx.cards.map((c) => ({
        kind: "ritual_card" as const,
        id: c.id,
        name: c.name,
        position: c.position,
        orientation: c.orientation,
        reading: c.reading,
        keywords: c.keywords,
      })),
  });

  registerEngine({
    id: "hexagram",
    description: "I Ching–shaped hexagram cast from seed (local, deterministic)",
    run: (ctx) => [castHexagram(ctx.seed)],
  });

  registerEngine({
    id: "lunar_phase",
    description: "Approximate lunar phase from UTC date (local almanac theater)",
    run: (ctx) => [lunarPhase(ctx.date)],
  });
}

registerBuiltinEngines();
