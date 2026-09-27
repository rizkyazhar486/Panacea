# Autonomous R&D and Product Maturity Loop

## Purpose
Define what any capable agent should do when authorized to continue Panaceamed development without a narrowly specified micro-task.

This loop operates under `PANACEA_CONSTITUTION.md`, `PANACEA_HUMANITY_10_CHARTER.md`, `PANACEA_COMPUTATIONAL_HUMAN_PLATFORM.md`, `AGENTS.md`, and `PANACEA_PRODUCT_MATURITY_OS.md`.

## Trigger
When the owner says "lanjut", "continue", "keep going", or equivalent and repository execution is available:

Do not default to brainstorming.

Execute:

```text
SCAN
  -> MAP
  -> GAP DETECTION
  -> PRIORITIZE
  -> DEPTH GATE
  -> SELECT ONE VERTICAL SLICE
  -> IMPLEMENT
  -> INTEGRATE
  -> VALIDATE
  -> UPDATE SOURCE OF TRUTH
  -> COMMIT
  -> VERIFY
  -> REASSESS
  -> REPEAT
```

## 1. SCAN
Inspect current main immediately before material work:
- current head;
- recent relevant commits;
- open/active overlapping work when available;
- build/test/CI state;
- architecture/state ownership;
- relevant governance registries.

Never assume an older green check applies to a newer head.

## 2. MAP
Update the working system map:
- domain/capability/workflow;
- inputs/outputs;
- state ownership;
- dependencies;
- shared services;
- persistence;
- external integrations;
- evidence/provenance boundary.

## 3. GAP DETECTION
Look for:
- broken core workflows;
- shared primitive missing while multiple features duplicate the same responsibility;
- detailed UI with no executable domain-model contract;
- physiological relationship hidden in page-specific logic instead of an explicit coupling contract;
- model-derived state lacking model/version/parameter/validation identity;
- safety/security/data-integrity issues;
- feature exists but backend/persistence absent;
- backend exists but no usable workflow;
- duplicate patient state;
- conflicting terminology or units;
- AI output without provenance/uncertainty;
- demo data that appears real;
- unreachable/orphan capability;
- duplicated service/API;
- missing error/loading/empty behavior;
- missing tests/observability;
- feature island that should connect to a shared workflow;
- **Reality Engine / compounding-depth gaps**, where applicable:
  - prior predictions are not retained for later observed-outcome comparison;
  - personal parameters are individualized without identifiability/provenance/uncertainty;
  - unknown/unsupported state is hidden instead of exposed as Reality Gap;
  - historical state cannot be replayed with original model/version;
  - counterfactual state can leak into the canonical real timeline;
  - causal explanation is implied from correlation;
  - outcome feedback never reaches model-validation/calibration evidence.

## 4. PRIORITIZE
Default queue:
A. safety/security/data integrity
B. broken core workflow
C. canonical-state inconsistency
D. shared-infrastructure / duplicate-state debt
E. specialized domain-engine depth gap
F. cross-system coupling / model-validation gap
G. compounding-depth gap: identifiability / Reality Gap / replay / prediction-feedback / counterfactual isolation
H. projection convergence and workflow maturity
I. UX friction
J. performance/observability
K. visual refinement
L. net-new feature

Priority heuristic:

[
Priority = rac{Impact 	imes Frequency 	imes IntegrationGain 	imes RiskReduction 	imes StrategicValue}{Complexity 	imes RegressionRisk}
]

Do not fake numeric precision.

## 4A. DEPTH GATE
Before selecting net-new breadth, classify the highest-priority candidate against the Computational Human Platform doctrine.

Ask, in order:
1. does it repair a safety/security/data/canonical-state blocker?
2. does it deepen a shared infrastructure primitive?
3. does it deepen an existing specialized domain engine?
4. does it replace hidden/ad-hoc physiology with explicit cross-system coupling?
5. does it improve model provenance, units, uncertainty, observability or validation?
6. does it converge Clinical, AI-EMR, Body Exposure, Timeline or simulation onto shared state/model outputs?
7. only then: is new breadth justified by a named user/problem, system fit, reuse check and validation path?

