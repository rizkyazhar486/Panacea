# PANACEA CONSTITUTION
## Model-agnostic scientific, clinical, engineering, and continuous-evolution charter

**Status:** Parent authority for Panacea research, development, discovery, innovation, invention, validation, deployment, publication, and post-deployment learning.

This document is intentionally model-agnostic. It applies to Claude Code, ChatGPT/Codex, Astra-class systems, future GPT/Claude/Gemini/open models, specialist scientific agents, autonomous workflows, human contributors, and technologies that do not yet exist.

The repository owner's latest explicit instruction remains the highest product-development authority. Within that intent, this Constitution is the standing scientific/safety/governance baseline. Model-specific files such as `CLAUDE.md`, `AGENTS.md`, future `GPT.md`, `ASTRA.md`, workflow prompts, and agent handoffs must conform to it rather than silently weakening it.

---

## 1. Mission

Panacea is not merely a health application. It is intended to become a continuously improving health, biomedical, clinical, education, research, and human-performance operating system that converts trustworthy evidence and validated observations into useful understanding, safer action, testable hypotheses, and new knowledge.

Its long-horizon mission includes:
- everyday health, prevention, wellness, recovery, nutrition, sleep, exercise and longevity;
- medical education from whole-body anatomy to physiology, pathophysiology, biomechanics, tissue, cell, organelle, molecule, pathway and genome;
- clinician workflow, AI-EMR, clinical decision support, hospital operations and patient education;
- biomedical research, epidemiology, surveillance, diagnostics, therapeutics, devices and clinical trials;
- drug and biologic discovery, target discovery, biomarkers, translational medicine and post-market safety;
- scientific discovery and invention in difficult unsolved domains, including oncology, neurodegeneration, cardiovascular disease, infectious disease, rare disease, regenerative medicine, aging biology and fundamental physiology;
- human performance, mental resilience, learning, productivity and evidence-based behavior change;
- non-clinical human-flourishing domains such as personal finance/wealth education, leadership, social connection, family/community wellbeing and peace-building, while keeping their evidence standards and regulatory boundaries distinct from medicine;
- legitimate cryptography, distributed-systems and digital-asset research for security, reliability, economics and infrastructure, without turning Panacea into an exploitation or abuse platform.

Ambition is unlimited; claims are not. Panacea may attempt problems that humanity has not solved, but it must never represent a hypothesis, simulation, benchmark result or model output as an established discovery without the evidence required for that claim.

---

## 2. The permanent scientific loop

All serious discovery and invention work should follow the durable loop:

`Observe -> Question -> Hypothesize -> Formalize -> Simulate -> Test -> Falsify -> Revise -> Replicate -> Translate -> Deploy -> Monitor -> Learn`

Negative results, failed hypotheses, contradictions and boundary cases are first-class scientific assets. They must be retained when useful because a future model, dataset, instrument or theory may make an older failed direction newly tractable.

For mechanistic work, prefer interpretable governing structure where scientifically plausible. Pure prediction may be useful, but prediction must not be mislabeled as mechanism or causality.

For every important scientific object retain:
- question/hypothesis;
- assumptions;
- variables and units;
- source data and provenance;
- method/model/version;
- uncertainty;
- falsification criteria;
- counterexamples;
- replication status;
- external-validation status;
- clinical/translational boundary;
- who reviewed/approved the claim when human review is required.

---

## 3. “100%” is a versioned acceptance state, never the end

“100% complete” means **100% of the explicitly defined acceptance criteria for the current version are satisfied with evidence**. It never means perfect, infallible, permanently finished, zero-risk or scientifically complete.

When a version reaches 100% acceptance, Panacea must automatically transition conceptually into **Continuous Evolution Mode**:

`Accepted Baseline -> Monitor -> Discover New Capability/Evidence -> Benchmark -> Validate -> Integrate -> Re-validate -> New Accepted Baseline`

A completed version is therefore the launch point for the next version.

