# Canonical Patient State

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
Clinical, Body Exposure, Timeline, Longevity, Prevention, Wearables and Education may render different views of the same underlying state.

They must not create independent conflicting patient authorities.

## Integration rule
Before adding feature-local patient storage, ask:
1. does the canonical state already represent this?
2. can an existing event/resource be extended?
3. does the new field need a shared semantic code?
4. who owns write authority?
5. how are provenance and conflict handled?
6. how does supersession/correction work?

## Clinical record boundary
Live streams, AI drafts, simulations and reference anatomy do not silently become a signed clinical record.
Promotion into committed clinical state must preserve applicable consent, review, provenance and audit rules already defined by the repository.
