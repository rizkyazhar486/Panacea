# Panacea Reality Engine & Compounding Human Model — Design Specification

**Date:** 2026-09-27  
**Status:** Owner-approved conceptual direction; written-spec review required before canonical propagation or implementation planning.  
**Parent doctrines:** `PANACEA_COMPUTATIONAL_HUMAN_PLATFORM.md`, `PANACEA_VERTICAL_COMPUTATIONAL_HUMAN_DOCTRINE.md`, and `docs/superpowers/specs/2026-09-27-continuous-human-state-runtime-design.md`.

## 1. Strategic decision

Panaceamed must not stop at being a continuously updating digital health platform.

It should evolve into a **continuously self-calibrating computational human**: a permissioned model of one person that remembers state transitions, quantifies what it does not know, learns from prediction error, can replay prior states, can generate explicitly labeled counterfactual branches, and becomes more individualized over time.

The durable moat is not route count, UI complexity, or generic AI capability. It is the compounding depth of:

```text
longitudinal observations
+ personal calibration
+ mechanistic models
+ causal provenance
+ outcome feedback
+ validated uncertainty
+ secure device/clinical integration
= progressively harder-to-reproduce individual human model
```

## 2. The Reality Engine

The Reality Engine is the layer that continuously compares the computational human with newly observed reality.

Let the best current estimated human state be:

[
hat X_t
]

and the new observed state components be:

[
Y_t
]

The model-prediction error is:

[
e_t = Y_t - H(hat X_t)
]

where (H) maps the internal state to expected observations.

The engine must not blindly force (e_t 	o 0). Instead it asks:

- is the discrepancy sensor noise?
- is the model structurally incomplete?
- is a parameter wrong?
- did an intervention/exposure occur?
- is a cross-system coupling missing?
- is the observation stale or low quality?
- does the model's supported domain exclude this state?

The output is either:
- state correction;
- parameter recalibration;
- uncertainty expansion;
- model-gap flag;
- missing-observation request;
- validation/falsification evidence;
- no update when evidence is insufficient.

The Reality Engine therefore converts disagreement with reality into scientific information rather than hiding it.

## 3. Personal Biological Source Code

Each person has a versioned personal parameter/state model:

[
Theta_i(t)
]

representing only parameters Panacea is scientifically justified in personalizing.

Examples may eventually include:
- resting/autonomic response characteristics;
- exercise-response kinetics;
- recovery dynamics;
- insulin/glucose response parameters;
- fluid/volume-response parameters;
- pharmacokinetic/pharmacodynamic parameters where supported;
- respiratory response;
- thermal response;
- sleep/recovery effects;
- renal handling parameters;
- disease-specific model parameters;
- device-specific calibration factors.

Population/reference parameters remain explicitly distinct from personalized parameters.

Personalization must require:
- evidence-supported parameter meaning;
- identifiable/estimable parameter structure;
- sufficient observations;
- uncertainty;
- version history;
- provenance;
- bounded update rules;
- rollback;
- validation against held-out or subsequent observations where feasible.

The system must never personalize an unidentifiable parameter merely because an optimizer can produce a number.

## 4. Biological Git — version control for a human

Every meaningful real-world state change should be reconstructible as a causal event history.

Analogy:

```text
real observation/intervention = commit
state checkpoint = snapshot
important episode = tag
counterfactual scenario = branch
replayed history = checkout
difference between states = diff
provenance graph = commit ancestry
```

This is an architectural metaphor, not permission to oversimplify biology.

A human-state diff at two times should be representable conceptually as:

[
Delta X = X(t_2)-X(t_1)
]

but the system should expose the causal/event path that explains the transition rather than only a vector difference.

Biological Git must preserve:
- effective time;
- event time;
- source;
- truth class;
- intervention/exposure;
- affected domain-engine states;
- parameter-set version;
- causal parents;
- uncertainty;
- validation status;
- consent/access boundaries.

The real observed history is the canonical reality branch. Simulated futures never overwrite it.

## 5. Human Time Machine

Panacea should eventually reconstruct a prior computational state at any valid historical checkpoint:

```text
state before event
-> event/intervention
-> physiological transition
-> compensation/counter-regulation
-> resulting state
-> observed outcome
```

The user or clinician should be able to replay:
- pre-illness → deterioration → intervention → recovery;
- pre-exercise → effort → recovery;
- medication administration → response;
- procedure/anesthesia course;
- ICU/device-support episode;
- longitudinal wellness/longevity transitions.

