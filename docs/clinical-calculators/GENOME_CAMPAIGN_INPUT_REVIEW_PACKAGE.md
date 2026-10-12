# Genome Lab aggregate campaign inputs — engineering evidence

Status: human review unassigned; clinically_reviewed=false. This is a non-executable aggregate-count demonstration, not a patient measurement, biological construction system or clinically validated assessment.

Five counts start unknown. Users must enter explicit nonnegative whole counts; an optional labelled illustrative example retains the previous 285 designed, 285 assembled, 16 viable, 6 tested and 0 growth counts. Those numbers are not asserted to be a verified experiment or dataset.

The parser rejects blank, malformed, fractional, negative, nonfinite and unsafe integers. The maximum is JavaScript's intrinsic exact-integer bound, not a biological limit. Existing relationships remain: viable ≤ assembled ≤ designed and growth ≤ tested. No fraction is silently rounded and no blank is changed to zero.

Existing formulas and units remain:

- Assembly rate = assembled / designed.
- Viability rate = viable / assembled.
- Overall yield = viable / designed.
- No-growth screen = 1 − growth / tested.
- Display percentages = ratio × 100.
- Wilson 95% interval retains z=1.959963984540054 and the existing bounded formula in `src/lib/biology/phageResearchSandbox.ts`. Statistical context: E. B. Wilson (1927), DOI `10.1080/01621459.1927.10502953`; this does not validate the illustrative campaign or any clinical interpretation.

When a denominator has zero observations, the UI shows an unavailable rate, and no viability interval is presented for zero assembled observations. Explicit zero numerators with positive denominators remain valid. The existing engine's zero-denominator sentinel convention is preserved for compatibility and is not presented as a measured 0% or a zero-width confidence interval.

The separate virtual-candidate heuristic and its coefficients are unchanged and unvalidated. `executable=false` and all existing blocked capabilities remain intact. This change adds no sequences, synthesis export, laboratory protocol, host-range capability or biological optimization.

Reproducible checks:

```sh
node --experimental-transform-types --import=./scripts/uji/typescript-resolver.mjs scripts/uji/phage-campaign-inputs.mts
node --experimental-transform-types --import=./scripts/uji/typescript-resolver.mjs scripts/uji/phage-research-sandbox.mts
npm run uji
npm run build
GENOME_CAMPAIGN_QA_ORIGIN=http://127.0.0.1:4173 node scripts/qa/genome-campaign-input-smoke.mjs
```

Evidence includes a baseline unsafe-integer rejection failure, boundary and wrong-type tests, an exhaustive small-count interval/proportion property grid, unchanged sample rates, and actual built-client missing/invalid/zero/example recovery checks. These are technical checks, not clinical approval or evidence that six screened observations prove biological specificity. Reviewer identity, qualifications, approval date, reviewed version and signature remain unassigned.
