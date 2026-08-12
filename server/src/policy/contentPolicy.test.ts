import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { evaluateContentPolicy } from "./contentPolicy.js";

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = JSON.parse(
  readFileSync(join(here, "fixtures.json"), "utf8")
) as Array<{ mood: string; category: string | null; expect: string }>;

describe("contentPolicy fixtures", () => {
  for (const row of fixtures) {
    it(`${row.expect}: ${row.mood.slice(0, 48)}`, () => {
      const r = evaluateContentPolicy(row.mood);
      if (row.expect === "allow") {
        expect(r.action).toBe("allow");
      } else {
        expect(r.action).toBe("refuse");
        if (r.action === "refuse") {
          expect(r.category).toBe(row.category);
        }
      }
    });
  }
});
