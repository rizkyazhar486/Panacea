# PANACEA ONE OS — LONGITUDINAL CARE DOCTRINE

## Status

**Canonical, mandatory, non-negotiable product north star.**

This doctrine records the owner's immutable raw target for Panaceamed. It sits beneath the Panacea Constitution and alongside the Computational Human Platform, Human Observability Doctrine, Humanity 10 Charter and Invictus Principle. Features, pages, models and visual modules may evolve; this target does not.

## 1. Immutable raw target

Panaceamed exists to make fragmented healthcare function as **one simple, trusted, longitudinal, integrated operating system**.

**Panacea One OS = Simplicity × Integration × Longitudinality × Trust × Orchestration**

**Many permissioned inputs → One Patient State → One Coordinated Intelligence → One Synchronized Care Workflow → Auditable outcomes and follow-up**

The user must not carry the complexity of the healthcare system. Backend complexity may be deep; clinician and patient surfaces should remain compact, minimal, legible and action-oriented.

## 2. One patient, one identity, one longitudinal state

There must never be a second patient truth merely because care moves between applications, facilities, rooms, devices or time periods.

**Daily life → outpatient clinic → emergency/ward → operating room → ICU → rehabilitation/home → daily life**

Clinical, AI-EMR, Visit OS, Body Exposure, patient education, wearables, hospital operations and future specialty modules are projections of the same governed patient substrate, not competing sources of truth.

## 3. Continuous data fabric

The target data fabric includes, when consented and technically available:

- patient-generated symptoms, goals and outcomes;
- wearables and home sensors;
- outpatient measurements and physical examination;
- bedside multiparameter monitoring and telemetry;
- operating-room anesthesia, ventilation, infusion and procedure systems;
- ICU monitoring, ventilation, infusion, dialysis/CRRT, ECMO and other critical-care devices;
- laboratory, pathology, ECG, imaging and diagnostic systems;
- medication, pharmacy, allergy and reconciliation data;
- orders, referrals, scheduling, reimbursement and operational state;
- discharge, follow-up, rehabilitation and daily-life recovery data.

The architecture target is continuous longitudinal context, not uncontrolled surveillance. Collection remains purpose-bound, consent-aware, role-authorized and auditable.

## 4. Normalize before intelligence

Raw data must not become clinical truth merely because it arrived from a device or AI.

**Ingest → resolve identity → validate → normalize units/codes → reconcile timestamp/clock → provenance → consent/authorization → canonical event/state → clinical review where required → reasoning/orchestration → role-specific projection**

Preferred healthcare interoperability contracts include HL7 FHIR R4, HL7 v2 where required, DICOM/DICOMweb, IHE device profiles, IEEE 11073 device semantics and standard clinical terminology/codes where appropriate. Vendor support is never claimed without a validated adapter and fixtures.

## 5. Poli patient board is a primary clinical anchor

Visit OS must expose a compact outpatient patient-flow board that answers before a clinician opens a chart:

- who is present in the clinical store;
- which patient state is selected;
- what trustworthy data is already present;
- when the latest valid signal was recorded;
- whether explicit critical results, recorded risk flags, missing observations, or unsigned/unverified work exist;
- what the next **workflow** action is, without pretending to autonomously diagnose or prescribe;
- whether the clinician can move directly into the same AI-EMR and live Visit OS state.

The board must reuse canonical patient identity and existing EMR/device state. It must not create a second queue database or fabricate connectivity.

## 6. Simplicity is an architecture requirement

**Maximum backend depth, minimum surface friction.**

Prefer one clear focus, one dominant next action and progressive disclosure. Do not expose every internal subsystem as a separate dashboard merely because it exists.

A directional product objective is:

**Clinical utility ∝ (continuity × interoperability × trust × actionability) / (fragmentation × workflow friction × cognitive burden)**

This is a product-design objective, not a validated clinical outcome formula.

## 7. Trust is structural

Every clinically meaningful datum or recommendation should preserve, where applicable: subject identity; source/source class; captured/recorded/received time; units/standard codes; provenance/transformation history; confidence/uncertainty; consent/purpose; review/signature state; model/method/version when derived; contradiction/missingness/staleness; and the actor responsible for consequential action.

Unknown stays unknown. Missing data is not silently inferred into recorded truth.

