# Claude Code Opus 5.5 — Autonomous Final 33% Completion Mission

**Owner directive date:** 2026-09-25  
**Repository:** `rizkyazhar486/Panacea`  
**Default branch:** `main`  
**Status:** Active execution directive beneath `PANACEA_CONSTITUTION.md`, `PANACEA_HUMANITY_10_CHARTER.md`, `PANACEA_PRODUCT_MATURITY_OS.md`, `AGENTS.md`, and the latest explicit owner instruction.

## Mission

Treat the remaining approximately 33% as a **production-readiness finishing mission**, not a request to inflate feature count.

The autonomous objective is:

[
RealCompletion = Functionality × Reliability × Integration × ClinicalSafety × Usability × ProductionReadiness
]

Continue executing without waiting for the owner to say **lanjut / continue** after each task.

Stop only when:
1. the current defined acceptance criteria are genuinely satisfied;
2. a hard external blocker requires unavailable credentials, irreversible owner approval, legal/licensing judgment, or another decision that cannot safely be inferred; or
3. the Claude Code session/context/usage limit physically prevents further execution.

Do not claim that model or platform limits can be bypassed. Before an unavoidable limit, leave the repository in a verified, resumable state.

## Continuous execution law

Repeat continuously:

```
INSPECT CURRENT MAIN
→ SELECT HIGHEST-VALUE BLOCKER
→ UNDERSTAND EXISTING IMPLEMENTATION
→ IMPLEMENT MINIMAL COHERENT FIX
→ RUN TARGETED VALIDATION
→ RUN RELEVANT ACCEPTANCE
→ REVIEW DIFF
→ COMMIT
→ PUSH
→ INSPECT EXACT-HEAD CI
→ REPAIR FORWARD IF NEEDED
→ VERIFY CURRENT MAIN
→ REASSESS
→ NEXT TASK
→ REPEAT
```

Do **not** stop after one commit. A commit is a checkpoint, not mission completion.

Do not ask:
- “Should I continue?”
- “Do you want me to commit?”
- “Should I push?”
- “Would you like me to fix the next issue?”

The standing owner answer is **yes, continue**, subject to the safety and escalation boundaries in this repository.

## Priority order

Unless current repository evidence requires a different dependency order:

1. clinical safety, security, privacy, and data-integrity blockers;
2. broken `main`, failing CI, build/typecheck/test failures;
3. broken core end-to-end workflows;
4. persistence/backend/data reliability;
5. authorization, consent, provenance, auditability;
6. interoperability and FHIR correctness;
7. canonical longitudinal patient-state consistency;
8. frontend runtime failures and unreachable flows;
9. mobile/responsive/accessibility failures;
10. Body Exposure integration, anatomy provenance, scientific accuracy, performance;
11. observability and deployment reliability;
12. UX friction and simplification;
13. visual polish;
14. net-new breadth only when it clears the repository’s research-to-implementation gate.

Default: **maturity and integration before new breadth**.

## Exact-head rule

Never use stale green CI as proof.

Before a material change:
1. read the latest `main` SHA;
2. inspect recent overlapping work;
3. build on the latest state;
4. preserve already-landed capability.

After a commit:
1. record the exact commit SHA;
2. inspect checks for that SHA;
3. if main moved, reassess against the new main;
4. repair failures forward;
5. never force-push or rewrite shared history.

## Auto-commit and auto-push

Commit coherent verified work automatically.

Use descriptive messages such as:

```
fix(area): repair concrete production blocker
feat(area): ship production-ready capability
test(area): add behavioral regression coverage
refactor(area): simplify while preserving behavior
docs(area): preserve operational truth
```

Before commit:
- inspect the diff;
- reject unrelated accidental changes;
- reject secrets;
- preserve concurrent useful work;
- run the most relevant targeted validation available.

Push completed verified work to `main` according to the current direct-main repository policy. Never weaken tests, safety, academic, biomedical, or security gates merely to obtain green status.

## Parallel-agent collaboration

Panaceamed is multi-agent.

Default behavior:

```
PRESERVE → UNDERSTAND → INTEGRATE → REPAIR → IMPROVE
```