Replay must be deterministic relative to the stored event/model versions whenever the underlying model supports deterministic replay.

If historical model code/parameters differ from current versions, the system must distinguish:
- **historical replay** using the original version;
- **reanalysis** using a newer model.

Never silently rewrite history using a newer model.

## 6. Counterfactual Branching

At a real state (X_t), Panacea may create explicitly simulated branches:

[
X_t
ightarrow
{
hat X^{(A)}_{t+Delta},
hat X^{(B)}_{t+Delta},
hat X^{(C)}_{t+Delta}
}
]

Examples:
- exercise intensity A vs B vs rest;
- different simulated procedure steps;
- educational medication-response scenarios;
- device setting scenarios;
- research hypotheses;
- recovery trajectories.

Every branch must carry:
- scenario assumptions;
- intervention set;
- model/version;
- parameter set;
- uncertainty;
- validation class;
- supported domain;
- explicit `counterfactual/simulated` truth class.

Counterfactuals must never be displayed as guaranteed outcomes.

When one real future later occurs, the Reality Engine may compare predicted vs observed outcomes to generate calibration/falsification evidence.

## 7. Prediction–Reality Recalibration Loop

The central compounding loop is:

```text
OBSERVE
  -> ESTIMATE
  -> PREDICT
  -> REALITY OCCURS
  -> COMPARE
  -> EXPLAIN ERROR
  -> RECALIBRATE / EXPAND UNCERTAINTY / FLAG MODEL GAP
  -> VALIDATE
  -> CONTINUE
```

Mathematically:

[
Theta_{t+1}
=
Update(
Theta_t,
e_t,
Q_t,
V_t
)
]

where:
- (e_t) = prediction error;
- (Q_t) = observation quality/uncertainty;
- (V_t) = model validation/support constraints.

No parameter update is allowed merely to improve retrospective fit if it degrades identifiability, plausibility, external validity, or future predictive performance.

## 8. Reality Gap Map

Panacea must explicitly represent what is known versus unknown.

For each state/domain/scale, classify coverage such as:
- directly measured;
- imaging-derived;
- clinician-observed;
- deterministic derived;
- model-constrained;
- population-reference;
- simulated;
- stale;
- unknown;
- unsupported by the current model.

The **Reality Gap** is the structured set of missing or weakly constrained states.

It may be visualized in Body Exposure or other surfaces, but must not invent percentages unless the coverage metric has a defensible denominator and weighting.

The core rule is:

> Unknown physiology must become visible as unknown, not hidden by polished visualization.

This extends the No Hollow Gap doctrine from biological scale depth to epistemic depth.

## 9. Active Sensing Intelligence

When uncertainty matters, Panacea should identify which additional permissible observation would reduce uncertainty the most.

Conceptually:

[
a^*
=
argmax_a
mathbb{E}
[
Delta I(X;Y_a)
]
]

subject to:
- consent;
- safety;
- clinical authority;
- device availability;
- burden/cost;
- evidence;
- purpose;
- regulatory/workflow constraints.

Possible outputs include:
- request another wearable measurement;
- recommend checking an available device signal;
- identify that a specific clinical observation would constrain the model;
- state that no permitted available measurement can resolve the uncertainty.

In clinical contexts this is decision support, not autonomous ordering unless a separately validated/authorized workflow permits it.

The system must never generate unnecessary testing simply to reduce model uncertainty.

## 10. Causal Physiological Graph

Panacea should represent state transitions as explicit causal/mechanistic paths whenever evidence supports them.

Example:

```text
hemorrhage
-> circulating volume ↓
-> preload ↓
-> stroke volume ↓
-> cardiac output ↓
-> arterial pressure ↓
-> baroreflex / autonomic compensation
-> regional perfusion consequences
```

Medication:

```text
dose
-> concentration
-> target engagement
-> organ-level effect
-> cross-system coupling
-> observed response
```

Procedure:

```text
clamp
-> regional resistance/topology change
-> flow redistribution
-> oxygen delivery change
-> tissue/metabolic response
-> compensatory systemic response
```

Each edge should declare, where applicable:
- relation type;
- direction/sign;
- equations/model;
- time scale;
- units;
- assumptions;
- evidence;
- uncertainty;
- validation;
- parent provenance.

Do not create causal edges solely from correlation.

## 11. Human Model SDK / Registry

