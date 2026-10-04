# ONE OS RURAL / LOW-RESOURCE FIELD PILOT

## Purpose

Convert the Panacea One OS north star into measurable field evidence in outpatient / primary-care settings, including clinics, Puskesmas and referral networks where connectivity, diagnostics, staffing or payer workflows may be constrained.

This protocol is **not** permission to alter clinical care without local authorization. Start with shadow-mode workflow observation and synthetic/simulated resilience drills. Any prospective patient-facing study, identifiable health-data collection, or intervention must follow applicable institutional, ethics, privacy and regulatory requirements.

## Primary question

Can the current Longitudinal Clinical Encounter Orchestrator turn fragmented longitudinal information into a care workflow that is:

1. faster;
2. more complete;
3. more trustworthy;
4. easier to understand;
5. more resilient to connectivity/referral failure;
6. operationally cleaner for reimbursement where applicable;

without worsening safety, clinical authority or access?

## Field sequence

### Phase A — baseline observation

Observe the existing workflow before Panacea changes it.

Record aggregate/de-identified process measurements:
- time from chart opening to clinician-ready context;
- number of systems/documents opened;
- repeated history questions caused by unavailable records;
- manual re-entry events;
- unresolved missing-data events;
- diagnostic/referral handoffs;
- time from order/collection to verified result;
- whether the verified result returns to the initiating clinician;
- avoidable claim/documentation corrections where available.

Do not infer causes that were not observed. Record the bottleneck as it occurred.

### Phase B — supervised Panacea workflow

Run the same predefined tasks with Panacea in supervised mode:
- patient identity resolved;
- longitudinal data reconciled;
- provenance/missingness visible;
- clinician remains decision authority;
- referral/lab state remains linked to the same episode;
- patient explanation and next step are generated from reviewed state;
- reimbursement evidence is derived only from signed clinical truth.

### Phase C — controlled resilience drill

Use synthetic or specifically authorized non-critical data to test:
1. start connected;
2. disconnect network;
3. create bounded episode events;
4. verify they are stored only through secure durable offline storage;
5. restart/reload the client when feasible;
6. reconnect;
7. drain the queue;
8. verify exact patient + episode identity;
9. verify duplicate replay does not create a second truth;
10. verify acknowledged events are reconciled;
11. verify rejected/conflicting events fail closed.

Do not deliberately interrupt connectivity during emergency or time-critical patient care.

### Phase D — remote diagnostic continuity

For workflows where testing is unavailable locally, measure:

**order → specimen/study identity → collection → chain of custody → transport/referral → remote processing → verified result → same longitudinal patient state → clinician review → patient communication**

Record each handoff and where continuity breaks.

## Core metrics

### Speed

**Time reduction (%) = ((T_baseline - T_OneOS) / T_baseline) × 100**

**Step reduction (%) = ((S_baseline - S_OneOS) / S_baseline) × 100**

Report medians and dispersion, not only best-case examples.

### Completeness

**Trusted completeness = trusted required data classes present / required data classes**

A class counts only if identity, time, provenance, normalization and required review state pass.

### Trust

**Trust coverage = trustworthy reconciled fragments / evaluated fragments**

Also record:
- wrong-patient prevention events;
- timestamp conflicts;
- unresolved duplicates;
- stale/conflicting data surfaced;
- unsigned/unreviewed clinical items.

### Understanding

Use a predefined short instrument.

**Understanding = correct responses / scored responses**

For patients, test whether they can state:
- what is known;
- what remains uncertain;
- what they should do next;
- where/when follow-up occurs.

For clinicians, use task-success questions tied to the episode.

### Resilience

Record:
- secure offline capture success;
- queue survival after reload/restart;
- replay idempotency;
- conflict detection;
- exact-patient reconciliation;
- time to resynchronization;
- data-loss events.

**Resilience success rate = completed resilience drills without silent loss/corruption / attempted drills**

### Referral / diagnostic continuity

**Result-return rate = verified referred results returned to initiating episode / completed referred tests**

**Diagnostic TAT = verified result time - predefined order or collection start time**

State which start point is used.

### Economic / reimbursement operations

Where the setting supports it:

**First-pass clean-claim rate = claims accepted without preventable correction / submitted claims**

**Payment cycle time = settled payment time - authorized claim submission time**

**Cost-to-collect = reimbursement operations cost / collected reimbursement**

Do not collect payment metrics if they are unavailable or outside authorization.

## Comparison design

Preferred early sequence:
1. synthetic usability test;
2. shadow-mode real workflow timing;
3. supervised comparative workflow;
4. small prospective pilot after local approval;
5. independent external replication.

When the same users perform baseline and Panacea tasks, use paired analysis. Report raw distributions and confidence intervals before relying on significance tests.

Do not claim patient-outcome improvement from workflow timing alone.

## Minimum field dataset

Use study IDs, not names or MRNs in research exports.

Minimum fields:
- study episode ID;
- site class;
- role;
- workflow mode (baseline / One OS);
- task definition/version;
- start/end timestamps;
- interaction count;
- context-switch count;
- duplicate-entry count;
- required data-class count;
- trusted data-class count;
- evaluated fragment count;
- trustworthy fragment count;
- comprehension correct/total;
- connectivity state;
- resilience drill outcome if applicable;
- referral/result timestamps where applicable;
- claim/payment timestamps only when authorized.

No raw patient narrative, image, laboratory payload, identifier or credential belongs in the public repository.

## Evidence promotion

- **E1** — repository tests and deterministic fixtures.
- **E2** — measured workflow/usability evidence with predefined protocol.
- **E3** — authorized real-world prospective field evidence.
- **E4** — independent external validation or replication.

Promotion requires the underlying evidence artifact; completing this document alone changes no evidence level.

## Stop / safety conditions

Pause the pilot workflow if:
- patient identity cannot be resolved;
- data provenance is materially uncertain;
- offline persistence cannot be protected;
- a clinical output is being treated as signed without responsible review;
- the test interferes with urgent care;
- consent/privacy scope is exceeded;
- the local institution or responsible clinician requests a stop.

## Field note discipline

For each observed failure, record:

**Observed bottleneck → evidence → affected actor → operational consequence → current workaround → proposed Panacea intervention → measurable success criterion**

Do not jump directly from anecdote to feature.

## North-star field criterion

Panacea earns expansion only when the selected workflow demonstrates meaningful improvement across the relevant dimensions without a trust, safety, access or equity regression.

**Observe reality → measure baseline → intervene narrowly → measure delta → expose failures → refine → independently validate.**
