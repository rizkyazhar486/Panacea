# Continuous Human State Runtime — Design Specification

**Date:** 2026-09-27  
**Status:** Owner-approved architectural direction; implementation requires a separate reviewed plan.  
**Parent doctrine:** `PANACEA_COMPUTATIONAL_HUMAN_PLATFORM.md`

## 1. Product decision

Panaceamed must represent one human as **one continuously evolving computational state** shared across Clinical, Your Body, AI-EMR, Body Exposure, procedures, devices and future surfaces.

Clinical and Your Body are projections of the same timestamped state:

[
X(t)=\{P(t),\hat{x}(t),O(t),U(t),E(t),\Pi(t)\}
]

- (P(t)): Canonical Patient State — measured/imported/clinician-authored truth.
- (hat{x}(t)): continuously estimated physiological state.
- (O(t)): current observations from devices, labs, imaging and human input.
- (U(t)): active interventions/behaviors.
- (E(t)): environment/exposure context.
- (Pi(t)): provenance, uncertainty, model/version and validation metadata.

The product goal is the best continuously updated state justified by observations and validated models — never false omniscience.

## 2. Exact timestamp, not false exactness

Panaceamed should know the state **at an exact timestamp**, but must not claim every internal variable is exactly observed.

Every field carries:

[
z_i(t)=\{value,unit,effectiveTime,truthClass,uncertainty,source,model,validation\}
]

Truth classes remain explicit: measured, imported, clinician-entered, deterministic-derived, model-estimated, simulated, stale, unavailable.

"Current" means current relative to the freshest accepted observation plus model propagation.

## 3. Continuous-discrete human dynamics

Continuous physiology:

[
\frac{d\mathbf{x}}{dt}
=
F(\mathbf{x},\mathbf{u},\mathbf{e},\boldsymbol{\theta},\mathbf{C},t)
+
\boldsymbol{\epsilon}
]

Discrete events:

[
\mathbf{x}(\tau_k^+)
=
G_k(\mathbf{x}(\tau_k^-),\mathbf{a}_k)
]

Events include medication bolus/infusion changes, meals, exercise, sleep/wake, bleeding, trauma, intubation, ventilator changes, anesthesia, incision, vascular clamp/unclamp, dialysis, ECMO changes, transfusion and other procedures.

The runtime continues from the previous state. It does not restart isolated simulators.

## 4. Device observation model

Devices observe the human rather than directly defining internal truth:

[
\mathbf{y}_t=H(\mathbf{x}_t)+\boldsymbol{\nu}_t
]

Potential inputs include wearable HR/HRV/activity/sleep, supported SpO2, CGM, ECG, BP, arterial line, capnography, ventilator, EEG/BIS, infusion pumps, Swan-Ganz, ECMO, dialysis, labs and imaging.

Every adapter preserves source/device identity, timestamp, semantic code, unit, signal quality and uncertainty when available.

## 5. State assimilation

A State Assimilator sits between observations and model state:

[
\hat{\mathbf{x}}_t
=
A(\hat{\mathbf{x}}_{t^-},\mathbf{y}_t,\mathbf{R}_t,\mathbf{M},\Pi)
]

The architecture does not mandate one estimator. Domains may use direct measured-variable binding, Bayesian filtering, Kalman-family methods, particle methods, optimization or learned estimators only where justified and validated.

Measured patient truth remains in Canonical Patient State; assimilation updates estimated physiology, never the signed clinical record.

## 6. Runtime architecture

```text
Observation / Intervention / Environment Event
                     |
          Semantic + Unit Normalization
                     |
             Canonical Event Stream
                     |
       +-------------+-------------+
       |                           |
Canonical Patient State      Event Scheduler
       |                           |
       +--------- State Assimilator --------+
                     |
           Continuous Human Runtime
                     |
        Specialized Domain Engines
                     |
          Cross-System Coupling Graph
                     |
       Estimated Physiological State
                     |
         Provenance + Uncertainty
                     |
     +---------------+---------------+
     |               |               |
  Your Body        Clinical       Body Exposure
```

## 7. Clinical and Your Body invariant

Your Body presents current everyday physiology/performance context. Clinical presents the same state under stricter clinical governance.

At the same subject and timestamp:

[
State_{YourBody}(t)=Projection_{YourBody}(X(t))
]

[
State_{Clinical}(t)=Projection_{Clinical}(X(t))
]

Differences are projection, permissions, interpretation and workflow — not different physiology.

No surface owns a second copy of current HR, oxygen state, medications, procedure state or modeled physiology.

## 8. Examples

### Exercise

```text
workout/activity event
 -> musculoskeletal demand
 -> metabolic demand
 -> cardiovascular/respiratory coupling
 -> oxygen delivery/utilization
 -> thermal/endocrine/renal compensation
 -> updated shared state
 -> Your Body + Clinical + Body Exposure
```

Fick relationship:

[
\dot VO_2=CO(C_aO_2-C_vO_2)
]

### Medication

Generic PK:

[
\frac{dC}{dt}=Input(t)-Distribution(C,t)-Elimination(C,t)
]

Example PD relationship:

[
E(C)=E_0+\frac{E_{max}C^\gamma}{EC_{50}^\gamma+C^\gamma}
]

only when sourced parameters and validation class exist.

