# Panacea Frontier Health OS — Astra / Codex / Ultracode Handoff

Do not restart the product architecture. Extend the files already committed in `main`:

- `src/lib/frontierHealthOS.ts`
- `src/pages/FrontierHealthOS.tsx`
- `server/uji/frontierHealthOS.uji.ts`
- `src/lib/knowledgeBridge.ts`
- `src/pages/KnowledgeBridge.tsx`
- `src/lib/biomedicalEngineBlueprint.ts`
- `src/pages/bodyhub/BiomedicalEngineLab.tsx`
- `src/lib/wholeBodyAtlasBlueprint.ts`
- `src/pages/bodyhub/WholeBodyPrecisionLab.tsx`
- existing `Body3D`, `Radiology`, `GenomicsLab`, `CellLab`, `SurgicalLab`, `SecondOpinion`, `EMR`, `Planning`, `Marketplace`, `Consult`, `Hospitals`, `Pharmacy`, `Orders`, `Connect`, `PusatJiwa`, `Longevity`, `HealthProfile`, and notification systems.

## Mission

Turn Panacea from a collection of health features into a programmable, human-gated health operating system that reduces three gaps simultaneously:

1. **knowledge gap** — patient does not understand what clinicians know;
2. **coordination gap** — correct care exists but is fragmented across people, facilities and time;
3. **data gap** — relevant data exists but is siloed, stale, missing, untrusted or impossible to interpret together.

The target loop is:

`measure → understand → decide → authorize → coordinate → observe outcome → learn`

Every transition must preserve provenance, uncertainty, consent and human accountability.

---

# Frontier systems to execute

## A. Ambient Multimodal Visit Intelligence

Build a consent-first ambient clinical encounter workspace. Use audio and optional vision only when authorized.

Astra target:
- conversation timeline;
- speaker-separated transcript;
- visual medication/object cues where supported;
- live entity chips for symptom, medication, dose, allergy, exam finding, plan;
- click any generated item to reveal the exact transcript/video span that supports it;
- unresolved/ambiguous items glow amber rather than being silently resolved.

Codex target:
- adapter interface for external transcription/multimodal models;
- temporary encounter buffer;
- reconciliation with EMR medication/allergy/problem lists;
- draft-only output until clinician confirmation;
- audit log of accepted/rejected/corrected generated statements.

Do not auto-sign notes or orders.

## B. Living Health State Twin

Use the existing whole-body 3D model as the visual shell, but represent only measured or explicitly modeled states.

Astra target:
- time scrubber across the body;
- organ/system overlays for measured lab, imaging, wearable and symptom state;
- data freshness halos;
- uncertainty opacity;
- click organ → show the evidence that changed its state;
- switch between `measured`, `inferred`, `educational` layers.

Codex target:
- typed state-event contract;
- provenance and timestamp model;
- conflict resolution when two sources disagree;
- stale-data handling;
- FHIR adapters.

Never label this a complete simulation of the patient.

## C. Causal Counterfactual Lab

This is not a normal prediction screen. Build it around explicit assumptions.

Astra target:
- interactive causal DAG;
- confounder/mediator/collider badges;
- observed trajectory next to hypothetical trajectory;
- assumption panel that cannot be hidden;
- uncertainty band and unsupported-model warnings.

Codex target:
- schema for causal graph, estimand and study provenance;
- no individualized effect output unless the required validated causal model exists;
- research-only mode by default.

## D. Explainable Clinical Trial Match

Implement registry adapters and criterion-level matching.

Astra target:
- ranked trial cards;
- eligibility matrix with `match / mismatch / unknown`;
- every cell links to both the trial criterion and patient datum;
- map view for trial sites;
- missing-data checklist;
- genomics/pathology biomarker visual links.

Codex target:
- start with ClinicalTrials.gov adapter;
- structured eligibility parser;
- lexical + semantic retrieval layer;
- criterion-by-criterion evaluation;
- human reviewer override and audit trail;
- recruitment status refresh.

Do not claim enrollment eligibility; site investigators decide.

## E. Federated Health Learning Network

Build architecture and simulation before any real multi-institution training.

Astra target:
- hospital/network node map;
- local model versions;
- drift, performance and governance indicators;
- aggregation animation that never displays raw patient data.

Codex/Ultracode target:
- federated job manifest;
- secure aggregation interface;
- site-version registry;
- differential-privacy configuration hooks;
- poisoning/anomaly checks;
- rollback and immutable audit events.

