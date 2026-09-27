# PANACEA COMPUTATIONAL HUMAN PLATFORM

## Model-agnostic vertical-depth architecture doctrine

**Status:** Canonical product-architecture doctrine beneath `PANACEA_CONSTITUTION.md` and `PANACEA_HUMANITY_10_CHARTER.md`, operationalized by `PANACEA_PRODUCT_MATURITY_OS.md`.

This document applies to every current and future model, agent, workflow and human contributor working on Panaceamed. It does not replace the Constitution, Humanity 10 Charter, clinical/safety gates, Universal Human Gold Standard, or validated existing architecture. It tells builders **what Panaceamed is becoming and how to deepen it**.

## 1. Product identity

Panaceamed is not a collection of healthcare pages, widgets or isolated AI features.

Panaceamed is a **Computational Human Platform**: a continuously improving biomedical operating system in which Clinical Intelligence, AI-EMR, longitudinal health, Body Exposure, digital-twin simulation, education, devices, imaging, pharmacology, procedures and future applications are different projections of shared patient/reference state, evidence, knowledge and computational models.

The default build hierarchy is:

```text
STABILIZE
-> DEEPEN SHARED INFRASTRUCTURE
-> DEEPEN SPECIALIZED DOMAIN ENGINE
-> COUPLE ACROSS SYSTEMS
-> VALIDATE
-> PROJECT INTO CLINICAL / BODY / SIMULATION SURFACES
-> OPTIMIZE
-> EXPAND BREADTH ONLY WHEN JUSTIFIED
```

## 2. Vertical sophistication

Panaceamed optimizes for validated vertical depth rather than raw feature count.

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

Where:

- (D_{domain}) = biomedical/domain depth;
- (D_{model}) = mechanistic/computational depth;
- (D_{infrastructure}) = state/runtime/data execution depth;
- (D_{integration}) = cross-domain and workflow coupling;
- (D_{validation}) = software/scientific/clinical validation appropriate to the claim.

This is an internal prioritization heuristic, not a clinical score.

A visually impressive or feature-rich module remains shallow if its model, state, provenance, uncertainty, integration or validation are shallow.

## 3. Two distinct state layers

### 3.1 Canonical Patient State

The existing Canonical Patient State remains the source of truth for what Panaceamed knows or records about a person: measured observations, imported records, clinician-authored facts, patient-reported data, provenance, time, confidence and truth class.

It must not be replaced by simulation state.

### 3.2 Physiological State Engine

Panaceamed may derive a separate computational physiological state for simulation, mechanistic reasoning and digital-twin work.

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
- (mathbf{u}) = medications, procedures, behavior and other interventions;
- (mathbf{e}) = environmental/external exposures;
- (oldsymbol{\theta}) = patient/model parameters;
- (mathbf{C}) = cross-system coupling structure;
- (oldsymbol{\epsilon}) = model/process uncertainty.

A practical transition may be represented as:

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

**Hard boundary:** measured, clinician-authored and imported clinical truth must never be silently overwritten by simulated, inferred or model-derived values.

## 4. Specialized domain engines

Every major human system should ultimately be represented by specialized computational engines that share common contracts rather than by isolated pages.

Target engine families include:

- cardiovascular / hemodynamics / electrophysiology;
- respiratory / gas exchange / ventilation mechanics;
- renal / fluid / electrolyte / acid-base;
- neurological / autonomic / sensory / motor;
- endocrine / metabolic;
- hepatic / gastrointestinal / nutrition;
- hematologic / coagulation;
- immune / inflammatory;
- musculoskeletal / biomechanics;
- reproductive / fetal-neonatal where appropriate;
- integumentary / wound;
- pharmacokinetic / pharmacodynamic;
- procedure / device interaction;
- environment / human-performance coupling.

The Universal Human Gold Standard remains whole-body and uniform. No organ or module owns a permanently superior quality standard.

## 5. Domain Engine Contract

A mature domain engine should declare, as applicable:

