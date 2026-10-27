# T-CLIN Six-Pillar Human-Impact Gate (v1.1)

**Status:** Engineering governance, not clinical validation or medical-device authorization.  
**Canonical source:** [Clinical Utility Audit](../../governance/CLINICAL_UTILITY_AUDIT.json).  
**Machine-readable contracts:** [Six-Pillar Impact Gate](../../governance/T_CLIN_SIX_PILLAR_IMPACT_GATE.json).  
**Automated acceptance:** node --test scripts/qa/t-clin-six-pillar-impact.test.mjs.

## Product north star

T-CLIN may expand toward 1000+ only when scientific rigor and coherent human benefit justify it. Module count alone is not a clinical outcome. Every proposed T-CLIN should strengthen an existing user experience rather than invent a second patient state, an extra super-app or an unverified public medical claim.

1. **Clinical One OS:** patient journey, VisitOS, orders, referrals, results, follow-up and clinician-controlled decisions.
2. **Education Workflow:** case-based learning, anatomy–pathophysiology, clinical reasoning and clear explanations.
3. **Body Exposure:** anatomy-to-molecule visualization; distinguish measured patient state from exploratory simulation.
4. **Device & Monitoring:** permissioned device streams and longitudinal interpretation without invented measurements.
5. **Trust, Safety & Validation:** identity, consent, provenance, fail-closed safety, clinician authority and independent assessment.
6. **Adoption & Real-World Impact:** verified work completed, time saved, comprehension, accessibility and continuity of care.

These are six destinations within **one** operating system, not six parallel clinical databases. The existing Longitudinal Clinical Encounter Orchestrator remains the shipping priority under [Frontier Biomedical Discovery Directive](../../PANACEA_FRONTIER_BIOMEDICAL_DISCOVERY_DIRECTIVE.md) and [Current Wedge](../../governance/doctrine/PANACEA_CURRENT_WEDGE.md).

## Evidence-bounded pilot across six product pillars

The machine-checked pilot contains **nine** anchor contracts. It retains all five highest-priority clinical candidates selected by the canonical audit and adds four complementary modules to ensure every product pillar has at least one primary anchor. The new anchors are research, patient education, device support and continuity-of-care workflows, **not** proof of benefit or readiness for patient use.

| T-CLIN | Primary pillar | Prospective measurable endpoint | Baseline/result |
| --- | --- | --- | --- |
| 06 — ICD provenance | Clinical One OS | Approved provenance-linked ICD codes / eligible diagnoses | Not measured |
| 11 — Lab milestones | Clinical One OS | Reviewed and order-matched results / eligible diagnostic results | Not measured |
| 13 — Episode closure | Clinical One OS | Safe signed episode closures / eligible closure episodes | Not measured |
| 16 — Vital provenance | Trust, Safety & Validation | Rejected synthetic/unverified inputs / intentionally invalid vital inputs | Not measured |
| 17 — Referral handoff | Clinical One OS | Acknowledged and reconciled handoffs / eligible cross-facility handoffs | Not measured |
| 19 — Post-discharge outreach | Adoption & Real-World Impact | Documented timely outreach / eligible follow-up episodes | Not measured |
| 21 — Plain-language companion | Education Workflow | Comprehension demonstrated / evaluated participants | Not measured |
| 71 — Cell atlas reference | Body Exposure | Cell Ontology mappings concordant with reference / evaluated reference mappings | Not measured |
| 110 — CGM review | Device & Monitoring | Provenance-verified clinician reviews / eligible CGM review encounters | Not measured |

The canonical audit records T-CLIN-06/11/13/16/17/19/21 as E1_HEURISTIC and T-CLIN-71/110 as E2_WORKFLOW. These are **repository evidence classifications**, not clinical validation, and T-CLIN-71 remains research-only. None has externally established human benefit through this gate. Numerators/denominators are **prospective measurement definitions**, not observations.

For a prespecified, nonzero eligible cohort denominator:

\[
\mathrm{OutcomeRate} = \frac{\mathrm{Eligible\ cases\ with\ verified\ outcome}}{\mathrm{All\ eligible\ cases\ in\ cohort}}.
\]

Zero denominator means an undefined rate, not 0%. Record missingness, comparator, time window, uncertainty and independently reviewable provenance before reporting measurements. Keep baseline and observed values null until evidence is approved through a separate governance change.

## Mandatory requirements for future T-CLIN intake

- Describe a named user, real human problem, primary pillar, supporting pillar and existing surface to reuse.
- Prespecify a falsifiable result: numerator, denominator, cohort, comparison, measurement method, and expected failure criteria.
- Trace science to primary references; include data provenance and license/consent, intended use, truth class, safety controls and human signoff.
- Distinguish research simulation and education from clinical decision support; never promote synthetic outputs to actual measurements.
- Add positive, negative and boundary cases; absent/malformed evidence must fail closed.
- Prefer demonstrable human benefit over raw T-CLIN count. Preserve independent clinical review for clinical use.

For backlog triage only, an **unvalidated advisory portfolio heuristic** with inputs 0–100 is:

\[
P = 0.35C + 0.25I + 0.20E + 0.20A,
\]

where C = intended clinical/educational benefit, I = six-pillar integration, E = evidence quality and A = adoption feasibility. This score never offsets safety failure, missing provenance, absent consent, unlicensed sources or lack of qualified clinical review.

## Enforcement and honest limits

- The new test is discovered by the existing build command: node --test scripts/qa/*.test.mjs.
- It requires all six unique pillars to have a primary anchor; exactly nine contracts including the audit's top five; coherent numerator/denominator; canonical source category, validation status and evidence tier; appropriate authority for research vs clinician workflows; and no fabricated measured outcome or clinical-benefit claim.
- Thirteen negative controls mutate the contracts to check fake pillar, missing anchor, fabricated measured result, unjustified validation, wrong evidence tier, category promotion, forged validation status, wrong authority, missing denominator, duplicate IDs and incomplete six-pillar coverage.
- **v1.1 scope is deliberately nine audit-backed anchors only**. It does not certify every T-CLIN-01..120, future modules, predictive reliability, biological simulations, real-world efficacy or release acceptance. Broaden scope with a separately reviewed schema migration and test revision.
- No patient record, production clinical action, UI, treatment recommendation or signature authorization is modified in this PR.

**Required verification:** run the new test, existing clinical-utility audit test, and exact-head CI before merge. Green unit tests establish engineering properties, not patient outcome validation.
