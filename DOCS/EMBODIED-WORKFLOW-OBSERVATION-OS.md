# Panacea Embodied Workflow Observation OS

## Why this exists

The 2026-09-29 owner-supplied reference shows an egocentric/head-mounted camera observing hands, tools and a workbench, then turning those tiny interactions into a structured record of what happened. Panacea should absorb that idea as an **OS-level observation primitive**, not as another isolated camera page.

The architectural target is:

```text
authorized camera / AR glasses / room camera / device telemetry
-> replaceable perception adapters
-> hand-object evidence graph
-> temporal workflow episode
-> protocol-step evidence + explicit gaps
-> Human Observability boundary
-> Canonical Longitudinal State (derived summary only)
-> Clinical / Records / Simulate / Body Exposure projections
```

This is the equivalent of giving Panacea a governed "visual memory of work" while preserving truth class, consent, uncertainty and human review.

## Canonical implementation

- `src/lib/embodiedWorkflowOS.ts`
- regression coverage in `scripts/qa/human-observability.test.mjs`
- architectural parent: `PANACEA_HUMAN_OBSERVABILITY_DOCTRINE.md`
- canonical truth store: `src/lib/panaceaLongitudinalState.ts`
- simulation consumer: `src/lib/universalOperationSimulator.ts`

No perception model owns patient truth. A future hand tracker, action-recognition model, multimodal model, AR headset or surgical camera can plug into the same contract.

## Architecture

### 1. Capture plane

Supported source classes are head-mounted camera, room camera, mobile camera, AR glasses and mixed sensors.

Capture itself must already be authorized. This layer does not create consent and does not infer identity.

### 2. Perception adapter plane

Adapters may produce:

- hand detections and handedness;
- instruments, containers, reagents, devices, anatomy or workspace objects;
- normalized boxes / tracks;
- hand-object relations;
- action labels such as grasp, move, dispense, position or inspect;
- confidence and source references.

Those outputs are **model estimates**, not measured clinical truth.

### 3. Embodied evidence graph

Each hand-object edge is scored with a weighted geometric mean:

```text
C_interaction
= C_hand^0.20
* C_object^0.20
* C_spatial^0.20
* C_temporal^0.15
* C_contact^0.15
* C_action^0.10
```

The geometric mean is intentional: one weak evidence channel should suppress the aggregate instead of being hidden by several strong channels.

### 4. Workflow / protocol reconstruction

For a protocol step with N required interactions:

```text
coverage_step = matched_required / N

C_step = coverage_step * GM(C_interaction, matched)

coverage_protocol
= sum(weight_step * coverage_step) / sum(weight_step)

Gap_protocol = 1 - coverage_protocol

U_episode = 1 - C_episode
```

`Gap_protocol` is an **observation gap**, not a claim of non-compliance. Missing camera evidence may mean occlusion, model failure, an unobserved action, or a genuinely omitted step. Panacea must preserve that ambiguity.

Step states are therefore:

- `supported-candidate`
- `partial`
- `unobserved`

Never `completed` or `compliant` by model inference alone.

### 5. Canonical-state bridge

Panacea writes only a compact derived summary into Canonical Longitudinal State after explicit subject binding and purpose consent.

Raw media, face identity, biometric identity and pixel geometry stay out of canonical patient state by default.

The bridge uses:

- domain: `other`
- metric: `embodied-workflow-episode`
- semantic state: `model-estimated`
- promotion to `clinician-reviewed` only after an identified accepted review
- provenance: source IDs, capture time, received time, method/version
- uncertainty and protocol gaps preserved in the value

This means an egocentric workflow can later be replayed in Records, explained in Clinical, projected into Body Exposure, or compared with a teaching simulation without creating a parallel truth store.

### External perception adapter boundary

The first concrete adapter boundary is implemented at:

- `src/domains/observability/adapters/embodiedPerceptionAdapter.ts`
- `src/domains/observability/index.ts`
- `scripts/qa/embodied-perception-adapter.test.mjs`

It accepts structured output from an already-authorized perception system and normalizes it into `EmbodiedWorkflowFrame`. It does not ingest raw video bytes.

The adapter fails closed when capture authorization is absent, expired or revoked; source/model provenance is missing; confidence leaves `[0,1]`; normalized geometry is invalid; hand-object references are inconsistent; packet limits are exceeded; or privacy-forbidden raw-media/identity fields are present.

Transport continuity is explicit:

```text
missing_packets = sequence_current - sequence_previous - 1
```

for positive sequence gaps. Timestamp regressions are recorded as clock-integrity gaps instead of silently sorted away, so replay/review layers can distinguish missing transport evidence from a coherent capture stream.

A device-specific camera connector is still required before Panacea can claim live headcam/AR capture support. This adapter is the governed normalization boundary that those connectors must use.

## High-value Panacea use cases

### Laboratory / research

Hands + pipette + rack + tube + centrifuge can become a provenance-preserving protocol record and reproducibility timeline.

### Bedside care

Authorized device setup, specimen handling, examination workflow or checklist evidence can be summarized for review. It must never autonomously diagnose or authorize treatment.

### Procedural education

A learner's hand-instrument-object interactions can be compared with an approved educational protocol and connected to Universal Operation Simulator. No patient-specific trajectory, force threshold, incision coordinate or device setting is generated.

### Rehabilitation

Observed exercise/task interactions can create a longitudinal workflow episode, but movement quality or treatment conclusions remain model estimates until appropriately validated/reviewed.

### Self-care

With explicit user consent, medication organization, device use or home health routines may be represented as model-estimated episodes without covert monitoring.

## Safety and privacy invariants

Hard false by architecture:

- covert capture;
- patient/operator identity inference;
- raw media embedded in canonical patient state;
- automatic protocol-compliance declaration;
- autonomous clinical action;
- patient-specific surgical navigation;
- medication/device actuation;
- replacing measured truth with model estimates.

The perception system should minimize retention and may store raw media only in a separately governed media service with explicit purpose, access control, retention/deletion policy and auditability.

## Future extension points

The stable contract can later absorb:

- depth cameras and 3D hand pose;
- eye gaze;
- instrument telemetry;
- device state streams;
- speech / ambient transcription;
- RFID or barcode confirmation;
- sterile-field / workspace maps;
- procedure-phase recognition;
- multimodal foundation models;
- local/on-device privacy-preserving inference;
- clinician annotation and replay.

These enrich evidence. They do not weaken truth-class boundaries.

## External references

1. Grauman K, et al. Ego4D: Around the World in 3,000 Hours of Egocentric Video. CVPR. 2022;18995-19012. https://openaccess.thecvf.com/content/CVPR2022/html/Grauman_Ego4D_Around_the_World_in_3000_Hours_of_Egocentric_Video_CVPR_2022_paper.html
2. Zhang F, Bazarevsky V, Vakunov A, et al. MediaPipe Hands: On-device Real-time Hand Tracking. arXiv:2006.10214. 2020. https://arxiv.org/abs/2006.10214
3. Panacea internal: `PANACEA_HUMAN_OBSERVABILITY_DOCTRINE.md`, `PANACEA_COMPUTATIONAL_HUMAN_PLATFORM.md`, `DOCS/UNIVERSAL-OPERATION-SIMULATOR.md`.
