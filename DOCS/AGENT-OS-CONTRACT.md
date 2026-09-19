# Panacea Agent OS contract

Panacea Agent OS is a thin governance layer over the existing MCP/orchestration foundation. It does not create another patient store, task database, or hidden source of truth.

## Capability routing

Tasks are routed by explicit intent to the smallest sufficient capability set. Equivalent provider families are not invoked together by default. Medical-evidence work requires a discovery capability plus an independent citation-verification capability.

Permission tiers are:

1. read/analyze
2. reversible draft
3. scoped reversible write
4. privileged external action

Privileged external actions require explicit authorization at execution time.

## Durable knowledge loop

Repository-owned durable knowledge may contain only reusable decisions, failure lessons, architectural constraints, and unresolved strategic work. Records are compact summaries with evidence references.

Raw PHI, credentials, tokens, private keys, raw prompts, and transient chat are outside the durable contract. External memory systems such as Notion or Mem may mirror/project approved records, but they are adapters rather than Panacea's source of truth.

## Evidence conflicts

Authority order is:

system of record > direct runtime observation > official documentation > high-quality structured evidence > secondary sources > model inference.

Lower-authority disagreement never overrides stronger evidence. Conflicting claims at the same strongest authority remain an explicit conflict; values are never averaged into false consensus.

## Observability

The canonical trace schema captures trace/session identity, model provider/name/version, selected capabilities and permission tier, tool calls/errors/latency, retrieval provenance, token/cost data when available, evaluation metrics, human/automated feedback, and safety/clinical-escalation flags.

Raw prompts and raw PHI are intentionally absent. A PostHog adapter may receive an approved projection only when Panacea instrumentation is configured; no parallel telemetry store is required by this contract.

## Regression

Deterministic golden routing cases cover feature, bug, medical-evidence, and Body/3D workflows. These tests protect tool-selection efficiency, anti-overlap behavior, independent evidence verification, and permission boundaries without using a model grader.