Panacea should eventually permit validated external/internal model modules to join the computational human through the same contract.

A model module must declare:

[
M
=
{
inputs,
outputs,
units,
state,
equations/algorithm,
parameters,
evidence,
uncertainty,
validation,
provenance,
failure modes,
supported population,
fidelity
}
]

Potential contributors may include:
- academic research groups;
- hospitals;
- medical-device manufacturers;
- computational physiology groups;
- pharmaceutical/biotech research teams;
- validated open-source projects;
- Panacea internal engines.

No model enters production merely because it runs.

Required gates include:
- schema/unit compatibility;
- evidence and license review;
- reproducibility;
- numerical tests;
- benchmark/reference comparison;
- security review;
- privacy review;
- model-card metadata;
- failure/unsupported-domain behavior;
- versioning/rollback;
- clinical validation where the intended use requires it.

The long-term platform opportunity is for specialist models to become governed modules within Panacea rather than forcing Panacea to recreate every scientific niche.

## 12. Privacy-preserving collective learning

Personal calibration belongs to the individual user model.

Population learning must be a separate governed process.

Where technically and scientifically appropriate, future work may use privacy-preserving approaches such as:
- federated learning;
- secure aggregation;
- differential privacy where the utility trade-off is acceptable;
- pseudonymized research datasets;
- split/on-device inference;
- local feature extraction.

These techniques do not automatically make a workflow private or compliant. Every research/training use still requires explicit purpose, governance, access controls, data lineage and validation.

Raw face, genomic, biometric, medical or continuous telemetry data must not silently enter generalized model training.

## 13. Cryptographic and computational provenance

For important model-derived states, Panacea should be able to reconstruct:

```text
source observation/device
-> normalized semantic field
-> model + version
-> parameter set
-> solver/runtime version
-> parent state
-> derived output
-> uncertainty
-> review/publication status
-> AI-EMR projection
```

Where justified, tamper-evident hashes/signatures or append-only logs may strengthen provenance and auditability.

Cryptographic integrity does not establish biomedical correctness; it proves integrity/lineage only.

## 14. Vertical Compounding Depth

The previous vertical-depth function remains:

[
S_{vertical}
=
D_{domain}
	imes
D_{model}
	imes
D_{infrastructure}
	imes
D_{integration}
	imes
D_{validation}
]

This design adds a longitudinal-compounding dimension:

[
S_{compound}
=
S_{vertical}
	imes
D_{personalization}
	imes
D_{temporal}
	imes
D_{causal}
	imes
D_{epistemic}
	imes
D_{feedback}
]

where:
- (D_{personalization}) = scientifically justified individual calibration;
- (D_{temporal}) = replayable/resumable longitudinal depth;
- (D_{causal}) = mechanistic causal connectivity;
- (D_{epistemic}) = explicit known/unknown/uncertainty structure;
- (D_{feedback}) = prediction-vs-reality learning/validation loop.

This is an internal architectural heuristic, not a clinical score.

A future model must not interpret "deeper" as only adding more biological levels. It should also deepen:
- individual calibration;
- temporal continuity;
- causal explanation;
- uncertainty;
- falsifiability;
- state assimilation;
- feedback from outcomes;
- replayability;
- counterfactual validity;
- secure provenance.

## 15. Future-model deepening law

When a future model has additional capability, compute, context or scientific tools, it should preferentially use them to close the deepest unresolved gap in this order:

```text
safety / privacy / security / data integrity
-> canonical truth/state consistency
-> semantic observation quality
-> physiological/domain-model depth
-> cross-system coupling
-> personal parameter identifiability/calibration
-> uncertainty / Reality Gap
-> causal explanation
-> prediction-vs-reality falsification
-> temporal replay/checkpoint fidelity
-> counterfactual validation
-> projection convergence
-> performance/UX
-> justified new breadth
```

Additional intelligence should **increase scientific depth and falsifiability**, not simply generate more content.

### Forbidden shortcuts

Future models must not:
- optimize personalization by overfitting;
- invent latent internal state to make a twin appear complete;
- hide uncertainty;
- treat prediction accuracy on the same calibration data as validation;
- convert correlation into causation without evidence;
- use counterfactuals as clinical certainty;
- request unnecessary measurements for information gain alone;
- silently train population models from private user data;
- replace historical provenance with newer model outputs;
- fabricate continuity while devices are offline;
- increase visual realism faster than biological/state validity.

## 16. User-facing expression

