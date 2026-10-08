# PanaceaMed — Verified Outcome Delivery (Software + Service) Design

**Status:** Proposed implementation specification (2026-10-08). This document is not evidence that any workflow or commercial outcome has shipped.

**Source:** Owner-provided 68-second screen recording, 2026-10-08. Its central proposition is "sell outcomes, not software"; an illustrative on-screen claim contrasts "$1 in software" with "$6 in service". The ratio and suggested business valuations are **unverified rhetoric, not pricing evidence or a financial forecast**.

**Authority and alignment:** Follow [Panacea Constitution](../../../PANACEA_CONSTITUTION.md), [One OS doctrine](../../../PANACEA_ONE_OS_LONGITUDINAL_CARE_DOCTRINE.md), [current wedge](../../../PANACEA_CURRENT_WEDGE.md), [Product Maturity OS](../../../PANACEA_PRODUCT_MATURITY_OS.md), and [Worthiness Evidence Standard](../../../PANACEA_WORTHINESS_EVIDENCE_STANDARD.md). This design operationalizes their existing direction and does not authorize new autonomy, new patient-truth storage, or scope expansion.

## 1. Product decision

PanaceaMed must **deliver verified work**, not merely access to tools, models, dashboards, generated notes, or feature counts.

**North star:** **One patient. One longitudinal state. One trusted care flow. One evidenced next action.**

**Value proposition for the active wedge:** "Help a clinic or hospital complete a longitudinal outpatient encounter—from pre-visit reconciliation through signed clinician decisions, diagnostic/referral result return, patient explanation, reimbursement evidence where relevant, and follow-up—with less administrative friction and no loss of safety or provenance."

The user buys **work reliably brought to a safe, accountable state**. The provider can optionally contract for delivery services around the same software platform. Neither the platform nor a service provider may promise a diagnosis, cure, recovery, or financial reimbursement.

## 2. Define outcomes before building features

Separate three kinds of outcomes:

1. **Workflow outcomes (service-deliverable):** trusted history prepared; clinician-review packet ready; signed documentation complete; externally ordered diagnostic result returned and reviewed; patient communication delivered; follow-up task appropriately closed or escalated; reimbursement evidence packet compiled from signed facts.
2. **Clinical outcomes (observe, never guarantee):** symptom change, adherence, avoided complications, readmissions, morbidity, mortality, patient-reported outcomes. Monitor with appropriate consent, cohort definition, comparators, confounders and qualified clinical validation; do not sell them as guaranteed AI outputs.
3. **Economic outcomes (hypotheses until measured):** staff time saved, less re-entry, fewer missing documents, improved referral/result closure, faster legitimate claim preparation. Do not promise payer approvals or automatically optimize toward higher coding/reimbursement.

**Completion is not the same as auto-generation.** A note draft is not a signed note; a lab alert is not documented review; a referral order is not result return; a payment claim is not payment; patient education sent is not demonstrated comprehension.

## 3. Service unit: the verified longitudinal encounter

The existing longitudinal patient identity and patient-state/event fabric remain canonical. Introduce only a lightweight **workflow projection** or evidence-backed completion contract referencing existing resource IDs; never create a competing patient record, duplicate encounter database, or model-authored clinical truth.

For one eligible encounter:

```text
Authorized inputs (prior visits / devices / vitals / allergies / meds / labs)
  -> identity + units + timing + provenance + consent reconciliation
  -> pre-visit context with missing/conflicting/stale flags
  -> human clinical encounter + documented physical examination
  -> AI-assisted draft and clinically consequential human review/signature
  -> confirmed order/referral transmission or explicit blocked state
  -> verified result return and clinician acknowledgement, when applicable
  -> patient explanation + documented follow-up owner/next action
  -> reimbursement-ready evidence from signed facts, when applicable
  -> verified closure OR honest pending/escalated/failed state
```

An encounter can have legitimate pending downstream tasks after the in-person visit; never label them completed simply because the visit UI closed.

