# VibeOracle — Open Source Parts Registry

**Purpose:** continuously harvest excellent GitHub / OSS components and map them onto this monorepo.  
**Rule:** prefer thin adapters over heavy frameworks; keep “pure vibe, not evidence.”  
**Last scan:** 2026-08-12 (goal cycle: harvest + integrate)

---

## Already integrated (native / inspired)

| Part | Source / spirit | Where in repo |
|------|-----------------|---------------|
| Hono stock middleware | [honojs/hono](https://github.com/honojs/hono) | `body-limit`, `request-id`, `secure-headers`, `cors` in `app.ts` |
| ConnInfo IP | [@hono/node-server](https://github.com/honojs/node-server) | `middleware/rateLimit.ts` `getConnInfo` |
| CF-Connecting-IP | Cloudflare edge headers + [CF docs](https://developers.cloudflare.com/fundamentals/reference/http-request-headers/) | `rateLimit.ts` when `TRUST_PROXY=true` |
| Zod schemas | [colinhacks/zod](https://github.com/colinhacks/zod) | `schemas.ts` |
| OpenAI-compatible client | [openai/openai-node](https://github.com/openai/openai-node) → xAI | `llm.ts` |
| Prompt canary + leak scan | [tldrsec/prompt-injection-defenses](https://github.com/tldrsec/prompt-injection-defenses) | `parts/canary.ts`, `parts/outputGuard.ts` |
| Soft refuse UX | product pattern (safety apps) | `policy/*` |
| Mulberry32 ritual RNG | public domain PRNG | `engines/deck.ts` |
| Digit-root day seed | numerology-shaped (not copied code) | `engines/dayseed.ts` |
| Weekday tone | calendar theater | `engines/weekday.ts` |
| Hexagram thin engine | public-domain I Ching *structure* (not Wilhelm prose); see also [adamblvck/iching-wilhelm-dataset](https://github.com/adamblvck/iching-wilhelm-dataset) as data inspiration only | `engines/hexagram.ts` |
| Lunar phase engine | open almanac math (Meeus-style JD approx, local only) | `engines/lunar.ts` |
| Share sanitizer | bidi/ZW strip (unicode security notes) | `sanitize.ts` |
| Canvas share PNG | modern-screenshot / html-to-image *spirit*, zero dep | `client/src/shareImage.ts` |
| Satori OG PNG | [vercel/satori](https://github.com/vercel/satori) + [@resvg/resvg-js](https://github.com/yisibl/resvg-js); pattern kinship with [mohdlatif/og-image-generator-cloudflare-worker](https://github.com/mohdlatif/og-image-generator-cloudflare-worker) (Hono+OG) | `server/src/og/render.ts`, `GET /api/og` |
| Prompt lock | [promptfoo/promptfoo](https://github.com/promptfoo/promptfoo)-compatible YAML + always-on runner (Windows-safe) | `eval/*` |
| Edge multi-IP RL | Cloudflare WAF; related: [elithrar/workers-hono-rate-limit](https://github.com/elithrar/workers-hono-rate-limit), [bytaesu/hono-cf-rate-limit](https://github.com/bytaesu/hono-cf-rate-limit) | `docs/cloudflare-rate-limit.md`, `deploy/cloudflare-rate-limit.rules.json` |
| Pluggable engines | plugin registry pattern | `engines/registry.ts` |

---

## High-value candidates (next harvest)

### Security & abuse

| Repo | Why | Fit |
|------|-----|-----|
| [rhinobase/hono-rate-limiter](https://github.com/rhinobase/hono-rate-limiter) | Mature Hono RL + Redis stores | Optional swap for base IP RL; keep our live budget layer |
| [elithrar/workers-hono-rate-limit](https://github.com/elithrar/workers-hono-rate-limit) | CF Workers binding RL for Hono | If origin moves to Workers |
| [NVIDIA/garak](https://github.com/NVIDIA/garak) | LLM red-team probes | CI job outside app (Python) |
| [protectai/llm-guard](https://github.com/protectai/llm-guard) | Input/output scanners | Sidecar if we accept Python |
| [NVIDIA/NeMo-Guardrails](https://github.com/NVIDIA/NeMo-Guardrails) | Programmable rails | Heavy; only if multi-agent grows |

### Product / UX

| Repo | Why | Fit |
|------|-----|-----|
| [html-to-image](https://github.com/bubkoo/html-to-image) / modern-screenshot | High-quality DOM → PNG | Upgrade canvas if Satori fonts fail |
| [motiondivision/motion](https://github.com/motiondivision/motion) | Card flip / ritual animation | Optional client polish |
| [shadcn/ui](https://github.com/shadcn-ui/ui) patterns | Accessible controls | Only if UI grows beyond 5 screens |

### Engines & content

| Repo / idea | Why | Fit |
|-------------|-----|-----|
| [jesshewitt/i-ching](https://github.com/jesshewitt/i-ching) | Compact hexagram JSON / PWA | Compare structure; keep original counsel |
| [strobus/i-ching](https://github.com/strobus/i-ching) | Graph of hexagrams | Optional graph navigation later |
| Weather metaphor pack | free lexicons | Prompt flavor packs |

### Ops

| Repo | Why | Fit |
|------|-----|-----|
| [open-telemetry/opentelemetry-js](https://github.com/open-telemetry/opentelemetry-js) | Traces/metrics | After single-node proven |

---

## Integration rules

1. **No silent live→demo.** Parts must not reintroduce that footgun.  
2. **Zero network in engines.** Engines are local deterministic facts only.  
3. **Policy before spend.** Any new “pre-LLM” part runs before `acquireLiveBudget`.  
4. **License:** MIT/Apache preferred; attribute in this file.  
5. **Deps:** prefer stdlib / already-in-tree; each new npm dep needs a one-line justification here.  
   - `satori`, `@resvg/resvg-js`: server OG PNG (Satori path).

---

## Harvest log

| Date | Action |
|------|--------|
| 2026-08-12 | Initial registry; canary + outputGuard; deck 24; engine registry; canvas share |
| 2026-08-12 | Hexagram engine; Satori OG `/api/og`; prompt assertions + promptfoo config; Cloudflare rate-limit docs |
| 2026-08-12 | **Goal cycle re-scan:** CF Workers Hono RL repos, I Ching datasets (structure-only), Hono+Satori OG workers; **integrated lunar_phase engine** (almanac math, local); expanded “already integrated” citations for CF-Connecting-IP + satori/resvg |

---

## How to add a part

1. Open a row under **Harvest log**.  
2. Prefer adapter under `server/src/parts/` or `server/src/engines/`.  
3. Register engines in `engines/registry.ts`.  
4. Add fixtures/tests in the same PR.  
5. Update this file.
