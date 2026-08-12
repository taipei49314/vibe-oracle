import { describe, expect, it } from "vitest";
import { castHexagram } from "./hexagram.js";
import { buildFacts } from "./facts.js";
import { drawCards } from "./deck.js";

describe("hexagram engine", () => {
  it("is deterministic for a seed", () => {
    const a = castHexagram("hex-seed-1");
    const b = castHexagram("hex-seed-1");
    expect(a).toEqual(b);
    expect(a.number).toBeGreaterThanOrEqual(1);
    expect(a.number).toBeLessThanOrEqual(64);
    expect(a.binary).toHaveLength(6);
    expect(a.name.length).toBeGreaterThan(2);
    expect(a.judgment.length).toBeGreaterThan(10);
  });

  it("varies across seeds", () => {
    const nums = new Set(
      ["a", "b", "c", "d", "e", "f", "g", "h"].map(
        (s) => castHexagram(s).number
      )
    );
    expect(nums.size).toBeGreaterThan(1);
  });

  it("appears in buildFacts", () => {
    const cards = drawCards("hx", 3);
    const facts = buildFacts("mood weather here", cards, "2026-08-12", "hx");
    const h = facts.find((f) => f.kind === "hexagram");
    expect(h).toBeTruthy();
    if (h && h.kind === "hexagram") {
      expect(h.number).toBeGreaterThanOrEqual(1);
    }
  });
});