### Procedure/surgery

For resistance-controlled flow:

[
Q=\frac{\Delta P}{R}
]

A clamp event changes a physiological parameter/state, propagates through coupling, and the same resulting state is projected into procedure UI, Clinical and Body Exposure.

## 9. Semantic observation binding

Current `LongitudinalEvent.metric` is free-form and cannot safely bind automatically to physiological fields.

Required chain:

```text
source metric
 -> canonical semantic code
 -> canonical unit
 -> quality/provenance
 -> physiological field binding
```

Use standards where applicable:
- HL7 FHIR;
- LOINC;
- SNOMED CT / approved terminology;
- UCUM;
- DICOM/DICOMweb;
- IEEE 11073 / approved medical-device interfaces.

Never infer equivalence among free-form names like `hr`, `heart-rate`, `pulse` or `spo2` without explicit mapping.

## 10. Freshness

[
Age_i(t)=t-t_{observed,i}
]

[
Fresh_i(t)=Age_i(t)\le TTL_i
]

TTL is field/source specific. A stale measurement must remain timestamped and stale. Model propagation may continue only where supported, and propagated state never becomes measured.

## 11. Persistence and resumability

The current bounded simulation runtime must evolve into a resumable runtime with:

- subjectId;
- runtime/model version;
- physiological epoch;
- current simulation time;
- last wall-clock synchronization;
- domain-engine internal states;
- latest model fields;
- latest accepted boundaries;
- active interventions;
- active devices;
- pending events;
- provenance graph;
- uncertainty state;
- checkpoint history.

On app restart, elapsed time and missed observations are reconciled explicitly. Panacea must not pretend computation continued while offline.

## 12. Event causality

Every event carries subject, event id, semantic type, effective time, received time, source, idempotency key, truth class, payload, provenance, uncertainty/quality and consent/access boundary.

Equal-time events require deterministic ordering or explicit simultaneity rules.

No wall-clock race may change physiological output.

## 13. Multi-rate physiology

Different systems run at different useful timescales:

[
t_{i,n}=n\Delta t_i
]

High-frequency ECG must not force renal/endocrine models to run at waveform frequency.

## 14. User-facing state contract

Every state display in Clinical/Your Body must answer:

1. What is this?
2. What exact time does it represent?
3. Measured, estimated, simulated or stale?
4. Which source/device/model produced it?
5. How fresh is it?
6. What uncertainty/confidence exists?
7. What validation class/assumptions apply?

## 15. Safety boundary

Continuous state does not imply autonomous medicine.

The runtime must not:
- fabricate missing measurements;
- convert model estimates into signed clinical truth;
- hide uncertainty;
- display stale data as live;
- claim consumer-wearable data is clinical-grade without qualification;
- diagnose or prescribe solely because a model state changes;
- represent reference anatomy as patient-specific anatomy;
- call an unvalidated model a clinical digital twin.

## 16. Implementation decomposition

This program is intentionally split into sequential sub-projects:

1. **Continuous runtime kernel** — persistent/resumable state, deterministic event scheduler, checkpoints/replay.
2. **Semantic observation binding** — coded field registry, units and fail-closed device/longitudinal adapters.
3. **State assimilation** — freshness, uncertainty and measured-vs-estimated update rules.
4. **Intervention engine** — exercise, drugs, meals, sleep, environment, procedures/device support.
5. **Projection convergence** — Your Body, Clinical, AI-EMR and Body Exposure use one snapshot API.
6. **Deeper physiological verticals** — respiratory, renal, neuro, endocrine, metabolic, coagulation, immune, pharmacology and procedure engines.
7. **Device continuity** — secure wearable/medical-device streaming with quality/freshness semantics.

Each sub-project must be independently testable.

## 17. Acceptance criteria

Architecture is fulfilled when:
- one subject has one continuous runtime state;
- Clinical and Your Body query the same snapshot timestamp;
- measured truth stays separate from estimated state;
- observations arrive continuously with semantic/unit/provenance contracts;
- interventions change state through engines rather than directly changing UI;
- runtime resumes deterministically after interruption;
- history is replayable from events/checkpoints;
- stale measurements are never presented as live;
- unknown uncertainty remains unknown rather than fabricated;
- devices do not bypass Canonical Patient State governance;
- Body Exposure/procedure simulators project the same state rather than forking it;
- future agents cannot create a second patient-state authority.

## 18. References

Repository authorities:
- `PANACEA_COMPUTATIONAL_HUMAN_PLATFORM.md`
- `docs/architecture/PATIENT_STATE.md`
- `docs/architecture/PRODUCT_SYSTEM.md`
- `src/lib/panaceaLongitudinalState.ts`
- `src/lib/physiology/runtime.ts`
- `DOCS/PHYSIOLOGICAL-RUNTIME.md`
- `DOCS/CARDIOVASCULAR-IDENTITY-ENGINE.md`
- `DOCS/OXYGEN-TRANSPORT-ENGINE.md`

External frameworks to use where appropriate: HL7 FHIR, LOINC, UCUM, DICOM/DICOMweb, IEEE 11073, Fick whole-body oxygen transport, hybrid dynamical systems and state-estimation methods.

This specification defines architecture and truth semantics. It does not itself establish clinical validation for any physiological model.
