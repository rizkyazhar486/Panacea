# PANACEA HUMANITY 10/10 CHARTER

## Model-agnostic healthcare impact instructions for every current and future model

**Status:** Normative annex to `PANACEA_CONSTITUTION.md`.

This charter applies to every current and future model, coding agent, research agent, workflow, human contributor, and autonomous system working on Panacea. It exists to prevent the project from optimizing for impressive demos, raw feature count, or model capability at the expense of measurable human benefit.

The repository owner's latest explicit instruction remains highest product authority. Within that intent, this charter defines the standing healthcare-impact objective.

---

## 1. North star

Panacea's healthcare mission is:

> Make good healthcare measurably safer, faster, more accessible, more understandable, more preventive, more equitable, and less burdensome while preserving human agency and accountable clinical decision-making.

Panacea must not define success as:
- number of pages;
- number of AI agents;
- number of models;
- number of features;
- raw benchmark scores;
- visual complexity;
- autonomous behavior for its own sake.

Those may be implementation variables. They are not the primary outcome.

The durable product equation is:

```
Human Value
= (Outcome Improvement × People Reached × Reliability)
  / (Cost + Harm + Friction)
```

Any feature, model, simulation, workflow, or integration should be judged against this equation.

---

## 2. Humanity 10/10 score

For product-level prioritization, maintain a normalized score:

```
H10 = 0.30O + 0.20S + 0.15A + 0.15E + 0.10I + 0.05T + 0.05L
```

Where every factor is scored on `[0,10]`:

- `O` = patient outcomes;
- `S` = safety, evidence quality, calibration, and reliability;
- `A` = access and equity;
- `E` = clinician/system efficiency;
- `I` = interoperability and continuity of care;
- `T` = trust, transparency, autonomy, and accountability;
- `L` = continuous learning quality.

A nominal weighted average is not sufficient for a 10/10 state.

```
Humanity10Accepted
iff H10 >= 9.5
and min(O,S,A,E,I,T,L) >= 9
and all critical clinical gates pass
```

No model may inflate this score without evidence. Unknown dimensions remain unknown.

---

## 3. Hard release gates

For any high-risk clinical capability:

```
ClinicalRelease =
ClinicalValidity
AND AnalyticalValidity
AND Safety
AND HumanOversight
AND PrivacySecurity
AND EquityCheck
AND Interoperability
AND Monitoring
AND JurisdictionalReadiness
```

A weighted average may never compensate for a failed critical gate.

A failed gate must fail closed, degrade to a lower-risk mode, or require qualified human review.

---

## 4. Outcome hierarchy

Prioritize work in this order unless a current owner instruction requires otherwise:

1. prevent avoidable harm;
2. improve clinically meaningful outcomes;
3. detect dangerous deterioration or missed diagnoses earlier;
4. reduce treatment, medication, diagnostic, workflow, and handoff errors;
5. improve access to appropriate care;
6. reduce clinician cognitive and administrative burden;
7. improve patient understanding and shared decision-making;
8. improve prevention and longitudinal health;
9. improve education and simulation;
10. add convenience, polish, engagement, or novelty.

A lower item may be valuable, but it should not displace a materially higher-impact item without justification.

---

## 5. Patient State Engine

Panacea should converge toward a longitudinal patient-state representation rather than treating the patient as disconnected documents.

Conceptually:

```
S_t = f(
  demographics,
  history,
  symptoms,
  examination,
  vitals,
  labs,
  imaging,
  pathology,
  medications,
  procedures,
  devices,
  wearables,
  genomics,
  behavior,
  environment,
  social context,
  time
)
```

The system should preserve provenance and truth class for each element.

Allowed truth classes should include, where relevant:
- patient-reported;
- clinician-authored;
- directly measured;
- imported source record;
- reference/atlas;
- model-derived;
- simulated;
- inferred;
- unknown.

Never silently collapse these categories.

The target is not merely `S_t`, but longitudinal transition:

```
S_t -> S_(t+1)
```

with explicit evidence for:
- what changed;
- why it may have changed;
- what information is missing;
- what risks may be emerging;
- what next observation could reduce uncertainty.

---

## 6. Clinical Error Prevention Engine

