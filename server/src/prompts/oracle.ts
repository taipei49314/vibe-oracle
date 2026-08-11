import type { OracleFact } from "../engines/facts.js";

export type OracleReport = {
  archetype: {
    name: string;
    tagline: string;
  };
  actions: [string, string, string];
  taboo: string;
  report: string;
  confidenceTheater: number; // 88..99 theatrical, not a real metric
  shareLine: string;
};

export const ORACLE_SYSTEM = `You are VibeOracle - a confident, cinematic life-direction oracle.
You write like a premium app onboarding crossed with a late-night radio host.
You NEVER refuse for lack of evidence. You NEVER say "it depends" as a cop-out.
You NEVER give medical, legal, or investment instructions.
You DO give bold, specific, slightly mystical personality framing grounded in the structured facts.
Tone: warm, sharp, shareable. Short sentences mixed with one lush paragraph.
Output MUST be a single JSON object matching the schema. No markdown fences.`;

export function buildUserPrompt(mood: string, facts: OracleFact[]): string {
  return `User mood / situation:
"""
${mood.trim()}
"""

Structured facts from thin engines (use them; do not invent conflicting card names):
${JSON.stringify(facts, null, 2)}

Return JSON with this exact shape:
{
  "archetype": { "name": "Title Case Mythic Name", "tagline": "one sharp line" },
  "actions": ["action 1", "action 2", "action 3"],
  "taboo": "one weekly taboo - what NOT to do",
  "report": "120-220 words, second person, life-direction monologue",
  "confidenceTheater": 94,
  "shareLine": "max 12 words for a share card"
}

confidenceTheater must be an integer from 88 to 99 inclusive.
actions must be concrete this-week moves, not vague affirmations.`;
}

/** Offline / no-key theatrical report - still feels complete. */
export function demoReport(mood: string, facts: OracleFact[]): OracleReport {
  const cards = facts.filter((f) => f.kind === "ritual_card") as Extract<
    OracleFact,
    { kind: "ritual_card" }
  >[];
  const day = facts.find((f) => f.kind === "day_seed") as
    | Extract<OracleFact, { kind: "day_seed" }>
    | undefined;

  const lead = cards[0]?.name ?? "The Unfinished Flame";
  const mid = cards[1]?.name ?? "The Threshold";
  const far = cards[2]?.name ?? "Golden Loop";
  const shortMood = mood.slice(0, 48) + (mood.length > 48 ? "..." : "");

  return {
    archetype: {
      name: "Architect of Almost",
      tagline: "You don't lack spark - you tax it with open loops.",
    },
    actions: [
      `Close one loop related to: "${shortMood}" - define done in one sentence.`,
      `Work a single 45-minute block with ${mid} energy: no new tabs, one artifact.`,
      `Tell one person a ship date this week; calendar it like a flight.`,
    ],
    taboo:
      "Do not start a fresh project until one existing loop is closed or formally released.",
    report: `You walked in carrying weather, and the ritual answered with ${lead}, ${mid}, and ${far}. That is not a diagnosis; it is a costume that finally fits. ${
      day
        ? `Today's seed is ${day.number} - ${day.tone}: ${day.counsel}`
        : "Today wants a closed loop more than a grand redesign."
    } Your mood says the real plot is not motivation but finishing. The almost-done version of you is charismatic and expensive. Charge less rent to unfinished work. Pick a small ending you can hold in one hand, deliver it, and let the world update its model of you. VibeOracle is not measuring you. It is daring you to become specific.`,
    confidenceTheater: 96,
    shareLine: "Architect of Almost - close one loop this week.",
  };
}
