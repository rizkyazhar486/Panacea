# PANACEA PRODUCT MATURITY & INTEGRATION OPERATING SYSTEM

**Status:** Canonical operational layer beneath `PANACEA_CONSTITUTION.md` and `PANACEA_HUMANITY_10_CHARTER.md`.

This document converts Panaceamed's maturity-first direction into a durable, model-agnostic operating system for future AI agents and human contributors.

## Authority
Authority order:
1. latest explicit repository-owner instruction;
2. `PANACEA_CONSTITUTION.md`;
3. `PANACEA_HUMANITY_10_CHARTER.md`;
4. this Product Maturity OS;
5. domain-specific directives and implementation notes.

This file does not replace existing charters. It operationalizes them.

## Current phase
Default development phase:

`SPECIALIZE -> MATURE -> INTEGRATE -> VALIDATE -> SIMPLIFY -> OPTIMIZE -> SCALE`

Do not default back to feature-count expansion.

## Product value function

[
V = rac{D 	imes R 	imes I 	imes U 	imes E 	imes L}{C + F + H}
]

Where:
- D = clinical/domain depth
- R = reliability
- I = integration
- U = usability
- E = evidence/provenance quality
- L = longitudinal utility
- C = user complexity
- F = fragmentation
- H = failure/harm risk

The formula is a prioritization heuristic, not a clinical scoring instrument.

## Canonical system primitives
Panaceamed should converge around:
- **Canonical Patient State** — personalized state;
- **Body Exposure** — spatial model;
- **Timeline** — temporal model;
- **Clinical Knowledge Graph** — medical relationship model;
- **Reasoning Gateway** — AI-assisted synthesis and uncertainty;
- **Workflow Engine** — action and follow-up;
- **Outcome Feedback** — result returns into longitudinal state;
- **Shared Platform Services** — identity, terminology, provenance, consent, audit, normalization, notification, observability.

Core loop:

[
Data ightarrow PatientState ightarrow Intelligence ightarrow Workflow ightarrow Action ightarrow Outcome ightarrow UpdatedPatientState
]

## Feature organization
Every meaningful capability belongs to:

`DOMAIN -> CAPABILITY -> WORKFLOW -> FEATURE -> SUBFEATURE -> COMPONENT`

The primary organizing unit is a real user/clinical workflow, not a page or widget.

## Dynamic institutional memory
The repository itself must preserve:
- what exists;
- why it exists;
- how it connects;
- its maturity;
- its risks;
- its dependencies;
- its evidence boundary;
- its next highest-value action.

Machine-readable state lives in `governance/*.yaml`.
Human-readable architecture lives in `docs/architecture/*.md`.
Execution logic lives in `automation/AUTONOMOUS_RND_LOOP.md`.

These are living files. Agents update them when the underlying repository state changes materially.

## Research-to-implementation gate

[
Research ightarrow Evidence ightarrow Problem ightarrow User ightarrow UseCase ightarrow SystemFit ightarrow ReuseCheck ightarrow ValidationPlan ightarrow Implementation
]

Research does not automatically create a feature.

A new feature should normally require:
- named user;
- concrete problem;
- meaningful frequency or severity;
- measurable benefit;
- fit with the canonical architecture;
- no stronger existing capability that can be extended;
- acceptable safety/privacy/regulatory boundary.

## Default priority order
1. clinical/safety/security/data-integrity blockers;
2. broken core workflows;
3. canonical-state inconsistency;
4. integration debt and duplicate state;
5. high-impact maturity gaps;
6. UX friction;
7. performance/observability;
8. visual refinement;
9. net-new breadth.

The owner may explicitly override this order.

## One vertical slice at a time
Prefer:

`real input -> normalization -> shared state -> reasoning/logic -> user surface -> action -> persistence -> follow-up -> observable outcome`

over creating multiple partially connected surfaces.

## Completion
A capability is not mature merely because code exists.

Relevant layers should include:
- real use case;
- data contract;
- validation;
- backend/service;
- persistence where needed;
- frontend state;
- UI states;
- provenance;
- uncertainty;
- privacy/security;
- testing;
- observability;
- mobile/accessibility;
- integration with shared state;
- measurable outcome or justified educational/research purpose.

## Anti-fragmentation laws
- REUSE > CREATE
- CONNECT > DUPLICATE
- MATURE > EXPAND
- WORKFLOW > WIDGET
- SYSTEM > FEATURE
- OUTCOME > OUTPUT
- REAL DATA > IMPLIED DATA
- TRACEABILITY > UNSUPPORTED CERTAINTY
- SIMPLE SURFACE > EXPOSED INTERNAL COMPLEXITY

## Continuous evolution
A version reaching its acceptance criteria is not an endpoint.

[
AcceptedBaseline ightarrow Monitor ightarrow Research ightarrow Benchmark ightarrow Validate ightarrow Integrate ightarrow Revalidate ightarrow NewBaseline
]

This loop must compound validated capability, not compounding complexity or risk.
