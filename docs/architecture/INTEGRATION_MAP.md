# Cross-Domain Integration Map

Canonical architecture doctrine: [`PANACEA_COMPUTATIONAL_HUMAN_PLATFORM.md`](../../PANACEA_COMPUTATIONAL_HUMAN_PLATFORM.md).

## Purpose
Make feature relationships inspectable and prevent feature islands.

## Canonical relationship model
Every important capability should declare:
- inputs;
- outputs;
- reads_from;
- writes_to;
- dependencies;
- dependents;
- patient-state fields;
- knowledge relationships;
- shared services;
- workflow entry/exit;
- evidence/provenance boundary;
- truth class: measured/reference/inferred/model-derived/simulated;
- model/parameter identity where computation is involved;
- coupling fields/events and units;
- validation class and unsupported domain.

The machine-readable source is `governance/FEATURE_REGISTRY.yaml`.

## Domain-engine and coupling contract

For computational-human work, integration is deeper than connecting pages.

A specialized domain engine should declare:
- state variables and units;
- boundary-condition inputs;
- interventions/exposures consumed;
- modeled outputs/events;
- model and parameter versions;
- uncertainty and provenance;
- coupling fields consumed/produced;
- time-step/scheduling assumptions where relevant;
- failure/non-convergence behavior;
- validation class.

Cross-system exchange should use shared typed fields/events and unit validation. Do not make cardiovascular, respiratory, renal, neuro, metabolic or other domains depend directly on one another's UI components.

Preferred pattern:

`patient/reference input -> normalized boundary condition -> domain engine -> coupling fabric -> model-derived state -> validation -> one or more projections`.

## High-value integration patterns

### Laboratory
`Lab -> normalization -> patient state -> timeline -> clinical intelligence -> prevention/longevity -> relevant spatial context -> follow-up`

### Imaging
`Imaging -> report/finding -> patient state -> timeline -> clinical reasoning -> Body Exposure localization when evidence supports it`

### Wearables
`Device -> adapter -> normalized telemetry -> longitudinal state -> trends -> contextual coaching/clinical view when appropriate`

### Diagnosis
`Diagnosis -> clinical record -> timeline -> relevant Body Exposure context -> treatment/monitoring -> outcome`

### Procedure
`Procedure -> clinical documentation -> timeline -> anatomy/simulation context -> modeled intervention state when justified -> coupled response -> outcome monitoring`

### Cross-system physiology
`measured/reference boundary conditions -> specialized engines -> typed coupling -> model-derived whole-body state -> Clinical/Body Exposure/Simulation projections`


Current canonical implementation evidence (audited at `adfaf2d5040a4e96bb305173060df14bddb75583`):
- `src/lib/physiology/runtime.ts` is the shared typed coupling runtime: engines declare units, model/version/parameter identity, validation/fidelity class, truth class and provenance; duplicate producers, undeclared fields, cycles, unit mismatches and non-finite outputs fail closed.
- `src/lib/physiology/longitudinalBoundary.ts` admits patient-derived boundaries only from measured, imported or clinician-entered longitudinal events; simulated, AI-draft, derived and unavailable states are rejected.
- `src/lib/physiology/canonicalOxygenDelivery.ts` proves the integrated path from canonical observed events through cardiovascular/oxygen engines into a model-derived Reality Error prediction while preserving source lineage and leaving canonical patient truth unchanged.
- `src/lib/physiology/cerebralPerfusionCoupling.ts` and `src/lib/physiology/fickOxygenExtraction.ts` are bounded source-backed model-derived calculations. They do not establish cerebral blood flow, tissue oxygen utilization, diagnosis, prognosis or treatment thresholds, and should be routed through the shared runtime before broader projection.

## Feature-island detection
Flag capabilities that have:
- no inbound workflow;
- no outbound workflow;
- duplicate patient state;
- local terminology inconsistent with shared terminology;
- isolated mock data;
- UI without backend/data contract;
- backend without reachable user workflow;
- duplicated APIs/services;
- no provenance for important clinical outputs;
- model output without model/parameter identity;
- hidden unit conversion across domain engines;
- direct UI-to-UI physiological coupling;
- simulated values written back as measurements;
- duplicated coupling logic that should live in a shared engine/fabric.

Resolution order:
`INTEGRATE -> EXTRACT SHARED CORE -> SPECIALIZE DOMAIN ENGINE -> COUPLE -> VALIDATE -> DEPRECATE SAFELY -> JUSTIFY ISOLATION`

Do not delete a feature solely because it is currently isolated.


## Reality Engine feedback integration

Preferred longitudinal feedback path:

`observation -> Canonical Patient State -> Continuous Human Runtime -> model prediction -> later real observation -> Reality Engine comparison -> calibration / uncertainty / model-gap evidence -> validated projection`.

Integration rules:
- retain both prediction and later observation; never overwrite the former to hide error;
- bind prediction/error records to model, version, parameter set and parent state;
- personalize parameters only when an explicit identifiability contract permits it;
- expose unsupported/unknown state as Reality Gap rather than inventing values;
- replay historical state with the original model/version when reconstructing history;
- keep newer-model reanalysis separate from original historical interpretation;
- isolate counterfactual branches so they cannot publish into the real patient timeline;
- distinguish mechanistic causal edges from correlation.

Additional feature-island flags:
- personalized model with no identifiability/provenance contract;
- prediction surface with no later-outcome comparison;
- hidden unknown/unsupported state;
- replay that cannot reproduce original model/version;
- counterfactual simulation sharing writable state with the real timeline;
- causal explanation generated only from correlation.
