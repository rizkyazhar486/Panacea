# Capability Maturity Model

Canonical architecture doctrine: [`PANACEA_COMPUTATIONAL_HUMAN_PLATFORM.md`](../../PANACEA_COMPUTATIONAL_HUMAN_PLATFORM.md).

## Lifecycle
`DISCOVERED -> MAPPED -> CONNECTED -> FUNCTIONAL -> VALIDATED -> MATURE -> PRODUCTION_READY -> OPTIMIZED`

Definitions:
- **DISCOVERED**: capability exists or is requested.
- **MAPPED**: use case, owner domain, dependencies and boundaries understood.
- **CONNECTED**: participates in canonical state/shared services where appropriate; computational domains expose explicit coupling boundaries rather than UI-to-UI dependencies.
- **FUNCTIONAL**: real workflow works beyond mock/demo appearance; where a physiological/simulation claim exists, an executable model contract exists rather than animation-only behavior.
- **VALIDATED**: relevant deterministic tests and failure modes are covered, and computational models have an explicit validation class appropriate to their claim.
- **MATURE**: reliable, coherent, usable and integrated.
- **PRODUCTION_READY**: required safety/security/privacy/observability/release gates pass.
- **OPTIMIZED**: evidence-driven performance/usability improvements applied.

Clinical validation is separate from software maturity. A feature can be technically mature without being clinically validated.

## Vertical computational depth

For computational-human capabilities, software maturity is necessary but insufficient. Track vertical depth across:

[
S_{vertical}
=
D_{domain}
\times
D_{model}
\times
D_{infrastructure}
\times
D_{integration}
\times
D_{validation}
]

This is an internal heuristic. Unknown factors remain unknown.

Interpretation:
- **Domain depth**: biomedical specificity and appropriate fidelity.
- **Model depth**: executable governing model/algorithm and explicit assumptions rather than display-only content.
- **Infrastructure depth**: state, runtime, persistence, scheduling, provenance, units, observability and failure handling.
- **Integration depth**: canonical state, cross-system coupling and multi-surface reuse.
- **Validation depth**: numerical/software/scientific/expert/clinical validation appropriate to the claim.

A capability cannot be called computationally deep merely because it has a detailed UI or a large amount of content.

## Maturity heuristic

[
M = 0.20F + 0.15I + 0.15R + 0.15U + 0.15C + 0.10S + 0.10O
]

Where:
- F functional completeness
- I integration
- R reliability
- U usability
- C clinical/domain quality
- S safety/security
- O observability/testing

Use only as an internal prioritization heuristic. Unknown dimensions remain unknown.

## Priority heuristic

[
Priority = rac{Impact 	imes Frequency 	imes IntegrationGain 	imes RiskReduction 	imes StrategicValue}{Complexity 	imes RegressionRisk}
]

Do not fabricate precision. Use ordinal or evidence-backed scores when numeric data do not exist.

## Definition of done
For the relevant risk level:
- user can complete intended workflow;
- data/state flow is correct;
- real-vs-mock status is explicit;
- loading/empty/error states work;
- provenance/uncertainty are represented where needed;
- security/privacy implications assessed;
- tests are relevant;
- observability exists;
- integration is coherent;
- measured/recorded state is not conflated with model-derived/simulated state;
- computational models identify model version, parameters, units, assumptions and validation class where relevant;
- cross-system coupling is explicit and tested where relevant;
- shared projections reuse canonical state/model outputs rather than duplicating them;
- source-of-truth registries are updated.

## No Hollow Gap maturity gate

The mandatory deepening contract is [PANACEA_VERTICAL_COMPUTATIONAL_HUMAN_DOCTRINE.md](../../PANACEA_VERTICAL_COMPUTATIONAL_HUMAN_DOCTRINE.md).

For a biological entity (E), optionally track the internal heuristic:

[
VC(E)=\frac{\sum_i w_iC_i}{\sum_iw_i}
]

with a hollow-gap floor:

[
HG(E)=\min_i C_i
]

where (C_i) is completeness of each scientifically relevant scale and (w_i) is its context-specific weight.

These are prioritization heuristics, never clinical scores; unknown completeness remains unknown.

A capability cannot be declared vertically mature when a critical intermediate biological scale remains essentially absent, even if gross anatomy and genomics are individually excellent. Missing relevant layers must be explicit. Superficial UI/3D polish, artificial/fabricated biological content and subjective/unsupported claims cannot increase vertical maturity.

Definition-of-done additionally requires, where applicable:
- anatomy -> tissue -> microarchitecture -> cell/niche continuity;
- organelle/molecular/pathway continuity;
- RNA/gene/regulatory/chromatin/DNA linkage;
- physiology/pathophysiology and cross-scale causality;
- evidence/provenance and explicit truth class;
- visualization fidelity appropriate to each implemented scale;
- explicit `VERTICAL GAP — NOT YET MODELED` boundaries rather than fabricated bridges.
