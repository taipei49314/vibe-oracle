import type { OracleFact } from "../engines/facts.js";
import type { OracleReport } from "../prompts/oracle.js";
import type { PolicyCategory } from "./contentPolicy.js";
import { CONFIDENCE_MIN } from "../schemas.js";

const IASP = "https://www.iasp.info/suicidalthoughts/";

const TITLES: Record<PolicyCategory, { name: string; tagline: string }> = {
  crisis: {
    name: "Boundary Keeper",
    tagline: "This weather needs a human, not a theater card.",
  },
  medical: {
    name: "Boundary Keeper",
    tagline: "Health questions belong to clinicians, not oracles.",
  },
  legal: {
    name: "Boundary Keeper",
    tagline: "Law is not a vibe. Find counsel, not a card draw.",
  },
  investment: {
    name: "Boundary Keeper",
    tagline: "No guaranteed tickers live here — only theater.",
  },
  injection: {
    name: "Boundary Keeper",
    tagline: "The ritual will not step outside its stage.",
  },
  csam: {
    name: "Boundary Keeper",
    tagline: "This topic is closed. Permanently.",
  },
};

export function refuseReport(
  category: PolicyCategory,
  _mood: string,
  facts: OracleFact[]
): OracleReport {
  const title = TITLES[category] ?? TITLES.injection;
  const cards = facts.filter((f) => f.kind === "ritual_card") as Extract<
    OracleFact,
    { kind: "ritual_card" }
  >[];
  const lead = cards[0]?.name ?? "The Threshold";

  if (category === "crisis") {
    return {
      archetype: title,
      actions: [
        "If you are in immediate danger, contact local emergency services now.",
        `Visit IASP resources for localized support: ${IASP}`,
        "Tell one trusted person you are not okay — specificity beats silence.",
      ],
      taboo:
        "Do not treat this oracle as crisis counseling, diagnosis, or a safety plan.",
      report: `You asked for a reading, and the deck answered with a closed gate. Card ${lead} is not a diagnosis; VibeOracle is entertainment theater, not care. If you are in crisis or thinking about harming yourself, please reach real humans — emergency services if you are in danger, and international resources via ${IASP}. You deserve support that can stay with you. The oracle steps aside.`,
      confidenceTheater: CONFIDENCE_MIN,
      shareLine: "Boundary Keeper — humans over oracles in crisis.",
    };
  }

  if (category === "medical") {
    return {
      archetype: title,
      actions: [
        "Book a licensed clinician for diagnosis or medication questions.",
        "Write one non-medical self-care move you control this week (sleep, walk, meal).",
        "Park research spirals behind a 24-hour cool-off before acting on random web tips.",
      ],
      taboo:
        "Do not take medical dosing or diagnostic advice from an entertainment oracle.",
      report: `The ritual pulled ${lead}, then stopped. VibeOracle will not diagnose, prescribe, or dose. That is not caution theater — it is a hard boundary. Your body is not a prompt. Take health questions to qualified professionals; keep this app for mood weather and weekly taboos only.`,
      confidenceTheater: CONFIDENCE_MIN,
      shareLine: "Boundary Keeper — clinicians, not cards.",
    };
  }

  if (category === "legal") {
    return {
      archetype: title,
      actions: [
        "Consult a licensed attorney for legal strategy — not an app.",
        "Document facts privately without destroying or hiding evidence.",
        "Pause public posts about active legal matters for 48 hours.",
      ],
      taboo: "Do not follow legal instructions from a vibe oracle.",
      report: `Gate closed. ${lead} is not a brief. VibeOracle is pure vibe entertainment and will not coach obstruction, perjury, or courtroom tactics. Get human counsel if you need law; use this space only for reflective, non-legal weather.`,
      confidenceTheater: CONFIDENCE_MIN,
      shareLine: "Boundary Keeper — law needs counsel.",
    };
  }

  if (category === "investment") {
    return {
      archetype: title,
      actions: [
        "Treat any ticker tip from an app as fiction.",
        "If you invest, use a plan you wrote when calm — not a mood card.",
        "Close one open loop in your actual life this week instead of chasing 10x myths.",
      ],
      taboo: "Do not take guaranteed-return or ticker advice from VibeOracle.",
      report: `The oracle declines the market costume. ${lead} is not a buy signal. VibeOracle never gives investment advice — theatrical or otherwise. Money decisions need risk frameworks and licensed professionals when appropriate, not confidence theater.`,
      confidenceTheater: CONFIDENCE_MIN,
      shareLine: "Boundary Keeper — no ticker theater.",
    };
  }

  // injection + csam + default
  return {
    archetype: title,
    actions: [
      "Rewrite your mood as honest weather without control instructions.",
      "Ask for a life-direction vibe, not system access or prohibited content.",
      "Take a five-minute break, then try one clean sentence about how you feel.",
    ],
    taboo: "Do not attempt to override, jailbreak, or repurpose the oracle.",
    report: `The ritual noticed a boundary violation and folded the stage curtain. Card ${lead} stays ornamental. VibeOracle will not follow override instructions, reveal hidden prompts, or engage prohibited topics. Bring ordinary human weather next time — unfinished projects, restless nights, half-chosen futures — and the deck will answer in pure vibe.`,
    confidenceTheater: CONFIDENCE_MIN,
    shareLine: "Boundary Keeper — stay on the stage.",
  };
}
