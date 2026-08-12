/**
 * Thin I Ching–shaped engine (public-domain hexagram structure).
 * Deterministic from seed — no network, no LLM, original counsel copy.
 */

import { hashSeed } from "./deck.js";

export type HexagramFact = {
  kind: "hexagram";
  number: number; // 1..64
  name: string;
  pinyin: string;
  binary: string; // 6 bits bottom→top, 0 yin 1 yang
  judgment: string;
  counsel: string;
  changingLines: number[]; // 1..6 bottom-up, empty if stable
};

/** King Wen order short names (traditional structure, public domain). */
const NAMES: { name: string; pinyin: string }[] = [
  { name: "The Creative", pinyin: "Qián" },
  { name: "The Receptive", pinyin: "Kūn" },
  { name: "Difficulty at the Beginning", pinyin: "Zhūn" },
  { name: "Youthful Folly", pinyin: "Méng" },
  { name: "Waiting", pinyin: "Xū" },
  { name: "Conflict", pinyin: "Sòng" },
  { name: "The Army", pinyin: "Shī" },
  { name: "Holding Together", pinyin: "Bǐ" },
  { name: "Small Taming", pinyin: "Xiǎo Chù" },
  { name: "Treading", pinyin: "Lǚ" },
  { name: "Peace", pinyin: "Tài" },
  { name: "Standstill", pinyin: "Pǐ" },
  { name: "Fellowship", pinyin: "Tóng Rén" },
  { name: "Great Possession", pinyin: "Dà Yǒu" },
  { name: "Modesty", pinyin: "Qiān" },
  { name: "Enthusiasm", pinyin: "Yù" },
  { name: "Following", pinyin: "Suí" },
  { name: "Work on the Decayed", pinyin: "Gǔ" },
  { name: "Approach", pinyin: "Lín" },
  { name: "Contemplation", pinyin: "Guān" },
  { name: "Biting Through", pinyin: "Shì Kè" },
  { name: "Grace", pinyin: "Bì" },
  { name: "Splitting Apart", pinyin: "Bō" },
  { name: "Return", pinyin: "Fù" },
  { name: "Innocence", pinyin: "Wú Wàng" },
  { name: "Great Taming", pinyin: "Dà Chù" },
  { name: "Mouth Corners", pinyin: "Yí" },
  { name: "Great Excess", pinyin: "Dà Guò" },
  { name: "The Abysmal", pinyin: "Kǎn" },
  { name: "The Clinging", pinyin: "Lí" },
  { name: "Influence", pinyin: "Xián" },
  { name: "Duration", pinyin: "Héng" },
  { name: "Retreat", pinyin: "Dùn" },
  { name: "Great Power", pinyin: "Dà Zhuàng" },
  { name: "Progress", pinyin: "Jìn" },
  { name: "Darkening of the Light", pinyin: "Míng Yí" },
  { name: "The Family", pinyin: "Jiā Rén" },
  { name: "Opposition", pinyin: "Kuí" },
  { name: "Obstruction", pinyin: "Jiǎn" },
  { name: "Deliverance", pinyin: "Xiè" },
  { name: "Decrease", pinyin: "Sǔn" },
  { name: "Increase", pinyin: "Yì" },
  { name: "Breakthrough", pinyin: "Guài" },
  { name: "Coming to Meet", pinyin: "Gòu" },
  { name: "Gathering", pinyin: "Cuì" },
  { name: "Pushing Upward", pinyin: "Shēng" },
  { name: "Oppression", pinyin: "Kùn" },
  { name: "The Well", pinyin: "Jǐng" },
  { name: "Revolution", pinyin: "Gé" },
  { name: "The Cauldron", pinyin: "Dǐng" },
  { name: "The Arousing", pinyin: "Zhèn" },
  { name: "Keeping Still", pinyin: "Gèn" },
  { name: "Development", pinyin: "Jiàn" },
  { name: "The Marrying Maiden", pinyin: "Guī Mèi" },
  { name: "Abundance", pinyin: "Fēng" },
  { name: "The Wanderer", pinyin: "Lǚ" },
  { name: "The Gentle", pinyin: "Xùn" },
  { name: "The Joyous", pinyin: "Duì" },
  { name: "Dispersion", pinyin: "Huàn" },
  { name: "Limitation", pinyin: "Jié" },
  { name: "Inner Truth", pinyin: "Zhōng Fú" },
  { name: "Small Exceeding", pinyin: "Xiǎo Guò" },
  { name: "After Completion", pinyin: "Jì Jì" },
  { name: "Before Completion", pinyin: "Wèi Jì" },
];

