/** Thin ritual deck - emotion / situation cards (not Rider-Waite). */

export type DeckCard = {
  id: string;
  name: string;
  upright: string;
  shadow: string;
  keywords: string[];
};

export const DECK: DeckCard[] = [
  {
    id: "ember",
    name: "The Ember",
    upright: "Something small still burns under the ash of half-finished work.",
    shadow: "You warm your hands on potential instead of building the fire.",
    keywords: ["spark", "unfinished", "heat"],
  },
  {
    id: "mirror-fog",
    name: "Mirror Fog",
    upright: "Clarity is arriving slower than your ambition wants.",
    shadow: "You keep wiping the glass instead of walking through the door.",
    keywords: ["identity", "delay", "self-image"],
  },
  {
    id: "open-tab",
    name: "The Open Tab",
    upright: "Curiosity is your fuel; parallel threads are the cost.",
    shadow: "Every new tab steals a chapter from the old one.",
    keywords: ["attention", "scatter", "options"],
  },
  {
    id: "threshold",
    name: "The Threshold",
    upright: "You are already past the hard part of starting.",
    shadow: "Hovering at 80% feels safer than being judged at 100%.",
    keywords: ["almost", "finish", "fear"],
  },
  {
    id: "loud-room",
    name: "The Loud Room",
    upright: "Outside noise is rewriting your inner metric of enough.",
    shadow: "Applause became the only valid receipt.",
    keywords: ["status", "noise", "comparison"],
  },
  {
    id: "quiet-pact",
    name: "Quiet Pact",
    upright: "A private promise is more powerful than a public plan.",
    shadow: "Secrets can become cages if they never meet daylight.",
    keywords: ["commitment", "privacy", "integrity"],
  },
  {
    id: "second-wind",
    name: "Second Wind",
    upright: "Energy returns when the story gets specific.",
    shadow: "Waiting for motivation is a luxury tax on unfinished work.",
    keywords: ["momentum", "body", "return"],
  },
  {
    id: "golden-loop",
    name: "Golden Loop",
    upright: "A tiny closed loop beats a grand unfinished arc.",
    shadow: "Perfectionism dressed up as craft.",
    keywords: ["ship", "loop", "craft"],
  },
  {
    id: "night-market",
    name: "Night Market",
    upright: "Desire is loud after dark; choose which stall is actually yours.",
    shadow: "Sampling forever is still not choosing.",
    keywords: ["desire", "choice", "night"],
  },
  {
    id: "compass-crack",
    name: "Cracked Compass",
    upright: "Your old north is wrong for this season - that is data, not failure.",
    shadow: "Clinging to a broken direction feels like loyalty.",
    keywords: ["direction", "season", "update"],
  },
  {
    id: "soft-armor",
    name: "Soft Armor",
    upright: "Tenderness is a strategy, not a weakness.",
    shadow: "Over-protecting the work keeps it from meeting the world.",
    keywords: ["care", "defense", "exposure"],
  },
  {
    id: "signal-flare",
    name: "Signal Flare",
    upright: "One clear ask can reorganize the whole map.",
    shadow: "Hinting is not communicating.",
    keywords: ["ask", "clarity", "signal"],
  },
  // Wave-2 expansion (original copy — arcana-shaped, not Rider-Waite)
  {
    id: "paper-bridge",
    name: "Paper Bridge",
    upright: "A fragile plan still crosses the river if you walk lightly.",
    shadow: "You keep redrawing the bridge instead of taking a step.",
    keywords: ["plan", "risk", "crossing"],
  },
  {
    id: "echo-chamber",
    name: "Echo Chamber",
    upright: "Your own voice is trying to reach you through the noise.",
    shadow: "Agreement is not the same as truth.",
    keywords: ["feedback", "bias", "voice"],
  },
  {
    id: "empty-inbox",
    name: "Empty Inbox",
    upright: "Clear space is a decision, not an accident.",
    shadow: "Zero messages can still mean full avoidance.",
    keywords: ["space", "focus", "reset"],
  },
  {
    id: "borrowed-crown",
    name: "Borrowed Crown",
    upright: "Authority you practice becomes authority you own.",
    shadow: "You are wearing someone else's metric of success.",
    keywords: ["status", "identity", "power"],
  },
  {
    id: "slow-river",
    name: "Slow River",
    upright: "Depth arrives when you stop thrashing the surface.",
    shadow: "Patience without motion is just waiting in costume.",
    keywords: ["pace", "depth", "patience"],
  },
  {
    id: "glass-elevator",
    name: "Glass Elevator",
    upright: "Visibility is coming whether you style it or not.",
    shadow: "You hide progress until the moment of judgment.",
    keywords: ["visibility", "expose", "rise"],
  },
  {
    id: "midnight-workshop",
    name: "Midnight Workshop",
    upright: "Quiet hours are where real craft hides.",
    shadow: "Night work without rest is a glamorous leak.",
    keywords: ["craft", "night", "labor"],
  },
  {
    id: "two-keys",
    name: "Two Keys",
    upright: "Access is a relationship, not a hack.",
    shadow: "You collect keys to doors you never open.",
    keywords: ["access", "trust", "choice"],
  },
  {
    id: "weather-vane",
    name: "Weather Vane",
    upright: "You can turn without losing the tower.",
    shadow: "Spinning with every gust is not adaptation.",
    keywords: ["adapt", "direction", "wind"],
  },
  {
    id: "sealed-letter",
    name: "Sealed Letter",
    upright: "Words waiting to be sent still shape the room.",
    shadow: "Unsent truth becomes a second personality.",
    keywords: ["message", "truth", "delay"],
  },
  {
    id: "green-wire",
    name: "Green Wire",
    upright: "The fix is small and exact — not a rebuild.",
    shadow: "You keep cutting the red wire of drama instead.",
    keywords: ["fix", "precision", "repair"],
  },
  {
    id: "last-train",
    name: "Last Train",
    upright: "A closing door is still a door if you move now.",
    shadow: "Romanticizing missed trains is still missing them.",
    keywords: ["timing", "urgency", "depart"],
  },
];

export function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mulberry32 - fine for ritual theater, not cryptography. */
export function mulberry32(a: number) {
  return function next() {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type DrawnCard = DeckCard & {
  orientation: "upright" | "shadow";
  position: "past" | "present" | "horizon";
  reading: string;
};

const POSITIONS: DrawnCard["position"][] = ["past", "present", "horizon"];

export function drawCards(seed: string, count = 3): DrawnCard[] {
  const n = Math.min(Math.max(count, 1), 3);
  const rand = mulberry32(hashSeed(seed || "vibe"));
  const pool = [...DECK];
  const drawn: DrawnCard[] = [];

  for (let i = 0; i < n; i++) {
    const idx = Math.floor(rand() * pool.length);
    const card = pool.splice(idx, 1)[0];
    const orientation: DrawnCard["orientation"] =
      rand() > 0.45 ? "upright" : "shadow";
    const position = POSITIONS[i] ?? "horizon";
    drawn.push({
      ...card,
      orientation,
      position,
      reading: orientation === "upright" ? card.upright : card.shadow,
    });
  }
  return drawn;
}
