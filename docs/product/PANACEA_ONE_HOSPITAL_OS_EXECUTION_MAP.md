# Panacea One Hospital & Healthcare Ecosystem — Executable Mind Map

**Status:** PROPOSED ACCEPTANCE CONTRACT — not implemented, reviewed, clinically validated, or deployed.
**Date:** 2026-10-28.
**Scope:** The long-term One OS architecture, delivered one evidence-gated clinical episode at a time.
**Authority:** AGENTS.md; docs/governance/README.md; governance/doctrine/PANACEA_CURRENT_WEDGE.md; governance/doctrine/PANACEA_ONE_OS_LONGITUDINAL_CARE_DOCTRINE.md; docs/product/PRD_PANACEAMED.md.
**Machine-readable backlog:** governance/HOSPITAL_ONE_OS_ACCEPTANCE.json.
**Verification:** node --test scripts/qa/hospital-one-os-map.test.mjs.
**Execution contract:** DOCS/handoffs/GEMINI_ARGON_ONE_HOSPITAL_OS.md.

## The entire healthcare ecosystem — editable mind map

~~~mermaid
mindmap
  root((PANACEA ONE OS))
    One governed patient state
      Identity and identity reconciliation
      Consent and purpose
      Source provenance and audit
      Clinical review and signatures
      Time and versioned event history
      Cross-facility interoperability
    Care delivery
      Patient and caregiver
      Doctor and specialty care
      Nurse and allied health
      Laboratory pathology imaging
      Pharmacy and medicines
      Referral discharge and follow-up
    Hospital operations
      Registration and scheduling
      Emergency and triage
      Admission transfer discharge
      Bed and capacity management
      Ward ICU OR and anesthesia
      Staffing supplies and logistics
      Claims and payer evidence
    Education
      Medical nursing allied-health students
      Case-based curricula and OSCE
      Supervision and competency logs
      Anatomy and Body Exposure
      Patient plain-language education
    Research
      Questions protocols and ethics
      Approved cohort and study identity
      Purpose-bound de-identified exports
      Statistical analysis reproducibility
      Translational hypotheses and publication
    AI agents
      Record preparation and evidence retrieval
      Role-specific worklists and handoffs
      Clinical drafts for human review
      Scheduling and operational coordination
      Permission and audit boundaries
      Evaluation and incident escalation
    Data and devices
      HL7 FHIR and SATUSEHAT
      HL7 v2 DICOM IHE and terminology
      LIS RIS PACS and pharmacy
      Wearables and bedside devices
      Offline and legacy source translation
    Adoption and validation
      Synthetic end-to-end journeys
      Browser accessibility usability
      Professional and facility pilots
      Safety and privacy incidents
      Measured benefit and external validation
~~~

This is a **target architecture**, not a claim of existing production services. Preserve one clinical truth and expose role-specific, permissioned projections. Do not turn the map into eight competing dashboards.

## Design invariants

1. **One patient / encounter graph:** patientRef, encounterRef, facilityRef, eventRef, taskRef, and sourceRef all refer to existing canonical entities; no shadow EMR, orphan worklist, or ad-hoc user localStorage.
2. **Separate actors and authorities:** patient, doctor, nurse, lab technician, pharmacist, learner, educator, researcher, facility operator, platform admin, insurer and AI agent are distinct *capabilities* with tenant, task, purpose, licence and consent checks; registering a role does not grant access. Source Role union currently lists eight account values (pasien, dokter, kontributor, verifikator, perawat, lab, admin, owner), whereas the current PRD still describes six; reconcile documentation against actual enforced permissions before adding any new role.
3. **One orchestration graph:** every work item has id, subject, encounter, owner, actor scope, state, timestamps, source provenance, audit, outstanding obligations, and a single contextually useful next action. Reuse present task/event infrastructure.
4. **No autonomous consequential medicine:** AI may summarize, retrieve evidence, prepare drafts and coordinate permitted nonclinical tasks. Only an appropriately authenticated/authorized clinician may make and sign consequential clinical decisions. Nurse, pharmacist and lab authorities stay within approved professional scope.
5. **Truth classes:** measured / clinician-reviewed / signed / historical-imported / derived / educational-reference / simulated / AI-draft / missing are visibly distinguishable. No synthetic data promoted into patient truth.
6. **Minimum external data:** controlled research exports need documented protocol/ethics, lawful basis, subject rights, minimization, disclosure controls, access logging and revocation/retention; editorial contributor/verifier privileges never imply patient-data access.
7. **Clinical before expansion:** uphold the current outpatient longitudinal encounter wedge and red-main stop rule; hospital, education and research are dependency-gated extensions, not permission to multiply unfinished features.
8. **UX:** see → understand → act → confirm; one primary next action, accessible navigation, preserved context, 390px and desktop parity, 44px project touch targets, keyboard/focus, reduced motion, no hidden clinical decisions.

