# Continuous Human State Runtime — Design Specification

**Date:** 2026-09-27  
**Status:** Revised owner-directed architecture; expanded for permissioned real-time human mirroring and zero-trust privacy. Requires owner re-approval before implementation planning.  
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

## 14. Real-time permissioned human mirror

Panaceamed may present a **real-time external human mirror** only from data the user has explicitly permissioned and the device can actually observe.

### External appearance

Examples include:
- live camera appearance;
- face/skin surface appearance;
- posture and gross movement;
- visible wounds/skin changes when camera quality and permission support them;
- depth/mesh reconstruction only when a depth-capable source exists.

A normal RGB camera can show a live image, but it must not be represented as an exact metric 3D body surface without appropriate depth/geometry evidence.

Raw camera/video should default to **ephemeral on-device processing** where feasible. Persisting or uploading raw face/body imagery requires a separate explicit purpose-scoped permission.

### Internal body

The internal body shown at the same timestamp may combine:
- measured physiological observations;
- imaging-derived anatomy/pathology;
- reference anatomy;
- model-estimated physiology;
- intervention/procedure state.

These layers must remain visually and semantically distinct.

Panaceamed must never imply that an internal structure is literally being seen in real time when it is instead a reference atlas, prior image, inferred state or simulation.

### Consciousness / unconsciousness / cognitive state

Panaceamed may represent **observed or estimated arousal/consciousness-related state** only from supported inputs such as documented clinical examination, EEG/BIS-class signals, sedation/anesthesia context, sleep staging or other validated observations.

It must not claim direct access to thoughts, subjective experience, intention, memory or "mind reading".

The UI must label:
- observed consciousness examination;
- device-derived arousal/sedation index;
- model-estimated state;
- unavailable/unknown.

## 15. Permission and privacy architecture

Permission is part of state computation, not a settings afterthought.

For every data stream, define:

```text
subject
+ source/device
+ data class
+ purpose
+ allowed surfaces
+ allowed recipients
+ effective time
+ expiry/revocation
+ retention policy
+ processing location
+ audit trail
```

A user may permit a wearable HR stream for Your Body while denying raw camera persistence, research export or Clinical access. The runtime must enforce that distinction.

### Consent-scoped access

Authorization must be both identity-aware and purpose-aware.

Prefer:
- OAuth/OIDC/SMART-style authorization for FHIR-facing integrations;
- fine-grained scopes;
- resource/data-class segmentation;
- consent-aware policy evaluation;
- RBAC/ABAC where appropriate;
- explicit device identity and trust state.

Consent withdrawal affects future access immediately. Historical legal/clinical retention obligations, where applicable, must remain separately governed rather than silently deleted or silently retained.

## 16. Security architecture — hard requirement

The continuous human state contains highly sensitive health, biometric, behavioral, device and possibly video data. Security is a first-class architecture layer.

### Zero-trust baseline

No user, device, service, model or network location receives implicit trust.

Every sensitive request requires:
- authenticated subject/service/device identity;
- authorization for the exact resource/purpose;
- token/session freshness;
- policy evaluation;
- auditability.

### Data minimization

Collect and retain only what is required for the approved purpose.

Default rules:
- process raw camera/body imagery on-device when feasible;
- persist derived features instead of raw media when raw media is unnecessary;
- do not retain high-frequency raw waveforms indefinitely by default;
- never reuse health/biometric streams for unrelated analytics, advertising or model training without separate explicit authorization.

### Encryption and keys

Require:
- modern TLS for data in transit;
- encryption at rest;
- hardware/platform-backed key storage on supported devices;
- server-side key-management service for protected backend keys;
- key rotation;
- environment separation;
- secrets never committed to source control.

For especially sensitive streams, support per-subject/per-tenant cryptographic separation where the deployment architecture permits it.

### Mobile/device security

Mobile clients should be evaluated against OWASP MASVS control families including storage, crypto, authentication, network, platform, code, resilience and privacy.

A compromised/rooted/jailbroken device must not automatically receive unrestricted access to sensitive state; device trust may reduce allowed operations according to policy.

### Audit and provenance

Sensitive access and state mutation must produce append-only/auditable security events containing:
- actor/service/device;
- subject;
- action;
- resource/data class;
- purpose;
- authorization/consent decision;
- timestamp;
- outcome;
- relevant policy/version.

Clinical/resource provenance remains distinct from security audit, but the two must be correlatable.

### Break-glass access

If emergency access is ever supported, it must be:
- explicitly invoked;
- narrowly scoped;
- time-limited;
- strongly authenticated;
- prominently audited;
- reviewable after the event.

There is no silent administrator bypass.

### Retention/deletion

