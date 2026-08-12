/**
 * Thin lunar-phase engine — local deterministic calendar theater.
 * Phase math adapted from public-domain astronomical approximations
 * (no network; not an ephemeris product).
 *
 * Harvest spirit: open almanac / calendar engines listed in docs/parts-registry.md
 */

export type LunarFact = {
  kind: "lunar_phase";
  date: string;
  /** 0..1 fraction through synodic month */
  phase: number;
  name: string;
  illumination: number; // 0..1 approximate
  counsel: string;
};

const SYNODIC = 29.530588853;
/** Known new moon reference (UTC): 2000-01-06 18:14 */
const REF_JD = 2451550.1;

function julianDayUTC(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  // Meeus-style civil → JD at 12:00 UTC for day stamp theater
  let year = y;
  let month = m;
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return (
    Math.floor(365.25 * (year + 4716)) +
    Math.floor(30.6001 * (month + 1)) +
    d +
    B -
    1524.5
  );
}

const PHASES: { max: number; name: string; counsel: string }[] = [
  {
    max: 0.03,
    name: "New Moon",
    counsel: "Plant one intention smaller than your fear of starting.",
  },
  {
    max: 0.22,
    name: "Waxing Crescent",
    counsel: "Add one visible inch to the work — light is compounding.",
  },
  {
    max: 0.28,
    name: "First Quarter",
    counsel: "Choose a side of the conflict; half-light is still a decision.",
  },
  {
    max: 0.47,
    name: "Waxing Gibbous",
    counsel: "Refine, don't restart. The shape is almost honest.",
  },
  {
    max: 0.53,
    name: "Full Moon",
    counsel: "Show the receipt. Full light wants evidence of effort, not vibes alone.",
  },
  {
    max: 0.72,
    name: "Waning Gibbous",
    counsel: "Teach or document one thing you already know how to finish.",
  },
  {
    max: 0.78,
    name: "Last Quarter",
    counsel: "Release one loop that is rent without return.",
  },
  {
    max: 0.97,
    name: "Waning Crescent",
    counsel: "Rest is infrastructure. Schedule recovery before the next new start.",
  },
  {
    max: 1.01,
    name: "New Moon",
    counsel: "Plant one intention smaller than your fear of starting.",
  },
];

/** ISO date YYYY-MM-DD → lunar phase fact (deterministic). */
export function lunarPhase(isoDate?: string): LunarFact {
  const date =
    isoDate && /^\d{4}-\d{2}-\d{2}$/.test(isoDate)
      ? isoDate
      : new Date().toISOString().slice(0, 10);
  const jd = julianDayUTC(date);
  let phase = ((jd - REF_JD) / SYNODIC) % 1;
  if (phase < 0) phase += 1;
  // illumination rough: 0 at new, 1 at full
  const illumination = 0.5 * (1 - Math.cos(2 * Math.PI * phase));
  const row = PHASES.find((p) => phase <= p.max) ?? PHASES[PHASES.length - 1]!;
  return {
    kind: "lunar_phase",
    date,
    phase: Math.round(phase * 1000) / 1000,
    name: row.name,
    illumination: Math.round(illumination * 1000) / 1000,
    counsel: row.counsel,
  };
}