1. state variables, dimensions, units, bounds and truth class;
2. measured/reference inputs and boundary conditions;
3. outputs and events with explicit units;
4. governing equations, algorithms or learned-model contract;
5. assumptions, supported population and fidelity limits;
6. parameter set with source, version, units, calibration status and range;
7. solver/runtime method, time step, tolerances and failure behavior;
8. coupling fields/events consumed and produced;
9. uncertainty representation where supported;
10. provenance and model version;
11. validation class;
12. failure modes and unsupported extrapolation behavior;
13. fidelity level;
14. observability and reproducibility hooks;
15. projection adapters for Clinical, AI-EMR, Body Exposure, Timeline and simulation surfaces.

A UI component is not a domain engine.

## 6. Cross-system coupling fabric

Human physiology is coupled. Domain engines must not become isolated mini-applications.

Cross-system influence is a first-class architecture concept. A useful conceptual sensitivity form is:

[
C_{ij}
=
\frac{\partial F_i}{\partial x_j}
]

Implementations do not need an analytic Jacobian unless scientifically justified. The requirement is architectural: shared typed fields/events, units, provenance, timing and uncertainty must make coupling explicit rather than hiding it in page-specific logic.

Examples:

- gas exchange -> acid-base -> cardiovascular and neurological state;
- renal sodium/water handling -> volume/preload/BP -> neurohormonal response;
- autonomic tone -> chronotropy/vascular resistance -> perfusion;
- drug exposure -> target effect -> organ response -> whole-body response;
- perfusion -> oxygen delivery -> metabolism -> organ function.

## 7. Shared infrastructure primitives

Panaceamed should progressively converge on these logical responsibilities, reusing existing implementations where present:

- Canonical Patient State;
- Physiological State Engine;
- Domain Engine Registry;
- Model / Parameter Registry;
- Cross-System Coupling Fabric;
- Simulation Scheduler;
- Clinical Event Bus;
- Biomedical Knowledge Graph;
- Terminology and Unit Service;
- Evidence / Provenance Ledger;
- Uncertainty representation/engine;
- Imaging Pipeline;
- Waveform / Telemetry Pipeline;
- Interoperability Layer;
- AI Inference / Reasoning Gateway;
- Observability Layer;
- Validation Harness;
- Acceleration Layer only when workload and benchmarks justify it.

These are logical boundaries, not a mandate for premature microservices.

## 7A. Implemented runtime foundation

As of 2026-09-27, the first code-level whole-body runtime substrate is implemented in `src/lib/physiology/`:

- `runtime.ts` — fail-closed `DomainEngineContract`, registry, deterministic multi-rate scheduler, typed coupling fields, model/parameter/validation/fidelity provenance and explicit model-derived/simulated output truth classes;
- `longitudinalBoundary.ts` — read-only admission of explicitly measured/imported/clinician-entered numeric longitudinal events as boundary conditions; unknown measurement uncertainty stays unknown (`sigma = null`);
- `exampleEngines.ts` — dimensionless synthetic fixtures only, explicitly not human physiology;
- `scripts/uji/physiological-runtime.mts` — deterministic contract gate automatically discovered by `npm run uji`;
- `DOCS/PHYSIOLOGICAL-RUNTIME.md` — exact status and scientific boundary.

This foundation does **not** mean Panaceamed has a validated whole-human physiological model. Real organ/system engines remain future vertical work and require literature-grounded equations/parameters, supported-population definitions and validation appropriate to their claims. The existing multiscale kernel remains complementary rather than replaced.

## 8. One state, many projections

The intended relationship is:

```text
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
                  Cardio   Resp    Renal   Neuro ... engines
                    \       |       |      /
                     Cross-System Coupling
                              |
                   Model-derived State/Event Stream
                              |
         +--------------------+--------------------+
         |                    |                    |
Clinical Intelligence    Body Exposure       Simulation/Training
         |                    |                    |
AI-EMR / Workflow        Spatial Projection   Procedure / Device UI
```