Retention is data-class and purpose specific.

The system must support:
- retention policy metadata;
- consent revocation;
- deletion workflows where legally/operationally permitted;
- immutable records only where a valid clinical/legal requirement justifies them;
- export/account closure flows;
- backups that honor documented retention/deletion lifecycle rather than becoming permanent shadow copies.

### Research and training boundary

Research export or AI-model training is a separate purpose from care/personal use.

It requires:
- separate authorization/consent basis where applicable;
- de-identification/pseudonymization appropriate to the use;
- dataset lineage;
- access control;
- reproducibility/audit;
- no assumption that "user allowed app access" means "user allowed model training".

## 17. Privacy-preserving real-time rendering

Clinical, Your Body and Body Exposure should receive the **minimum projection required for the current surface**, not an unrestricted copy of the entire human-state store.

Example:

```text
Continuous Human State
        |
Policy / Consent Evaluation
        |
Projection Builder
  |        |        |
Your Body Clinical Body Exposure
```

The projection builder must strip fields the surface is not authorized to receive.

A skin/face view may use a transient local camera buffer while Clinical receives only derived/authorized findings. Conversely, a clinician may see a signed lab result that Your Body does not need.

## 18. Security acceptance criteria

Before any continuous real-world deployment, the architecture must demonstrate:
- no sensitive stream without explicit source/purpose authorization;
- no unauthorized cross-surface state leakage;
- encryption in transit and at rest;
- secure local storage/key handling;
- auditable authorization/consent decisions;
- revocation enforcement;
- deterministic separation of measured vs estimated state;
- no raw camera/biometric persistence unless explicitly enabled;
- stale/offline data cannot masquerade as live;
- no silent training/research reuse;
- recovery/backup procedures preserve security and retention guarantees;
- security testing against the relevant mobile/API/web threat model.

## 19. User-facing state contract

Every state display in Clinical/Your Body must answer:

1. What is this?
2. What exact time does it represent?
3. Measured, estimated, simulated or stale?
4. Which source/device/model produced it?
5. How fresh is it?
6. What uncertainty/confidence exists?
7. What validation class/assumptions apply?

## 20. Safety boundary

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

## 21. Implementation decomposition

This program is intentionally split into sequential sub-projects:

1. **Continuous runtime kernel** — persistent/resumable state, deterministic event scheduler, checkpoints/replay.
2. **Semantic observation binding** — coded field registry, units and fail-closed device/longitudinal adapters.
3. **State assimilation** — freshness, uncertainty and measured-vs-estimated update rules.
4. **Intervention engine** — exercise, drugs, meals, sleep, environment, procedures/device support.
5. **Projection convergence** — Your Body, Clinical, AI-EMR and Body Exposure use one snapshot API.
6. **Deeper physiological verticals** — respiratory, renal, neuro, endocrine, metabolic, coagulation, immune, pharmacology and procedure engines.
7. **Device continuity** — secure wearable/medical-device streaming with quality/freshness semantics.

Each sub-project must be independently testable.

## 22. Acceptance criteria

Architecture is fulfilled when:
- one subject has one continuous runtime state;
- permissioned external appearance can be rendered live from actual camera/depth sources without claiming unsupported internal visibility;
- internal anatomy/physiology layers clearly distinguish measured/imaged/reference/estimated/simulated state;
- consciousness/arousal representation is observation/model based and never presented as mind reading;
- every projection is filtered by consent/purpose policy before reaching Clinical, Your Body or Body Exposure;
- raw face/body/video data are minimized and default to ephemeral/on-device processing when feasible;
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

## 23. References

Repository authorities:
- `PANACEA_COMPUTATIONAL_HUMAN_PLATFORM.md`
- `docs/architecture/PATIENT_STATE.md`
- `docs/architecture/PRODUCT_SYSTEM.md`
- `src/lib/panaceaLongitudinalState.ts`
- `src/lib/physiology/runtime.ts`
- `DOCS/PHYSIOLOGICAL-RUNTIME.md`
- `DOCS/CARDIOVASCULAR-IDENTITY-ENGINE.md`
- `DOCS/OXYGEN-TRANSPORT-ENGINE.md`

External frameworks to use where appropriate: HL7 FHIR, SMART App Launch/OAuth/OIDC, FHIR Consent/AuditEvent/Provenance/security labels, LOINC, UCUM, DICOM/DICOMweb, IEEE 11073, NIST SP 800-207 zero-trust principles, OWASP MASVS/MASTG, Fick whole-body oxygen transport, hybrid dynamical systems and state-estimation methods.

This specification defines architecture and truth semantics. It does not itself establish clinical validation for any physiological model.