/** Short theatrical judgments (original vibe copy, not classical translation). */
const JUDGMENTS: string[] = [
  "Heaven moves without apology — begin as if the map already trusts you.",
  "Earth holds. Capacity is power; absorption is strategy.",
  "Birth is messy. Protect the fragile first move.",
  "Not-knowing is a teacher if you stop performing certainty.",
  "Wait with posture, not paralysis.",
  "Conflict clarifies what you will not trade.",
  "Organize the scattered into one direction.",
  "Belonging is a pact — choose your circle on purpose.",
  "Small restraints compound into safety.",
  "Walk the line; elegance is a form of courage.",
  "Flow opens — use the window before it freezes.",
  "Blocked roads are data. Do not force theater.",
  "Find the people who share the real project.",
  "You already hold more than you catalog.",
  "Lower the crown; raise the work.",
  "Enthusiasm needs a vessel or it spills.",
  "Follow what is alive, not what is loud.",
  "Repair the rot before you decorate.",
  "Approach carefully — influence is mutual.",
  "See the whole pattern; stop polishing one tile.",
  "Bite through the obstruction cleanly.",
  "Beauty without spine is costume.",
  "What falls away was already leaving.",
  "Return is allowed. Start one loop again.",
  "Act without the story of debt.",
  "Store strength; do not spend it on display.",
  "Feed the work that feeds you.",
  "Too much beam cracks — redistribute the load.",
  "Depth is dangerous and necessary. Hold a rope.",
  "Clarity burns fog; do not stare until you blind.",
  "Influence works when both sides can move.",
  "Duration beats intensity. Keep the rhythm.",
  "Retreat is a tactic, not a personality.",
  "Power wants a worthy aim.",
  "Progress prefers daylight. Show one receipt.",
  "When light dims, protect the inner lamp.",
  "House rules shape destiny more than slogans.",
  "Opposition can be geometry, not war.",
  "Obstruction teaches alternate paths.",
  "Deliverance arrives when you drop the extra weight.",
  "Decrease the nonessential. Gain appears.",
  "Increase asks for generous precision.",
  "Breakthrough needs clean intent.",
  "What approaches may not be invited — inspect.",
  "Gather people around a real center.",
  "Rise step by step; elevators are myths.",
  "Oppression ends when you stop negotiating with it.",
  "The well is deep; draw only what you can carry.",
  "Revolution is schedule + courage, not mood.",
  "Refine the vessel; then fill it.",
  "Shock wakes the room — channel it.",
  "Stillness is an active skill.",
  "Development is gradual or it is cosplay.",
  "Premature union frays. Timing is kindness.",
  "Abundance peaks; share before it spoils.",
  "The wanderer travels light and honest.",
  "Gentle persistence outlasts force.",
  "Joy without cruelty is high craft.",
  "Disperse the fog of over-identity.",
  "Limitation is a frame that enables art.",
  "Inner truth does not need a microphone.",
  "Small excess: adjust, do not abandon.",
  "After completion, vigilance or relapse.",
  "Before completion: one more honest push.",
];

const COUNSELS: string[] = [
  "Name one creative act you will finish in 48 hours.",
  "Absorb one demand without adding a new project.",
  "Stabilize the smallest viable start.",
  "Ask one beginner question out loud.",
  "Wait on the decision; prepare the tools.",
  "Write the disagreement in one calm paragraph.",
  "Assign roles to your open loops.",
  "Text the person who actually steadies you.",
  "Put one constraint on your calendar.",
  "Walk into the awkward room with manners.",
  "Use the open window for a visible ship.",
  "Stop pushing the stuck door; map side doors.",
  "Schedule collaboration, not vibes alone.",
  "Inventory assets you already own.",
  "Do the unglamorous task first.",
  "Channel excitement into one artifact.",
  "Follow the living thread; drop two dead ones.",
  "Fix the broken process before new features.",
  "Approach one relationship with clean intent.",
  "Step back and redraw the system map.",
  "Cut the knot with one decisive move.",
  "Add beauty only after structure holds.",
  "Let one expired story go without funeral.",
  "Restart the abandoned loop with a smaller done.",
  "Act from present data, not old guilt.",
  "Save energy; refuse one status game.",
  "Feed the practice that feeds the mission.",
  "Reduce scope by 30% and ship.",
  "Take one careful depth dive with a timeout.",
  "Clarify with light, then rest your eyes.",
  "Offer influence as invitation, not control.",
  "Keep the streak; skip the spectacle.",
  "Step back one square to keep the board.",
  "Apply force only to the true bottleneck.",
  "Publish a progress receipt today.",
  "Protect rest as part of the strategy.",
  "Align home logistics with ambition.",
  "Translate opposition into a design constraint.",
  "Route around the blockage once.",
  "Drop one obligation that is pure theater.",
  "Remove one subscription of attention.",
  "Increase one high-leverage habit by 10%.",
  "Name the breakthrough criteria in writing.",
  "Inspect sudden opportunities for hooks.",
  "Host a short gathering with a clear purpose.",
  "Climb one rung; ignore the whole ladder myth.",
  "Stop bargaining with the oppressive pattern.",
  "Draw one sustainable cup from the well.",
  "Change one rule that no longer earns rent.",
  "Refine the tool before filling the cauldron.",
  "Use shock to reorder priorities, not doomscroll.",
  "Practice ten minutes of deliberate stillness.",
  "Advance the long project by one inch.",
  "Delay the premature yes.",
  "Share abundance without draining the core.",
  "Travel light: one bag, one goal.",
  "Persist gently on the stubborn seam.",
  "Choose joy that does not require a victim.",
  "Dissolve a clique of old self-stories.",
  "Set one limit that protects craft.",
  "Speak the true thing to one safe person.",
  "Correct the small miss; skip the drama.",
  "After a win, install a guardrail.",
  "Before the finish line, remove one vanity task.",
];

function toBinary6(n: number): string {
  return (n & 0x3f).toString(2).padStart(6, "0");
}

/**
 * Cast hexagram from ritual seed (deterministic).
 * Optional changing lines from a second hash nibble.
 */
export function castHexagram(seed: string): HexagramFact {
  const h = hashSeed(seed || "hex");
  const idx = h % 64; // 0..63
  const number = idx + 1;
  const meta = NAMES[idx]!;
  const judgment = JUDGMENTS[idx]!;
  const counsel = COUNSELS[idx]!;
  const binary = toBinary6(h >>> 8);

  // 0–2 changing lines for theater (deterministic)
  const chRaw = (h >>> 16) % 8;
  const changingLines: number[] = [];
  for (let line = 1; line <= 6; line++) {
    if ((chRaw >> (line - 1)) & 1) {
      if (changingLines.length < 2) changingLines.push(line);
    }
  }

  return {
    kind: "hexagram",
    number,
    name: meta.name,
    pinyin: meta.pinyin,
    binary,
    judgment,
    counsel,
    changingLines,
  };
}
