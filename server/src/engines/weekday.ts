/** Weekday tone engine — thin structured fact (calendar theater). */

export type WeekdayFact = {
  kind: "weekday_tone";
  weekday: string;
  tone: string;
  counsel: string;
};

const TABLE: Record<number, { weekday: string; tone: string; counsel: string }> =
  {
    0: {
      weekday: "Sunday",
      tone: "Horizon",
      counsel: "Name next week's one non-negotiable before midnight.",
    },
    1: {
      weekday: "Monday",
      tone: "Ignition",
      counsel: "Ship a tiny artifact before lunch — proof over plans.",
    },
    2: {
      weekday: "Tuesday",
      tone: "Build",
      counsel: "Protect one deep block; refuse two shallow meetings.",
    },
    3: {
      weekday: "Wednesday",
      tone: "Pivot",
      counsel: "Midweek audit: keep, kill, or calendar one open loop.",
    },
    4: {
      weekday: "Thursday",
      tone: "Push",
      counsel: "Make something visible to another human before Friday.",
    },
    5: {
      weekday: "Friday",
      tone: "Close",
      counsel: "Close or formally park work; do not start a new saga.",
    },
    6: {
      weekday: "Saturday",
      tone: "Restore",
      counsel: "Rest counts as infrastructure. Schedule recovery like a deploy.",
    },
  };

/** ISO date YYYY-MM-DD → weekday fact (UTC). */
export function weekdayTone(isoDate?: string): WeekdayFact {
  const date =
    isoDate && /^\d{4}-\d{2}-\d{2}$/.test(isoDate)
      ? isoDate
      : new Date().toISOString().slice(0, 10);
  const [y, m, d] = date.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const row = TABLE[dow] ?? TABLE[1]!;
  return {
    kind: "weekday_tone",
    weekday: row.weekday,
    tone: row.tone,
    counsel: row.counsel,
  };
}
