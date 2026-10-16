# Clinical review deferral — owner decision of 2026-10-17

**Decision (Product Owner):** formal clinical review is **out of scope for Alpha**. It moves to the subsequent **Clinical Validation** phase. This record applies the decision to the canonical ledger and the documentation; it does not claim any clinical approval.

## What changed

| Item | Before | After |
| --- | --- | --- |
| C6 status | `PENDING_CLINICAL_REVIEW` | `DEFERRED_TO_CLINICAL_VALIDATION` (with a complete `deferral` record: who decided, when, reference, target phase, original acceptance) |
| C6 acceptance text for Alpha | an authorised reviewer signs the ranges of every calculator | engineering acceptance only (independent references, hostile-input matrices, mutation checks, fail-closed behaviour); formal clinical approval is not an Alpha requirement |
| Alpha denominator | 45 | **44 active** (45 records kept); the deferred criterion is not counted and earns no credit |
| Alpha progress | VERIFIED / 45 | VERIFIED / 44 (see `docs/alpha/ALPHA_ACCEPTANCE_LEDGER.md`, generated from `governance/ALPHA_ACCEPTANCE_LEDGER.json`) |

## What did **not** change (explicit safeguards)

- C6 is **not VERIFIED** and is **not clinically validated**. `clinically_reviewed` stays `false` everywhere it exists; no reviewer name, date, version or signature was invented.
- The original acceptance text, the previous status and the previous owner are preserved inside the criterion's `deferral` record; the historical review findings in `docs/clinical-calculators/ENGINEERING_REVIEW_DOSSIER.md` and the per-calculator review packages are untouched.
- Per-calculator review states in `governance/CALCULATOR_REVIEW_REGISTRY.json` and the on-screen labels ("Technical output. Not clinician-reviewed or clinically validated.") are unchanged: they describe each function and remain true.
- No clinical safety check, input validation, numerical-correctness test, mutation check or fail-closed behaviour was removed or relaxed. The ledger gate itself got stricter: a deferral is only honoured when its record is complete, never earns credit, cannot be attached to a non-deferred criterion, and cannot shrink the 45 recorded criteria (`scripts/uji/alpha-ledger.mts`, each rule proven by a named failing mutant).
- Unvalidated clinical decision-support functions remain **restricted to non-clinical testing** until Clinical Validation is completed and approved.

## Entry conditions for the Clinical Validation phase (not started)

1. Name an authorised reviewer and record identity, date and approved version for each calculator range.
2. Resolve the reviewer-only items listed in the engineering dossier (unsourced constants and bands, two duplicated sodium/potassium implementations that disagree, the Framingham coefficients not yet re-derived from the primary source, `graceScore` points table).
3. Only after approval may `clinically_reviewed` change, per function, with evidence.

Clinical validation remains an explicit requirement **before deployment for real clinical decision-making.**
