# Contributing to VibeOracle

Thanks for caring about a weird little oracle.

## Product rules (non-negotiable)

1. **Pure vibe, not evidence** — don’t dress engines as science.  
2. **No silent live → demo** on LLM failure.  
3. **Engines are local only** — no `fetch` / network inside `server/src/engines/`.  
4. **Policy before live spend** — content checks before `acquireLiveBudget` / LLM.  
5. **Confidence is theatrical** — keep `confidenceTheater` in the documented range and UI copy honest.

## Dev setup

```bash
cp .env.example .env
npm install
npm run dev
npm run check
```

## Adding a thin engine

1. Create `server/src/engines/your-engine.ts` that returns structured facts.  
2. `registerEngine({ id, description, run })` in `registry.ts`.  
3. Add `your-engine.test.ts` that calls the **real** function + `buildFacts` if stamped.  
4. Extend client `types.ts` if the UI should show the fact.  
5. Log the source in `docs/parts-registry.md` harvest log.

## PR checklist

- [ ] `npm run check` passes  
- [ ] New pure logic has unit tests (no mock of the unit under test)  
- [ ] No secrets committed  
- [ ] README product story unchanged unless intentional  

## Good first issues

- Extra deck cards (original copy only)  
- Policy fixtures for more languages (with tests)  
- Landing microcopy / a11y  
- Demo GIF / screenshots for `docs/assets/`

## Code of conduct (short)

Be kind. No harassment. This is entertainment software — don’t use it to harm people.
