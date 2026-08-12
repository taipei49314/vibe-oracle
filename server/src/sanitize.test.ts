import { describe, expect, it } from "vitest";
import {
  sanitizeShareText,
  SHARE_TEXT_MAX_CODE_POINTS,
} from "./sanitize.js";

describe("sanitizeShareText", () => {
  it("strips zero-width and bidi overrides", () => {
    const dirty = `Hello\u200B\u202Eworld`;
    const out = sanitizeShareText(dirty);
    expect(out).toBe("Helloworld");
    expect(out).not.toMatch(/[\u200B\u202E]/);
  });

  it("truncates to max code points", () => {
    const long = "a".repeat(200) + "\u200B";
    const out = sanitizeShareText(long);
    expect([...out].length).toBeLessThanOrEqual(SHARE_TEXT_MAX_CODE_POINTS);
    expect(out).not.toContain("\u200B");
  });

  it("collapses newlines to spaces", () => {
    expect(sanitizeShareText("a\nb\r\nc")).toBe("a b c");
  });
});