Do not inflate completion percentages without a trustworthy denominator. Prefer requirement-level acceptance matrices, tests, clinical/evidence gates and externally inspectable artifacts.

---

## 4. Compounding capability, not compounding risk

Panacea should become more capable as models, compute, sensors, datasets, scientific instruments and methods improve. Growth should compound across reusable knowledge, data contracts, benchmarks, validated models, scientific assets and infrastructure.

However, maturity in high-risk domains is deliberately **multiplicative**, not additive:

`M = E x R x S x G x V`

where each factor is normalized to `[0,1]`:
- `E` = evidence quality;
- `R` = reproducibility;
- `S` = safety/reliability;
- `G` = governance/provenance/data integrity;
- `V` = external validation.

A near-zero factor keeps total maturity near zero even if other factors are excellent. A spectacular benchmark cannot compensate for missing safety, provenance or external validation.

For high-risk clinical release, weighted-average scores are never enough by themselves. Critical gates are conjunctive: required evidence, safety, privacy, human review and regulatory conditions must each pass.

---

## 5. Technology and model evolution

No model receives scientific authority because of its brand, generation number, benchmark marketing, parameter count or claims such as “AGI”.

Every new model/tool must enter through a capability evaluation pipeline:
1. identify intended task classes;
2. run Panacea's internal benchmark suite on representative and adversarial cases;
3. compare with the current production baseline;
4. evaluate calibration, hallucination, reproducibility, tool use, latency, cost, privacy and failure modes;
5. perform domain-specific expert review for high-risk medical/scientific work;
6. canary or shadow-test where appropriate;
7. promote only the task classes for which evidence supports promotion;
8. preserve rollback and provenance.

Model routing is capability-driven, not permanently vendor-driven. The current strongest reasoning model may handle discovery today and be replaced tomorrow if a new model demonstrates superior validated performance.

Standing cadence:
- **event-triggered review** when a major model, scientific method, instrument, regulatory change or safety event appears;
- **monthly capability/evidence scan** for models, tools, standards and important research;
- **quarterly benchmark and architecture review**;
- **annual mission/governance review**;
- immediate review for critical security, safety or regulatory changes.

“Up to date” means source-backed and date/version-aware, not merely generated recently.

---

## 6. Evidence hierarchy and claim discipline

Each output must explicitly distinguish, where relevant:
- measured observation;
- reference/atlas value;
- clinician-authored fact;
- patient-reported information;
- model-derived estimate;
- simulation;
- hypothesis;
- association;
- causal inference;
- replicated result;
- externally validated result;
- guideline/consensus recommendation;
- regulatory status;
- unsupported/unknown.

Never manufacture certainty by collapsing these categories.

Core rule:

`Claim strength <= Evidence strength`

Uncertainty must increase when data quality, external validity, temporal relevance or source reliability decreases.

Clinical and scientific citations must be traceable to real sources. Never fabricate references, DOI/PMID, authors, trials, reviewers, regulatory approvals or datasets.

---

## 7. Biomedical discovery and Grand Challenges

Panacea may maintain a portfolio of “Grand Challenges” for problems beyond routine engineering. Examples include:
- mechanistic human physiological state estimation;
- cancer detection, stratification and therapeutic hypotheses;
- Alzheimer's and Parkinson's disease mechanisms/biomarkers/therapeutic hypotheses;
- rare-disease diagnosis and treatment discovery;
- regenerative medicine and tissue repair;
- precision pharmacology;
- cardiovascular, renal, pulmonary and metabolic systems modeling;
- infection, antimicrobial resistance and outbreak science;
- aging biology and healthspan;
- whole-body biomechanics and rehabilitation;
- multiscale models from organ systems to molecular/genomic processes.

Grand Challenges must optimize for **scientific truth**, not demos. Novelty claims require novelty checking. Mechanistic claims require stronger support than predictive accuracy. Counterexample search and falsification are mandatory.

Panacea must never promise a cure because a model generated a plausible mechanism, molecule, target or simulation result.

---

## 8. Drug, biologic and therapeutic discovery

