# Panacea Field Use-Case R&D Autopilot

## Purpose

Panacea is not allowed to become a feature warehouse that learns only from its builders.

The product must continuously convert real-world health and healthcare friction into
validated use cases, small experiments, reusable platform capabilities and eventually
a stronger Health Operating System.

This playbook is model-agnostic. ChatGPT, Claude, Codex, Astra, future models and
authorized human builders follow the same loop.

"Continuous" means continuous across authorized work sessions and explicit continuation
commands. No agent may claim that work continues in the background between turns when
no automation/runtime is actually executing.

## Continuation trigger

When the owner says **"lanjut"**, **"continue"**, **"keep going"** or an equivalent
continuation instruction without narrowing the scope, the active agent should:

1. inspect current `main`, active overlapping work and the latest field-learning state;
2. select the highest-value independent unresolved use case or evidence gap;
3. work it through the loop in this document without asking the owner to choose between
   routine alternatives;
4. preserve existing useful work and avoid overlapping an active conflicting lane;
5. validate the resulting change/evidence;
6. record what was learned, what changed, and the next unresolved item;
7. continue to the next independent item within the authorized execution window unless
   blocked by safety, missing access, a genuinely irreversible decision, or the end of
   the current execution turn.

Do not interpret "lanjut" as "invent another feature." Interpret it as "run the next
highest-value evidence-to-product cycle."

## The field is the primary learning surface

Acceptable evidence streams include, when legally and ethically available:

- direct user interviews and observed workflows;
- patient, caregiver, clinician, nurse, pharmacist and administrator feedback;
- in-product first-party behavioral telemetry and retention;
- support tickets, bug reports, abandonment points and failed tasks;
- outpatient/clinic workflow friction, waiting, referral, follow-up and handoff failures;
- documentation, medication, scheduling, billing and administrative burden;
- health-literacy and patient-education misunderstanding;
- preventive-care and chronic-care gaps;
- accessibility, geographic access, affordability and digital-barrier problems;
- near misses, adverse-event learning, safety incidents and quality-improvement reports;
- malpractice complaints, legal cases and ethics/professional-conduct reports;
- consent, privacy, boundary, communication and professionalism failures;
- public-health and health-system datasets;
- device/wearable integration failures and consumer-health workflow gaps;
- published clinical evidence, standards, guidelines and regulator notices;
- competitor/user-review evidence showing an unmet workflow.

A field signal is evidence, not automatically truth. Malpractice, misconduct or ethical
violation reports must remain allegations/claims unless an authoritative process has
established otherwise. Never turn unverified reports into accusations against a named
person or organization.

## Field Evidence Ledger

Every durable field signal should be representable with at least:

```
id
source_type
source_reference
observed_at
jurisdiction
population
role
workflow
problem
current_workaround
frequency
severity
time_cost
financial_cost
safety_cost
access_cost
health_literacy_gap
desired_outcome
evidence_strength
confidence
privacy_class
regulatory_context
status
related_use_cases
```

Rules:

- de-identify by default;
- do not place patient secrets or unnecessary personal data in the product-learning
  ledger;
- keep clinical records separate from product analytics;
- preserve provenance and jurisdiction;
- do not fabricate field evidence to fill an empty row;
- conflicting evidence is recorded as conflict, not averaged into false certainty.

## WHO -> PROBLEM -> PROMISE -> PROOF

No candidate becomes a priority merely because it sounds innovative.

### WHO

Identify one concrete population and context.

Bad: "everyone who cares about health."

Better: "working adults with fragmented wearable + lab data who cannot tell what
requires action today."

### PROBLEM

Describe an observed job, failure or cost in the user's language.

A problem statement should include:

```
trigger -> current behavior -> friction -> consequence -> frequency
```

### PROMISE

State the smallest user-visible improvement Panacea can plausibly deliver.

The promise must be understandable without explaining the technology stack.

### PROOF

Define evidence that would change our belief.

Possible proof includes:

- task completion;
- repeated voluntary use;
- reduced time/friction;
- improved comprehension;
- fewer workflow errors/omissions;
- clinician/patient acceptance;
- willingness to pay;
- referral/share behavior;
- D1/D7/D30 retention;
- operational or clinical outcome proxy when scientifically appropriate;
- external validation where required.

A feature without a proof plan is an idea, not an R&D candidate.

## Use-case priority equation

Score each factor from 1-5 unless a domain requires a different validated scale.

```
Priority =
(Pain * Frequency * Reach * WillingnessToPay * Distribution * FounderEdge * EvidenceConfidence)
/
(Complexity * RegulatoryRisk * HarmRisk)
```

Where:

- Pain = severity of the actual problem;
- Frequency = how often it occurs;
- Reach = number/diversity of people affected;
- WillingnessToPay = monetary or strong non-monetary demand;
- Distribution = how efficiently Panacea can reach the WHO;
- FounderEdge = advantage from medicine, technology, partnerships or workflow access;
- EvidenceConfidence = strength/repeatability of the field signal;
- Complexity = time/cost/dependency burden to reach value;
- RegulatoryRisk = jurisdiction-specific regulatory burden;
- HarmRisk = risk if the product is wrong, misunderstood or over-relied upon.

The score ranks hypotheses. It never substitutes for real-world validation.

When two candidates are close, prefer the one that:
1. produces value sooner;
2. is easier to test reversibly;
3. teaches more about the platform;
4. creates a reusable capability;
5. has a safer regulatory boundary.

## R&D automation loop

For every candidate:

