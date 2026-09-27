# Canonical Patient State

Canonical architecture doctrine: [`PANACEA_COMPUTATIONAL_HUMAN_PLATFORM.md`](../../PANACEA_COMPUTATIONAL_HUMAN_PLATFORM.md).

## Goal
Provide one coherent longitudinal representation of what Panaceamed knows about a person while preserving source, time, confidence and truth class.

Conceptual state:

[
P_t = {Demographics, History, Symptoms, Signs, Vitals, Labs, Imaging, Diagnoses, Medications, Procedures, Wearables, Lifestyle, Genomics, MentalState, Environment, Goals, Outcomes, Time}
]

Transition concept:

[
P_{t+1} = Update(P_t, NewObservation, Intervention, Outcome, Provenance)
]

These equations are architectural abstractions, not physiological equations.

## Physiological state is a separate derived layer

The Canonical Patient State answers: **what is known or recorded about this person?**

The Physiological State Engine answers: **given explicit models, parameters, boundary conditions and uncertainty, what state does the computation represent?**

Conceptually:

[
\frac{d\mathbf{x}}{dt}
=
F(\mathbf{x}, \mathbf{u}, \mathbf{e}, \boldsymbol{\theta}, \mathbf{C}, t)
+
\boldsymbol{\epsilon}
]

A model-derived state element must retain, as applicable:
- model family and version;
- parameter-set identity and provenance;
- solver/runtime version;
- boundary-condition source and time;
- units;
- simulated/model-derived truth class;
- uncertainty/confidence representation;
- validation class;
- assumptions and unsupported domain;
- parent observation/state references.

Model-derived physiological state may use measured Canonical Patient State values as boundary conditions. It does **not** become measured patient truth merely because the model used real patient inputs.

Promotion of any model output into a clinical record requires the explicit workflow, review, provenance and claim boundary appropriate to that output; simulation itself never performs that promotion.

## Truth classes
Where relevant, preserve distinctions such as:
- patient-reported;
- clinician-authored;
- directly measured;
- imported source record;
- reference/atlas;
- calculated;
- model-derived;
- inferred;
- simulated;
- experimental;
- unknown.

Never silently collapse these categories.

## State contract
A state element should carry enough metadata for its risk:
- subject/patient identity;
- semantic code/meaning;
- value and unit;
- effective/captured time;
- received/recorded time when different;
- source/device/system;
- provenance;
- author/reviewer where applicable;
- confidence/uncertainty where applicable;
- consent/access boundary;
- status: draft/verified/signed/superseded etc.

## One patient, many projections
Clinical, Body Exposure, Timeline, Longevity, Prevention, Wearables, Education and simulation may render different views of the same underlying recorded state and, when appropriate, explicitly labelled derived physiological state.

They must not create independent conflicting patient authorities. Projection-specific UI state is not a new patient truth source.

## Integration rule
Before adding feature-local patient storage, ask:
1. does the canonical state already represent this?
2. can an existing event/resource be extended?
3. does the new field need a shared semantic code?
4. who owns write authority?
5. how are provenance and conflict handled?
6. how does supersession/correction work?
7. is this measured/recorded truth or derived physiological/simulation state?
8. if derived, which model/version/parameter set/validation class owns it?

## Clinical record boundary
Live streams, AI drafts, simulations and reference anatomy do not silently become a signed clinical record.
Promotion into committed clinical state must preserve applicable consent, review, provenance and audit rules already defined by the repository.


## Personal model and Reality Engine metadata

The approved Reality Engine architecture may maintain derived metadata such as:
- personal model parameters;
- parameter uncertainty/identifiability status;
- prediction records;
- prediction-vs-observation error records;
- model-gap / Reality Gap classifications;
- replay checkpoints;
- counterfactual branch metadata;
- recalibration history.

These are **not** a second Canonical Patient State.

A personalized parameter does not become measured patient truth merely because it is individualized. It must retain model/version, parameter definition, units, provenance, identifiability assumptions, uncertainty, calibration data references, validation status and rollback/version history.

Prediction errors must remain auditable. Recalibration must not erase the earlier prediction or rewrite the real observed history.

Counterfactual and reanalysis outputs remain separate from the canonical real timeline and cannot enter the signed clinical record without the same explicit review/publication boundary required for other model-derived outputs.
