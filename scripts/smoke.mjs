/**
 * Smoke test against a running API (default http://127.0.0.1:8787).
 * Usage: node scripts/smoke.mjs
 */
const base = process.env.SMOKE_BASE || "http://127.0.0.1:8787";

async function main() {
  const health = await fetch(`${base}/api/health`);
  if (!health.ok) throw new Error(`health ${health.status}`);
  const h = await health.json();
  if (!h.ok) throw new Error("health not ok");

  const res = await fetch(`${base}/api/oracle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mood: "Smoke test: I want to ship something weird today",
      seed: "smoke-seed",
      date: "2026-08-11",
    }),
  });
  if (!res.ok) throw new Error(`oracle ${res.status} ${await res.text()}`);
  const body = await res.json();
  if (!body.report?.archetype?.name) throw new Error("missing archetype");
  if (!Array.isArray(body.ritual) || body.ritual.length !== 3) {
    throw new Error("ritual length");
  }
  console.log("SMOKE_OK", body.mode, body.report.archetype.name);
}

main().catch((e) => {
  console.error("SMOKE_FAIL", e);
  process.exit(1);
});