AI may accelerate discovery, but each stage retains its own evidence boundary:

`Target hypothesis -> target validation -> hit discovery -> hit confirmation -> lead optimization -> ADME/PK/Tox -> preclinical efficacy/safety -> regulatory submission -> Phase I -> Phase II -> Phase III -> authorization where applicable -> Phase IV/post-market surveillance`

A computational candidate is not a drug. A docking score is not efficacy. An animal result is not a human treatment effect. An early clinical signal is not definitive benefit.

Required practices where applicable:
- assay provenance and controls;
- chemistry/biology reproducibility;
- prospective validation;
- selectivity/off-target assessment;
- PK/PD and dose-exposure reasoning;
- toxicology;
- statistical analysis plans;
- predefined endpoints;
- adverse-event monitoring;
- independent replication;
- regulatory and ethics oversight.

High-throughput generation may create millions of candidate molecules or hypotheses. Advancement must be selective and evidence-driven.

---

## 9. Clinical trials

Any Panacea-supported clinical trial workflow must preserve:
- prospective protocol and version control;
- ethics committee/IRB/IEC review where required;
- informed consent;
- trial registration where applicable;
- inclusion/exclusion criteria;
- predefined outcomes and estimands;
- sample-size/statistical reasoning;
- randomization/blinding where applicable;
- data-quality and audit trail;
- adverse-event and serious-adverse-event processes;
- protocol deviation handling;
- DSMB/independent monitoring when appropriate;
- prespecified analysis and transparent deviations;
- results reporting independent of whether the trial is positive.

AI-generated protocol content remains draft until qualified human review.

Synthetic, simulated or generated participants must never be represented as real enrolled participants. Retrospective data must not be labeled prospective.

Reference families to align with as applicable include ICH Good Clinical Practice (E6), SPIRIT/SPIRIT-AI, CONSORT/CONSORT-AI, relevant national regulations, and domain-specific regulator guidance.

---

## 10. Surveillance, epidemiology and post-market learning

Surveillance is a continuous scientific/safety function, not a dashboard decoration.

For pharmacovigilance, device vigilance, infectious-disease surveillance, hospital safety and population monitoring:
- retain source, time, geography and uncertainty;
- distinguish signal from confirmed event;
- control for duplicate reports and denominator problems;
- avoid causal claims from spontaneous reports alone;
- preserve privacy and minimum-necessary data;
- provide traceable escalation to qualified human review;
- monitor model drift and data drift;
- detect safety signals without fabricating incidence or risk.

Post-deployment evidence must be allowed to invalidate earlier assumptions.

---

## 11. Publication engine: scale hypotheses, not scientific misconduct

Panacea may eventually generate, screen or coordinate millions of research questions, simulations, candidate analyses and draft structures. It must **not** become a paper mill.

The research funnel is:

`Questions -> hypotheses -> protocols -> experiments/analyses -> falsification -> replication -> validated contribution -> manuscript candidate -> human authorship/review -> publication/submission`

Publication requires genuine contribution, traceable methods/data, correct citations, reproducible analysis and accountable human authorship/approval where required.

Never:
- fabricate data or participants;
- fabricate citations;
- fabricate peer review;
- create fake author identities/affiliations;
- duplicate/salami-publish trivial variants;
- hide negative results to manufacture significance;
- plagiarize;
- claim IRB/ethics approval that did not occur;
- use generated text to disguise absent science.

High volume is acceptable only at the hypothesis/search layer. Scientific publication remains selective.

Reference families include ICMJE recommendations, COPE principles, EQUATOR reporting guidelines, PRISMA, STROBE, STARD, TRIPOD/TRIPOD+AI, CONSORT-AI, SPIRIT-AI, ARRIVE and domain-specific standards as applicable.

---

## 12. Medical education and hospital usefulness

Panacea should connect education and care rather than fragment them.

Education:
- anatomy -> physiology -> pathology -> diagnosis -> treatment -> outcomes;
- case-based and simulation-based learning;
- visual-first Body Exposure with explicit provenance;
- competency-aware learning where appropriate;
- citations and uncertainty visible at the point of deeper inspection.

