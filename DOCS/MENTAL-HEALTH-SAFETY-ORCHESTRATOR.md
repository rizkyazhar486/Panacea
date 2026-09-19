# Mental-health safety orchestration boundary

This module is a bounded fail-closed orchestration kernel, not a suicide-risk prediction model.

## Scope

- Accept only explicit user-reported or clinician-entered safety signals.
- Do not convert wearable, sentiment, engagement, camera, voice or model-inferred signals into confirmed suicide-risk facts without explicit confirmation.
- Positive self-harm signals require structured human assessment/handoff and follow-up.
- Current suicidal thoughts, current intent, a current plan with access to means, a recent attempt, or an explicit inability to stay safe produce a hard emergency-escalation state.
- A hard escalation cannot be downgraded by an LLM.
- External contact actions are declarative intents only. The execution layer must still apply authorization, consent, jurisdictional emergency policy and audit requirements.
- This kernel does not diagnose, prescribe, autonomously determine final disposition, or claim qualified clinical review.

## Evidence anchor

The implementation follows the conservative shape of the NIMH ASQ clinical pathways: a positive suicide-risk screen is followed by a brief suicide safety assessment, while current suicidal thoughts are treated as an acute/imminent signal requiring urgent full mental-health evaluation and safety precautions.

References:
- NIMH Ask Suicide-Screening Questions (ASQ) Toolkit: https://www.nimh.nih.gov/research/research-conducted-at-nimh/asq-toolkit-materials
- NIMH Adult Outpatient Brief Suicide Safety Assessment Guide: https://www.nimh.nih.gov/research/research-conducted-at-nimh/asq-toolkit-materials/adult-outpatient/adult-outpatient-brief-suicide-safety-assessment-guide

## Publication boundary

This kernel may be used as an internal orchestration guardrail, but it must not be represented as a clinically validated Panacea suicide-risk instrument. Qualified human clinical review, jurisdiction-specific crisis resources, end-to-end authorization/consent behavior, auditability, and product-surface validation are still required before production clinical claims.