Before touching a major area:
- inspect recent main changes;
- inspect likely overlap;
- avoid recreating another agent’s active implementation;
- prefer independent non-overlapping work when possible.

Never delete useful functionality merely because another architecture is preferred.

## Remaining-33% workstreams

### 1. Stabilization and CI

Drive the current exact head toward:
- production build passing;
- typecheck passing;
- critical frontend tests passing;
- critical server tests passing;
- stabilization/full acceptance passing;
- security baseline passing;
- deterministic non-flaky gates;
- deployment checks that reflect reality.

Diagnose root causes. Do not edit tests merely to hide failures.

### 2. Backend and persistence maturity

Audit and repair:
- persistence;
- migrations;
- concurrency;
- transactions where needed;
- idempotency;
- retry behavior;
- offline/online synchronization;
- stale-data handling;
- validation;
- authorization;
- audit trails;
- pagination;
- rate limiting;
- failure recovery.

Prototype-only persistence must not be represented as production durability.

### 3. Frontend production readiness

Audit high-value flows for:
- broken routes;
- blank states;
- dead CTAs;
- console/runtime errors;
- invalid forms;
- state loss;
- mobile overflow;
- inaccessible controls;
- duplicate navigation;
- confusing multi-step flows.

Apply ruthless simplicity without deleting capability. Hide complexity through progressive disclosure.

### 4. Canonical longitudinal health state

Converge real patient state across:
- laboratories;
- medications;
- vitals;
- wearables;
- symptoms;
- diagnoses;
- procedures;
- notes;
- patient-reported outcomes;
- care plans;
- daily check-ins;
- clinician review;
- follow-up.

Measured, reference, derived, simulated, AI-generated, and clinician-verified states must remain distinguishable.

### 5. Lab and personalized-medicine loop

Complete and validate:

```
capture
→ validate
→ normalize
→ longitudinal display
→ change detection
→ clinician review
→ action
→ recheck
→ measurable outcome
```

Never silently convert uncertain units. Preserve printed ranges and provenance when available.

### 6. Continuous-care loop

Complete:

```
clinician plan
→ patient input
→ offline-safe capture
→ synchronization
→ longitudinal persistence
→ rules/logic
→ clinician review
→ action
→ follow-up
```

Require idempotency, authorization, revocation handling, stale-plan handling, clear escalation semantics, and auditability.

### 7. Interoperability

Mature declared interoperability with:
- FHIR R4 correctness;
- stable identifiers;
- provenance;
- consent;
- clinician authorization;
- versioning;
- terminology mapping where genuinely implemented;
- safe import/export;
- explicit failure behavior.

Never fabricate integration support.

### 8. Clinical safety

Never present uncertain inference as verified clinical fact.

Preserve distinctions between:
- raw data;
- derived calculation;
- deterministic rule output;
- AI hypothesis/draft;
- clinician-reviewed conclusion.

Do not create autonomous diagnosis, prescription, procedure targeting, or emergency disposition where human review is required by the Panacea charters.

### 9. Body Exposure

Continue whole-body-first:

```
whole body
→ systems
→ organs
→ tissues
→ cells
→ organelles
→ molecules/pathways
→ genome/DNA
```

Body Exposure remains one shared projector, not disconnected demos.

Prioritize:
- provenance;
- anatomical accuracy;
- semantic zoom;
- persistent spatial context;
- physiology/pathophysiology;
- biomechanics;
- imaging;
- procedures/surgery education;
- pharmacology;
- mobile/WebGL performance.

Required references where applicable include:
- `thebuggeddev/anatomy`;
- Breath Atlas;
- `aycibatuhan/nervous-system-atlas`.

Do not copy unlicensed assets or invent microscopic precision.

### 10. AI-EMR / clinical workspace

Converge around one clinical operating workspace integrating:
- timeline;
- labs;
- medications;
- vitals;
- imaging context;
- findings;
- Body Exposure overlays;
- notes;
- decision support;
- follow-up.

AI may assist summarization, retrieval, prioritization, explanation, differential support, longitudinal context, and structured documentation, while clinician-reviewed truth remains visually and semantically distinct.

### 11. Longevity / wellness / prevention

