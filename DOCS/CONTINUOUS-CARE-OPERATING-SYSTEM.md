# Panacea Continuous Care Operating System

Status: implementation foundation. This document defines the longitudinal care workflow requested for daily disease follow-up, ward rounds, high-volume outpatient care, home monitoring, wearable/device ingestion, offline capture, AI-EMR preparation, and clinician review.

## Product intent

Panacea should move history-taking and passive data collection out of the short doctor encounter without moving clinical responsibility out of the clinician.

The operating loop is:

Patient + hospital devices + wearables + existing records
→ normalized provenance-preserving events
→ longitudinal patient state
→ condition-linked daily anamnesis
→ deterministic review-rule evaluation
→ clinician digest / queue
→ clinician verifies history + examines patient + forms assessment
→ clinician signs orders/medications/record
→ accepted data may be projected into FHIR/SATUSEHAT
→ follow-up continues.

A daily interview is not a diagnosis. A device stream is not a signed record. AI output is a draft/context layer until human clinical review.

## Canonical components already reused

Do not create a second EMR, patient state, device stack, imaging stack, or visit kernel.

- src/lib/panaceaLongitudinalState.ts — canonical longitudinal patient state.
- src/lib/healthStoreLongitudinalBridge.ts — current wearable/health-store bridge.
- src/lib/visitOperatingSystem.ts — live visit/device session state.
- src/lib/visitDeviceAdapters.ts — scalar device normalization boundary.
- src/lib/medicalDeviceIntegrationCatalog.ts — industry-wide device-family and standards catalog.
- src/lib/visitFhirObservation.ts — clinician-accepted device Observation publication boundary.
- src/lib/clinicalReviewWorkflow.ts — immutable human review workflow.
- src/lib/emrPipeline.ts — existing AI-EMR/human-gate concepts.
- src/lib/continuousCareOperatingSystem.ts — daily disease-linked anamnesis, offline reconciliation, clinician digest, review-rule evaluation, and QuestionnaireResponse projection.

## Continuous daily anamnesis

Every enrolled patient has a versioned ContinuousCarePlan owned by an identified clinician.

A plan contains:

- one or more diagnosis references with verification status;
- a versioned Questionnaire identifier;
- daily patient questions;
- conditional follow-up questions;
- explicitly clinician-authored patient-reported review rules;
- explicitly clinician-authored measurement review rules;
- monitored longitudinal metrics;
- a daily schedule.

The OS does not invent disease-specific red flags or vital thresholds. The rule contract exists so validated clinical protocols can be loaded later with evidence, version, reviewer, and provenance.

## Doctor workflow

The doctor-facing digest should make 50–100 patient workflows scan quickly without hiding uncertainty.

Per patient, the digest exposes:

- latest patient-reported history;
- unanswered required questions;
- explicit review-rule triggers;
- latest authorized vital/device/wearable signals;
- source, timestamp, review state, and trend;
- one workflow priority derived only from configured rules;
- the remaining human tasks.

Required human tasks remain:

1. verify important patient-reported history;
2. review triggered rules;
3. perform physical examination;
4. form the clinical assessment/diagnosis;
5. review and sign orders/medications.

The desired efficiency is less clerical time and less repeated history-taking, not removal of clinical verification.

## Continuous signals

Hospital bedside systems, home devices, Apple Health-class health stores, Garmin/WHOOP-class vendor data, and future adapters all feed the same longitudinal state after normalization and consent.

High-frequency waveforms and images remain in their appropriate waveform/DICOM stores. The longitudinal kernel should receive normalized references/summary observations, not flatten raw ECG, ventilator waveforms, CT, MRI, ultrasound video, or surgical feeds into scalar rows.

Device/wearable data must preserve:

- patient association;
- device/source identity;
- capturedAt;
- receivedAt;
- unit;
- evidence class;
- signal quality when known;
- adapter/vendor/interface version;
- consent;
- review state.

## Offline-first behavior

The current kernel provides deterministic reconciliation for offline daily reports:

- every report has a stable id;
- every client envelope has a monotonic sequence;
- reports are replayed in queued-time/sequence order;
- duplicate ids are idempotently rejected;
- cross-patient reports fail closed;
- stale plan versions fail closed.

Production follow-up work must add encrypted local persistence, authenticated outbox upload, server acknowledgements, replay protection, retention policy, device-clock handling, and audit events.

## Review rules and formulas

