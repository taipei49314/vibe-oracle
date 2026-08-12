/** Exported strings for honesty / disclaimer (server tests may snapshot). */

export const CONFIDENCE_LABEL = (n: number) =>
  `Vibe intensity · theatrical · ${n}`;

export const MODE_BANNER = {
  live: "Live oracle",
  demo: "Demo mode — offline script, not live model",
  refused: "Boundary reading — this topic needs a human, not an oracle",
} as const;

export const DEMO_BUILD_BANNER = "Demo build";

export const AGE_NOTICE =
  "VibeOracle is entertainment for adults (18+). Not medical, legal, financial, or crisis care.";

export const CRISIS_FOOTER =
  "If you are in crisis, contact local emergency services. International resources: https://www.iasp.info/suicidalthoughts/";

export const FOOTER_DISCLAIMER =
  "Pure vibe · not evidence · confidence is theatrical · not medical, legal, or investment advice";

export const SHARE_SUFFIX =
  "via VibeOracle (pure vibe, not evidence; theatrical score only)";

/** Sharp product one-liner (also used in README positioning). */
export const TAGLINE =
  "Most AI oracles cosplay certainty. VibeOracle admits the theater — then still gives you a card.";

export const LANDING_KICKER = "Pure vibe · not evidence";

export const LANDING_SUBHEAD =
  "One mood in. Three ritual cards. Thin local engines stamp facts. An LLM (or offline demo) returns an archetype, three moves, a weekly taboo, and a share card — with confidence that is proudly theatrical.";

export const LANDING_TITLE_LINE2 = "A destiny costume out.";

export const LANDING_PILLARS: [string, string][] = [
  ["Ritual", "Past · present · horizon emotion cards — deterministic draw from seed."],
  ["Thin engines", "Day-seed, weekday, hexagram, lunar — local facts, zero network."],
  ["Honest theater", "mode: live | demo | refused. No silent fake. Share PNG included."],
];
