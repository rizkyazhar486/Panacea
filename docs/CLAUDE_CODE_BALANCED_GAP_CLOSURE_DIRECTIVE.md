# Claude Code — Balanced Gap Closure → Body Exposure → Final UI/UX Directive

**Owner directive date:** 2026-09-25  
**Repository:** `rizkyazhar486/Panacea`  
**Status:** Active owner sequencing directive. This document overrides older default sequencing when those documents conflict with the order below, while preserving the Constitution, Humanity 10 Charter, Product Maturity OS, scientific/safety gates, and the long-term longevity mission.

## Mission

Finish Panaceamed by closing the **largest real maturity gaps first**, bringing the major product systems to a reasonably even maturity floor, then make **Body Exposure the dominant implementation focus**, and reserve **UI/UX visual finishing touches for the final phase**.

Do not optimize for feature count, commit count, lines of code, page count, or visual novelty.

The working objective is:

[
BalancedCompletion = min(CoreMaturity) 	imes Integration 	imes Reliability 	imes ClinicalSafety 	imes EvidenceQuality
]

The minimum maturity of the core system matters more than making the strongest area even stronger while another core area remains weak.

## Non-negotiable rule: weakest important system first

At the start of every autonomous cycle:

1. inspect current `main`;
2. inspect `governance/MATURITY_REGISTRY.yaml`, `governance/RISK_REGISTRY.yaml`, current exact-head CI, and relevant acceptance evidence;
3. identify the **largest material gap among core systems**;
4. work on that gap until either:
   - it reaches the current maturity floor;
   - a harder dependency becomes the true blocker; or
   - progress requires an external human/credential/legal/clinical action that cannot be fabricated;
5. record the blocker and immediately move to the next largest software-addressable gap;
6. repeat until the major systems are reasonably level.

Do not spend multiple sessions polishing an already-strong subsystem while a weaker core workflow remains unknown, unvalidated, disconnected, or unsafe.

## Gap priority heuristic

Use this only as an engineering prioritization heuristic:

[
GapPriority =
rac{
GapSeverity 	imes ClinicalImportance 	imes RiskReduction 	imes IntegrationUnblocking 	imes EvidenceConfidence
}{
Effort 	imes RegressionRisk
}
]

Clinical safety, security, privacy, data integrity, broken `main`, and failing critical CI override the heuristic.

Do not invent precise percentages when the denominator is not trustworthy. Prefer repository-backed maturity states and named evidence.

---

# Phase order

## Phase 0 — hard blockers always preempt everything

Immediately repair:
- failing exact-head CI / build / typecheck / critical tests;
- clinical-safety defects;
- security/privacy defects;
- data-loss/corruption risks;
- broken authorization/consent/audit paths;
- production-breaking runtime failures.

When these are green, return to the phase sequence below.

---

## Phase 1 — Human clinical validation enablement FIRST

This is currently the largest strategic maturity gap and therefore the first lane.

Claude Code must **not fabricate human validation**. Code can make validation possible, measurable, reproducible and auditable, but only real qualified humans can supply real clinical review/validation.

### Build everything required to make real validation executable

Prioritize:
- prospective clinician-validation protocol scaffolding for declared workflows;
- clinician usability-test workflow and structured feedback capture;
- case-review/adjudication workflow;
- blinded or appropriately controlled evaluation paths where applicable;
- reviewer identity, credential, timestamp, scope and conflict-of-interest metadata;
- provenance for every reviewed claim/output;
- disagreement and override capture;
- safety-event / near-miss reporting;
- versioned model/system identity for every evaluation;
- frozen evaluation datasets where ethically and legally appropriate;
- metric definitions before evaluation begins;
- exportable validation reports;
- audit trails that cannot silently rewrite prior review;
- separation of engineering acceptance from clinical validation;
- IRB/ethics/consent boundary documentation when human-subject research requires it.

### Minimum evaluation families