The product should make these capabilities understandable without exposing unnecessary complexity.

Potential high-level user concepts:
- **Now** — current permissioned human state;
- **Why** — causal explanation of meaningful changes;
- **History** — replayable biological timeline;
- **What changed** — state diff;
- **What we know / don't know** — Reality Gap;
- **What would help us know more** — Active Sensing, when justified;
- **What if** — explicitly simulated counterfactual branches;
- **How your body differs from baseline** — personalized model;
- **Evidence / provenance** — source and confidence.

These are projections of shared infrastructure, not independent feature silos.

## 17. Business defensibility principle

The defensible asset is the continuously validated relationship between:
- the person's real observations;
- their longitudinal state;
- personalized parameters;
- intervention history;
- model predictions;
- observed outcomes;
- prediction errors;
- recalibration history;
- validation/provenance.

A competitor may reproduce an interface or a generic model. It is harder to reproduce a years-long, permissioned, scientifically versioned, continuously calibrated model of one person's physiology and responses.

This is not a claim that Panacea becomes impossible to compete with. It defines the compounding system that should make product value and scientific depth increase with longitudinal use.

## 18. Relationship to existing Panacea architecture

This design extends rather than replaces:
- `PANACEA_COMPUTATIONAL_HUMAN_PLATFORM.md`;
- `PANACEA_VERTICAL_COMPUTATIONAL_HUMAN_DOCTRINE.md`;
- `docs/superpowers/specs/2026-09-27-continuous-human-state-runtime-design.md`;
- Canonical Patient State;
- Physiological Runtime;
- Domain Engine Registry;
- Cross-System Coupling;
- AI-EMR publication boundary;
- Body Exposure;
- permission/security architecture;
- No Hollow Gap Principle.

The Continuous Human Runtime provides the evolving state substrate.

The Reality Engine adds:
- personal calibration;
- prediction error;
- epistemic gap tracking;
- active sensing;
- replay;
- branching;
- feedback-driven scientific improvement.

## 19. Implementation decomposition

This program must not be implemented as one monolithic task.

Recommended independent sub-projects:

1. **Reality Error Ledger** — store predicted vs observed quantities with model/version/provenance and no automatic calibration.
2. **Parameter Registry & Identifiability Contract** — declare which parameters may be individualized and under what evidence.
3. **Biological Git / Checkpoint Graph** — immutable/replayable event and model-version history.
4. **Reality Gap Registry** — explicit known/unknown/stale/unsupported coverage.
5. **Active Sensing Planner** — information-value suggestions under consent/safety/burden constraints.
6. **Counterfactual Branch Runtime** — isolated simulation branches that can never overwrite reality.
7. **Calibration Engine** — bounded parameter updates with held-out/future prediction checks.
8. **Causal Graph Runtime** — mechanistic causal traces tied to domain-engine outputs.
9. **Human Model SDK/Registry** — governed external model contract and sandbox.
10. **Projection Layer** — user-facing Now/History/Why/What-if/Reality-Gap views.
11. **Privacy-preserving population learning** — separate later program only after governance, validation and data-purpose design.

Each sub-project requires its own spec/plan if it changes production architecture materially.

## 20. Acceptance criteria for the concept

The concept is realized only when:
- model predictions can be compared against later real observations;
- prediction errors remain auditable rather than being erased;
- personal parameters have explicit identifiability/provenance/uncertainty;
- a model can become less certain when evidence contradicts it;
- historical state can be replayed with the original model/version;
- newer models can reanalyze history without overwriting historical interpretation;
- counterfactual branches remain isolated from the real timeline;
- Reality Gap exposes unsupported/unknown state;
- Active Sensing can decline to recommend a measurement when information gain does not justify burden/risk;
- causal explanations distinguish mechanism from correlation;
- external model modules cannot bypass evidence/security/validation gates;
- longitudinal use can improve calibration without silently converting private data into population training;
- all projections remain governed by the same permission/security and truth-class rules.

## 21. Non-goals

This design does not promise:
- perfect prediction;
- complete observability of the human body;
- autonomous clinical decision-making;
- mind reading;
- deterministic disease futures;
- universal parameter identifiability;
- that every model should personalize;
- that every uncertainty should be reduced;
- that all user data should be retained;
- that privacy techniques eliminate governance requirements;
- that competitors become unable to compete.

The target is a deeper, more falsifiable, more personalized and more useful computational human over time.