Mature existing domains using evidence and real data where available:
- sleep;
- recovery;
- HRV;
- exercise;
- VO₂max;
- nutrition;
- metabolic health;
- cardiovascular risk;
- body composition;
- mental wellness;
- preventive care;
- wearable integrations;
- biological-age concepts with explicit limitations;
- validated genomics/pharmacogenomics;
- longitudinal personal baselines.

No pseudoscientific certainty.

### 12. Mobile, accessibility, observability, deployment

Test critical paths on realistic phone widths, including around 390 px.

Reject:
- horizontal overflow;
- clipped dialogs;
- hidden primary actions;
- unusable dense tables;
- focus traps;
- inaccessible forms.

Maintain pragmatic observability without logging sensitive health information unnecessarily.

Verify real deployment behavior where access exists. Never claim production verification without evidence.

## Task definition of done

A task is complete only when the relevant subset is satisfied:
- implementation exists;
- integrated into the actual workflow;
- types/build are acceptable;
- targeted tests pass;
- regression coverage exists when justified;
- authorization/safety boundaries are preserved;
- mobile state is usable if user-facing;
- operational truth is updated only when needed;
- commit exists;
- push succeeded;
- exact-head CI is inspected;
- result is present on current main.

Code written but unintegrated is not done.

## Mission definition of done

Do not claim “100%” because many files or features exist.

A current baseline is accepted only when:
- current main builds;
- required critical frontend/server/stabilization/security checks pass;
- core user workflows have no major dead ends;
- persistence and authorization are trustworthy for the declared scope;
- clinical representations maintain provenance and uncertainty;
- declared interoperability works for its stated scope;
- critical mobile flows are usable;
- deployment path is documented and verified to the extent available;
- no known critical security or clinical-safety defect remains;
- maintainers can continue from repository state without reconstructing hidden context.

After that, transition to the Constitution’s **Continuous Evolution Mode** rather than stopping product development.

## Anti-slop law

Do not optimize for number of commits, lines of code, widgets, pages, or feature count.

Reject:
- fake buttons;
- placeholder features presented as done;
- fabricated real-time integrations;
- fake patient data presented as real;
- duplicate routes without system value;
- TODO-heavy skeletons;
- decorative dashboards without workflow;
- abstractions without immediate value.

Use:

[
UseCase = Who + Problem + Promise + Proof
]

Prefer measurable outcomes over output volume.

## Priority heuristic

For ordinary engineering work:

[
Priority =
rac{UserImpact × RiskReduction × DependencyUnblocking × Confidence}{Effort}
]

Clinical-safety, security, privacy, and data-integrity blockers override the heuristic.

## Context / usage-limit protocol

Claude Code cannot bypass hard usage or context limits.

Use available capacity for verified repository progress.

When approaching an unavoidable limit:
1. finish the smallest safe coherent unit;
2. run targeted validation;
3. commit;
4. push;
5. record the exact main SHA and latest verified commit;
6. record current failing checks;
7. identify current unfinished task;
8. identify the single next exact action;
9. leave a concise durable continuation note in the established repository task ledger or handoff location.

Continuation shape:

```
PANACEA AUTONOMOUS CONTINUATION STATE

main_sha:
working_branch:
latest_verified_commit:

completed_this_session:
-

current_blocker:
-

failing_checks:
-

current_task:
-

next_exact_action:
-

next_priority_after_that:
-

files_in_scope:
-

known_overlap_do_not_overwrite:
-

verification_commands:
-
```

Do not spend the final context window writing a long retrospective.

## Resume behavior

When a later Claude Code session starts:
1. read latest main;
2. read this directive plus `CLAUDE.md`, `AGENTS.md`, and canonical charters;
3. inspect recent commits and exact-head checks;
4. read continuation state if present;
5. resume the next concrete action;
6. do not redo already-landed work.

## Start / continue directive

Every session governed by this document should behave as if the owner has already said **“lanjut”** after each verified task.

```
DO WORK
→ VERIFY
→ COMMIT
→ PUSH
→ INSPECT CI
→ REPAIR/INTEGRATE
→ VERIFY MAIN
→ NEXT TASK
→ REPEAT
```

Use the available Opus 5.5 capacity this week primarily for **verified production progress**, not token consumption for its own sake.
