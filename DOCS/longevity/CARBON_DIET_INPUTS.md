# Carbon Diet: explicit recorded quantities

This completes the existing #2411 input-validation candidate while preserving its contributor's commit ancestry and the existing food factors, reference table and arithmetic.

A blank serving field is unknown, not a zero intake. Explicit zero and decimal servings remain representable; negative, malformed, non-finite and over-cap values are rejected. The existing candidate's 100 servings/week cap is a provisional input bound, not a nutritional or clinical threshold.

Only recorded quantities contribute to the educational subtotal. Partial records are labelled with the number of known categories and do not show comparisons against full-diet reference values. Rejected inputs suppress estimates until corrected. All twelve explicit zeros produce a valid zero result. The existing projection remains weekly subtotal × 52, using the unchanged global-average food factors; it is not a measured personal emissions audit.

Food records reuse the account/self-subject browser-cache adapter introduced by #2485. Remount on identity change, hide invalid/expired or mismatched sessions, and recheck before delayed writes. Guest entries are ephemeral. Unknown-owner legacy storage remains untouched and is not automatically adopted; ambiguous legacy zeros are not presented as explicitly supplied new quantities.

Tests:

```sh
node --experimental-transform-types --import=./scripts/uji/typescript-resolver.mjs scripts/uji/carbon-diet-sajian.mts
npm run uji
npm run build
CARBON_DIET_QA_ORIGIN=http://127.0.0.1:4173 node scripts/qa/carbon-diet-input-smoke.mjs
```

The pure tests preserve known formula outputs (2 beef servings + 3 rice servings = 24.62 kg CO₂e/week). Browser tests cover missing/invalid/zero/decimal recovery, partial-record labels, all-zero results, account isolation/restoration and cross-tab mismatch against the actual built client at 390×844. Synthetic client/cache tests are not clinical validation, real-server persistence or full Alpha E2E acceptance. Human review remains unassigned.
