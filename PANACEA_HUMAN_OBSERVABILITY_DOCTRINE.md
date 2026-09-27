# PANACEA HUMAN OBSERVABILITY DOCTRINE

## Universal, longitudinal, permissioned human-state intelligence

**Status:** Mandatory cross-repository architecture doctrine beneath `PANACEA_CONSTITUTION.md` and `PANACEA_COMPUTATIONAL_HUMAN_PLATFORM.md`.

This doctrine formalizes the owner's recurring concept of Panaceamed as a system that can continuously understand a human being across time. The owner's informal word **"surveillance"** is implemented here as **Human Observability**: subject-authorized, purpose-bound, longitudinal observation and state integration for health, clinical care, physiology, performance, research and simulation.

It does **not** authorize covert monitoring, unauthorized tracking, manipulative profiling, law-enforcement targeting, population control, or access outside the subject's consent and the applicable clinical/legal purpose.

The architectural analogy is the operational idea behind an ontology-driven platform: fragmented data, models, relations, decisions, actions and security are unified into a live representation of a changing real-world system. Panacea applies that pattern to the human being while preserving biomedical truth classes, clinical review, privacy, provenance and uncertainty.

Reference architecture analogy:
- Palantir Foundry Ontology overview: https://www.palantir.com/explore/platforms/foundry/ontology/
- Palantir Ontology decision model: https://www.palantir.com/docs/foundry/ontology/why-ontology
- Palantir security/access-control propagation: https://www.palantir.com/docs/foundry/security/access-control-propagation

These references are architectural analogies only. Panacea must not copy proprietary implementation, branding or restricted material.

---

## 1. Functional competence and ethical competence are both mandatory

A system can be morally well-intended and still be functionally bad. A system can also be technically capable and still be unsafe or illegitimate. Panacea must reject both failure modes.

Therefore release maturity is conjunctive:

`K_release = K_function × K_evidence × K_safety × K_governance × K_operability`

Every factor is normalized to `[0,1]`. A near-zero factor keeps release maturity near zero.

Implications:
- good intentions do not excuse unreliable engineering;
- technical competence does not excuse unsafe, non-consensual or ungoverned behavior;
- a feature that looks intelligent but cannot preserve provenance, uncertainty, consent or reproducibility is not mature;
- a feature that is safe but does not actually work is also not mature.

The permanent target is **competent + evidence-grounded + safe + governed + operational**.

---

## 2. The human is the operational world model

Panacea should not treat wearables, laboratory data, AI-EMR, Body Exposure, imaging, procedures, environment, genomics, nutrition, sleep, activity and symptoms as separate applications.

They are observations or projections of one changing human context.

Conceptually, the governed observation history is:

`O[1:t] = { y[1:t], u[1:t], e[1:t], c[1:t], b[1:t], r[1:t] }`

where:
- `y` = measured or imported biological signals;
- `u` = interventions, medications, procedures and therapies;
- `e` = environment and external exposures;
- `c` = clinical context, encounters, findings and records;
- `b` = behavior, activity, sleep, nutrition and performance context;
- `r` = patient-reported state and goals.

A hidden physiological state may be estimated only as a separate truth class:

`p(x_t | O[1:t], θ, M)`

where `x_t` is latent physiological state, `θ` is the parameter set and `M` identifies the exact model/version.

Observed truth and estimated state are never interchangeable.

---

## 3. The universal human ontology

Every important runtime object should ultimately map into a coherent human ontology rather than remain trapped in feature-local state.

Core object families include:
- **Human / Subject** — the authorized person whose state is represented;
- **Observation** — vital, lab, waveform, imaging finding, symptom, measurement or report;
- **Encounter** — visit, admission, consultation, procedure episode or care episode;
- **Intervention** — medication, procedure, device therapy, exercise, nutrition or behavior change;
- **Exposure** — environment, location-derived exposure, occupational exposure or external stressor;
- **Behavior Episode** — activity, sleep, meal, recovery, training or adherence event;
- **Anatomical Context** — reference anatomical structure and spatial context, never silently patient-specific;
- **Clinical Finding** — clinician-authored or appropriately reviewed finding;
- **Model State** — derived, inferred, simulated or forecast state with model provenance;
- **Outcome** — measured downstream response after an intervention or event;
- **Device** — wearable, medical device, imaging system or validated data source;
- **Evidence** — guideline, study, atlas, model source, dataset or parameter provenance;
- **Consent / Authorization** — purpose, scope, time window, revocation and policy version;
- **Action / Decision** — recommendation, annotation, escalation, order draft, simulation or user action;
- **Alert / Signal** — a detected condition that still retains source, uncertainty and review state.