```
FIELD SIGNAL
  -> normalize + preserve provenance
  -> cluster repeated pains
  -> WHO / PROBLEM / PROMISE / PROOF
  -> priority score
  -> smallest useful experiment
  -> instrument behavior
  -> expose to real users/workflow
  -> measure proof
  -> qualitative follow-up
  -> KEEP / ITERATE / KILL
  -> promote reusable capability to Panacea OS
  -> repeat
```

### KEEP

Keep and deepen when evidence repeatedly supports the promise.

### ITERATE

Change the WHO, problem framing, workflow or intervention when the pain is real but the
current product fails to deliver the promise.

### KILL

Stop or archive a feature when evidence shows weak pain, weak repeat use, low trust,
unacceptable harm/regulatory burden or no meaningful advantage.

Sunk engineering effort is not a reason to keep a weak use case.

## Field domains that must never be ignored

The R&D loop should intentionally sample beyond consumer wellness.

### Care delivery

- outpatient clinic flow;
- triage;
- referral;
- follow-up;
- continuity;
- medication reconciliation;
- diagnostics and results;
- clinician documentation;
- handoffs;
- waiting and access;
- payment/administration;
- chronic disease management;
- emergency escalation boundaries.

### Health education

- misunderstanding of diagnoses, tests and medicines;
- inability to distinguish urgent from non-urgent information;
- adherence barriers;
- preventive-care literacy;
- risk communication;
- misinformation;
- accessibility and language.

### Safety, malpractice and ethics learning

Use verified or clearly attributed evidence to identify system failures such as:

- missing informed consent;
- communication/handoff failure;
- documentation gaps;
- delayed escalation;
- medication error pathways;
- failure to follow up critical results;
- privacy/confidentiality failure;
- conflicts of interest;
- professional-boundary problems;
- discriminatory or inaccessible care;
- unsafe delegation or automation;
- failure to disclose uncertainty.

The product response should default to prevention, education, auditability, escalation,
checklists, structured communication and safer workflow.

Panacea must not autonomously declare that a named clinician committed malpractice,
issue legal judgments, or convert an allegation into a clinical fact.

## Global product rule

A global use case must separate:

```
Global product capability
+ jurisdiction configuration
+ clinical/regulatory module
+ data-residency/privacy policy
+ localization/culture/language
```

Do not assume evidence, law, workflow or user behavior from one country transfers
unchanged to another.

Country expansion therefore runs the same field-learning loop locally.

## Engagement: compelling, not compulsive

The owner wants Panacea to be as naturally returnable as the best consumer products.
The optimization target is **meaningful repeated use**, not addiction or maximum screen
time.

Optimize:

- fast time-to-value;
- personally relevant daily utility;
- clear progress;
- immediate understandable feedback;
- useful novelty;
- continuity across days/months/years;
- social support/community when appropriate;
- forgiving streaks and progress recovery;
- autonomy and user control;
- a strong reason to return because something useful changed;
- completion: when the health task is done, help the user leave the screen.

Do not optimize:

- endless scrolling solely to increase time-on-app;
- unpredictable/intermittent rewards designed to create compulsive checking;
- notification spam;
- shame, fear, health anxiety or loss-aversion manipulation;
- hiding exit/disable controls;
- artificial scarcity;
- exploiting loneliness, mental-health vulnerability or illness severity;
- engagement metrics that rise while user benefit falls.

Preferred north-star relationship:

```
Healthy Engagement =
Meaningful Actions * Benefit Realized * Voluntary Return * Trust
/
(Friction + Harm + Unnecessary Screen Time)
```

A shorter session that successfully resolves the user's need can be better than a long
session.

## Proof hierarchy

Prefer evidence in this order when available:

1. observed behavior/outcome in the real workflow;
2. repeated longitudinal behavior;
3. willingness to pay / contract / deployment commitment;
4. structured qualitative evidence from the target WHO;
5. retrospective complaints/support patterns;
6. expert opinion;
7. founder intuition.

Founder intuition is useful for generating hypotheses, never for declaring proof.

## Minimum output of every R&D cycle

Every completed cycle should leave a durable record of:

```
WHO
PROBLEM
FIELD EVIDENCE
PROMISE
PROOF METRIC
PRIORITY SCORE + assumptions
EXPERIMENT
RESULT
DECISION: keep / iterate / kill
REUSABLE PLATFORM CAPABILITY
OPEN QUESTIONS
NEXT ACTION
```

## No-gap rule

"No gap" does not mean pretending everything is complete.

It means the system continuously maintains an explicit gap ledger.

A gap can be:

- unknown user problem;
- missing evidence;
- weak proof;
- missing telemetry;
- missing jurisdiction coverage;
- missing safety control;
- broken workflow;
- missing integration;
- poor accessibility;
- high abandonment;
- unresolved field complaint;
- unvalidated feature;
- duplicated capability;
- scientific uncertainty;
- deployment or distribution bottleneck.

Unknown gaps remain explicitly unknown until evidence resolves them.

## Default behavior after "lanjut"

Unless the owner names another target:

```
1. inspect newest main
2. inspect unresolved field/use-case gaps
3. ingest the newest available evidence
4. update WHO / PROBLEM / PROMISE / PROOF candidates
5. select the highest-value safe independent candidate
6. implement or test the smallest proof-producing delta
7. instrument it
8. validate it
9. record learning
10. continue
```

The objective is not to produce the largest number of features.

The objective is to make Panacea increasingly hard to live without because it repeatedly
solves real health and healthcare problems better, more safely and more simply.