Application surfaces observe or interact with shared state. They do not create independent physiological truth.

## 9. Body Exposure

Body Exposure is the principal spatial projector and interaction surface of the Computational Human Platform.

It should progressively project:

- source-backed anatomy/reference geometry;
- legitimate patient context;
- modeled physiological states;
- pathophysiological transitions;
- imaging-derived findings;
- device/procedure interactions;
- tissue/cell/molecular semantic zoom;
- uncertainty and provenance;
- intervention response over time.

Rendering is downstream of state/model contracts. An animation, static layer list or scripted sequence must not be represented as a physiological or surgical simulator unless a stateful computational model and appropriate validation support that claim.

## 10. Future-model task-selection law

Every future agent should apply this order when no narrower owner instruction overrides it:

1. preserve safety, security, privacy, provenance, data integrity and clinical-release gates;
2. inspect existing shared primitives and current main before creating anything;
3. repair broken core workflows or inconsistent canonical state;
4. deepen shared infrastructure before adding parallel feature-local infrastructure;
5. deepen an existing specialized domain engine before adding a shallow new surface;
6. strengthen cross-system coupling and shared state;
7. strengthen validation, observability, uncertainty and provenance;
8. project the stronger shared state into Clinical, Body Exposure, AI-EMR, Timeline or simulation;
9. optimize performance and UX;
10. add net-new breadth only when evidence, user need, system fit, reuse check and validation path justify it.

When two similarly valuable tasks compete, prefer the larger evidence-backed increase in:

[
\Delta S_{vertical}
=
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

subject to risk, cost, regression and owner sequencing constraints.

Do **not** optimize by default for route count, component count, widget count, commit count, prompt count or visual spectacle.

## 11. Validation ladder

Use the validation level appropriate to the model and claim:

```text
schema/unit validation
-> deterministic numerical validation
-> manufactured/synthetic benchmark
-> published-model reproduction
-> cross-engine invariant/conservation tests
-> external/reference benchmark
-> domain-expert review
-> human clinical validation when the intended claim/use requires it
```

Software validation never becomes clinical validation by wording.

## 12. Migration doctrine

Apply this architecture incrementally:

- preserve proven existing implementations;
- map them to the canonical primitives;
- expose explicit contracts;
- migrate duplicate state only after compatibility is demonstrated;
- deepen one validated vertical slice at a time;
- add cross-system coupling after individual contracts are stable enough;
- converge projections onto shared state;
- introduce GPU/WebGPU/HPC/neural operators/FE/FSI/MD or external scientific services only after workload, evidence, benchmark, provenance, security and rollback requirements are defined.

## 13. Anti-goals

This doctrine does not authorize:

- fabricated patient-specific values;
- simulation silently promoted into the clinical record;
- clinical-validation claims from software tests;
- AI-generated equations treated as evidence without sources/validation;
- premature microservice proliferation;
- a second patient-state authority;
- organ-specific privileged gold standards;
- destructive rewrites of validated capability;
- complexity for its own sake;
- more features when existing capabilities remain shallow or disconnected.

## 14. Relationship to existing authorities

This doctrine must be read together with:

- `PANACEA_CONSTITUTION.md`;
- `PANACEA_HUMANITY_10_CHARTER.md`;
- `PANACEA_PRODUCT_MATURITY_OS.md`;
- `docs/body-exposure/HUMAN_DIGITAL_TWIN_GOLD_STANDARD.md`;
- `docs/architecture/PRODUCT_SYSTEM.md`;
- `docs/architecture/PATIENT_STATE.md`;
- `docs/architecture/KNOWLEDGE_GRAPH.md`;
- `docs/architecture/INTEGRATION_MAP.md`;
- `docs/architecture/MATURITY_MODEL.md`;
- `DOCS/VISSIM-OS.md`;
- `automation/AUTONOMOUS_RND_LOOP.md`.

If an older agent-authored breadth recommendation conflicts with this doctrine and no newer explicit owner instruction requires that breadth, prefer deeper shared computational architecture.