### Minimal outcome contract (design, not a new persisted schema)

| Field | Meaning |
| --- | --- |
| `episodeRef` | Existing canonical encounter/patient references, bound to role/tenant |
| `outcomeKind` | Controlled vocabulary: previsit, signed-record, diagnostic-return, referral, explanation, follow-up, eligible-claim-evidence |
| `eligibility` | Who/what is counted, requirement variants, cutoff and exclusions |
| `owner` | Accountable human/service role; no fictitious owner |
| `state` | not-started / blocked / preparing / needs-review / waiting-external / verified / failed / escalated |
| `requiredEvidence` | Existing source refs and proof receipts; missing evidence stays missing |
| `authorization` | Consent, purpose, actor, tenant, clinical sign-off and policy gates |
| `timing` | Start, relevant deadlines, verification timestamp, stale/pending timestamps |
| `verification` | Rule and/or qualified reviewer, result, method/version, immutable audit reference |
| `nextAction` | Exactly one clearly identified next action per role when work is not verified |

**Invariants:** Never infer `verified` from model-generated text, a click event, missing upstream messages, or a provider integration stub. External result failures and offline queues must be visible. Clinician-authorized changes remain clinically signed; AI does not act as the authorized clinician.

## 4. User experience: service delivered, complexity hidden

Do **not** create a fourth super-page, duplicate dashboard, patient data island, or new attention-maximizing interface.

On the existing clinician-facing episode/Visit OS surface, expose a compact **completion and exception panel**:

- **Ready now:** only data with valid identity, provenance, time and consent.
- **Needs you:** one prioritized clinician sign-off or missing critical observation.
- **Waiting externally:** laboratory, referral, transport, payer or offline synchronization with honest timestamp and accountable owner.
- **Verified done:** completed milestones with evidence and audit drill-down.

A patient sees plain-language next steps and whether follow-up is pending, not a misleading green clinical outcome score. A clinic operator sees task ownership and delays, not unrestricted patient details. Each role gets a focused next action; full details are progressive disclosure.

## 5. Minimum measurable pilot: one real episode, not 1,000 features

**Population:** a predeclared subset of outpatient/primary-care episodes, including a low-connectivity/referral scenario. Define eligibility, exclusions, endpoints, risk categories, clinician consent and data permissions before data collection.

**Primary operational endpoint**

```text
Verified completion rate =
  eligible episodes with ALL required milestones evidenced and approved by the cutoff
  / ALL eligible episodes started in the measurement window
```

Publish the denominator, cutoff, open/pending/failed counts, and case-mix. Do not drop hard cases silently to improve the result. Report **end-to-end episode closure** separately from **visit-documentation closure**.

**Secondary endpoints:**

- Clinician administrative minutes per eligible encounter, baseline versus Panacea in matched workflow/case-mix.
- Duplicate-entry events and clinically relevant missing-data events per encounter.
- Percentage of signed documents with traceable sources and role-correct authorization.
- Time from result availability to documented qualified review; urgent exceptions separately.
- Referral/result return rate by deadline and documented escalation rate.
- Patient comprehension on a predefined, validated or explicitly exploratory instrument.
- First-pass legitimate claim readiness where applicable, without upcoding or implied payer acceptance.
- Safety: wrong-patient events, unauthorized clinical decisions, missed urgent results, privacy/consent breaches, and severity-weighted incidents. **Any serious safety failure blocks commercialization irrespective of productivity gains.**

```text
Administrative time saved per case = T_baseline - T_Panacea
Net buyer value =
  (verified staff minutes saved x loaded labor cost per minute)
  + measured avoided rework cost
  + measured cash-flow value where attributable
  - integration / human review / training / operations / subscription cost
```

These are **measurement formulas, not forecasts**. Report confidence intervals, exposure period, nonresponse/missing data, and costs when evidence supports it. Clinical quality must not worsen in exchange for faster documentation.

