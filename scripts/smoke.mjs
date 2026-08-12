/**
 * Smoke test against a running API (default http://127.0.0.1:8787).
 * Usage: node scripts/smoke.mjs
 *
 * Does not send client seed/date (server-authoritative by default).
 * When PUBLIC_DEMO=true, asserts mode !== "live".
 */
const base = process.env.SMOKE_BASE || "http://127.0.0.1:8787";

async function main() {
  const health = await fetch(`${base}/api/health`);
  if (!health.ok) throw new Error(`health ${health.status}`);
  const h = await health.json();
  if (!h.ok) throw new Error("health not ok");
  if (!h.modeCapability) throw new Error("missing modeCapability");

  const ready = await fetch(`${base}/api/ready`);
  if (!ready.ok && ready.status !== 503) {
    throw new Error(`ready unexpected ${ready.status}`);
  }

  const res = await fetch(`${base}/api/oracle`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Client-Token": "00000000-0000-4000-8000-000000000001",
    },
    body: JSON.stringify({
      mood: "Smoke test: I want to ship something weird today",
      drawCount: 3,
    }),
  });
  if (!res.ok) throw new Error(`oracle ${res.status} ${await res.text()}`);
  const body = await res.json();
  if (body.detail) throw new Error("error detail must not appear on success");
  if (!body.report?.archetype?.name) throw new Error("missing archetype");
  if (!Array.isArray(body.ritual) || body.ritual.length !== 3) {
    throw new Error("ritual length");
  }
  if (!body.meta?.requestId || body.meta.confidenceLabel !== "theatrical") {
    throw new Error("missing meta envelope");
  }
  if (!["live", "demo", "refused"].includes(body.mode)) {
    throw new Error(`bad mode ${body.mode}`);
  }
  if (h.publicDemo && body.mode === "live") {
    throw new Error("PUBLIC_DEMO must not return live");
  }
  if (body.report.confidenceTheater < 72 || body.report.confidenceTheater > 92) {
    throw new Error("confidence out of theatrical range");
  }
  console.log("SMOKE_OK", body.mode, body.report.archetype.name, body.meta.requestId);
}

main().catch((e) => {
  console.error("SMOKE_FAIL", e);
  process.exit(1);
});
