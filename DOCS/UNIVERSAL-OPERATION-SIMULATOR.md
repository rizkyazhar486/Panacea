# Panacea Universal Operation Simulator

## Goal

Build one reusable educational simulation system that can represent the global universe of operations without creating a separate bespoke engine for every procedure.

The target is not to pretend that every operation is already fully modelled. The target is:

```
global procedure universe
-> explicit coverage ledger
-> one simulator contract
-> detailed procedure records
-> source-backed anatomy
-> complications / safety state
-> validated specialty expansion
```

## Reference interaction

The 2026-09-24 owner reference showed a microsurgical field with focused anatomy, instrument-oriented interaction, phase/task guidance, bleeding/hemostasis state, a synthetic physiologic monitor, complication awareness and contextual procedural guidance.

Panacea generalizes that interaction pattern across specialties while preserving an educational boundary.

## Global coverage model

`src/lib/globalOperationUniverse.ts` defines broad operation domains and representative procedure families across:

- general, colorectal, hepatobiliary/pancreatic;
- breast/endocrine and vascular;
- adult and congenital cardiothoracic;
- neurosurgery and spine;
- reconstruction, trauma, sports and hand orthopaedics;
- pediatric surgery;
- urology, OB/GYN and gynecologic oncology;
- plastic/reconstructive and burn surgery;
- ENT/head-neck and ophthalmology;
- oral/maxillofacial surgery;
- transplant surgery;
- dermatologic/minor surgery.

Representative families are a coverage scaffold, not a claim that every named procedure already has detailed simulation.

## Detailed simulation kernel

Every detailed `SurgicalProcedure` can run through the same state machine:

```
orientation
-> risk identification
-> complication injection
-> abstract safety response
-> hemostasis/final safety review
-> next phase
```

State includes current educational phase, field clarity, structures-at-risk awareness, bleeding state, complication scenario, abstract hemostasis review, a synthetic training monitor, completion state and event log.

Synthetic monitor values are visual training state only. They are not patient physiology, treatment thresholds or clinical targets.

## Safety boundary

The simulator may teach anatomy orientation, procedure sequence concepts, structures at risk, complication awareness, high-level safety checkpoints and before/after anatomical intent.

The generic simulator must not generate:

- patient-specific surgical navigation;
- incision coordinates;
- drill trajectories;
- implant sizing;
- device/energy settings;
- medication/anesthetic dosing;
- autonomous clinical decisions.

Patient-specific rehearsal requires real source imaging/geometry, validated registration, provenance and qualified clinician review.

## Interoperability

The global architecture is compatible with WHO ICHI's Target–Action–Means model.

`attachIchiIdentity()` only carries a code/URI when a validated source supplies it. Panacea must never fabricate an ICHI code.

## Expansion rule

A new operation should be added as data, not as another renderer.

Minimum detailed record:

```
procedure identity
specialty/domain
region
approach
learning objectives
phases
anatomy focus
structures at risk
complications
instrument families (non-executable)
patient-specific evidence requirements
provenance/evidence level
```

Then the shared simulation kernel provides the interaction.

## Completion rule

"All operations" is an evolving coverage objective, not a one-time completeness claim.

The repo must expose gaps explicitly:

```
detailed now
+ catalogued families
+ unresolved domains
+ missing source anatomy
+ missing specialty review
+ missing provenance
= operation coverage ledger
```

Expansion continues by highest-value clinical/educational gap while keeping the same engine and safety boundary.
