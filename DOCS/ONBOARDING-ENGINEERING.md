# Onboarding — engineering owner & product/UX

Two human roles now share the work with the founder (clinical owner) and AI agents:

| Role | Owns | Does not own |
|---|---|---|
| Engineering owner | production backend, database, deployment, integrations, code quality, technical accountability | clinical rules/thresholds, clinical sign-off |
| Product/UX | doctor & patient workflows, usability, information architecture, design system | clinical content correctness |
| Founder (physician) | clinical safety, clinical review, prospective validation | — |

## Run it (15 minutes)

```bash
npm ci && (cd server && npm ci)
cd server && PORT=8787 JWT_SECRET=dev npx tsx src/index.ts   # backend
VITE_API_URL=http://127.0.0.1:8787 npx vite                   # frontend, other terminal
npm run uji            # all gates: must print N/N berkas uji lulus
(cd server && npm run uji)
```

`server/` is deployed on its own: it cannot import `src/lib`. Clinical kernels run in the browser; the server is the trust boundary (auth, consent, validation, audit).

## Read first (in order)

1. `CLAUDE.md`: working contract and hard boundaries (short sections: *Maturation phase*, *Ruthless simplicity*).
2. `governance/MATURITY_REGISTRY.yaml`: what is FUNCTIONAL, known gaps, next action per workflow.
3. The flagship workflow end-to-end:
   `src/lib/lab.ts` → `src/lib/labSync.ts` → `server/src/labLog.ts` → `server/src/labFhir.ts` (FHIR R4 + consent + review)
   → `src/lib/labLongitudinalBridge.ts` → `src/lib/panaceaLongitudinalState.ts` → `src/lib/hasilTerukurLab.ts` (outcome measures).

## House rules

- Direct-to-main, small coherent commits; never force-push. Every behaviour change ships with a gate in `scripts/uji/` (or `server/uji/`) that you have seen fail once by sabotage.
- Never fabricate clinical data, device support, reviewer identity or LOINC/UCUM codes (verified registry only: `server/src/mcp/verifiedTerminologyRegistry.ts`).
- Report *technically works*, *clinically reviewed*, *clinically validated* as separate states.
- Code comments may be Indonesian; UI copy is English first.

## Highest-value first tasks

**Engineering owner**
1. Replace the single-node JSON/Mongo store for lab log, shares, reviews and care plans with a real database schema + migrations; keep the consent/audit semantics and the existing gates green.
2. Production deployment with secrets management, backups, structured logs and error monitoring; document restore.
3. Security review of auth/consent routes (`/api/lab-log/*`, `/api/clinician/*`, `/api/care/*`): rate limits, token lifetime, audit completeness.
4. SATUSEHAT sandbox path for the existing FHIR Observation/QuestionnaireResponse bundles.

**Product/UX**
1. Usability test the flagship loop with 3–5 patients and 2–3 doctors (enter/paste lab → trend → share → doctor review → recheck); record task time and errors.
2. Consolidate the lab card, share and doctor view into one design-system pattern (390×844 first).
3. Information architecture pass: every major capability ≤2 interactions from Home; secondary tools behind disclosure.
