import type { DrawnCard } from "./deck.js";
import type { DaySeedFact } from "./dayseed.js";

/** Structured facts for the LLM — engines write, oracle narrates. */
export type OracleFact =
  | {
      kind: "ritual_card";
      id: string;
      name: string;
      position: string;
      orientation: string;
      reading: string;
      keywords: string[];
    }
  | DaySeedFact
  | {
      kind: "mood_echo";
      text: string;
      wordCount: number;
    };

export function buildFacts(mood: string, cards: DrawnCard[], day: DaySeedFact): OracleFact[] {
  const facts: OracleFact[] = [
    {
      kind: "mood_echo",
      text: mood.trim(),
      wordCount: mood.trim().split(/\s+/).filter(Boolean).length,
    },
    day,
    ...cards.map((c) => ({
      kind: "ritual_card" as const,
      id: c.id,
      name: c.name,
      position: c.position,
      orientation: c.orientation,
      reading: c.reading,
      keywords: c.keywords,
    })),
  ];
  return facts;
}
