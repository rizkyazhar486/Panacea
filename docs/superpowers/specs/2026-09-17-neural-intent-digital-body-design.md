# Neural Intent → Digital Body Design

## Status

Approved product direction from the 17 September 2026 Panaceamed design session. This document defines the production architecture and safety boundary; it does **not** claim that Panaceamed can read thoughts or provide a clinically validated BCI.

Current implementation base: `main@b2227fd5a1ac25dfb7ea8b737e5c2f5a6c19d46b`.

## Goal

Create a device-independent **Intent Layer** that can represent what a user intends to communicate or move, distinguish that intent from what was actually observed, and project the result into Panaceamed's Digital Body without requiring a wearable or neural implant.

The same contract must be able to accept:

- explicit touch/select input;
- voice/AAC input;
- camera or motion-derived observations when permission and a compatible source exist;
- structured rehabilitation tasks;
- future compatible BCI decoder output, including invasive research/clinical systems;
- simulated/demo signals that are visibly marked as simulated and never promoted to measured patient data.

The Intent Layer is an **input normalization and visualization primitive**, not a diagnosis engine, treatment recommender, neural decoder, or autonomous clinical actuator.

## Scientific reference and scope

The immediate research reference is:

Brosler SC, Liu JR, Silva AB, et al. *Simultaneous speech and gesture decoding for multimodal communication in paralysis*. Nature Neuroscience. Published 14 September 2026. DOI: `10.1038/s41593-026-02446-2`.

The study demonstrated proof-of-concept parallel speech and gesture decoding from a single high-density ECoG implant in three participants with severe paralysis, with decoded output driving a personalized full-body avatar in real time. The work used a restricted vocabulary and invasive implanted hardware; generalization remained imperfect and larger cohorts/non-invasive methods remain future work.

Panaceamed therefore MUST NOT generalize this paper into claims that ordinary users can have thoughts, gestures, or speech inferred from a phone, wearable, or generic camera stream.

## Product placement

This capability does **not** create a fourth super-page or a standalone "brain implant" product.

Canonical placement:

- **Your Body** — primary visual surface for Digital Body, intended/observed movement, rehabilitation progress and communication output.
- **Clinical** — optional review surface for source provenance, rehabilitation episodes, neurological context and clinician-reviewed interpretation.
- **AI Chatbot** — may consume only consented/minimum-necessary intent context; it does not invent intent.
- **AI-EMR** — may receive a draft/reference only through the existing review-gated clinical workflow; no autonomous signing or clinical commit.

The Body renderer remains one shared body. Intent changes state/animation/highlight of that shared body rather than creating a second anatomy viewer.

## Architecture

```text
explicit selection / voice / AAC / motion / rehab / compatible BCI
                              │
                              ▼
                    Source-specific adapter
                              │
                              ▼
                        IntentSignal
                              │
                  validate + normalize
                              │
                              ▼
                         IntentEvent
                   provenance + confidence
                              │
              ┌───────────────┼────────────────┐
              ▼               ▼                ▼
        Digital Body      longitudinal      governed AI/
        projection         bridge*          clinical bridge*

* Bridges are follow-on work and must reuse the canonical longitudinal/governance
  contracts once their active PR lane is settled.
```

Phase A in this branch is intentionally limited to the source-independent kernel. It must be independently useful and testable without touching `BodyExposureOS.tsx` or the active longitudinal state implementation.

## Core domain model

### `IntentSourceKind`

```ts
type IntentSourceKind =
  | 'explicit-touch'
  | 'voice-aac'
  | 'motion-observation'
  | 'rehab-task'
  | 'bci-decoder'
  | 'simulation'
```

### `IntentEvidenceClass`

```ts
type IntentEvidenceClass =
  | 'explicit'
  | 'observed'
  | 'decoded'
  | 'simulated'
```

Meaning is strict:

- `explicit`: the user directly selected/issued the intent.
- `observed`: a sensor observed movement or behavior; it does **not** prove intent.
- `decoded`: a compatible decoder emitted an intent hypothesis from a declared signal source.
- `simulated`: demo/training data only.