Federation alone is not a privacy guarantee.

## F. Patient-Controlled Verifiable Health Wallet

Target W3C Verifiable Credentials 2.0 style architecture plus FHIR-linked health claims.

Astra target:
- credential wallet cards for vaccination, allergy, medication, imaging summary, emergency conditions, genomics report summary and insurance/coverage metadata;
- selective-disclosure UI;
- issuer verification animation;
- sharing receipt history;
- QR/presentation surface when standards-compatible implementation exists.

Codex target:
- issuer / holder / verifier abstractions;
- signature verification adapters;
- revocation/status checks;
- explicit consent scopes;
- do not confuse authenticity with medical correctness.

## G. Hospital-at-Home Command Center

Astra target:
- command center overview;
- patient cards with trend sparklines;
- device connectivity/confidence;
- home visit, lab and medication tasks;
- escalation ladder;
- map and logistics view.

Codex target:
- IoMT adapter contract;
- sensor provenance and battery/connectivity state;
- task ownership and escalation state machine;
- no treatment changes executed solely from consumer sensor values.

## H. Spatial Omics + Digital Pathology Atlas

Astra target:
- whole slide image → tissue region → cell neighborhood → pathway/gene zoom;
- synchronized body/organ localization;
- spatial heatmap layers for transcript/protein markers;
- tumor/immune/stromal cell neighborhoods;
- provenance badge for each layer.

Codex target:
- WSI tile adapter;
- segmentation/annotation layer contract;
- spatial transcriptomics/proteomics coordinate contract;
- pathology-foundation-model adapter kept separate from validated diagnostic claims.

## I. Human-Gated Care Agent Orchestrator

This is the end-to-end automation layer.

Astra target:
- care graph with nodes for doctor, lab, imaging, pharmacy, rehabilitation, surgery, home care and follow-up;
- dependency arrows;
- owner/status/consent on every node;
- bottleneck and cost overlays;
- one-tap view of what is blocked and why.

Codex target:
- orchestration state machine;
- action adapters for booking/order/payment-capable integrations when available;
- approved-plan constraint;
- patient authorization gate before external actions;
- cancel/rollback/idempotency support.

The agent coordinates approved care. It does not invent prescriptions, diagnoses or procedures.

## J. Closed-Loop Medication Journey

Join `prescribed → dispensed → taken → physiologic response → adverse effect → clinician review`.

Astra target:
- longitudinal medication ribbon;
- provenance style differentiating `prescribed`, `dispensed`, `patient-reported`, `device-detected`, and `inferred`;
- biomarker response overlays;
- adverse-effect episodes;
- medication reconciliation diff.

## K. Personal Medical Knowledge Graph

Astra target:
- graph from symptom → finding → diagnosis → anatomy → pathway → gene → drug → evidence → clinician → facility → cost;
- semantic zoom;
- color/shape by evidence provenance rather than visual decoration.

Codex target:
- typed node/edge ontology;
- strict provenance on every edge;
- hypothesis edges separated from documented facts;
- cross-link to Body Explorer, Biomedical Engine and Knowledge Bridge.

## L. Diagnostic Journey Replay

Build a replay of evidence arrival, not a fictional reconstruction of a clinician's mind.

Astra target:
- differential diagnosis branches changing over time;
- reveal the lab/imaging/finding that moved each branch;
- unknown rationale shown as unknown;
- final diagnosis does not retroactively erase uncertainty.

## M. Decision Time Machine

Persist a versioned snapshot of decisions:

`what was known → options → patient values → decision → later outcome`.

Astra target:
- before/decision/after storyboard;
- evidence version/date;
- hindsight-bias warning;
- patient preference layer.

## N. Family Health Graph

Keep genetic inheritance, shared environment and care relationships visually separate.

Astra target:
- pedigree mode;
- household/shared-exposure mode;
- caregiver network mode;
- screening/prevention gaps.

Do not reveal one family member's private information to another without authorization.

## O. Evidence Conflict Visualizer

Astra target:
- constellation of guideline/RCT/meta-analysis/observational/patient-specific evidence;
- effect direction, size, certainty, population similarity and date;
- disagreement zones visibly remain disagreement zones.

Do not average incompatible evidence merely to produce a single answer.

## P. 3D Consent + Procedure Preview

