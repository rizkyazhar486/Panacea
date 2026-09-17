---
name: panacea-clinical-safety-gate
description: Use when a Panaceamed change can influence diagnosis, triage, treatment, medication, procedure choice, risk communication, patient-specific interpretation, or clinician decision-making.
---

# Panacea Clinical Safety Gate

## Principle
Clinical usefulness must never outrun evidence, provenance, uncertainty handling, or clinician oversight.

## Gate
Before shipping clinically meaningful behavior, classify it as one of:
- education/reference;
- decision support;
- patient-specific inference;
- treatment/procedural recommendation.

Risk increases down that list. Apply stricter review, provenance, validation, and human oversight as risk rises.

## Required checks
- State intended user and clinical context.
- Identify source data, missing data, freshness, and confidence.
- Preserve contraindications, red flags, and uncertainty where relevant.
- Distinguish guideline/reference facts from model-generated interpretation.
- Do not fabricate human review, regulatory status, diagnostic accuracy, or outcome benefit.
- Never convert generic atlas/simulation content into patient-specific anatomy or procedural targeting.
- Do not silently turn wellness metrics into diagnoses.
- Keep an auditable trail from output to evidence/version/model where feasible.

## Release rule
If evidence, scope, or safety boundaries are unresolved, degrade gracefully to education/reference or block the unsafe action. Do not weaken repository medical gates to make CI green.