Hospital/clinical workflow:
- longitudinal patient state;
- AI-EMR as clinical source of truth only after appropriate verification;
- decision support, not autonomous physician replacement;
- integration with validated devices, labs, imaging and interoperable standards;
- clear audit trail of clinician-authored vs AI-drafted content;
- human review for high-risk recommendations;
- workflow benefit measured by real outcomes, not screen count.

Useful clinical AI must be evaluated for patient safety, clinician workload, equity, calibration, error patterns, generalizability and workflow effects.

---

## 13. Human flourishing domains

Panacea may support domains beyond medicine, including fitness, mental resilience, relationships, family/community wellbeing, career development, learning, finance and wealth education, leadership and peaceful social contribution.

These domains must not be falsely medicalized.

For finance/wealth:
- separate education, simulation and general planning from regulated personalized financial advice;
- show assumptions, downside risk, fees, taxes and uncertainty;
- never imply guaranteed returns.

For mental resilience/performance:
- distinguish validated psychometric tools, observed task performance, self-report and informal coaching;
- never invent a universal “mental toughness” diagnosis or deterministic score;
- crisis/suicide-safety flows take priority over performance optimization.

For leadership/influence/community:
- optimize for ethical capability, cooperation, service and durable value creation rather than coercion, exploitation or manipulation.

---

## 14. Data, privacy, security and provenance

Every serious Panacea system must know:
- what data it has;
- whose data it is;
- why it is permitted to process it;
- where it came from;
- when it was captured;
- how it was transformed;
- who/what accessed it;
- how long it is retained;
- how it can be corrected or deleted where required.

Principles:
- data minimization;
- purpose limitation;
- least privilege;
- encryption in transit/at rest where appropriate;
- auditability;
- consent/authorization;
- jurisdiction-aware retention and access;
- de-identification/pseudonymization where appropriate;
- no silent conversion of public/reference data into patient-specific facts.

Security research is defensive and authorized. Cryptography/digital-asset work may study protocols, consensus, privacy, economics and resilience, but must not become unauthorized exploitation, credential theft, covert surveillance or asset theft.

---

## 15. Reproducibility

Every research-grade result should be reproducible to the extent scientifically possible.

Record:
- code commit;
- model name/version/config;
- prompts/system instructions when relevant;
- tool versions;
- dataset snapshot/version and license;
- random seeds where meaningful;
- preprocessing;
- environment/container;
- evaluation set;
- statistical method;
- exclusions and failures.

A result that cannot be independently reconstructed must be labeled accordingly.

---

## 16. Validation ladder

Use the strongest relevant ladder:

`unit -> integration -> deterministic QA -> simulation -> retrospective validation -> temporal validation -> external-site validation -> prospective validation -> clinical-impact evaluation -> post-market monitoring`

Not every feature needs every rung. High-risk clinical claims generally need the higher rungs.

External validation means genuinely independent data/site/time/population where applicable, not a second split from the same narrow source presented as “external”.

---

## 17. Metrics that matter

Do not optimize only for engagement, number of features, benchmark score, papers, commits or model calls.

Track outcomes such as:
- correctness/calibration;
- failure severity;
- reproducibility;
- evidence coverage;
- latency/cost;
- clinician/patient task completion;
- cognitive load;
- time saved;
- adherence;
- safety events;
- external validation;
- patient-important outcomes when studied;
- scientific novelty and replication.

A feature that increases complexity without measurable benefit is a candidate for consolidation, not celebration.

---

## 18. Simplicity and interoperability

Internally and externally, prefer a small number of canonical contracts and source-of-truth objects over duplicated state.

Panacea should be simple to use because complexity is handled by the system, not dumped on the user.

Ruthless simplicity does **not** mean deleting scientific depth. It means:
- one obvious primary path;
- progressive disclosure;
- shared longitudinal state;
- reusable scientific engines;
- composable adapters;
- minimal duplicate schemas;
- explicit provenance;
- predictable failure behavior.

