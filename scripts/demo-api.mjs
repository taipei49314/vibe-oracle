/**
 * Zero-UI product demo against a running API (default :8787).
 * Usage: npm run demo:api
 *        SMOKE_BASE=http://127.0.0.1:8787 npm run demo:api
 */
const base = process.env.SMOKE_BASE || "http://127.0.0.1:8787";

async function main() {
  const health = await fetch(`${base}/api/health`).then((r) => r.json());
  console.log("health:", JSON.stringify(health, null, 2));

  const res = await fetch(`${base}/api/oracle`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Client-Token": "00000000-0000-4000-8000-demo00000001",
    },
    body: JSON.stringify({
      mood: "I keep starting things and abandoning them at 80%",
      drawCount: 3,
    }),
  });
  if (!res.ok) {
    console.error("oracle failed", res.status, await res.text());
    process.exit(1);
  }
  const body = await res.json();
  console.log("\n=== VibeOracle demo ===");
  console.log("mode:      ", body.mode);
  console.log("archetype: ", body.report?.archetype?.name);
  console.log("tagline:   ", body.report?.archetype?.tagline);
  console.log("theater:   ", body.report?.confidenceTheater);
  console.log("share:     ", body.report?.shareLine);
  console.log(
    "cards:     ",
    (body.ritual || []).map((c) => `${c.name}(${c.orientation})`).join(" · ")
  );
  const hex = (body.facts || []).find((f) => f.kind === "hexagram");
  const lunar = (body.facts || []).find((f) => f.kind === "lunar_phase");
  if (hex) console.log("hexagram:  ", `${hex.number} ${hex.name}`);
  if (lunar) console.log("lunar:     ", lunar.name);
  console.log("\nactions:");
  for (const a of body.report?.actions || []) console.log(" -", a);
  console.log("\ntaboo:", body.report?.taboo);
  console.log("\nmeta:", body.meta);
  console.log("\nDEMO_API_OK");
}

main().catch((e) => {
  console.error("DEMO_API_FAIL", e.message || e);
  console.error("Is the API running? npm run dev:server");
  process.exit(1);
});
