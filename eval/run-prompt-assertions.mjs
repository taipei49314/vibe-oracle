/**
 * Always-on prompt / policy lock (promptfoo-compatible intent).
 * No native deps — runs on Windows + Linux CI.
 *
 * Usage: node eval/run-prompt-assertions.mjs
 * Optional: npx promptfoo eval -c eval/promptfooconfig.yaml  (Linux CI)
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const checks = [];

function check(name, ok, detail = "") {
  checks.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

const systemSrc = readFileSync(
  join(root, "server/src/prompts/oracle.ts"),
  "utf8"
);

check(
  "system forbids medical diagnoses",
  /NEVER give medical diagnoses/i.test(systemSrc)
);
check(
  "system forbids legal strategy",
  /NEVER give legal strategy/i.test(systemSrc)
);
check(
  "system forbids investment advice",
  /NEVER give investment/i.test(systemSrc)
);
check(
  "system forbids self-harm assistance",
  /NEVER assist with self-harm/i.test(systemSrc)
);
check("system is entertainment-only", /entertainment only/i.test(systemSrc));
check(
  "confidence theater range referenced",
  /CONFIDENCE_MIN/.test(systemSrc) && /CONFIDENCE_MAX/.test(systemSrc)
);
check(
  "user mood delimited as untrusted",
  /<user_mood>/.test(systemSrc) && /untrusted/i.test(systemSrc)
);

const fixtures = JSON.parse(
  readFileSync(join(root, "server/src/policy/fixtures.json"), "utf8")
);
check("policy fixtures non-empty", fixtures.length >= 10, `n=${fixtures.length}`);
check(
  "policy fixtures include Chinese crisis",
  fixtures.some((f) => /自杀|自殺/.test(f.mood))
);
check(
  "policy fixtures include leet kill",
  fixtures.some((f) => /k1ll/i.test(f.mood))
);

const canarySrc = readFileSync(
  join(root, "server/src/parts/canary.ts"),
  "utf8"
);
check("canary mints VO-CANARY tokens", /VO-CANARY-/.test(canarySrc));
check(
  "output guard module present",
  readFileSync(join(root, "server/src/parts/outputGuard.ts"), "utf8").includes(
    "guardOracleReport"
  )
);

// Runtime: policy + hexagram via vitest (already covered by `npm test` in check)
// Re-run a focused subset; use shell on Windows to avoid npx.cmd EINVAL.
let runtimeOk = true;
try {
  const cmd =
    process.platform === "win32"
      ? "npx vitest run src/policy/contentPolicy.test.ts src/parts/canary.test.ts src/engines/hexagram.test.ts"
      : "npx vitest run src/policy/contentPolicy.test.ts src/parts/canary.test.ts src/engines/hexagram.test.ts";
  execFileSync(cmd, {
    cwd: join(root, "server"),
    stdio: "pipe",
    encoding: "utf8",
    shell: true,
  });
} catch (e) {
  runtimeOk = false;
  console.error(e.stdout || e.stderr || e.message);
}
check("runtime policy + canary + hexagram tests", runtimeOk);

const failed = checks.filter((c) => !c.ok);
console.log("");
console.log(
  failed.length
    ? `PROMPT_ASSERTIONS_FAIL ${failed.length}/${checks.length}`
    : `PROMPT_ASSERTIONS_OK ${checks.length}/${checks.length}`
);
process.exit(failed.length ? 1 : 0);
