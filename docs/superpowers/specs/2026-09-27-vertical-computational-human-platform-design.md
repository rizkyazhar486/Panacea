# Panaceamed Vertical Computational Human Platform — Architecture Design

**Date:** 2026-09-27  
**Status:** Owner-approved architectural direction; implementation into canonical source-of-truth files follows repository governance.  
**Scope:** Product vision, future-model operating doctrine, shared infrastructure, domain-engine contracts, cross-system coupling, and migration of existing capabilities toward deeper vertical computation.

## 1. Decision

Panaceamed must evolve from a broad collection of healthcare capabilities into a **Computational Human Platform**.

The platform is one continuously improving biomedical operating system in which AI-EMR, Clinical Intelligence, Body Exposure, longitudinal health, digital-twin simulation, education, devices, imaging, pharmacology, procedures, and future applications are projections of the same underlying patient/reference state, knowledge, evidence, and computational model infrastructure.

The strategic default is therefore:

```
INFRASTRUCTURE
-> DOMAIN ENGINES
-> CROSS-SYSTEM COUPLING
-> CLINICAL INTELLIGENCE
-> SIMULATION
-> VISUALIZATION
-> USER WORKFLOWS
-> POLISH
```

not:

```
MORE PAGES -> MORE WIDGETS -> MORE FEATURES -> POLISH
```

Feature breadth remains allowed only when it strengthens the shared system and passes the repository's existing evidence, safety, maturity, reuse, and validation gates.

## 2. Vertical sophistication

Panaceamed's sophistication is limited by the weakest depth layer:

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

where:

- (D_{domain}) = biomedical/domain depth;
- (D_{model}) = mechanistic/computational depth;
- (D_{infrastructure}) = runtime, state, data and execution depth;
- (D_{integration}) = cross-domain and workflow coupling;
- (D_{validation}) = software/scientific/clinical validation appropriate to the claim.

This is an internal prioritization heuristic, not a clinical score.

A visually impressive or feature-rich module is not considered deep if its state, model, provenance, uncertainty, integration, or validation are shallow.

## 3. Whole-body state model

Panaceamed retains one canonical longitudinal patient state, but adds a computational physiological state layer rather than treating the clinical record itself as the simulator.

Conceptually:

[
\frac{d\mathbf{x}}{dt}
=
F(
\mathbf{x},
\mathbf{u},
\mathbf{e},
\boldsymbol{\theta},
\mathbf{C},
t
)
+
\boldsymbol{\epsilon}
]

where:

- (mathbf{x}) = physiological state vector;
- (mathbf{u}) = interventions, medications, procedures, behavior;
- (mathbf{e}) = environmental and external exposures;
- (oldsymbol{\theta}) = patient/model parameters;
- (mathbf{C}) = explicit cross-system coupling structure;
- (oldsymbol{\epsilon}) = process/model uncertainty.

A practical state transition may be represented as:

[
\mathbf{x}_{t+\Delta t}
=
\Phi(
\mathbf{x}_{t},
\mathbf{u}_{t},
\mathbf{e}_{t},
\boldsymbol{\theta},
\mathbf{M},
\Delta t
)
]

where (mathbf{M}) identifies the exact model family, version, parameter set, solver and provenance.

The existing canonical longitudinal patient state remains authoritative for observations, clinical records, provenance and truth classes. Simulated/model-derived states must never silently overwrite measured or clinician-authored states.

## 4. Cross-system coupling

Domain engines must not become isolated mini-applications.

The platform needs an explicit coupling fabric. A useful conceptual sensitivity structure is:

[
C_{ij}
=
\frac{\partial F_i}{\partial x_j}
]

This does **not** require every implementation to compute an analytic Jacobian. It establishes that cross-system influence is a first-class contract rather than hidden ad-hoc component logic.

Examples include:

- pulmonary gas exchange -> acid-base state -> cardiovascular and neurological effects;
- renal sodium/water handling -> effective circulating volume -> preload/BP -> neurohormonal response;
- autonomic tone -> chronotropy/vascular resistance -> perfusion;
- medication exposure -> receptor/target effect -> organ response -> whole-body state;
- tissue perfusion -> oxygen delivery -> metabolic state -> organ function.

Cross-system communication should converge on shared typed contracts, events/fields, units, provenance and uncertainty rather than direct UI-to-UI coupling.

## 5. Specialized domain engines

Every major physiological domain should ultimately have its own specialized computational vertical while conforming to common infrastructure contracts.

Target verticals include, without assigning a permanently privileged organ:

- cardiovascular/hemodynamic/electrophysiology;
- respiratory/gas exchange/ventilation mechanics;
- renal/fluid/electrolyte/acid-base;
- neuro/autonomic/sensory/motor;
- endocrine/metabolic;
- hepatic/GI/nutrition;
- hematologic/coagulation;
- immune/inflammatory;
- musculoskeletal/biomechanics;
- reproductive/fetal-neonatal where appropriate;
- integumentary/wound;
- pharmacokinetic/pharmacodynamic;
- device/procedure interaction;
- environment/human-performance coupling.

