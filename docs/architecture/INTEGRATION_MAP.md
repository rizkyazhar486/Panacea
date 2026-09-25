# Cross-Domain Integration Map

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
- evidence/provenance boundary.

The machine-readable source is `governance/FEATURE_REGISTRY.yaml`.

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
`Procedure -> clinical documentation -> timeline -> anatomy/simulation context -> outcome monitoring`

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
- no provenance for important clinical outputs.

Resolution order:
`INTEGRATE -> EXTRACT SHARED CORE -> SPECIALIZE -> DEPRECATE SAFELY -> JUSTIFY ISOLATION`

Do not delete a feature solely because it is currently isolated.