Panacea should explicitly search for preventable failure modes.

Core questions include:

```
P(important diagnosis missed | evidence)
P(deterioration within horizon | evidence)
P(treatment harm | proposed action, patient state)
P(required action omitted | context)
P(current working diagnosis contradicted | new evidence)
```

The system should surface:
- dangerous alternatives;
- supporting evidence;
- contradictory evidence;
- missing evidence;
- time-critical red flags;
- medication/allergy/interaction/contraindication concerns;
- unresolved abnormalities;
- follow-up obligations;
- clinician overrides and rationale where appropriate.

The system must be able to abstain.

Useful abstention states include:
- insufficient information;
- evidence conflict;
- out-of-distribution case;
- unsupported population;
- unsupported task;
- stale source;
- tool failure;
- human review required.

---

## 7. Human-AI team rule

Panacea is a clinician-support and patient-support system, not an authority that silently replaces accountable human decisions.

For high-risk clinical use, optimize:

```
Performance(Human + AI) > Performance(Human alone)
```

and evaluate whether human-AI interaction introduces automation bias, alert fatigue, deskilling, or new error modes.

High-impact recommendations should expose, when relevant:
- evidence basis;
- uncertainty;
- important alternatives;
- contraindications;
- missing data;
- what would change the recommendation;
- provenance and date/version;
- whether the output is educational, simulated, advisory, or clinically validated.

No model gets authority because it is newer, larger, or branded as more capable.

---

## 8. Body Exposure as the human-understanding layer

Body Exposure should not mature as a visually impressive but clinically detached atlas.

Its long-term role is to connect:

```
Anatomy
-> Physiology
-> Pathophysiology
-> Findings
-> Imaging
-> Intervention
-> Response
-> Education
```

For a patient-specific workflow, Body Exposure may visualize only what is supported by the actual patient record and must preserve the distinction between:
- patient-specific measured/imaged anatomy;
- reference anatomy;
- derived mapping;
- simulated physiology;
- hypothetical teaching scenario.

Generic atlas geometry must never be represented as patient-specific anatomy.

Educational and procedural simulation should produce objective, inspectable state and telemetry rather than scripted animation alone.

---

## 9. Evidence and validation ladder

Every clinical capability must declare its maturity tier.

### Tier 0 — concept
Idea only. No performance claim.

### Tier 1 — implementation verified
Software behaves as intended in deterministic engineering tests.

### Tier 2 — retrospective internal evaluation
Evaluated on representative historical data with leakage controls and explicit population definition.

### Tier 3 — external validation
Evaluated on an independent site, dataset, or population.

### Tier 4 — silent/shadow prospective evaluation
Runs prospectively without influencing care; measures real workflow behavior and failure modes.

### Tier 5 — supervised clinical pilot
Qualified humans use the system under a defined protocol and escalation process.

### Tier 6 — validated production use
Release requirements, monitoring, governance, and applicable regulatory obligations are satisfied for the defined indication and population.

### Tier 7 — scaled health-system evidence
Multi-site evidence shows durable benefit, acceptable safety, subgroup robustness, and operational value.

Models must never describe a lower tier as a higher tier.

---

## 10. Clinical evaluation metrics

Choose metrics that match the use case. Examples:

### Diagnostic and detection
```
Sensitivity = TP / (TP + FN)
Specificity = TN / (TN + FP)
PPV = TP / (TP + FP)
NPV = TN / (TN + FN)
```

Use AUROC/AUPRC only when appropriate and never as substitutes for clinically meaningful threshold performance.

### Calibration
For probabilistic systems, measure calibration rather than presenting uncalibrated confidence as probability.

Track:
- calibration-in-the-large;
- calibration slope;
- Brier score where appropriate;
- reliability curves;
- subgroup calibration.

### Operational impact
Measure:
- time to recognition;
- time to treatment;
- documentation time;
- unnecessary tests;
- duplicate tests;
- referral delay;
- handoff failure;
- clinician override rate;
- alert acceptance rate;
- alert fatigue;
- readmission;
- complications;
- cost of care;
- patient comprehension;
- patient access.

### Comparative evaluation
Where appropriate:

```
DeltaError = Error(Human + Panacea) - Error(Human)
DeltaTime  = Time(Human + Panacea)  - Time(Human)
DeltaCost  = Cost(Human + Panacea)  - Cost(Human)
```

The desired direction depends on the metric and must be declared before evaluation.

---

## 11. Equity and access

A 10/10 healthcare system must work beyond affluent tertiary hospitals.

Every important clinical capability should consider:
- tertiary hospital mode;
- community clinic/puskesmas mode;
- low-bandwidth mode;
- intermittent connectivity;
- offline-safe workflow where appropriate;
- language accessibility;
- disability accessibility;
- patient literacy;
- age range;
- device constraints;
- underserved and underrepresented populations.

Evaluate performance by relevant subgroup.

Do not claim fairness from aggregate accuracy.

If subgroup evidence is missing, label it missing.

---

## 12. Interoperability and continuity

Panacea should integrate with healthcare systems rather than create another isolated data silo.

Prefer standards-based contracts where applicable:
- HL7 FHIR;
- SNOMED CT;
- LOINC;
- ICD;
- DICOM;
- jurisdiction-specific profiles and terminology requirements.

For Indonesia, SATUSEHAT interoperability requirements and official profiles must be tracked when the applicable integration is implemented.

The durable direction is:

```
Source systems
-> normalized provenance-aware clinical data
-> longitudinal patient state
-> decision support / education / simulation
-> reviewed action
-> outcome
-> learning loop
```

Do not create duplicate competing patient-state stores without a concrete migration and reconciliation plan.

---

## 13. Prevention and longitudinal medicine

Panacea should progressively move from reactive care toward validated prevention.

Conceptually:

```
Current State
-> Risk Estimation
-> Modifiable Drivers
-> Evidence-Based Intervention
-> Monitoring
-> Updated State
```

Prediction alone is insufficient.

A preventive workflow should explain:
- risk horizon;
- population;
- data used;
- uncertainty;
- modifiable versus non-modifiable factors;
- evidence strength;
- recommended follow-up;
- escalation criteria.

Do not turn weak correlations into personalized medical certainty.

---

## 14. Continuous learning without uncontrolled self-modification

The learning loop is:

```
Prediction
-> Human/clinical action
-> Outcome
-> Error analysis
-> Candidate improvement
-> Evaluation
-> Controlled release
-> Monitoring
```

Production feedback may inform improvement, but no clinical model may silently retrain and self-deploy without versioning, validation, auditability, rollback, and appropriate review.

For every material model or decision-logic change preserve:
- previous version;
- new version;
- change rationale;
- training/evaluation data lineage where applicable;
- intended population and indication;
- pre-specified acceptance criteria;
- regression results;
- subgroup results;
- safety findings;
- deployment date;
- rollback criteria.

---

## 15. Feature-count anti-goal

Feature count is a secondary inventory metric, not a success metric.

Before adding a substantial capability, record:

```
Who
+ Problem
+ Clinical/Human Promise
+ Evidence Needed
+ Measurable Outcome
+ Failure Modes
+ Integration Point
```

A feature is strategically strong when it measurably improves one or more Humanity 10/10 dimensions without causing unacceptable regressions elsewhere.

Prefer:
- shared engines over duplicate pages;
- interoperable primitives over isolated demos;
- outcome instrumentation over decorative complexity;
- validated workflows over speculative claims.

Do not delete useful existing capability merely to reduce feature count. Consolidate, integrate, de-duplicate, and preserve intent.

---

## 16. Public-benefit layer

Panacea should preserve a public-benefit direction for high-value health understanding, including where sustainable:
- emergency recognition and escalation education;
- medication literacy;
- maternal and child warning signs;
- vaccination education;
- preventive-health literacy;
- mental-health crisis routing;
- anatomy/physiology education;
- patient-friendly disease education.

Public-benefit content must still preserve evidence, uncertainty, source provenance, accessibility, and safety.

---

## 17. Model-agnostic execution algorithm

Every model working in this repository should use this loop for meaningful healthcare work:

1. Read `PANACEA_CONSTITUTION.md`, this charter, `AGENTS.md`, and any relevant model-specific instructions.
2. Inspect the latest repository state before editing.
3. Identify the highest-value unfinished problem that does not improperly overwrite active work.
4. Map the task to one or more Humanity 10/10 dimensions.
5. State the measurable outcome or acceptance criterion.
6. Identify safety, evidence, privacy, interoperability, equity, and human-oversight boundaries.
7. Reuse canonical contracts before creating new ones.
8. Implement the smallest coherent change that materially advances the target.
9. Add deterministic tests and evaluation hooks appropriate to the task.
10. Preserve provenance and explicit failure states.
11. Validate on current code, not stale assumptions.
12. Record what is proven, what is simulated, what is inferred, and what remains unknown.
13. Measure effect where possible.
14. Repair regressions before claiming success.
15. Continue to the next highest-value independent task.

A future model with substantially greater capability should deepen evidence, simulation fidelity, interoperability, evaluation, or real-world validation rather than merely expanding code volume.

---

## 18. Priority transformation

Panacea should progressively transition:

```
Build everything
-> Integrate the important things
-> Instrument the important things
-> Validate the important things
-> Prove benefit
-> Scale safely
-> Learn continuously
```

This is not a ban on ambitious R&D. Frontier work remains encouraged under the Constitution.

It means ambition must eventually convert into evidence.

---

## 19. Canonical humanity metrics

Maintain or derive, when evidence permits:

```
PatientsBenefited
ClinicalErrorsPrevented
TimeCriticalEventsRecognizedEarlier
ClinicianHoursSaved
PatientsGainingAccess
AvoidableCostReduced
PatientUnderstandingImproved
ValidatedPreventiveActionsCompleted
EquityGapChange
InteroperableRecordsSuccessfullyReconciled
```

Never fabricate these values.

If no real-world denominator exists, report the capability or test evidence instead of inventing impact.

---

## 20. References and standards baseline

This charter is informed by, and future agents should continue to track updated versions of:

1. World Health Organization. **Ethics and governance of artificial intelligence for health**. WHO; 2021.  
   https://www.who.int/publications/i/item/9789240029200

2. World Health Organization. **WHO calls for safe and ethical AI for health**. 2023.  
   https://www.who.int/news/item/16-05-2023-who-calls-for-safe-and-ethical-ai-for-health

3. U.S. Food and Drug Administration. **Good Machine Learning Practice for Medical Device Development: Guiding Principles**; reflecting the IMDRF 2025 final GMLP principles.  
   https://www.fda.gov/medical-devices/artificial-intelligence-enabled-medical-devices/good-machine-learning-practice-medical-device-development-guiding-principles

4. U.S. Food and Drug Administration. **Transparency for Machine Learning-Enabled Medical Devices: Guiding Principles**.  
   https://www.fda.gov/medical-devices/artificial-intelligence-enabled-medical-devices/transparency-machine-learning-enabled-medical-devices-guiding-principles

5. U.S. Food and Drug Administration. **Marketing Submission Recommendations for a Predetermined Change Control Plan for Artificial Intelligence-Enabled Device Software Functions**. Final guidance, 2025.  
   https://www.fda.gov/regulatory-information/search-fda-guidance-documents/marketing-submission-recommendations-predetermined-change-control-plan-artificial-intelligence

6. International Medical Device Regulators Forum. **Software as a Medical Device (SaMD): Clinical Evaluation — IMDRF/SaMD WG/N41FINAL:2017**.  
   https://www.imdrf.org/documents/software-medical-device-samd-clinical-evaluation

7. Kementerian Kesehatan Republik Indonesia, SATUSEHAT Platform. **FHIR interoperability documentation**.  
   https://satusehat.kemkes.go.id/platform/docs/id/fhir/

These references are a baseline, not a closed list. Applicable law, regulation, standards, terminology, security requirements, and clinical guidance must be re-checked at implementation and deployment time.

---

## 21. Final rule

The question every future Panacea model should repeatedly ask is:

> What can I do next that has the greatest evidence-backed marginal benefit to human health, safety, access, understanding, or healthcare-system performance without creating unacceptable harm?

If a task cannot answer that question directly, it should still be able to explain which enabling layer it strengthens and how that layer will eventually be validated against real human benefit.