---

## 19. Safety and human authority

AI can propose, search, simulate, draft, rank, summarize and discover. It does not acquire clinical, scientific, legal or ethical authority merely by being capable.

Humans retain accountability where professional judgment, consent, ethics approval, regulatory authorization, authorship or patient-specific decision-making requires it.

In urgent/high-risk healthcare:
- safety takes priority over optimization;
- uncertainty must be visible;
- the system must fail closed when required context is missing;
- autonomous diagnosis/treatment claims must not exceed the validated/regulatory status of the system.

---

## 20. Anti-hype rule

Panacea must resist hype from both inside and outside the project.

Do not infer:
- AGI from one benchmark;
- clinical readiness from a demo;
- causality from correlation;
- mechanism from prediction;
- safety from absence of observed harm in a small sample;
- generalizability from one site/population;
- cure from preclinical results;
- scientific novelty from fluent text;
- trustworthy publication from citation-looking output.

The stronger the claim, the stronger the required evidence.

---

## 21. Continuous research backlog

Every agent may create durable research questions and “unknowns” rather than forcing premature answers.

Backlog classes:
- unresolved contradiction;
- missing data;
- weak evidence;
- failed replication;
- unsupported mechanism;
- missing external validation;
- regulatory unknown;
- model/tool limitation;
- security/privacy concern;
- potentially transformative hypothesis;
- future-technology opportunity.

When new technology appears, re-evaluate previously blocked high-value questions.

---

## 22. Role allocation across current and future models

Use the best validated model/tool for the task.

Typical routing:
- frontier scientific reasoning: hypothesis generation, mechanistic modeling, symbolic discovery, counterexample search, falsification, observability/identifiability, uncertainty and scientific synthesis;
- engineering agents: implementation, tests, refactors, migrations, adapters, CI, observability and deployment;
- architecture/integration reviewers: system design, cross-module contracts, safety gates, acceptance criteria and final reconciliation;
- cheaper/fast models: repetitive transformations, clerical work, formatting and low-risk maintenance after stronger models establish the correct pattern.

This routing is not permanent. A future model may replace any role after benchmarked validation.

No model may self-promote into a higher-risk role merely because it claims superior capability.

---

## 23. Reference and standards families

Use current authoritative versions, not this document's memory, whenever a task materially depends on them. Relevant families include:
- WHO guidance on ethics/governance of AI for health;
- Good Machine Learning Practice principles and applicable regulator guidance for AI/ML medical devices;
- ICH Good Clinical Practice and other ICH efficacy/safety/quality guidelines;
- CONSORT-AI and SPIRIT-AI;
- EQUATOR reporting guideline families;
- ICMJE and COPE publication-integrity principles;
- FAIR data principles where appropriate;
- HL7 FHIR and relevant health interoperability standards;
- ISO/IEC 27001-family security controls and applicable healthcare security/privacy requirements;
- jurisdiction-specific healthcare, privacy, medical-device, clinical-trial and pharmacovigilance regulation.

Before relying on a standard, verify its current version and jurisdictional applicability.

---

## 24. Definition of success

Panacea succeeds when it compounds trustworthy capability faster than it compounds complexity or risk.

The governing objective is:

`Net Value = Validated Benefit x Reliability x Reach x Reusability - Safety Risk - User Burden - Scientific Debt - Operational Complexity`

The formula is conceptual, not a clinical metric. It exists to prevent a common failure mode: maximizing visible capability while hidden scientific, safety and operational debt grow faster.

The ultimate standard is not “how impressive is the model?” but:
- Is the result true enough for its claim?
- Can another team reproduce it?
- Does it improve a meaningful outcome?
- Is uncertainty explicit?
- Is provenance intact?
- Is the system safer after the change?
- Does it remain understandable and maintainable?
- Can it learn from failure?
- Can a stronger future technology replace a weaker component without destroying accumulated knowledge?

If yes, Panacea is evolving in the intended direction.
