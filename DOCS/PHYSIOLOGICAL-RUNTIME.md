# Panacea Physiological Runtime Foundation

**Status:** implemented infrastructure scaffold; deterministic and synthetically tested. It is **not** a validated human physiology model and must not be used for diagnosis, treatment selection, clinical prediction, or patient-specific internal anatomy.

Canonical architecture: [`PANACEA_COMPUTATIONAL_HUMAN_PLATFORM.md`](../PANACEA_COMPUTATIONAL_HUMAN_PLATFORM.md).

## Purpose

This runtime is the first code-level substrate for the Computational Human Platform doctrine. It provides a shared contract for future cardiovascular, respiratory, renal, neurological, metabolic, pharmacology, device and other domain engines without making those domains depend on one another's UI components.

It complements, rather than replaces, the existing multi-scale coupling kernel in `src/lib/multiskala/kernelKopling.ts`:

- `multiskala/kernelKopling.ts` remains the grid/multi-scale biological coupling substrate;
- `physiology/runtime.ts` provides whole-body/domain-engine composition, scalar/time-series state exchange and canonical patient-state boundary admission;
- future adapters may bridge the two only with explicit units, provenance, uncertainty and validation.

## Implemented contracts

`src/lib/physiology/runtime.ts` defines:

- `DomainEngineContract<S>` — engine identity, model/version, parameter set, validation class, fidelity, time step, consumed fields, produced fields, initialization and deterministic step function;
- `createDomainEngineRegistry()` — fail-closed registration and producer/unit checks;
- `runPhysiologicalSimulation()` — deterministic multi-rate scheduling and typed field exchange;
- `BoundaryCondition` — admitted measured/imported/clinician-entered numeric input with source identity;
- `PhysiologicalValue` — boundary or model-derived/simulated value with explicit unit and provenance;
- deterministic, content-sensitive provenance containing engine, model, model version, parameter-set id, validation class, fidelity, step, simulation time, output value/uncertainty and parent value ids.

## Truth boundary

The recorded longitudinal patient state remains authoritative for measured/recorded patient truth.

The adapter in `src/lib/physiology/longitudinalBoundary.ts` admits only explicitly classified numeric longitudinal events whose `semanticState` is:

- `measured`;
- `imported`;
- `clinician-entered`.

It rejects simulated, AI-draft, unavailable, derived and rule-output events. Unknown measurement uncertainty remains `sigma = null`; the adapter does not manufacture certainty.

A longitudinal event used as a boundary condition is read-only. Simulation output is never written back into `panaceaLongitudinalState.ts` by this runtime.

## Fail-closed composition

Before execution, the registry rejects duplicate engine ids, invalid/non-positive `dtSeconds`, duplicate field producers, clinical truth classes on model outputs, missing producers/boundaries, self-consumption, unit mismatches and field/boundary collisions.

During execution it rejects missing/undeclared/duplicate boundary values, unsupported boundary truth classes, truth-class/source-semantic mismatches, undeclared outputs, runtime unit mismatch, non-finite values, invalid uncertainty and duplicate output emission.

## Deterministic time model

For engine `i` with time step `dt_i`:

\[
t_{i,n} = n\,dt_i,\quad n=0,1,2,\ldots
\]

Engines due at the same simulation time execute in registry declaration order. This makes same-time producer→consumer exchange reproducible. Future cyclic physiological coupling should use explicit initial-state contracts rather than accidental ordering. The runtime is not driven by wall-clock time.

## Provenance

Every engine output records:

\[
P = \{engine, model, version, parameterSet, step, t, parents\}
\]

The deterministic provenance id is an implementation identifier, not a cryptographic content signature.

## Synthetic fixture

`src/lib/physiology/exampleEngines.ts` contains two dimensionless linear engines solely to verify composition, multi-rate scheduling, field exchange, boundary admission, truth-class separation and provenance. It is deliberately **not human physiology** and contains no clinical parameter claims.

## Gate

`scripts/uji/physiological-runtime.mts` is automatically discovered by `npm run uji`. It covers the fail-closed registry, deterministic scheduler, provenance, longitudinal boundary adapter and synthetic coupling fixture.