## 8. Autonomous orchestration is bounded

Panacea may automate coordination, normalization, summarization, reminders, routing and other low-risk operational steps when policy permits. It must not silently convert AI output or raw device data into a clinician-signed diagnosis, prescription, procedure order, emergency decision or other consequential clinical act.

**AI / rules → risk classification → policy → authorization level → action → audit → outcome feedback**

Human clinical authority remains explicit where the risk class requires it.

## 9. Anti-fragmentation acceptance gate

Reject, redesign or defer work that creates duplicate patient state, adds an isolated dashboard for already represented data, loses provenance/consent/timing/review state, makes a vendor/model the permanent source of truth, increases cognitive burden without utility, or optimizes feature count rather than end-to-end continuity.

Prefer work that strengthens:

**Observe → reconcile → understand → coordinate → act safely → explain → audit → follow up → learn**

## 10. Minimum One OS acceptance

A release claiming progress toward One OS should demonstrate, with maturity-appropriate evidence:

1. the same patient identity survives movement between relevant surfaces;
2. longitudinal events retain time and provenance;
3. missing or invalid data fails closed;
4. device/EMR inputs do not silently become signed clinical truth;
5. the outpatient board can focus a patient and open the same EMR state;
6. Visit OS consumes governed observations without inventing unsupported device support;
7. consequential clinical outputs remain review/authorization-bound;
8. the mobile surface remains compact and usable;
9. no PHI, secret or credential is committed to the public repository;
10. growth improves integration depth rather than multiplying islands.

## 11. Permanent proof obligation — the pure concept must be demonstrated

Panacea must not merely **look integrated**. The standing product obligation is:

> **Prove that One/Invictus can take fragmented longitudinal data and produce care that is faster, more complete, more trustworthy, and easier to understand.**

This is a falsifiable target, not a marketing sentence. Each dimension must have its own evidence and must remain **unmeasured** until the relevant benchmark or pilot data exist.

### 11.1 Faster

Measure a predefined workflow before and after One OS using the same task definition and comparable users/cases.

**Time reduction (%) = ((T_baseline - T_OneOS) / T_baseline) × 100**

A secondary workflow-friction measure may use:

**Step reduction (%) = ((S_baseline - S_OneOS) / S_baseline) × 100**

Do not claim speed from fewer visible screens alone. Capture actual task-completion time and/or interaction steps.

### 11.2 More complete

Completeness is requirement-relative, never a vague "more data" claim. For a predefined encounter/workflow protocol:

**Completeness coverage = trusted required data classes present / required data classes**

Only reconciled fragments with correct patient identity, valid time, normalization, provenance, and required review state count toward trusted completeness. Missing data remains missing.

### 11.3 More trustworthy

Trust is structural before it is reputational. For the evaluated context:

**Trust coverage = trustworthy reconciled fragments / evaluated fragments**

A fragment is structurally trustworthy only when its patient identity, source, timestamp, provenance, normalization and required clinical review state pass. This metric does not prove clinical correctness by itself; it proves that the system is not hiding unresolved data-quality/review gaps.

### 11.4 Easier to understand

Use a predefined comprehension/task-success instrument for clinicians and/or patients.

**Understanding (%) = correct responses / total scored responses × 100**

**Understanding gain (percentage points) = U_OneOS - U_baseline**

Readability scores or UI aesthetics may be supporting evidence, but do not replace measured comprehension.

### 11.5 No composite score may hide a failed dimension

Do not collapse these four dimensions into one flattering weighted score. A fast workflow with poor trust is not successful; a complete record that nobody understands is not successful.

The executable measurement contract lives in `src/domains/clinical-operations/model/oneOsCareProof.ts`. It must fail closed on invalid benchmark inputs and must not invent speed or comprehension gains when no comparative measurement was supplied.

## 12. Relationship to Invictus

Invictus is the compounding clinical-orchestration kernel direction inside this One OS target. Models, sensors and compute may change and deepen it, but model power does not redefine the product.

Its permanent execution loop is therefore:

**Fragmented longitudinal observations → governed reconciliation → compact clinical context → bounded orchestration → human review where required → outcome/understanding measurement → longitudinal learning**

**One patient. One longitudinal state. One trusted healthcare operating system.**
