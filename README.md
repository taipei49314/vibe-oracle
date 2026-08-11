# VibeOracle

**The OS for your next chapter.**  
One mood in → archetype, three actions, a weekly taboo, a shareable card.

> Not evidence. Pure vibe.  
> No `INSUFFICIENT_EVIDENCE`. Confidence is theatrical.

Medium synthesis:

| Layer | Borrowed spirit | Implementation |
|-------|-----------------|----------------|
| Shell | FortuneTeller-style | Vite + React + Tailwind |
| Ritual | Arcana-style | 3-card emotion deck |
| Engines | mingyu/taibu shape | local deck + day-seed → `facts[]` |
| Framing | personality reading | Archetype + share card |
| LLM | SpaceXAI / xAI | `XAI_API_KEY` or full demo mode |

## Quick start

```bash
cd vibe-oracle
cp .env.example .env
# optional: XAI_API_KEY=... for live readings

npm install
npm run dev
```

- Client: http://localhost:5173  
- API: http://localhost:8787  

Without `XAI_API_KEY`, the API still returns a complete **demo** report.

## Scripts

| Command | What |
|---------|------|
| `npm run dev` | API + client |
| `npm test` | Vitest (engines + HTTP) |
| `npm run build` | client + server |
| `npm run check` | test + build |
| `npm run smoke` | hit a running API |

## API

### `GET /api/health`

```json
{ "ok": true, "name": "VibeOracle", "hasKey": false, "demoAllowed": true }
```

### `POST /api/oracle`

```json
{
  "mood": "I keep starting things and abandoning them at 80%",
  "seed": "optional",
  "drawCount": 3,
  "date": "2026-08-11"
}
```

Response: `{ mode, seed, ritual, facts, report }` where `report` has
`archetype`, `actions[3]`, `taboo`, `report`, `confidenceTheater`, `shareLine`.

## What this is not

- Not medical, legal, or investment advice  
- Not a deterministic research harness  
- Not a full bazi / ziwei stack  

## License

MIT
