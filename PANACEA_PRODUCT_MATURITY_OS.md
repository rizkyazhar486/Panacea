# PANACEA PRODUCT MATURITY & INTEGRATION OPERATING SYSTEM

**Status:** Canonical operational layer beneath `PANACEA_CONSTITUTION.md` and `PANACEA_HUMANITY_10_CHARTER.md`.

This document converts Panaceamed's maturity-first direction into a durable, model-agnostic operating system for future AI agents and human contributors.

## Authority
Authority order:
1. latest explicit repository-owner instruction;
2. `PANACEA_CONSTITUTION.md`;
3. `PANACEA_HUMANITY_10_CHARTER.md`;
4. `PANACEA_COMPUTATIONAL_HUMAN_PLATFORM.md`;
5. this Product Maturity OS;
6. domain-specific directives and implementation notes.

This file does not replace existing charters. It operationalizes them.

## Current phase
Default development phase:

`STABILIZE -> DEEPEN SHARED INFRASTRUCTURE -> SPECIALIZE DOMAIN ENGINE -> COUPLE -> VALIDATE -> PROJECT -> SIMPLIFY -> OPTIMIZE -> SCALE`

Do not default back to feature-count expansion. "Depth" means deeper domain computation, model fidelity, infrastructure, integration and validation — not merely more detail inside one page.

## Vertical depth operating law

The current architecture doctrine is [`PANACEA_COMPUTATIONAL_HUMAN_PLATFORM.md`](PANACEA_COMPUTATIONAL_HUMAN_PLATFORM.md).

Use the internal heuristic:

[
S_{vertical} = D_{domain} \times D_{model} \times D_{infrastructure} \times D_{integration} \times D_{validation}
]

The terms represent biomedical/domain depth, mechanistic/computational model depth, infrastructure/runtime depth, cross-system/workflow integration and appropriate validation. Unknown dimensions remain unknown; do not fabricate precision.

When choosing between similarly valuable software-addressable tasks after hard blockers, prefer the task that increases the weakest vertical factor or removes a coupling/state bottleneck. A new page or widget has low priority when an existing capability lacks a real model, shared state, provenance, uncertainty, validation or integration.

Canonical implementation order:

`shared primitive -> domain engine -> coupling -> validation -> projection -> UX/performance optimization -> justified breadth`.

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
- **Canonical Patient State** — measured/recorded personalized truth with provenance and truth classes;
- **Physiological State Engine** — separate model-derived dynamic state for mechanistic simulation/digital-twin work;
- **Domain Engine Registry / Model & Parameter Registry** — specialized computational capabilities, parameters and validation classes;
- **Cross-System Coupling Fabric / Simulation Scheduler** — typed multi-system exchange and time evolution;
- **Body Exposure** — spatial projection and interaction surface over shared reference/patient/model state;
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
Prefer a workflow slice:

`real input -> normalization -> shared state -> reasoning/logic -> user surface -> action -> persistence -> follow-up -> observable outcome`

or, for computational-human work:

`boundary condition -> domain engine -> coupling -> model-derived state -> validation -> shared projection`

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