Review rules are workflow triggers, not risk predictions.

Signal age:

ageMinutes = max(0, generatedAt - receivedAt) / 60,000

A measurement rule can trigger only if:

- subject matches;
- clinical-support consent is active;
- metric exists;
- unit exactly matches the verified rule;
- measurement age ≤ configured maxAgeMinutes;
- the configured predicate evaluates true.

Digest priority:

workflowPriority = max(patientReportedRulePriority, measurementRulePriority)

where priority ordering is:

routine < review-today < immediate-human-review

This is an explainable workflow queue. It is not a mortality score, diagnosis probability, disposition rule, or substitute for triage.

## FHIR/SATUSEHAT direction

Use FHIR R4 resources according to their semantics rather than forcing all data into Observation:

- Condition — recorded diagnoses/problems and verification status.
- Questionnaire — versioned disease-follow-up interview definition.
- QuestionnaireResponse — each patient daily anamnesis.
- Observation — measurements and simple assertions such as clinician-accepted device/vital data.
- Encounter — the visit/ward/outpatient context.
- Provenance / AuditEvent — origin and processing/audit boundaries.
- DiagnosticReport / ImagingStudy — reports and imaging context where applicable.

The first kernel now produces a bounded QuestionnaireResponse projection. Network publication remains separate and must use the existing SATUSEHAT identity/validation path.

## Human-in-the-loop boundary

Continuous Care OS may prepare history, trends, evidence context, and rule-triggered review work.

It must not autonomously:

- finalize a diagnosis;
- prescribe or sign medication;
- place a binding order;
- change a ventilator/pump/dialysis/ECMO/implant/device setting;
- perform an emergency disposition;
- suppress a patient from human review because an AI score is low.

## Astra / Claude Code continuation queue

This is a multi-agent handoff. Re-read latest main and open PR overlap before touching shared files.

### Phase B — backend persistence and continuous scheduler

1. Persist ContinuousCarePlan, DailyAnamnesisReport and clinician review events server-side.
2. Add authenticated patient↔clinician membership and authorization using the canonical Visit membership boundary.
3. Add a scheduler/outbox for due daily interviews and missed-check-in state.
4. Add encrypted offline sync acknowledgements, idempotency keys, replay protection and audit events.
5. Never store raw audio/video by default.

### Phase C — clinician inbox and ward-round packets

1. Build one high-density clinician work queue driven by ContinuousCareDigest.
2. Keep the primary UI visual-first and compact; details behind disclosure.
3. Batch review must never permit one-click bulk diagnosis/prescription signing.
4. Add ward-round mode: pre-round digest → physical exam entry → assessment/signoff.

### Phase D — medical device fabric

1. Add canonical non-scalar envelopes for waveform/alarm/setting/report/image references.
2. Implement technical QC: identity, unit, clock skew, replay, liveness, completeness, signal quality.
3. Begin real adapters only from documented/authorized interfaces.
4. Bedside monitors/ventilators first, then infusion, cath-lab IVUS/physiology, POC/lab, implant interrogation.
5. Remain inbound/read-only for high-risk therapy systems.

### Phase E — wearables and home monitoring

1. Normalize Apple Health / HealthKit-class data through the existing health-store bridge.
2. Add Garmin/WHOOP/Oura/Samsung/vendor-cloud adapters only when authorized interfaces exist.
3. Preserve consumer-vs-clinical evidence class.
4. Never promote consumer data to clinical-grade merely because it is continuous.

### Phase F — AI anamnesis

1. Add conversational interview generation over the versioned Questionnaire plan.
2. AI may rephrase and ask allowed follow-ups; it may not silently alter the underlying required questions or rule thresholds.
3. Produce source-linked structured answers plus a concise draft summary.
4. Every clinically committing output remains reviewable and attributable.

### Phase G — interoperability

1. Add Questionnaire and QuestionnaireResponse FHIR conformance fixtures.
2. Bind accepted clinical values to verified terminology and units.
3. Integrate with SATUSEHAT through the existing identity/auth/conformance layer.
4. Add Provenance/AuditEvent boundaries for creation, review and publication.

## Acceptance target

A complete slice is achieved when a patient can answer a scheduled disease-specific daily interview offline or online, authorized device/wearable data is fused into the same longitudinal state, the doctor receives a concise provenance-preserving digest, explicit rules can request human review, and no diagnosis/order/treatment is clinically committed until the doctor reviews and signs it.