Relations are first-class:
- temporal;
- anatomical/spatial;
- subject/object ownership;
- source/provenance;
- measurement-of;
- intervention-on;
- response-to;
- evidence-supports;
- model-derived-from;
- reviewed-by;
- authorized-for-purpose;
- causal only when evidence justifies causal semantics.

---

## 4. Operational loop

The canonical loop is:

`SENSE → NORMALIZE → IDENTIFY → PROVENANCE → AUTHORIZE → FUSE → ESTIMATE → SIMULATE → DETECT → EXPLAIN → REVIEW → ACT → MEASURE OUTCOME → LEARN`

Each transition must be inspectable.

### 4.1 Sense
Accept real observations from authorized sources: wearables, medical devices, clinical systems, laboratory systems, imaging systems, patient input, environment adapters and future validated sensors.

### 4.2 Normalize
Normalize units, identifiers, timestamps, coding systems, source metadata and quality flags without destroying the original record.

### 4.3 Identify
Bind every event to the correct subject, encounter, device, anatomical context and source version. Ambiguous identity fails closed.

### 4.4 Provenance
Every transformation must preserve where the information came from, when it was captured, when it was received, what transformation occurred and which software/model version performed it.

### 4.5 Authorize
Purpose-bound consent and authorization are evaluated before data enter a projection, model context or action path. Revocation must propagate forward.

### 4.6 Fuse
Fuse related signals into a coherent temporal context, but never erase disagreements, source conflicts or missingness.

### 4.7 Estimate
Derived or latent states are explicitly marked as non-observed. Unknown remains unknown.

### 4.8 Simulate
Counterfactual and mechanistic simulation remains separate from recorded patient truth.

### 4.9 Detect
Detect deviations, events and safety signals only within validated scope. A signal is not automatically a diagnosis.

### 4.10 Explain
Show the evidence path, contributing observations, model/version, assumptions, uncertainty and relevant blind spots.

### 4.11 Review
High-risk outputs route to appropriate qualified human review rather than silently self-promote into clinical truth.

### 4.12 Act
Actions must be bounded by authorization. Recommendation, draft, alert, simulation and actual device/clinical actuation are distinct action classes.

### 4.13 Measure outcome
The post-action state returns to the longitudinal record as new observed evidence.

### 4.14 Learn
Outcome data can improve models only through governed evaluation, versioning, validation and rollback. Production learning must not become silent uncontrolled model mutation.

---

## 5. Continuous does not mean fabricated

"Real time" means the system reacts to source events with bounded latency. It does not mean inventing data between measurements.

For any variable `z`:

`z(t) = observed value when valid evidence exists; otherwise model estimate z_hat(t; M) only when explicitly declared; otherwise unknown.`

The UI and APIs must preserve these distinctions.

Required behaviors:
- show last-known timestamp;
- show freshness/staleness;
- show missing expected streams;
- show source interruption;
- show uncertainty;
- never backfill absent measurements with visually plausible values unless explicitly labeled simulated/estimated;
- never convert a reference atlas into patient-specific internal anatomy.

Blind spots are first-class state, not an error to hide.

---

## 5A. Knowledge boundary and uncertainty anatomy

This doctrine inherits [`PANACEA_INVICTUS_PRINCIPLE.md`](PANACEA_INVICTUS_PRINCIPLE.md).

Every important human-state question should be able to expose a **knowledge boundary** rather than collapse uncertainty into one answer:

- `KNOWN`
- `KNOWN_WITH_UNCERTAINTY`
- `KNOWABLE_BUT_UNMEASURED`
- `CURRENTLY_UNIDENTIFIABLE`
- `SCIENTIFICALLY_UNCERTAIN`
- `UNSUPPORTED`

These are epistemic boundary states, not diagnoses or confidence scores. Body Exposure and other projections should progressively support **uncertainty anatomy**: making it visible which structures/signals are observed, estimated, stale, reference-only, unknown or unsupported for the individual. Realistic rendering must never visually erase a knowledge gap.


## 6. Human observability is multiscale

The same longitudinal identity should remain coherent across:

`whole human → system → organ → tissue → cell → organelle → molecular network → RNA → chromatin → DNA`

This does not imply that every scale is directly observable in a living person.

At each scale, Panacea must declare whether the representation is:
- observed;
- derived;
- model-estimated;
- simulated;
- reference/population;
- unknown.

A higher-resolution scientific representation must never be presented as direct knowledge of that individual's body unless the evidence actually supports it.

---

## 7. Every product surface is a projection, not another truth store

Clinical, AI-EMR, Your Body, Body Exposure, timeline/replay, AI chatbot, performance, longevity, research and future modules should read from governed shared state.

They may present different views, but should not independently invent competing patient truth.

The long-term architecture is:

`Sources → Canonical Longitudinal State → Human Ontology → Domain Engines → Cross-System Coupling → Governed Projections → Authorized Actions → Outcomes → State`