The repository's existing **Universal Human Gold Standard** remains applicable: all human systems share the same ultimate scientific and validation standard. Implementation sequencing may prioritize high-impact infrastructure or systems, but no single organ owns the quality standard.

## 6. Domain Engine Contract

A mature domain engine should declare, as applicable:

1. **State variables** — names, dimensions, units, bounds and truth class.
2. **Inputs** — measured observations, boundary conditions, interventions and parameters.
3. **Outputs** — modeled quantities and events with explicit units.
4. **Governing model** — equations, algorithms or learned-model contract.
5. **Assumptions** — population, geometry, timescale and simplifications.
6. **Parameter set** — source, version, units, ranges and calibration status.
7. **Solver/runtime** — deterministic/stochastic method, step size, tolerances and failure behavior.
8. **Coupling interfaces** — fields/events consumed and produced.
9. **Uncertainty** — parameter, measurement and model uncertainty where supported.
10. **Provenance** — evidence/source, model version and parent state.
11. **Validation class** — synthetic/unit, literature reproduction, benchmark, expert review, clinical validation, or other explicit class.
12. **Failure modes** — invalid domain, non-convergence, missing inputs, stale data, unit mismatch and unsupported extrapolation.
13. **Fidelity level** — educational/reference, mechanistic research, patient-informed simulation, clinically validated use, etc.
14. **Observability** — traceable state transitions and solver/runtime telemetry.
15. **Projection adapters** — Body Exposure, Clinical, AI-EMR, Timeline and other surfaces consume engine output without becoming the source of truth.

## 7. Specialized infrastructure

Panaceamed should progressively converge on these infrastructure primitives, reusing existing implementations where present:

- **Canonical Patient State** — measured/recorded longitudinal truth with provenance;
- **Physiological State Engine** — simulated/model-derived dynamic state;
- **Domain Engine Registry** — discoverable engine capabilities and compatibility;
- **Model/Parameter Registry** — model versions, parameter packs, evidence and validation;
- **Cross-System Coupling Fabric** — typed inter-engine exchange and scheduling;
- **Simulation Scheduler** — multi-rate stepping, convergence/error control and replay;
- **Clinical Event Bus** — clinically meaningful state transitions and workflow events;
- **Biomedical Knowledge Graph** — reference relationships with evidence/provenance;
- **Terminology & Unit Service** — semantic coding and unit normalization;
- **Evidence/Provenance Ledger** — data/model/source lineage;
- **Uncertainty Engine** — explicit propagation/representation appropriate to model class;
- **Imaging Pipeline** — DICOM/DICOMweb and derived spatial state;
- **Waveform/Telemetry Pipeline** — time-series/device data with source fidelity;
- **Interoperability Layer** — FHIR and other approved clinical/device standards;
- **Inference Gateway** — AI reasoning separated from deterministic/mechanistic engines;
- **Observability Layer** — technical and physiological execution traces;
- **Validation Harness** — reproducible scientific/software benchmarks;
- **Acceleration Layer** — WebGPU/GPU/HPC only when justified by validated workload and profiling.

These are logical responsibilities, not mandates for premature microservices.

## 8. One state, many projections

The architectural relationship becomes:

```
Clinical / Device / Imaging / Wearable / Environment Inputs
                         |
              Normalization + Provenance
                         |
              Canonical Patient State
                         |
        +----------------+----------------+
        |                                 |
Biomedical Knowledge              Boundary Conditions
        |                                 |
        +---------- Physiological State Engine ----------+
                    |       |       |       |
                  Cardio   Resp    Renal   Neuro ... domain engines
                    \       |       |      /
                     Cross-System Coupling
                              |
                   Model-derived State/Event Stream
                              |
         +--------------------+--------------------+
         |                    |                    |
Clinical Intelligence    Body Exposure       Simulation/Training
         |                    |                    |
AI-EMR / Workflow        Spatial Projection   Procedural/Device UI
```

The UI observes and interacts with this architecture. It does not create independent physiological truth.

## 9. Body Exposure's role

Body Exposure becomes the principal **spatial projector and interaction surface** for the computational human platform.

It should progressively render:

- anatomy/reference geometry;
- measured patient context where legitimate;
- modeled physiological states;
- pathophysiological transitions;
- imaging-derived findings;
- device/procedure interactions;
- tissue/cell/molecular semantic zoom;
- uncertainty/provenance;
- intervention response over time.

Rendering is downstream of state/model contracts. A visual animation without stateful validated computation must not be represented as a physiological or surgical simulator.

## 10. Future-model operating doctrine

Every current and future AI/model working on Panaceamed should apply the following default reasoning:

