# Security

## Reporting

If you find a vulnerability in VibeOracle, please **do not** open a public issue with exploit details.

Email or DM the maintainer via the GitHub profile on this repository, or open a **private** security advisory on GitHub if enabled.

Include: impact, steps to reproduce, affected version/commit.

## Trust model (short)

| Surface | Trust |
|---------|--------|
| Client mood text | Untrusted — validated, length-limited, policy-scanned |
| Client `seed` / `date` | Ignored by default |
| Proxy IP headers | **Ignored** unless `TRUST_PROXY=true` and (recommended) socket in `TRUSTED_PROXY_CIDRS` |
| Live LLM output | Schema + canary + output guard; still not a safety guarantee |
| Demo mode | Offline scripts; always labeled `mode: "demo"` |

## Hard gates for production

1. Do **not** set `TRUST_PROXY=true` on a publicly reachable origin without edge-only network policy. Prefer `TRUST_PROXY_MODE=cf-only`.  
2. Put Cloudflare (or equivalent) rate limits in front of `/api/oracle` and `/api/og` — see [docs/cloudflare-rate-limit.md](docs/cloudflare-rate-limit.md).  
3. Live deploys: `ALLOW_DEMO_WITHOUT_KEY=false`, hide key status, set CORS allowlist.

## Out of scope (by design)

- Perfect content moderation for all languages and jailbreaks  
- Multi-tenant auth / billing  
- Guaranteeing model behavior under adversarial prompts  

This is entertainment software with best-effort guardrails — not a certified safety product.
