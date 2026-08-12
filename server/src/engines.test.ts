import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { daySeed, digitRoot } from "./engines/dayseed.js";
import { DECK, drawCards, hashSeed } from "./engines/deck.js";
import { buildFacts } from "./engines/facts.js";
import { demoReport } from "./prompts/oracle.js";
import {
  extractJson,
  resolveSeed,
  runOracle,
  ReportSchema,
} from "./oracle.js";
import { normalizeMood, moodCodePointLength } from "./schemas.js";
import { resetConfigCache } from "./config.js";
import { CONFIDENCE_MAX, CONFIDENCE_MIN } from "./schemas.js";

describe("digitRoot", () => {
  it("reduces to 1..9", () => {
    expect(digitRoot(0)).toBe(9);
    expect(digitRoot(9)).toBe(9);
    expect(digitRoot(10)).toBe(1);
    expect(digitRoot(2026 + 8 + 11)).toBe(digitRoot(2045));
  });
});

describe("daySeed", () => {
  it("is stable for a fixed date", () => {
    const a = daySeed("2026-08-11");
    const b = daySeed("2026-08-11");
    expect(a).toEqual(b);
    expect(a.number).toBeGreaterThanOrEqual(1);
    expect(a.number).toBeLessThanOrEqual(9);
    expect(a.tone.length).toBeGreaterThan(0);
  });
});