1. **Preserve safety and source-of-truth contracts.**
2. **Inspect existing state and infrastructure before creating anything.**
3. **Prefer deepening a shared primitive or domain engine over adding a disconnected feature.**
4. **Prefer one end-to-end vertical slice over many partial surfaces.**
5. **Close duplicate-state and coupling gaps before adding parallel implementations.**
6. **Make equations/models executable, testable and observable where scientifically justified.**
7. **Separate measured, inferred, simulated, synthetic and reference truth classes.**
8. **Attach provenance, units, uncertainty and validation status to scientific outputs.**
9. **Make Body Exposure/Clinical/AI-EMR consume shared state rather than inventing their own.**
10. **Research may expand the frontier; production capability expands only after evidence, fit and validation gates.**
11. **Do not optimize for commit count, route count, widget count or visual spectacle.**
12. **After core stability, optimize for vertical depth, cross-system coupling and validated utility.**

When choosing between two similarly valuable tasks, prefer the task with larger:

[
\Delta V
\propto
\Delta(
D_{domain}
\times
D_{model}
\times
D_{infrastructure}
\times
D_{integration}
\times
D_{validation}
)
]

subject to existing safety, security, privacy, regression and clinical-release constraints.

## 11. Migration strategy

This architecture must be applied incrementally and without destructive rewrites.

### Phase A — doctrine and contracts
- update canonical vision/agent directives;
- extend architecture docs with physiological-state and domain-engine contracts;
- map existing runtime pieces into the new architecture;
- identify duplicates rather than deleting them immediately.

### Phase B — whole-body contract skeleton
- define domain-engine interfaces for all major systems;
- define common units, provenance, truth classes and coupling events;
- create model/parameter/validation registry schemas;
- connect to existing multiscale and longitudinal-state infrastructure.

### Phase C — deepen validated vertical slices
- select high-impact computational slices;
- implement the smallest mechanistic state transition with literature/benchmark evidence;
- expose it through the shared coupling/state infrastructure;
- prove it with deterministic tests and validation artifacts.

### Phase D — cross-system physiology
- replace ad-hoc relationships with explicit coupling contracts;
- add multi-rate scheduling and uncertainty behavior where justified;
- validate conservation/invariants and failure behavior.

### Phase E — projection convergence
- have Body Exposure, Clinical, AI-EMR, Timeline and simulations consume common states/events;
- remove duplicate semantics only after compatibility and migration proof.

### Phase F — acceleration and high-fidelity simulation
- GPU/WebGPU/HPC, learned surrogate/neural operators, fluid/FE/FSI/MD or external scientific services only after a validated workload, benchmark, provenance and rollback path exist.

## 12. Validation doctrine

No increase in architectural sophistication may weaken claim discipline.

For each computational layer, validation should be explicit and graduated, for example:

```
schema/unit tests
-> deterministic numerical tests
-> manufactured/synthetic benchmark
-> published-model reproduction
-> cross-engine invariant tests
-> external/reference benchmark
-> domain-expert review
-> human clinical validation when the claim/use requires it
```

A model may be useful before clinical validation, but its interface and wording must state its actual validation class.

## 13. Non-goals

This architecture does not authorize:

- fabricating patient-specific values;
- converting educational simulation into clinical truth;
- claiming clinical validation from software tests;
- implementing every mathematical model at once;
- premature microservice decomposition;
- replacing proven infrastructure solely for architectural aesthetics;
- creating a second patient-state authority;
- giving one organ a permanently superior quality standard;
- using AI-generated equations as evidence without source/validation;
- increasing complexity when a simpler validated model satisfies the use case.

## 14. Required canonical integration

After this design is reviewed, the implementation plan should update the minimum set of durable repository authorities so future models inherit it automatically:

1. `PANACEA_CONSTITUTION.md` — mission-level Computational Human Platform doctrine.
2. `PANACEA_PRODUCT_MATURITY_OS.md` — vertical-depth priority and domain-engine maturity rules.
3. `AGENTS.md` — mandatory future-agent execution behavior and source-of-truth pointer.
4. `CLAUDE.md` — model-specific compatibility pointer without duplicating the full doctrine.
5. `docs/architecture/PRODUCT_SYSTEM.md` — revised computational architecture.
6. `docs/architecture/PATIENT_STATE.md` — explicit measured-state vs physiological-state boundary.
7. `docs/architecture/INTEGRATION_MAP.md` — domain-engine/coupling integration rules.
8. `docs/architecture/MATURITY_MODEL.md` — depth-oriented maturity criteria.
9. Relevant governance registries/automation rules only where required by the changed architecture.

Existing validated capabilities and source-of-truth files are preserved and integrated rather than erased.

## 15. Acceptance criteria

The architecture change is complete only when:

- future agents can discover the doctrine from root-level authority files;
- “depth before breadth” means specialized computational depth, not only feature maturity;
- canonical patient truth and simulated physiological state are explicitly separated;
- domain engines have a common contract;
- cross-system coupling is a first-class architecture primitive;
- Body Exposure is defined as a projection/interaction layer over shared state;
- future-model task selection penalizes feature proliferation and disconnected state;
- the Universal Human Gold Standard remains whole-body and uniform;
- existing safety, evidence, clinical-validation and provenance rules remain intact;
- the implementation is additive/migratory rather than a destructive rewrite.
