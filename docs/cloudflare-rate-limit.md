# Cloudflare rate limiting (production multi-IP)

App-level limits (`RATE_LIMIT_*`, `GLOBAL_LIVE_MAX_PER_WINDOW`) are **per Node process**.  
Distributed clients / many IPs still need **edge** enforcement — Cloudflare is the recommended first layer.

## Goals

| Layer | What it stops |
|-------|----------------|
| Cloudflare WAF / Rate limiting rules | Multi-IP spray, bot floods, cheap 429 before origin |
| Origin `resolveIp` + `TRUST_PROXY=true` | Correct client IP when CF sets `CF-Connecting-IP` / XFF |
| Origin live budget | LLM cost after traffic is already thinned |

## 1. DNS / proxy

1. Put the API hostname (e.g. `api.yourdomain.com`) behind Cloudflare (**orange cloud** proxied).  
2. TLS full (strict) to origin.

## 2. Rate limiting rules (dashboard)

**Security → WAF → Rate limiting rules** (or **Security rules** depending on plan):

### Rule A — Oracle POST budget

| Field | Value |
|-------|--------|
| Name | `oracle-post-per-ip` |
| Expression | `(http.request.uri.path eq "/api/oracle" and http.request.method eq "POST")` |
| Characteristics | IP |
| Period | 1 minute |
| Requests | **30** (tune; origin default IP max is 20 — CF should be ≥ origin or equal) |
| Action | Block (or Managed Challenge) |
| Duration | 1 minute |

### Rule B — Global origin shield (optional, Enterprise / advanced)

| Field | Value |
|-------|--------|
| Name | `oracle-post-global` |
| Expression | same as A |
| Characteristics | **not** IP — use custom counting if available, else accept per-IP only on free/pro |
| Requests | e.g. 200 / min across path |

Free/Pro plans are mostly **per-IP**; still massively reduces abuse vs open origin.

### Rule C — OG image

| Field | Value |
|-------|--------|
| Expression | `(http.request.uri.path eq "/api/og")` |
| Period | 1 minute |
| Requests | 60 / IP |
| Action | Block |

## 3. Origin env when behind Cloudflare — **HARD GATE**

Do **not** set `TRUST_PROXY=true` unless **all** of the following hold:

1. Origin accepts TCP only from Cloudflare (or your edge) — firewall / security group.  
2. `TRUST_PROXY_MODE=cf-only` (default) — **never** use `headers` on a public origin.  
3. Preferably set `TRUSTED_PROXY_CIDRS` to your edge hop ranges so direct clients cannot spoof `CF-Connecting-IP`.

```bash
NODE_ENV=production
TRUST_PROXY=true
TRUST_PROXY_MODE=cf-only
# TRUSTED_PROXY_CIDRS=...   # strongly recommended

CORS_ORIGINS=https://app.yourdomain.com
SECURE_HEADERS_PROFILE=cross-origin
ALLOW_DEMO_WITHOUT_KEY=false
PUBLIC_DEMO=false
RATE_LIMIT_MAX_IP=20
RATE_LIMIT_MAX_LIVE_IP=5
GLOBAL_LIVE_MAX_PER_WINDOW=30
LLM_MAX_INFLIGHT=3
OG_RATE_LIMIT_MAX_IP=30
OG_MAX_INFLIGHT=2
```

### Misconfiguration = rate-limit bypass

If the origin is reachable on the public internet with `TRUST_PROXY=true` and empty `TRUSTED_PROXY_CIDRS`, clients can send a fake `CF-Connecting-IP` and mint a new rate-limit bucket. **Treat that as a P0 outage.**

## 4. Terraform / API sketch (optional)

```hcl
# Pseudocode — use Cloudflare Terraform provider rate_limit or ruleset resources
# https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs
```

Example Ruleset JSON export placeholder: [`deploy/cloudflare-rate-limit.rules.json`](../deploy/cloudflare-rate-limit.rules.json)

## 5. Verify

```bash
# From two machines / VPN exits
for i in $(seq 1 40); do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST https://api.yourdomain.com/api/oracle \
    -H 'content-type: application/json' \
    -d '{"mood":"I feel stuck between two futures today"}'
done
# Expect mix of 200 and 429 from CF and/or origin
```

## 6. What Cloudflare does **not** replace

- Content policy / soft refuse  
- Live LLM `max_tokens` / in-flight  
- `PUBLIC_DEMO` honesty  
- Auth (still anonymous by design)

## References

- [Cloudflare Rate limiting](https://developers.cloudflare.com/waf/rate-limiting-rules/)  
- [CF-Connecting-IP](https://developers.cloudflare.com/fundamentals/reference/http-request-headers/)  
- App design: `docs/blue-team-remediation-design.md` residual R3