Observed motion must never silently become intended motion. A camera seeing a hand move can produce an observation event; it cannot produce a decoded neural intent event.

### `IntentAction`

The kernel stores a bounded semantic action instead of arbitrary prose that downstream code would have to interpret unsafely.

Initial action vocabulary:

```ts
type IntentAction =
  | 'communicate'
  | 'speak'
  | 'gesture'
  | 'reach'
  | 'grasp'
  | 'release'
  | 'point'
  | 'nod'
  | 'turn-head'
  | 'move-upper-limb'
  | 'move-lower-limb'
  | 'custom'
```

`custom` requires a non-blank human-readable label but is still non-clinical metadata.

### `IntentEvent`

```ts
interface IntentEvent {
  id: string
  subjectId: string
  action: IntentAction
  customLabel?: string
  effector: IntentEffector
  evidenceClass: IntentEvidenceClass
  source: IntentSource
  capturedAt: string
  receivedAt: string
  decoderConfidence?: number
  signalQuality?: number
  displayConfidence?: number
  consent: IntentConsent
  status: 'candidate' | 'confirmed' | 'rejected'
  tags: readonly string[]
}
```

`candidate` is the default for decoded or observed hypotheses. Explicit user input can be confirmed at construction time because the user generated the action directly. Simulation remains `candidate` and cannot enter patient-specific clinical context.

## Provenance

Every event must preserve at minimum:

- `sourceKind`;
- `sourceId`;
- source/device/decoder `version` when available;
- `capturedAt` and `receivedAt`;
- `method`;
- evidence class;
- whether the source is patient-specific, generic simulation, or imported research data.

A BCI event is valid only when the adapter receives an explicit compatible decoder source identifier. The presence of a "BCI" UI control is never enough to create a measured BCI event.

## Confidence and freshness

Confidence is a display quality indicator, **not** a diagnosis probability, disability score, treatment threshold, or probability that a person "really intended" an action.

For decoded/observed sources the default display confidence is:

```text
C_display = clamp(C_source × Q_signal × F_freshness, 0, 1)
```

where:

```text
F_freshness = exp(-Δt / τ)
```

- `C_source` is the declared decoder/model/source confidence in `[0,1]`.
- `Q_signal` is source signal quality in `[0,1]`.
- `Δt` is age in milliseconds between capture and evaluation.
- `τ` is a source-specific freshness constant supplied by the caller.

No medical threshold is encoded by this formula. The kernel rejects negative/zero `τ`, timestamps in the wrong order, non-finite confidence values, and values outside `[0,1]`.

For explicit user input, display confidence may be omitted because the important fact is that the user explicitly issued the command. The kernel must not fabricate 100% confidence merely because the source is explicit.

## Consent and governance

Intent data can reveal sensitive communication or motor information. Every event must carry a consent envelope with explicit purposes.

Phase A purposes:

```ts
type IntentPurpose =
  | 'personal-visualization'
  | 'rehab-tracking'
  | 'clinical-support'
  | 'ai-context'
```

Rules:

1. Personal visualization requires active `personal-visualization` consent.
2. Clinical and AI bridges remain fail-closed until their canonical governance layers are available and explicitly authorize the event.
3. Simulation is never eligible for clinical or AI patient context.
4. Rejected events are not eligible for downstream projection.
5. Decoded/observed candidate events may be shown as hypotheses but must not be presented as confirmed user intent.

## Digital Body projection

The renderer consumes a small source-independent projection:

```ts
interface DigitalBodyIntentProjection {
  eventId: string
  action: IntentAction
  effector: IntentEffector
  state: 'intended' | 'observed' | 'decoded-candidate' | 'simulated'
  confidence?: number
  capturedAt: string
}
```

The projection may drive animation, highlights, trajectory overlays or communication/avatar output. It must never alter anatomical geometry to imply patient-specific anatomy.

