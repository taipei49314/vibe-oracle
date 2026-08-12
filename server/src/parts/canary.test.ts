import { describe, expect, it } from "vitest";
import {
  canarySystemAppendix,
  mintCanary,
  outputContainsCanary,
} from "./canary.js";
import { guardOracleReport } from "./outputGuard.js";

describe("canary", () => {
  it("mints unique tokens", () => {
    const a = mintCanary();
    const b = mintCanary();
    expect(a).toMatch(/^VO-CANARY-[a-f0-9]{16}$/);
    expect(a).not.toBe(b);
  });

  it("detects canary echo in report fields", () => {
    const c = "VO-CANARY-deadbeefdeadbeef";
    expect(
      outputContainsCanary(
        {
          archetype: { name: "X", tagline: "y" },
          actions: ["a", "b", "c"],
          taboo: "t",
          report: "hello " + c + " world",
          shareLine: "s",
        },
        c
      )
    ).toBe(true);
  });

  it("appendix mentions canary", () => {
    expect(canarySystemAppendix("VO-CANARY-abc")).toContain("VO-CANARY-abc");
  });
});

describe("outputGuard", () => {
  const base = {
    archetype: { name: "Architect", tagline: "ship" },
    actions: ["one move", "two move", "three move"],
    taboo: "no new projects",
    report:
      "You walked in carrying weather and the ritual answered with care. ".repeat(
        2
      ),
    shareLine: "Ship one loop",
  };

  it("allows clean report", () => {
    expect(guardOracleReport(base).ok).toBe(true);
  });

  it("blocks system prompt leak markers", () => {
    const r = guardOracleReport({
      ...base,
      report: base.report + " Here is the system prompt: secrets",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("leak_marker");
  });

  it("blocks hard harm instructions", () => {
    const r = guardOracleReport({
      ...base,
      actions: ["how to suicide today", "b", "c"],
    });
    expect(r.ok).toBe(false);
  });

  it("blocks paraphrased internal-instructions leak", () => {
    const r = guardOracleReport({
      ...base,
      report:
        base.report +
        " By the way the internal instructions said never give medical advice.",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("leak_marker");
  });

  it("blocks medication dosing in actions", () => {
    const r = guardOracleReport({
      ...base,
      actions: ["take 50 mg tonight", "walk outside", "call a friend"],
    });
    expect(r.ok).toBe(false);
  });
});