describe("drawCards", () => {
  it("is deterministic for the same seed", () => {
    const a = drawCards("fixed-seed-v1", 3);
    const b = drawCards("fixed-seed-v1", 3);
    expect(a.map((c) => c.id)).toEqual(b.map((c) => c.id));
    expect(a.map((c) => c.orientation)).toEqual(b.map((c) => c.orientation));
  });

  it("returns unique cards within a draw", () => {
    const drawn = drawCards("unique-check", 3);
    const ids = drawn.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("clamps count to 1..3", () => {
    expect(drawCards("c1", 0)).toHaveLength(1);
    expect(drawCards("c9", 9)).toHaveLength(3);
  });

  it("assigns past/present/horizon positions", () => {
    const drawn = drawCards("positions", 3);
    expect(drawn.map((c) => c.position)).toEqual([
      "past",
      "present",
      "horizon",
    ]);
  });

  it("deck has twenty-four cards", () => {
    expect(DECK.length).toBe(24);
    expect(hashSeed("a")).not.toBe(hashSeed("b"));
  });
});

describe("normalizeMood", () => {
  it("strips C0 and counts code points", () => {
    const n = normalizeMood("  hello\u0000world  ");
    expect(n).toBe("helloworld");
    expect(moodCodePointLength(n)).toBe(10);
  });
});

describe("buildFacts + demoReport", () => {
  it("stamps mood, day, and ritual facts", () => {
    const mood = "I abandon projects at eighty percent";
    const cards = drawCards("facts-seed", 3);
    const facts = buildFacts(mood, cards, "2026-01-01", "facts-seed");
    expect(facts.some((f) => f.kind === "mood_echo")).toBe(true);
    expect(facts.some((f) => f.kind === "day_seed")).toBe(true);
    expect(facts.some((f) => f.kind === "weekday_tone")).toBe(true);
    expect(facts.some((f) => f.kind === "hexagram")).toBe(true);
    expect(facts.some((f) => f.kind === "lunar_phase")).toBe(true);
    expect(facts.filter((f) => f.kind === "ritual_card")).toHaveLength(3);

    const report = demoReport(mood, facts, "facts-seed");
    expect(ReportSchema.safeParse(report).success).toBe(true);
    expect(report.actions).toHaveLength(3);
    expect(report.confidenceTheater).toBeGreaterThanOrEqual(CONFIDENCE_MIN);
    expect(report.confidenceTheater).toBeLessThanOrEqual(CONFIDENCE_MAX);
  });

  it("varies demo archetype by seed", () => {
    const mood = "I abandon projects at eighty percent";
    const cards = drawCards("facts-seed", 3);
    const facts = buildFacts(mood, cards, "2026-01-01", "facts-seed");
    const a = demoReport(mood, facts, "seed-a");
    const b = demoReport(mood, facts, "seed-b-different");
    const names = new Set(
      ["s1", "s2", "s3", "s4", "s5", "s6"].map(
        (s) => demoReport(mood, facts, s).archetype.name
      )
    );
    expect(names.size).toBeGreaterThan(1);
    expect(a.archetype.name).toBeTruthy();
    expect(b.archetype.name).toBeTruthy();
  });

  it("rejects confidence 96 in schema", () => {
    const mood = "I abandon projects at eighty percent";
    const cards = drawCards("facts-seed", 3);
    const facts = buildFacts(mood, cards, "2026-01-01", "facts-seed");
    const report = demoReport(mood, facts, "facts-seed");
    const bad = { ...report, confidenceTheater: 96 };
    expect(ReportSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects overlong archetype name", () => {
    const mood = "I abandon projects at eighty percent";
    const cards = drawCards("facts-seed", 3);
    const facts = buildFacts(mood, cards, "2026-01-01", "facts-seed");
    const report = demoReport(mood, facts, "facts-seed");
    const bad = {
      ...report,
      archetype: { ...report.archetype, name: "X".repeat(81) },
    };
    expect(ReportSchema.safeParse(bad).success).toBe(false);
  });
});

describe("extractJson / resolveSeed", () => {
  it("parses fenced-ish model output", () => {
    const raw = 'Sure!\n{"archetype":{"name":"X","tagline":"y"}}\n';
    expect(extractJson(raw)).toEqual({
      archetype: { name: "X", tagline: "y" },
    });
  });

  it("resolveSeed prefers explicit seed when allowed", () => {
    expect(
      resolveSeed("hello mood here", "my-seed", new Date(), true)
    ).toEqual({ seed: "my-seed", seedIgnored: false });
  });

  it("resolveSeed ignores client seed when not allowed", () => {
    const r = resolveSeed(
      "hello mood here",
      "my-seed",
      new Date("2026-08-11T12:00:00Z"),
      false
    );
    expect(r.seed).toBe("2026-08-11::hello mood here");
    expect(r.seedIgnored).toBe(true);
  });
});

describe("runOracle demo mode", () => {
  const prevKey = process.env.XAI_API_KEY;
  const prevDemo = process.env.ALLOW_DEMO_WITHOUT_KEY;
  const prevPublic = process.env.PUBLIC_DEMO;
  const prevSeed = process.env.ALLOW_CLIENT_SEED;

  beforeEach(() => {
    delete process.env.XAI_API_KEY;
    process.env.ALLOW_DEMO_WITHOUT_KEY = "true";
    process.env.PUBLIC_DEMO = "false";
    process.env.ALLOW_CLIENT_SEED = "true";
    resetConfigCache();
  });

  afterEach(() => {
    if (prevKey === undefined) delete process.env.XAI_API_KEY;
    else process.env.XAI_API_KEY = prevKey;
    if (prevDemo === undefined) delete process.env.ALLOW_DEMO_WITHOUT_KEY;
    else process.env.ALLOW_DEMO_WITHOUT_KEY = prevDemo;
    if (prevPublic === undefined) delete process.env.PUBLIC_DEMO;
    else process.env.PUBLIC_DEMO = prevPublic;
    if (prevSeed === undefined) delete process.env.ALLOW_CLIENT_SEED;
    else process.env.ALLOW_CLIENT_SEED = prevSeed;
    resetConfigCache();
  });

  it("rejects short mood", async () => {
    await expect(
      runOracle({ mood: "hi" }, { requestId: "t1" })
    ).rejects.toThrow("MOOD_REQUIRED");
  });

  it("returns demo when no API key", async () => {
    const out = await runOracle(
      {
        mood: "I keep restarting my life every Monday",
        seed: "unit-demo-seed",
        date: "2026-08-11",
      },
      { requestId: "t2" }
    );

    expect(out.mode).toBe("demo");
    expect(out.ritual).toHaveLength(3);
    expect(out.facts.length).toBeGreaterThanOrEqual(5);
    expect(ReportSchema.safeParse(out.report).success).toBe(true);
    expect(out.meta.requestId).toBe("t2");
  });
});
