# Panaceamed Product System Architecture

## Purpose
Define how Panaceamed behaves as one operating system rather than disconnected features.

## Canonical architecture

```text
User Experience
      |
Workflow Engine
      |
+----------------+----------------+----------------+
| Clinical       | Body Exposure  | Longitudinal   |
| Intelligence   | Spatial Model  | Health/Longevity|
+----------------+----------------+----------------+
      |
Canonical Patient State
      |
+--------------+--------------+------------------+
| EMR/Clinical | Wearables    | Labs/Imaging/etc |
+--------------+--------------+------------------+
      |
Clinical Knowledge Graph
      |
Shared Platform Services
      |
Database / Infrastructure / Observability
```

This is a product architecture direction, not a requirement for one physical service.

## Core product moats
### Clinical Intelligence + AI-EMR
Longitudinal clinical context, reasoning support, provenance, uncertainty, clinician review, follow-up and outcome tracking.

### Body Exposure
Spatial workspace connecting anatomy, physiology, pathology, imaging, patient context, education and interventions without confusing reference anatomy with patient-specific anatomy.

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
- analytics/observability.

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