New work should preferentially deepen this loop rather than create isolated feature-local databases or duplicate state machines.

---

## 8. Security and consent wrap the entire graph

Security is not a final API middleware step. It is part of the ontology and action model.

Minimum invariants:
- explicit subject identity;
- purpose-bound access;
- least privilege;
- minimum necessary data;
- revocable consent where applicable;
- source and transformation lineage;
- immutable audit trail for high-risk events;
- encryption and secure transport where production infrastructure supports it;
- retention/deletion policy;
- separation of clinical, research, educational and simulation use;
- no cross-subject data fusion without an authorized population/research purpose;
- no covert collection;
- no privilege escalation by an AI agent;
- no action merely because the data are technically accessible.

A data-derived artifact should not silently lose the access restrictions of its source.

---

## 9. Decision lineage

Every material recommendation or action should ultimately be reconstructable as:

`D_t = (Data_t, Logic_t, Model_t, Evidence_t, Authorization_t, HumanReview_t, Action_t, Outcome_[t+Δ])`

This is the minimum decision-lineage concept.

For high-risk clinical workflows, Panacea should be able to answer:
- what data existed at the decision time;
- what data were missing;
- which model/version ran;
- what rules and evidence were used;
- what uncertainty was present;
- who reviewed it;
- what action occurred;
- what later outcome was observed.

---

## 10. Existing runtime foundation

Do not rebuild the observability substrate from scratch. The current repository already contains key primitives that should converge under this doctrine:

- `src/lib/panaceaLongitudinalState.ts` — canonical longitudinal events, truth semantics, provenance and event bus;
- `src/lib/purposeConsentLedger.ts` — purpose-specific consent history and revocation;
- `src/lib/longitudinalReplay.ts` — time-aware reconstruction;
- `src/lib/longitudinalDigitalTwin.ts` — governed patient signal projection;
- `src/lib/medicalDeviceEventEnvelope.ts` — medical-device event boundary;
- `src/lib/environmentTelemetryBridge.ts` — environmental telemetry;
- `src/lib/emrLongitudinalBridge.ts` and `src/lib/careLongitudinalBridge.ts` — clinical state integration;
- `src/lib/bodyClinicalBridge.ts` — clinical/body projection seam;
- `src/lib/humanReplay.ts` and `src/lib/panaceaRealityEngine.ts` — longitudinal/reality-oriented orchestration;
- `src/lib/humanObservability.ts` — universal governed observation frame and explicit blind-spot contract.

Future agents should integrate and deepen these primitives instead of creating parallel incompatible digital twins.

---

## 11. Runtime Human Observability Contract

A universal observability frame should expose, at minimum:

1. subject;
2. observation time and replay clock;
3. intended purpose;
4. canonical state revision;
5. governed observations;
6. explicit truth class per observation;
7. source/provenance;
8. confidence;
9. observed domains;
10. expected-but-missing/stale signal gaps;
11. consent/authorization state;
12. boundary flags for forbidden inferences/actions.

A downstream model that cannot accept these boundaries is not entitled to receive the data.

---

## 12. Universal implementation law

When implementing any new Panacea capability, ask in this order:

1. **What real-world human object/event does this represent?**
2. **Where does its authoritative or reference data originate?**
3. **What is its truth class?**
4. **How is it timestamped and replayed longitudinally?**
5. **What consent/purpose authorizes use?**
6. **How does it connect to the human ontology and existing state?**
7. **Which domain engine consumes or produces it?**
8. **What uncertainty and blind spots remain?**
9. **What action can follow, and who is authorized to take it?**
10. **How will the outcome return to the state and be evaluated?**

If these questions are unanswered, adding another page or widget is usually premature.

---

## 13. Anti-goals

Forbidden architectural interpretations of "human surveillance" include:
- covert spying;
- indiscriminate continuous collection merely because a sensor exists;
- unauthorized location/person tracking;
- social-control scoring;
- manipulative behavioral targeting;
- silent cross-context reuse of sensitive health data;
- collapsing model estimates into measured truth;
- automatic diagnosis/treatment from unvalidated streams;
- unbounded AI access to all historical data;
- autonomous actuation of medical devices without a separately validated and authorized control architecture;
- filling missing data with fabricated values to make the digital twin appear continuous.

The goal is a **high-fidelity, permissioned operational model of the human**, not an omniscient fiction.

---

## 14. North-star outcome

Panacea should progressively become capable of answering, with explicit evidence and uncertainty:

> What is happening to this human now, what changed, why might it have changed, what is still unknown, what could happen next under explicit assumptions, what safe action is authorized, and what actually happened after that action?

The quality of Panacea is not measured by how much it watches. It is measured by how accurately, continuously, transparently and safely it converts authorized observations into useful human understanding and validated action.