**Evidence gate:** E0 thesis -> E1 implementation/tests -> E2 workflow comparison -> E3 supervised pilot -> E4 independent review/replication. No label such as "validated outcome" at E0/E1.

## 6. Business model: price accountable work, not tokens or vague autonomy

Test alternatives rather than assuming the video's 1:6 analogy:

- **Platform subscription:** secure base tooling, support and validated interoperability.
- **Managed workflow service:** explicitly scoped onboarding, data reconciliation, exception handling, and human-supervised care coordination, using appropriately credentialed staff.
- **Per verified operational unit:** only for objectively auditable *administrative* milestones with clear dispute/rework rules; not payment for diagnosing, prescribing, denying care, patient deterioration, or inflating claim codes.

Define who the buyer is (clinic, hospital, payer partner where lawful), what a unit includes, delivery responsibilities, latency expectations, exceptions, reversals, consent, professional liability, and what happens if third-party capacity is unavailable. Pilot willingness to pay and service unit economics before changing pricing.

```text
Unit contribution =
  realized revenue per delivered service unit
  - inference/computing cost
  - trained human review labor
  - integration/operations/support cost
  - remediation/rework and expected loss reserves
```

Never present illustrative ratios or hypothetical valuation as measured ROI.

## 7. Superpowers-style execution plan: smallest safe vertical slice

1. **Reconnaissance and test definition:** map existing episode IDs, clinical review/signature states, task/order/referral models, provenance events and permission gates; inspect overlapping PR ownership on live `main`; baseline available user journey. Do not add persistence before proving reuse.
2. **Red tests first:** construct deterministic fixtures showing (a) a valid signed episode, (b) unsigned AI-EMR draft, (c) lab result with no clinician acknowledgement, (d) wrong patient/tenant, (e) absent consent, (f) offline external referral pending, (g) stale timestamp, (h) aborted verification. Only (a) qualifies for its corresponding milestone; clinical outcome remains unclaimed.
3. **Smallest shared implementation:** pure, provenance-aware `deriveOutcomeStatus(existingEvents, role, policy)` selector/projection with evidence references; avoid a new canonical store. Keep clinician review gate fail-closed. Add focused unit tests.
4. **Existing UI projection:** show one pending action and expandable evidence on Visit OS. Preserve mobile compactness and role-specific privacy. Add interaction/accessibility tests and no-regression checks for existing clinical flows.
5. **Operational proof:** collect de-identified and consent-aware milestone events with data minimization, then run a supervised matched baseline pilot with independent reviewers.
6. **Commercial experiment:** buyer interviews, willingness to pay, measured delivery cost, cancellation/dispute/service-failure handling. Only then test workflow/service pricing.

### Engineering acceptance

- Identity, tenant, purpose and permission gates are enforced on **every** evidence reference.
- Clinically consequential completion cannot occur without authorized clinician review/signature.
- Missing, conflicting or stale data produce unknown/pending/blocked, never fabricated success.
- No duplicate patient state or new top-level page; use existing episode workflow.
- Deterministic tests and exact-head CI pass; inspect current `main` before opening or merging PR.
- Clear E1/E2/E3/E4 evidence labels and no unmeasured speed, safety, clinical or financial claims.
- Severe safety/trust regressions veto launch even when workflow metrics improve.

## 8. Decision rule for the backlog

For any future capability, ask:

> **What specific accountable job does this complete for whom, what canonical evidence proves completion, who holds clinical authority, and does it measurably improve the selected outpatient episode?**

If these questions cannot be answered, keep the feature as a supporting research/education capability or backlog it. Body Exposure remains valuable for education and domain accuracy, but is not falsely labeled a completed clinical service.

**Operating loop:** `observe -> reconcile -> prepare -> request authorization -> execute permitted work -> verify evidence -> close or escalate -> measure -> improve`.

**Bottom line:** PanaceaMed should be a clinically governed **outcome-delivery operating system**; it must not become an unlicensed autonomous care provider or a dashboard claiming patient benefit without evidence.