Where applicable to the feature being validated:
- correctness;
- omission rate;
- hallucination / unsupported-claim rate;
- harmful recommendation rate;
- clinician override rate;
- inter-rater agreement;
- time-to-review / workflow efficiency;
- usability and error recovery;
- subgroup/error analysis only when data and governance permit it;
- calibration/uncertainty behavior for systems that produce probabilities;
- longitudinal follow-up/process outcomes for care workflows.

### Stop condition for this phase

Do **not** mark clinical validation complete just because tooling exists.

This phase may be considered software-ready when:
1. the validation protocol is explicit;
2. metrics are defined;
3. reviewer workflow exists;
4. provenance/audit/versioning exists;
5. test cases/datasets can be frozen and reproduced;
6. results can be exported and reviewed;
7. the only remaining blocker is genuine external human execution or governance approval.

When external execution is the blocker, record it explicitly in the maturity/risk registry and move to Phase 2 rather than waiting idly.

---

## Phase 2 — AI-EMR / longitudinal clinical operating system

After validation enablement is software-ready or externally blocked, focus on the AI-EMR and clinical workspace.

Target one coherent clinician workflow:

[
PatientData
ightarrow CanonicalPatientState
ightarrow LongitudinalReview
ightarrow EvidenceAwareReasoning
ightarrow ClinicianReview
ightarrow Action
ightarrow FollowUp
ightarrow UpdatedPatientState
]

### Required convergence

Unify, without pretending unsupported integration exists:
- demographics;
- problems/diagnoses;
- medications;
- allergies;
- laboratory results;
- vitals;
- wearable/remote monitoring data;
- symptoms and patient-reported outcomes;
- notes;
- procedures;
- imaging context;
- care plans;
- daily check-ins;
- Body Exposure spatial overlays;
- clinician review;
- follow-up/outcomes.

### State semantics must remain explicit

Every important datum/output must preserve whether it is:
- measured/raw;
- imported;
- clinician-entered;
- derived deterministic calculation;
- deterministic rule output;
- AI-generated hypothesis/draft;
- simulated;
- reference/educational;
- clinician-reviewed/verified;
- unavailable/unsupported.

### AI behavior

AI may assist:
- retrieval;
- summarization;
- longitudinal change detection;
- differential support;
- evidence retrieval;
- prioritization;
- documentation drafting;
- explanation;
- follow-up preparation.

Do not silently convert AI output into verified diagnosis, prescription, emergency disposition, procedure target, or clinician-authenticated truth.

### Exit condition

Move onward when the highest-value patient-review workflow is end-to-end, persistent, provenance-aware, auditable, testable, and has no major dead end.

---

## Phase 3 — Raise the remaining core systems to the same maturity floor

After Phase 2, repeatedly choose the weakest remaining core lane rather than following a rigid feature list.

Expected lanes include:

### 3A. Continuous-care / follow-up loop
[
ClinicianPlan ightarrow PatientInput ightarrow Sync ightarrow Review ightarrow Action ightarrow FollowUp
]

Require:
- offline-safe capture;
- idempotency;
- stale-plan behavior;
- clear escalation semantics;
- clinician/patient role separation;
- revocation handling;
- outcome tracking.

### 3B. Backend and persistence
Raise durability around:
- production database/storage;
- migrations;
- concurrency;
- transactions where justified;
- idempotency;
- retry/recovery;
- pagination;
- validation;
- rate limits;
- backups/recovery;
- observable failures.

Prototype storage must never be described as production durability.

### 3C. Interoperability
Mature only what is genuinely implemented:
- FHIR R4 resources;
- stable identifiers;
- provenance;
- terminology mappings;
- consent;
- versioning;
- import/export;
- explicit error behavior.

### 3D. Safety / security / governance
Close material gaps in:
- least privilege;
- authorization;
- consent;
- audit;
- secrets handling;
- PHI-safe logging;
- provenance;
- change history;
- model/version traceability.

