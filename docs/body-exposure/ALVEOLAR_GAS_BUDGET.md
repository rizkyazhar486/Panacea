# Alveolar gas budget increment

The existing respiratory workspace retains its schematic model and exposes one
collapsed, unit-based educational zoom. No new route or patient truth store.

The pure domain engine composes two producers through the existing physiological
runtime: ventilation partition → ideal alveolar CO₂/O₂. Every output is simulated,
versioned and linked to its upstream ventilation provenance. Evaluation occurs at
t=0: this is a steady-state relationship, not breath-cycle dynamics or a patient
trajectory. The frequency sweep calls the same evaluator as the metric cards.

Equations and source metadata extend the existing `src/lib/ecmo/bukti.ts` registry.
VT and VD use mL BTPS; ventilation uses L/min BTPS; VCO₂ uses mL/min STPD.

`VA = (VT − VD) f / 1000`

`PACO2 = 0.863 VCO2 / VA`

`PAO2 = FiO2 (760 − 47) − PACO2 [FiO2 + (1 − FiO2) / RQ]`

The last expression is an algebraic rearrangement of the Appendix's ideal
alveolar-air RER equation, preserving the FiO₂ correction. The legacy simplified
gas-alveolar teaching module remains unchanged. No PaO₂ or SpO₂ is estimated.

Reference: Van Iterson EH, Smith JR, Olson TP. Alveolar air and O2 uptake during
exercise in patients with heart failure. J Card Fail. 2018;24(10):695–705.
doi:10.1016/j.cardfail.2018.08.001. PMID:30103021. PMCID:PMC6269087 (Appendix).
Source equations support the calculation, not validation of Panacea scenarios.

Unsupported scalar inputs, VD ≥ VT, negative O₂ tension, and gas mixtures above
available dry-gas pressure fail closed. Curve gaps are null. Unknown uncertainty
remains null. Teaching envelopes are software ranges, not normal values or
ventilator prescriptions. No patient data are read, generated or written.

Validation: golden values, ventilation conservation, equal minute-ventilation
contrasts, frequency response, FiO₂=1/RQ invariance, every scalar validation,
unsupported mixtures, null curve gaps, determinism, non-mutation, provenance,
source resolution and existing respiratory reachability tests.

UI and pure-engine entry points are separate so offline consumers do not load
JSX. The exact public-API/file inventory test is updated for this additive
capability; personalization constraints and purity assertions remain intact.

Local browser verification is pending: the sandbox has no Chromium executable
and the Playwright download returned a corrupt archive. Full exact-head CI and
Stabilization Acceptance remain required before merge. This increment does not
deliver 10K source textures or demonstrate superiority to commercial games.

## Dead-space and shunt identities panel

A second collapsed panel in the same respiratory workspace (no new route, no new patient truth store) exposes the two
algebraic identities in `gasExchangeIdentities.ts`: `VD/VT = (PaCO2 − PeCO2) / PaCO2` (Enghoff modification) and
`Qs/Qt = (CcO2 − CaO2) / (CcO2 − CvO2)`. The person types their own measured values: nothing is prefilled, a blank field
is "not entered" (never zero, while a typed `0` is a value), a comma decimal is accepted, and impossible combinations are
refused with the engine's reason instead of being clamped. The result is truth class `derived`, drawn as two labelled
shares of 100%, with the formula, the engine's limitations and PubMed links. No value is stored, interpreted or compared
with a normal range.

Honest limits: sources were read from PubMed abstracts only; the algebraic form of Qs/Qt was not printed in any abstract
read (`formVerified: false`), and below 100% inspired oxygen the result is venous admixture, not pure shunt. The panel
cannot detect mixed units between its fields. Not a diagnosis, ventilator target or clinical recommendation.

Validation: `scripts/uji/gas-identity-panel.mts` (unit, with four sabotage mutations) and
`scripts/qa/gas-exchange-identities-smoke.mjs` (real workspace at 390x844; wired into Stabilization Acceptance).
