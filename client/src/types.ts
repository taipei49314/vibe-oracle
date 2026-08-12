export type DrawnCard = {
  id: string;
  name: string;
  upright: string;
  shadow: string;
  keywords: string[];
  orientation: "upright" | "shadow";
  position: "past" | "present" | "horizon";
  reading: string;
};

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
  | {
      kind: "day_seed";
      date: string;
      number: number;
      tone: string;
      counsel: string;
    }
  | {
      kind: "weekday_tone";
      weekday: string;
      tone: string;
      counsel: string;
    }
  | {
      kind: "hexagram";
      number: number;
      name: string;
      pinyin: string;
      binary: string;
      judgment: string;
      counsel: string;
      changingLines: number[];
    }
  | {
      kind: "lunar_phase";
      date: string;
      phase: number;
      name: string;
      illumination: number;
      counsel: string;
    }
  | {
      kind: "mood_echo";
      text: string;
      wordCount: number;
    };

export type OracleReport = {
  archetype: { name: string; tagline: string };
  actions: [string, string, string];
  taboo: string;
  report: string;
  confidenceTheater: number;
  shareLine: string;
};

export type OracleMeta = {
  requestId: string;
  day: string;
  confidenceLabel: "theatrical";
  policy?: { category: string };
  seedIgnored?: boolean;
};

export type OracleResponse = {
  mode: "live" | "demo" | "refused";
  seed: string;
  ritual: DrawnCard[];
  facts: OracleFact[];
  report: OracleReport;
  meta: OracleMeta;
};

export type HealthResponse = {
  ok: boolean;
  name: string;
  version?: string;
  modeCapability?: "live" | "demo" | "none";
  demoAllowed?: boolean;
  publicDemo?: boolean;
  hasKey?: boolean;
};

export type Step = "landing" | "mood" | "ritual" | "loading" | "report";
