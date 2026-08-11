import { describe, expect, it } from "vitest";
import { daySeed, digitRoot } from "./engines/dayseed.js";
import { DECK, drawCards, hashSeed } from "./engines/deck.js";
import { buildFacts } from "./engines/facts.js";
import { demoReport } from "./prompts/oracle.js";
import { extractJson, resolveSeed, runOracle, ReportSchema } from "./oracle.js";

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
    expect(drawn.map((c) => c.position)).toEqual(["past", "present", "horizon"]);
  });

  it("deck has twelve cards", () => {
    expect(DECK.length).toBe(12);
    expect(hashSeed("a")).not.toBe(hashSeed("b"));
  });
});

describe("buildFacts + demoReport", () => {
  it("stamps mood, day, and ritual facts", () => {
    const mood = "I abandon projects at eighty percent";
    const cards = drawCards("facts-seed", 3);
    const day = daySeed("2026-01-01");
    const facts = buildFacts(mood, cards, day);
    expect(facts.some((f) => f.kind === "mood_echo")).toBe(true);
    expect(facts.some((f) => f.kind === "day_seed")).toBe(true);
    expect(facts.filter((f) => f.kind === "ritual_card")).toHaveLength(3);

    const report = demoReport(mood, facts);
    expect(ReportSchema.safeParse(report).success).toBe(true);
    expect(report.actions).toHaveLength(3);
    expect(report.confidenceTheater).toBeGreaterThanOrEqual(88);
  });
});

describe("extractJson / resolveSeed", () => {
  it("parses fenced-ish model output", () => {
    const raw = 'Sure!\n{"archetype":{"name":"X","tagline":"y"}}\n';
    expect(extractJson(raw)).toEqual({
      archetype: { name: "X", tagline: "y" },
    });
  });

  it("resolveSeed prefers explicit seed", () => {
    expect(resolveSeed("hello mood here", "my-seed")).toBe("my-seed");
    expect(resolveSeed("hello mood here", undefined, new Date("2026-08-11T12:00:00Z"))).toBe(
      "2026-08-11::hello mood here"
    );
  });
});

describe("runOracle demo mode", () => {
  it("rejects short mood", async () => {
    await expect(runOracle({ mood: "hi" })).rejects.toThrow("MOOD_REQUIRED");
  });

  it("returns demo when no API key", async () => {
    const prev = process.env.XAI_API_KEY;
    const prevDemo = process.env.ALLOW_DEMO_WITHOUT_KEY;
    delete process.env.XAI_API_KEY;
    process.env.ALLOW_DEMO_WITHOUT_KEY = "true";

    const out = await runOracle({
      mood: "I keep restarting my life every Monday",
      seed: "unit-demo-seed",
      date: "2026-08-11",
    });

    expect(out.mode).toBe("demo");
    expect(out.ritual).toHaveLength(3);
    expect(out.facts.length).toBeGreaterThanOrEqual(5);
    expect(ReportSchema.safeParse(out.report).success).toBe(true);

    if (prev === undefined) delete process.env.XAI_API_KEY;
    else process.env.XAI_API_KEY = prev;
    if (prevDemo === undefined) delete process.env.ALLOW_DEMO_WITHOUT_KEY;
    else process.env.ALLOW_DEMO_WITHOUT_KEY = prevDemo;
  });
});
