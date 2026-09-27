# Panaceamed Product System Architecture

## Purpose
Define how Panaceamed behaves as one operating system rather than disconnected features.

## Canonical architecture

```text
Clinical / Device / Imaging / Wearable / Environment Inputs
                         |
              Normalization + Provenance
                         |
              Canonical Patient State
                         |
        +----------------+----------------+
        |                                 |
Clinical Knowledge / Evidence       Boundary Conditions
        |                                 |
        +---------- Physiological State Engine ----------+
                    |       |       |       |
                  Cardio   Resp    Renal   Neuro ... domain engines
                    \       |       |      /
                     Cross-System Coupling
                              |
                   Model-derived State/Event Stream
                              |
        +---------------------+---------------------+
        |                     |                     |
Clinical Intelligence     Body Exposure       Simulation/Training
        |                     |                     |
AI-EMR / Workflow         Spatial Projection   Procedure / Device UI
        |
Longitudinal follow-up / outcome feedback
```

The Canonical Patient State remains the recorded/measured patient truth layer. The Physiological State Engine is a separate derived computational layer and must never silently write simulated values back as measurements.

This is a product architecture direction, not a requirement for one physical service.

## Computational-human architecture

The canonical architecture doctrine is [`PANACEA_COMPUTATIONAL_HUMAN_PLATFORM.md`](../../PANACEA_COMPUTATIONAL_HUMAN_PLATFORM.md).

Panaceamed should deepen through shared primitives and specialized domain engines before creating additional disconnected surfaces. Each domain engine owns a bounded computational model and exposes typed inputs/outputs, units, assumptions, parameters, provenance, uncertainty, validation class and coupling interfaces. Application surfaces consume shared state and events rather than becoming physiological sources of truth.

The preferred technical progression is:

`shared primitive -> specialized domain engine -> cross-system coupling -> validation -> projection -> optimization`.

## Core product moats
### Clinical Intelligence + AI-EMR
Longitudinal clinical context, reasoning support, provenance, uncertainty, clinician review, follow-up and outcome tracking.

### Body Exposure
Principal spatial projector and interaction surface over shared reference anatomy, patient context and model-derived physiological/simulation state. It connects anatomy, physiology, pathology, imaging, education and interventions without confusing reference anatomy, measured patient state and simulation state.

### Longitudinal Health / Prevention / Longevity
Trajectory-aware health state integrating clinically appropriate history, labs, imaging, activity, sleep, wearables, lifestyle, medications, family history and genomics when available.

## Shared-service candidates
Prefer common services for:
- identity/authentication;
- patient/context identity;
- timeline/events;
- terminology;
- unit normalization;
- source/provenance;
- consent;
- authorization;
- audit;
- notifications;
- search;
- AI reasoning gateway;
- evidence retrieval;
- device/integration adapters;
- analytics/observability;
- domain-engine/model/parameter registry;
- cross-system coupling and simulation scheduling;
- scientific validation harness.

Do not extract a shared service only for architectural aesthetics. Extract when duplication, inconsistency, safety or integration cost justifies it.

## Event model
Important state transitions should be expressible as events, for example:
- LAB_RESULT_RECEIVED
- OBSERVATION_RECORDED
- DIAGNOSIS_RECORDED
- MEDICATION_STARTED
- IMAGING_RESULT_AVAILABLE
- PROCEDURE_COMPLETED
- CLINICIAN_REVIEW_COMPLETED
- FOLLOWUP_REQUIRED
- PATIENT_STATE_UPDATED
- PHYSIOLOGICAL_MODEL_STARTED
- PHYSIOLOGICAL_STATE_UPDATED
- CROSS_SYSTEM_COUPLING_APPLIED
- MODEL_VALIDATION_STATUS_CHANGED

One event may be consumed by multiple domains, but should not cause each domain to create its own conflicting patient truth.

## Product success
Measure:
- complete end-to-end workflows;
- integration coverage;
- coherent state ownership;
- reduction of duplicate logic/state;
- reliable user outcomes;
- traceability;
- clinical/product validation status;
- friction and failure rates.

Raw route/component/widget counts are secondary implementation statistics.


## Reality Engine extension

Approved child-spec: [../superpowers/specs/2026-09-27-reality-engine-compounding-human-model-design.md](../superpowers/specs/2026-09-27-reality-engine-compounding-human-model-design.md).

The Computational Human Platform should progressively extend the continuous human state with a falsifiable Reality Engine loop:

```text
Observations / interventions
        |
Canonical Patient State
        |
Continuous Human Runtime
        |
Domain Engines + Coupling
        |
Predicted / estimated state
        |
Reality Engine
  |        |         |          |
error    personal   Reality    replay /
ledger   parameters   Gap      counterfactual branches
  \        |         |          /
   +-------+---------+---------+
            |
      later observations
            |
prediction-vs-reality comparison
            |
validation / bounded recalibration / model-gap evidence
            |
Clinical / Your Body / Body Exposure / AI-EMR projections
```

This does not create a second patient-state authority. Canonical Patient State remains measured/recorded truth. Personal model parameters, prediction-error records, counterfactual branches and reanalysis outputs are derived/model metadata with explicit provenance and truth class.

The real observed timeline is canonical reality. Counterfactual branches are isolated simulations. Historical replay should preserve original model/version; newer models may reanalyze history only as a separate interpretation.
