/** Day-seed engine - tiny structured fact, mingyu-shaped (not mingyu code). */

export type DaySeedFact = {
  kind: "day_seed";
  date: string;
  number: number; // 1..9
  tone: string;
  counsel: string;
};

const TONES: Record<number, { tone: string; counsel: string }> = {
  1: {
    tone: "Initiation",
    counsel: "Name the smallest first move and do only that.",
  },
  2: {
    tone: "Pairing",
    counsel: "Two threads max. Partnership beats isolation today.",
  },
  3: {
    tone: "Expression",
    counsel: "Say the thing out loud before it becomes a myth.",
  },
  4: {
    tone: "Foundation",
    counsel: "Boring structure is glamorous when it compounds.",
  },
  5: {
    tone: "Voltage",
    counsel: "Change one variable; don't rewire the whole life.",
  },
  6: {
    tone: "Care",
    counsel: "Tend the system that tends you - rest counts as work.",
  },
  7: {
    tone: "Audit",
    counsel: "Cut one story that is no longer earning its keep.",
  },
  8: {
    tone: "Power",
    counsel: "Ship a visible artifact; power wants receipts.",
  },
  9: {
    tone: "Closure",
    counsel: "Finish or formally release. Open loops are rent.",
  },
};

export function digitRoot(n: number): number {
  let x = Math.abs(n);
  while (x > 9) {
    x = String(x)
      .split("")
      .reduce((a, d) => a + Number(d), 0);
  }
  return x === 0 ? 9 : x;
}

/** Build day seed from ISO date (YYYY-MM-DD) or now (UTC date). */
export function daySeed(isoDate?: string): DaySeedFact {
  const date =
    isoDate && /^\d{4}-\d{2}-\d{2}$/.test(isoDate)
      ? isoDate
      : new Date().toISOString().slice(0, 10);
  const [y, m, d] = date.split("-").map(Number);
  const number = digitRoot(y + m + d);
  const meta = TONES[number] ?? TONES[1];
  return {
    kind: "day_seed",
    date,
    number,
    tone: meta.tone,
    counsel: meta.counsel,
  };
}