### 3E. Longevity / prevention / personalized medicine
Preserve the long-term product center, but mature it through real longitudinal state rather than isolated feature expansion:
- blood panels;
- personal baselines;
- early deviation detection;
- sleep/recovery;
- HRV;
- fitness/VO2max;
- nutrition;
- body composition;
- cardiovascular/metabolic risk;
- mental wellness;
- genomics/pharmacogenomics when validated and real;
- biological-age concepts with explicit limitations.

### 3F. Deployment / observability / real-world reliability
Verify:
- actual deployment behavior;
- error reporting;
- health checks;
- background jobs;
- retry semantics;
- mobile/network degradation;
- operational runbooks;
- no sensitive logging.

---

# Maturity leveling gate

Do not switch to Body Exposure dominance merely because the team is tired of core-platform work.

The core system is **balanced enough** when, based on repository evidence:

1. no critical workflow remains `UNKNOWN` without a current audit;
2. no core workflow is below a usable `FUNCTIONAL` state unless it is explicitly externally blocked;
3. clinical validation tooling is software-ready and any remaining human validation is recorded as a real external dependency;
4. AI-EMR patient review has a coherent end-to-end path;
5. persistence/auth/consent/audit/FHIR do not have known critical blockers for the declared scope;
6. exact-head critical CI is green;
7. no unresolved P0/P1 clinical-safety, security, privacy or data-integrity defect remains;
8. the largest remaining software-addressable gap is no longer dramatically below the strongest core area.

This is a **maturity floor**, not a cosmetic score target.

---

# Phase 4 — Body Exposure becomes the dominant focus

Once the maturity-leveling gate above is satisfied, allocate the majority of implementation attention to Body Exposure.

Default emphasis:
- **Body Exposure: dominant lane**
- core-platform regression/security/clinical blockers: interrupt-driven maintenance
- cosmetic UI/UX polish: still deferred

## Body Exposure order

Keep the existing whole-body-first law:

[
WholeBody
ightarrow Systems
ightarrow Organs
ightarrow Tissues
ightarrow Cells
ightarrow Organelles
ightarrow Molecules/Pathways
ightarrow Genome/DNA
]

Do not jump into microscopic detail while organism/system/organ coverage still has evidence or geometry debt.

## Body Exposure priorities

1. one persistent unified projector/state graph;
2. trustworthy whole-body/system coverage;
3. source provenance and academic-review boundaries;
4. semantic zoom and spatial continuity;
5. organ/system anatomy depth;
6. physiology;
7. pathophysiology;
8. biomechanics and movement;
9. imaging / DICOM / radiology;
10. pharmacology/mechanism overlays;
11. procedures and surgery education;
12. cell/metabolism;
13. molecular/genomic depth;
14. performance, streaming, mobile/WebGL stability.

Required reference families remain applicable where relevant:
- `thebuggeddev/anatomy`;
- Breath Atlas;
- `aycibatuhan/nervous-system-atlas`;
- source-backed HRA/Z-Anatomy/BodyParts3D assets already admitted by repository provenance rules.

Do not copy unlicensed assets. Do not label reference geometry as patient-specific. Do not invent microscopic precision.

## Body Exposure completion principle

A beautiful isolated demo is not progress if it does not improve the shared projector.

Prefer:
[
SharedState + SharedScene + SharedProvenance + DomainPlugins
]

over:
[
ManyDisconnectedPages
]

---

# Phase 5 — UI/UX FINISHING TOUCH LAST

**Visual finishing is intentionally last.**

Until the earlier phases are sufficiently mature, do not spend major effort on:
- decorative motion;
- cosmetic redesigns;
- gradients/background effects;
- visual novelty;
- card restyling;
- micro-animation;
- purely aesthetic spacing refinement;
- branding polish.

### Important distinction

The following are **not cosmetic polish** and may be fixed earlier because they affect safety/function:
- inaccessible controls;
- broken mobile layouts;
- clipped primary actions;
- unreadable critical information;
- focus traps;
- dead buttons;
- confusing clinical state;
- missing loading/error/empty states;
- navigation that makes a core workflow unreachable;
- interaction that can cause duplicate submission or data loss.

