/**
 * Lightweight output firewall for oracle JSON reports.
 * Complements input contentPolicy — no ML, no network.
 */

const LEAK_MARKERS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /you\s+are\s+now\s+dan/i,
  /system\s+prompt\s*:/i,
  /XAI_API_KEY/i,
  /ORACLE_SYSTEM/i,
  /INTERNAL CANARY/i,
  /\[INST\]/i,
  /<<SYS>>/i,
  /internal instructions?/i,
  /hidden rules?/i,
  /VO-CANARY-/i,
];

const HARD_HARM = [
  /\b(kill\s+yourself|how\s+to\s+suicide|step[-\s]?by[-\s]?step\s+to\s+die|how\s+to\s+die|methods?\s+of\s+suicide|overdose\s+on)\b/i,
  /自杀方法|自殺方法|如何自杀|如何自殺|怎么死|怎麼死/,
  // medication instructions in model output
  /\b(take\s+\d+\s*mg|double\s+your\s+(dose|pills)|stop\s+your\s+(meds?|medication)\s+immediately)\b/i,
  /\b(guaranteed\s+\d+x|buy\s+[A-Z]{2,5}\s+tomorrow)\b/,
];

export type OutputGuardResult =
  | { ok: true }
  | { ok: false; reason: "leak_marker" | "harm_marker" };

export function guardOracleReport(report: {
  archetype: { name: string; tagline: string };
  actions: string[];
  taboo: string;
  report: string;
  shareLine: string;
}): OutputGuardResult {
  const blob = [
    report.archetype.name,
    report.archetype.tagline,
    ...report.actions,
    report.taboo,
    report.report,
    report.shareLine,
  ].join("\n");

  for (const re of HARD_HARM) {
    if (re.test(blob)) return { ok: false, reason: "harm_marker" };
  }
  for (const re of LEAK_MARKERS) {
    if (re.test(blob)) return { ok: false, reason: "leak_marker" };
  }
  return { ok: true };
}