For computational-human work, use the architectural heuristic:

[
S_{vertical}
=
D_{domain}
\times
D_{model}
\times
D_{infrastructure}
\times
D_{integration}
\times
D_{validation}
]

Do not fabricate numeric precision. Prefer improving the weakest relevant factor or removing a shared bottleneck.

For longitudinal computational-human work, also apply:

[
S_{compound}
=
S_{vertical}
	imes
D_{personalization}
	imes
D_{temporal}
	imes
D_{causal}
	imes
D_{epistemic}
	imes
D_{feedback}
]

Before net-new breadth, ask:
- can important predictions be compared against later reality?
- are personalized parameters actually identifiable and uncertainty-bounded?
- are important unknowns visible as Reality Gap?
- can state/history be replayed with original model/version?
- are simulated counterfactual branches isolated from the real timeline?
- is causal language supported by mechanism/evidence rather than correlation?
- does outcome feedback improve validation/calibration evidence?

Hard safety/security/privacy/data/clinical blockers always outrank these experimental deepening dimensions.

A route, widget, component, animation or content-rich page is not a vertical-depth improvement by itself. A model-derived state must remain distinct from measured/recorded patient truth.

## 5. SELECT
Choose one meaningful independent vertical slice.
Avoid opening many unrelated implementation lanes.

## 6. IMPLEMENT
Prefer end-to-end workflow slices:
`data -> validation -> service -> persistence -> state -> UI -> action -> follow-up`

For computational-human slices prefer:
`boundary condition -> domain engine -> coupling -> model-derived state -> validation -> shared projection`

Reuse existing canonical systems before creating new ones. Do not create a second patient-record state, domain-specific event bus, model registry or coupling layer when a canonical primitive can be extended.

## 7. INTEGRATE
Ask:
- Which existing systems should consume this result?
- Does this update recorded Canonical Patient State, or is it derived physiological/simulation state that must stay separate?
- Which domain engine/model/version owns any derived state?
- Which other systems consume or produce coupling fields?
- Does it belong on Timeline?
- Is there meaningful Body Exposure context?
- Does it need Knowledge Graph linkage?
- Can shared terminology/provenance/audit services be reused?

Only connect when clinically/product meaningful.

## 8. VALIDATE
Use risk-appropriate:
- build/typecheck/lint;
- unit tests;
- integration tests;
- E2E/browser tests;
- data-contract validation;
- numerical/model invariant checks where computation is involved;
- cross-system coupling/unit/time-step checks where applicable;
- model/parameter/provenance/validation-class checks;
- unit/terminology/provenance checks;
- safety/privacy checks;
- domain expert/clinical validation where required.

Software validation never substitutes for clinical validation.

## 9. UPDATE SOURCE OF TRUTH
Before declaring meaningful work complete, update relevant:
- `governance/FEATURE_REGISTRY.yaml`
- `governance/MATURITY_REGISTRY.yaml`
- `governance/RISK_REGISTRY.yaml`
- `governance/RND_BACKLOG.yaml`
- architecture documents

Only record states supported by evidence.

## 10. COMMIT AND VERIFY
Follow the active repository shipping rule in `AGENTS.md`.
Never force-push.
If main advanced, reconcile rather than overwrite.
Inspect post-write CI/deployment evidence when available.

## 11. REASSESS
Re-scan after each coherent slice.
Do not assume the previous priority remains highest after state changes.

## Stop conditions
Pause autonomous execution only when:
- an external dependency blocks progress;
- a genuine owner/clinical/legal decision is required;
- safety requires escalation;
- no higher-value independent work remains;
- available repository/tool access cannot safely perform the next step.

Leave a durable blocker and next-action record.

## Research sub-loop
Recurring R&D should use:

[
Observe ightarrow SearchEvidence ightarrow CompareCurrentSystem ightarrow IdentifyGap ightarrow Falsify ightarrow Prioritize ightarrow Experiment ightarrow Validate ightarrow IntegrateOrReject
]

Negative findings and rejected ideas are valid outputs. Do not convert every research result into code.