Next vertical work should add a literature-grounded domain engine only after its variables, equations, parameter ranges, units, validation target and supported population are explicitly specified. A real organ engine must not inherit the synthetic fixture's constants.


## First real domain-engine slice

`src/lib/physiology/cardiovascularIdentityEngine.ts` is the first non-synthetic engine registered on this runtime. It reuses `hemodinamik.ts` for the identities SV = EDV - ESV, CO = HR × SV / 1000 and EF = SV / EDV, propagates known independent input uncertainty, emits only `model-derived` values, and fails closed on unsupported ventricular-volume inputs.

See `DOCS/CARDIOVASCULAR-IDENTITY-ENGINE.md`. Oxygen transport is intentionally deferred until the repository's Hufner/dissolved-O2 constant convention is reconciled body-wide.


## Oxygen-content scientific convention registry

`src/lib/physiology/oxygenContentConventions.ts` makes oxygen-content coefficients and their units explicit scientific objects. The current default is `panacea-clinical-effective-v1` (1.34 / 0.003; Hb g/dL), exactly matching `hemodinamik.ts`. A separate theoretical 1.39 / 0.0031 convention is available only by explicit selection. The ELSO VV 2021 verbatim expression is retained but non-executable because its printed Hb-unit convention is dimensionally inconsistent with the dissolved term without normalization.

See `DOCS/OXYGEN-CONTENT-CONVENTIONS.md`. Future domain engines must select a named convention; do not hand-type oxygen-content coefficients.


## First real cross-system chain

The first dependency-coupled physiological chain is implemented by:
- `cardiovascularIdentityEngine.ts` -> cardiac output;
- `oxygenTransportEngine.ts::arterialOxygenContentEngine()` -> CaO2;
- `oxygenTransportEngine.ts::systemicOxygenDeliveryEngine()` -> DO2.

The gate deliberately registers these engines out of dependency order; the runtime topologically orders them and preserves exact parent provenance. This proves shared engine coupling rather than page-specific formula chaining.

See `DOCS/OXYGEN-TRANSPORT-ENGINE.md`.

## Vertical biological projection foundation

The first executable No-Hollow-Gap substrate is implemented in `src/lib/biology/`:

- `verticalBiologyGraph.ts` defines ordered biological scales, evidence-bearing nodes, explicit gap/not-applicable lineage steps, fail-closed graph validation and lineage completeness assessment;
- `cardiovascularVerticalLineage.ts` seeds two reference-scoped cardiovascular lineages from whole human through LV myocardium/cardiomyocyte to RyR2 calcium handling and sarcomere/troponin biology, continuing through RNA, gene/regulatory, chromatin and DNA reference layers;
- `physiologyVerticalProjection.ts` maps the existing SV/EF/CO/CaO2/DO2 runtime fields read-only onto the biological graph without mutating node truth scope or physiological provenance.

The current cardiovascular lineages deliberately retain explicit `VERTICAL GAP — NOT YET MODELED` steps for patient-specific cardiomyocyte state and post-translational molecular state. Reaching DNA in the graph therefore does **not** mean Panacea has measured or inferred an individual's RYR2/TNNC1 expression, chromatin state or sequence.

Projection follows:

[
R_t = \mathcal{P}(G, X_t, B)
]

where (G) is the validated vertical biological graph, (X_t) is the physiological runtime state and (B) is the explicit field-to-node binding contract. (mathcal{P}) is read-only: it preserves value, unit, uncertainty, truth class and provenance and cannot promote model-derived values into measured patient truth.

Current bindings:
- `cardio.lv.stroke_volume` -> left ventricle;
- `cardio.lv.ejection_fraction` -> left ventricle;
- `cardio.cardiac_output` -> heart;
- `arterial.oxygen_content` -> cardiovascular-system projection;
- `systemic.oxygen_delivery` -> whole-human projection.

This is the first vertical scaffold, not a completeness claim. Subsequent organ/system work should extend the same graph/gap/provenance contracts rather than create disconnected deep-looking content.

