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

export type OracleResponse = {
  mode: "live" | "demo";
  seed: string;
  ritual: DrawnCard[];
  facts: OracleFact[];
  report: OracleReport;
};

export type Step = "landing" | "mood" | "ritual" | "loading" | "report";