Reuse Body Explorer + Surgical Lab + Radiology.

Astra target:
- normal → disease → procedure corridor → risk structures → recovery;
- patient-specific imaging only when a real segmentation exists;
- otherwise clearly label teaching anatomy;
- integrate Teach-Back from Knowledge Bridge.

## Q. Privacy-Preserving Synthetic Cohort Sandbox

Astra target:
- privacy-versus-utility dashboard;
- source versus synthetic distributions;
- subgroup fidelity;
- membership/privacy-risk testing;
- release checklist.

Codex target:
- generator adapter abstraction;
- empirical privacy-risk evaluation;
- provenance/versioning;
- governance gate.

Never equate `synthetic` with `anonymous`.

## R. Consent-Based Digital Phenotype Stream

Unify existing voice, gait, sleep, readiness and activity features.

Astra target:
- synchronized longitudinal signal ribbons;
- confidence bands;
- device/source badges;
- change-point markers;
- optional correlation explorer.

Never convert passive signals into disease diagnoses without validated indications.

## S. Real-Time Care Capacity Exchange

Extend Marketplace from directory/price comparison into capacity-aware orchestration.

Astra target:
- route options on map + timeline;
- doctor/home visit/lab/imaging/pharmacy/bed/OR/rehab availability;
- cost, travel, waiting time and care-friction overlays;
- medical-appropriateness constraint displayed before convenience ranking.

## T. Population Health Signal Radar

Astra target:
- privacy-preserving geographic heat map;
- symptom/syndrome/environment/service-demand layers;
- time slider;
- data-quality confidence;
- anomaly explanation.

Do not label a statistical anomaly as an outbreak declaration.

---

# Existing Knowledge Bridge features to integrate, not duplicate

The previous Knowledge Bridge architecture must be connected into these systems:

- Doctor ↔ Patient Translator
- Teach-Back Loop
- Evidence Ladder
- Shared Decision Matrix
- Visit Copilot
- Consent Simulator
- Care + Cost Pathway
- Second-Opinion Packet

Use these especially in clinical-trial matching, decision time machine, procedure consent, medication journey and hospital-at-home workflows.

---

# Shared visual language for Astra

Every frontier feature should visually distinguish four kinds of information:

1. **Measured** — directly from patient/device/lab/imaging source.
2. **Documented** — asserted by clinician or verified record.
3. **Modeled** — computed/inferred with method and uncertainty.
4. **Educational** — general medical teaching content.

Do not use the same styling for all four.

Recommended interaction style:
- dark, premium medical visualization;
- liquid-glass panels only when readability remains high;
- orbitable 3D when spatial context matters;
- dense information progressively revealed, not dumped at once;
- source/provenance on demand everywhere;
- timeline is a first-class navigation dimension;
- every automation has an explicit human/consent gate when external action is involved.

---

# Standards / research anchors for implementation

Use these as architecture references, not as permission to make unsupported clinical claims:

- W3C Verifiable Credentials Data Model 2.0 — Recommendation 15 May 2025.
- HL7 FHIR / SMART on FHIR for interoperable patient and clinician app access.
- ClinicalTrials.gov for registered trial data.
- 2026 TrialMatchAI work for explainable criterion-level trial matching architecture.
- 2026 literature on causal digital twins and causal inference.
- 2026 literature on federated learning and differential privacy in multimodal healthcare.
- 2026 ambient/vision-enabled clinical documentation studies.
- 2026 spatial omics / computational pathology work.
- 2026 hospital-at-home / remote monitoring digital-twin literature.

When building adapters, prefer official APIs/specifications and permissively licensed code. Do not copy code or assets from incompatible/unlicensed repositories.

---

# Acceptance criteria

A feature is not complete merely because a card exists.

For each feature Astra/Codex must produce:

1. functional entry point in Panacea navigation or an existing hub;
2. real state model and typed data contract;
3. empty/loading/error/stale/unsupported states;
4. explicit provenance and uncertainty;
5. human gate where required;
6. mobile-safe UI;
7. integration with at least one existing Panacea module;
8. tests for deterministic calculations/state transitions;
9. no fabricated patient-specific data;
10. a visible statement when an external adapter is not connected.

The end goal is not to claim that Panacea has solved medicine. The goal is to make the best available medical knowledge, patient data, care logistics and human decisions inspectable and executable in one coherent system.
