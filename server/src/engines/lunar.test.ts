import { describe, expect, it } from "vitest";
import { lunarPhase } from "./lunar.js";
import { buildFacts } from "./facts.js";
import { drawCards } from "./deck.js";

describe("lunarPhase", () => {
  it("is deterministic for a fixed date", () => {
    const a = lunarPhase("2026-08-12");
    const b = lunarPhase("2026-08-12");
    expect(a).toEqual(b);
    expect(a.kind).toBe("lunar_phase");
    expect(a.phase).toBeGreaterThanOrEqual(0);
    expect(a.phase).toBeLessThan(1);
    expect(a.illumination).toBeGreaterThanOrEqual(0);
    expect(a.illumination).toBeLessThanOrEqual(1);
    expect(a.name.length).toBeGreaterThan(3);
    expect(a.counsel.length).toBeGreaterThan(10);
  });

  it("varies across the month", () => {
    const names = new Set(
      [
        "2026-01-01",
        "2026-01-08",
        "2026-01-15",
        "2026-01-22",
        "2026-01-29",
      ].map((d) => lunarPhase(d).name)
    );
    expect(names.size).toBeGreaterThan(1);
  });

  it("is stamped by buildFacts registry", () => {
    const cards = drawCards("lunar-seed", 3);
    const facts = buildFacts(
      "I carry unfinished weather",
      cards,
      "2026-08-12",
      "lunar-seed"
    );
    const L = facts.find((f) => f.kind === "lunar_phase");
    expect(L).toBeTruthy();
    if (L && L.kind === "lunar_phase") {
      expect(L.date).toBe("2026-08-12");
    }
  });
});