Examples:

- explicit `reach` → animate/highlight intended upper-limb trajectory;
- motion observation → show observed trajectory separately from intent;
- rehab task → compare intended task with observed completion in a later rehabilitation episode layer;
- decoded BCI gesture → render as `decoded-candidate` unless independently confirmed;
- simulation → visibly render as simulated.

## Device-independent fallback

No source is mandatory. If the user has no wearable, camera permission, motion sensor, AAC device or BCI:

- explicit touch remains available;
- voice/AAC can be used when user chooses it;
- structured rehab tasks can be recorded manually;
- the Digital Body still functions as a visual/interaction model.

The product must not punish users with lower product usefulness because they lack a device.

## Failure behavior

The kernel fails closed when:

- IDs or source identifiers are blank;
- timestamps are invalid or capture occurs after receipt;
- source/evidence combinations are impossible (for example `explicit-touch` + `decoded`);
- BCI source lacks decoder identity/version metadata required by the adapter;
- confidence or quality is outside `[0,1]` or non-finite;
- consent is absent/inactive for the requested projection;
- a simulation is requested for clinical/AI use.

It never guesses a missing source, action, effector, confidence, or patient state.

## Safety boundaries

The Intent Layer MUST NOT:

- claim mind reading;
- diagnose neurological disease;
- estimate cognition, competence or mental state;
- infer suicidal intent or emergency status from movement/neural signals;
- prescribe therapy or stimulation;
- control external medical devices;
- create or sign EMR entries autonomously;
- infer patient-specific anatomy from generic atlas geometry;
- present simulated data as measured data;
- convert observed movement into intended movement without explicit evidence.

## Integration dependencies and lane ownership

As of this design:

- PR #1744 owns the longitudinal patient-state/governance foundation. Do not duplicate or edit its owned files from this lane.
- PR #1756 owns current Body/stabilization repair paths. Do not edit `BodyExposureOS.tsx` or Body foundation files until the lane settles.
- PR #1747 owns the `CLAUDE.md` continuation queue. This lane intentionally does not edit `CLAUDE.md`.

After dependencies settle, Phase B should add a narrow bridge from `IntentEvent` to the canonical longitudinal event format and surface projections. Phase C should mount a visual-first Neural/Intent workspace inside the existing Your Body/Body Exposure surface and verify 390×844 plus Body/WebGL acceptance.

## Phase A acceptance criteria

Phase A is complete when all are true:

1. A pure `src/lib/neuralIntent.ts` module defines and validates the source-independent contracts.
2. Source/evidence compatibility is deterministic and fail-closed.
3. Display confidence/freshness calculation follows the documented formula and clamps only the final multiplication, never invalid inputs.
4. Projection preserves the distinction among explicit intent, observed movement, decoded candidate and simulation.
5. Simulation cannot become clinical/AI context.
6. BCI events cannot exist without an explicit decoder source identifier and version.
7. Events and nested metadata returned by constructors are immutable enough that callers cannot mutate shared state accidentally.
8. Deterministic repository tests exercise all safety invariants.
9. TypeScript build remains clean.
10. No existing Body, longitudinal, clinical, AI-EMR or UI behavior changes in Phase A.

## Follow-on acceptance criteria

### Phase B — longitudinal bridge

- waits for the canonical longitudinal foundation to settle on `main`;
- preserves provenance/confidence/evidence class exactly;
- uses the existing purpose-consent and review gates rather than creating a competing governance model;
- never imports simulation into patient context;
- has replay/idempotency tests.

### Phase C — Digital Body UI

- uses the existing shared body viewer;
- no new top-level page;
- source selector and intent actions are reachable within two interactions from Home;
- primary scrolling UI is visual-first with one-line labels;
- interpretation/details use progressive disclosure;
- intended, observed, decoded-candidate and simulated states have persistent non-color labels;
- reduced-motion mode remains understandable;
- mobile verified at 390×844 with no overflow;
- Body/WebGL exact-head acceptance remains green.
