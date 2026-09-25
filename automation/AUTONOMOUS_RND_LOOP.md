# Autonomous R&D and Product Maturity Loop

## Purpose
Define what any capable agent should do when authorized to continue Panaceamed development without a narrowly specified micro-task.

This loop operates under `PANACEA_CONSTITUTION.md`, `PANACEA_HUMANITY_10_CHARTER.md`, `AGENTS.md`, and `PANACEA_PRODUCT_MATURITY_OS.md`.

## Trigger
When the owner says "lanjut", "continue", "keep going", or equivalent and repository execution is available:

Do not default to brainstorming.

Execute:

```text
SCAN
  -> MAP
  -> GAP DETECTION
  -> PRIORITIZE
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
- feature island that should connect to a shared workflow.

## 4. PRIORITIZE
Default queue:
A. safety/security/data integrity
B. broken core workflow
C. canonical-state inconsistency
D. integration debt
E. maturity gap
F. UX friction
G. performance/observability
H. visual refinement
I. net-new feature

Priority heuristic:

[
Priority = rac{Impact 	imes Frequency 	imes IntegrationGain 	imes RiskReduction 	imes StrategicValue}{Complexity 	imes RegressionRisk}
]

Do not fake numeric precision.

## 5. SELECT
Choose one meaningful independent vertical slice.
Avoid opening many unrelated implementation lanes.

## 6. IMPLEMENT
Prefer end-to-end:
`data -> validation -> service -> persistence -> state -> UI -> action -> follow-up`

Reuse existing canonical systems before creating new ones.

## 7. INTEGRATE
Ask:
- Which existing systems should consume this result?
- Does this update Patient State?
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