## Canonical cross-role journey — one episode, one truth

| Step | Human accountable | Existing or target interface | Required persisted evidence | Unsafe shortcut to reject |
|---|---|---|---|---|
| 1. Registration / pre-visit | authorized registrar / patient | registration + patient timeline | verified identity and facility scope, purpose, consent | fabricate identity; bypass tenant |
| 2. Assessment and triage | authorized nurse / clinician | assigned worklist + vitals | signed/attributed assessment, measured vitals with units/time, escalation | grant nurse doctor signing privilege |
| 3. Clinician encounter | physician | canonical VisitOS + AI-EMR | clinician-authored/approved note, reviewed problems, plan | treat model draft as signed diagnosis |
| 4. Diagnostic order | authorized clinician | order + referral | patient/encounter-linked order, specimen/study id, custody if applicable | invent lab order or transport status |
| 5. Laboratory execution | authorized lab technician | laboratory task/status | specimen custody, result source and quality, verified result | self-assert reviewed result |
| 6. Result review | physician / authorized reviewer | canonical result inbox | explicit review attribution, unresolved and escalated findings | close episode with unreviewed critical result |
| 7. Medication pathway | pharmacist / authorized nurse, respective duties | pharmacy validation / administration | source order, dispensing or administration event with lawful actor | assume prescription = dispensed = administered |
| 8. Patient education | clinician-reviewed material + patient | approved explanation and learning | versioned shared explanation, education status, follow-up | AI draft silently shared as care decision |
| 9. Facility coordination | scoped care coordinator / admin | referral, appointment, reimbursement task | task ownership, actual status, provenance, evidence packet | claim paid, deny care based on unsupported payer state |
| 10. Follow-up | patient + care team | same longitudinal episode | contacted / pending / escalated / verified closure with obligations | green completion from a click |
| 11. Learning projection | student and supervisor under policy | synthetic or explicitly approved education view | case permission, redaction, assessor and competency evidence | unrestricted access to live patient chart |
| 12. Research projection | approved investigator + ethics governance | purpose-scoped research workspace | protocol, consent/legal basis, lineage, export control, reproducibility | admin/reviewer role creates research entitlement |

All 12 steps are a **requirements storyboard**. Their implementation statuses must be established by source and tests, not inferred from this document.

## Engineering program (dependencies, not artificial T-CLIN numbers)

### Gate G0 — Stabilize existing main, one outpatient proof (P0)

- Inspect current main, open PR #2877 and #2874, exact-head failed checks and ownership. Keep WIP to one integration-critical PR; do not contaminate UX with the other clinical branch.
- Verify existing canonical patient-state, authority, task/encounter, signing, lab and follow-up contracts. Build one deterministic synthetic *cross-role* episode and a negative-permission matrix.
- Fix red-main/CI causes rather than weakening tests, inventing green results or bypassing external human decisions.

### Gate G1 — Nurse/lab/pharmacy/administration attach to same episode (P1)

- First vertical: registrar → nurse handoff → doctor review → ordered lab → custody/reconciliation → pharmacist verification when relevant → patient explanation → coordinated follow-up.
- Explicit task assignments, accept/reject/complete/escalate transitions and role boundaries; patient record stays canonical. Keep missing pharmacy and nursing endpoints flagged unsupported until actually integrated.
- Validate resume after browser reload, interrupted network, duplicate events, clock skew, wrong patient, wrong tenant, wrong actor, missing consent and unsigned care.

