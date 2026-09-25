# Capability Maturity Model

## Lifecycle
`DISCOVERED -> MAPPED -> CONNECTED -> FUNCTIONAL -> VALIDATED -> MATURE -> PRODUCTION_READY -> OPTIMIZED`

Definitions:
- **DISCOVERED**: capability exists or is requested.
- **MAPPED**: use case, owner domain, dependencies and boundaries understood.
- **CONNECTED**: participates in canonical state/shared services where appropriate.
- **FUNCTIONAL**: real workflow works beyond mock/demo appearance.
- **VALIDATED**: relevant deterministic tests and failure modes are covered.
- **MATURE**: reliable, coherent, usable and integrated.
- **PRODUCTION_READY**: required safety/security/privacy/observability/release gates pass.
- **OPTIMIZED**: evidence-driven performance/usability improvements applied.

Clinical validation is separate from software maturity. A feature can be technically mature without being clinically validated.

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
- source-of-truth registries are updated.
