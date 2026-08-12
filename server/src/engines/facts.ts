import type { DrawnCard } from "./deck.js";
import { runAllEngines, type EngineFact } from "./registry.js";

/** Structured facts for the LLM — engines write, oracle narrates. */
export type OracleFact = EngineFact;

export function buildFacts(
  mood: string,
  cards: DrawnCard[],
  date: string,
  seed: string
): OracleFact[] {
  return runAllEngines({
    mood,
    cards,
    date,
    seed,
  });
}