### Final finishing objectives

Only after maturity leveling and the major Body Exposure work:
- unify visual language;
- simplify navigation;
- remove redundant chrome;
- refine responsive behavior;
- improve hierarchy and typography;
- smooth transitions/motion;
- reduce visual noise;
- polish command-center aesthetics;
- preserve ruthless simplicity;
- keep major flows within minimal interactions;
- run final accessibility/mobile/browser review.

The final UI should make the mature system feel simpler, not hide unfinished engineering behind polish.

---

# Autonomous execution loop

Repeat continuously:

```
READ CURRENT MAIN
→ CHECK HARD BLOCKERS
→ READ MATURITY/RISK REGISTRIES
→ IDENTIFY WEAKEST IMPORTANT CORE LANE
→ IMPLEMENT THE HIGHEST-LEVERAGE COHERENT SLICE
→ RUN TARGETED TESTS
→ RUN RELEVANT ACCEPTANCE
→ REVIEW DIFF
→ COMMIT
→ PUSH
→ INSPECT EXACT-HEAD CI
→ UPDATE SOURCE OF TRUTH
→ REASSESS MATURITY FLOOR
→ NEXT GAP
```

After the maturity-leveling gate passes:

```
BODY EXPOSURE DOMINANT LOOP
→ whole-body evidence debt
→ systems
→ organs
→ shared physiology/pathophysiology
→ imaging/biomechanics/procedures
→ smaller scales
→ validate
→ commit/push
→ exact-head CI
→ repeat
```

Only then:

```
FINAL UI/UX POLISH
→ simplify
→ harmonize
→ accessibility
→ responsive/mobile
→ visual refinement
→ regression test
```

Do not stop after one coherent commit. A commit is a checkpoint.

---

# Source-of-truth update requirement

When meaningful progress changes maturity:
- update `governance/MATURITY_REGISTRY.yaml`;
- update `governance/RISK_REGISTRY.yaml` if risks change;
- update `governance/RND_BACKLOG.yaml` when priorities materially change;
- update evidence/acceptance notes only with verifiable facts.

Never mark human clinical validation, academic review, production integration, deployment, or external review as complete without real evidence.

---

# Copy-paste startup prompt for Claude Code

Use this prompt at the beginning of a Claude Code session:

> Work autonomously on `rizkyazhar486/Panacea` from the newest `main`. Read `CLAUDE.md`, `AGENTS.md`, `PANACEA_CONSTITUTION.md`, `PANACEA_HUMANITY_10_CHARTER.md`, `PANACEA_PRODUCT_MATURITY_OS.md`, `docs/CLAUDE_CODE_OPUS_5_5_FINAL_33_AUTONOMOUS.md`, and **`docs/CLAUDE_CODE_BALANCED_GAP_CLOSURE_DIRECTIVE.md`** before changing code. The latest owner sequencing is: **hard blockers first; then close the largest maturity gap starting with human clinical-validation enablement; then AI-EMR/longitudinal clinician workflow; then repeatedly raise the weakest remaining core systems until maturity is reasonably even; after that make Body Exposure the dominant focus; cosmetic UI/UX finishing touch comes last.** Do not fabricate human clinical validation—build the protocols, reviewer workflow, metrics, provenance, audit and reproducible evaluation infrastructure, record genuine external-human blockers, then continue to the next software-addressable gap. Do not optimize for feature count or visual novelty. Preserve direct-to-main policy: inspect latest main, implement one coherent high-value slice, validate, commit, push, inspect exact-head CI, update maturity/risk source of truth, then immediately continue without asking me to say “lanjut”. Never weaken clinical, academic, security, privacy, data-integrity or provenance gates to obtain green CI. Accessibility, broken mobile flows, dead actions and unsafe UX are functional defects and can be repaired early; **cosmetic polish remains the final phase**.