### Gate G2 — Hospital operations, not a second hospital database (P2)

- Add ADT, bed occupancy, ward rounds, emergency-to-ward/OR/ICU transfers, transport, staff scheduling and payer evidence only through validated adapters from the same identity and episode graph.
- Do not assert full ICU, operating-theatre, medication administration, staffing, claims or billing capability from a menu or data model.

### Gate G3 — Learning and controlled research (P3)

- Supervised students, nurses-in-training and residents use synthetic or institutionally permitted case projections; assessments, competencies and supervision recorded separately from signed care.
- Investigators need protocol/IRB-ethics gates, lawful basis, de-identification evaluation, cohort lineage, privacy-preserving export and reproducible analysis. Never broaden the editorial account roles into clinical data access.
- Use Body Exposure as source-labelled educational anatomy, not a patient-specific measured model.

### Gate G4 — Governed AI agent and device interoperability (P4)

- Agents operate inside role/purpose-approved tasks, human confirmations, rate/cost limits, traceability, clinical safety escalation, no autonomous clinician identity or raw PHI logging.
- Connect HL7 FHIR R4, SATUSEHAT, HL7 v2, DICOM/DICOMweb, IHE, LOINC, SNOMED CT and RxNorm where lawful/supported; prove per-vendor conformance rather than claiming universal plug-and-play. Device imports preserve calibration, method, timestamp and uncertainty.

### Gate G5 — Field adoption, safety and external verification (P5)

- Representative users: patient, doctor, nurse, lab, pharmacy, operations, medical/nursing student, investigator and AI oversight.
- Pilot endpoints: completed eligible episodes, unreviewed-result backlog, time to completion, duplicate data entry, patient comprehension, clinical safety incidents, role boundary violations, task handoff delays and accessibility.
- Measure against a predeclared baseline in appropriate controlled environments; external human authorizations and clinical validation remain independent gates.

## Definition of Done — each task

A completed claim requires an actual codepath reachable from a real role-permitted UI or backend service, canonical persisted state, negative controls, expected clinical authority, browser/integration evidence where appropriate, repeatable full tests, exact-head CI, and a link to reviewed evidence. Never mark ACCEPTED based on this roadmap or merely a green unit test.

**Acceptance metric:** Verified completion rate = (eligible tasks with a valid completion record and all required evidence / all eligible attempted tasks) × 100%. Unknown baseline or denominator = no numeric claim. Count unreviewed, escalated and blocked states separately; do not quietly remove them from denominators.

**Weakest-link readiness heuristic (proposal, not observed score):** R_HOSP = min(R_clinical, R_nursing, R_hospital, R_education, R_research, R_agents, R_interop, R_safety). Each subscore requires an explicit independently reviewable rubric; missing evidence means unknown, not zero or ten.

## Current documented reality and non-claims

- Current code includes clinical encounter, lab, FHIR and SATUSEHAT surfaces, educational components, MCP, perawat/lab account roles and operational worklists. These are candidates for reuse, **not** proof that all role-specific hospital workflows are complete.
- The PRD says six roles but the Role union defines eight. Resolve through an evidence-backed RBAC inventory; never modify authority to match stale prose.
- PR #2877 and #2874 are open; check their latest statuses. The 2026-10-28 UX exact-head CI has outstanding failures; no completion claim until it truly passes.
- A repository CI pass is not institutional adoption, prospective evidence or regulatory clearance.

## Source contracts

- Internal: docs/governance/README.md; governance/doctrine/PANACEA_CURRENT_WEDGE.md; docs/product/PRD_PANACEAMED.md; governance/FEATURE_REGISTRY.yaml; AGENTS.md.
- HL7 FHIR R4: https://hl7.org/fhir/R4/ ; Task https://hl7.org/fhir/R4/task.html
- IHE profiles: https://profiles.ihe.net/
- Indonesia SATUSEHAT: https://satusehat.kemkes.go.id/platform/
- Web accessibility: https://www.w3.org/TR/WCAG22/
- Human research ethics (WHO guidance): https://www.who.int/health-topics/ethics-and-health
