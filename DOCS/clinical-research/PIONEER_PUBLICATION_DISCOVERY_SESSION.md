# Panacea Pioneer Publication & Discovery Session

**Status:** Canonical research-idea workspace
**Scope:** Publication ideas, scientific gap discovery, translational hypotheses, new datasets, methods, biomarkers, mechanisms, interventions, and clinically useful research questions.
**Parent authority:** [PANACEA_CONSTITUTION.md](../PANACEA_CONSTITUTION.md) and [ACADEMIC-ACCURACY-GATE.md](ACADEMIC-ACCURACY-GATE.md).

## 1. Mission

This session exists to generate unusually high-value research ideas that are scientifically trustworthy, testable, clinically or practically applicable, and potentially pioneering. It is not a paper-mill workflow and it must never convert fluent model output into a novelty claim.

The target is not merely an interesting topic. The target is a **falsifiable contribution** that could survive literature search, prior-art search, data audit, methodological review, replication, and accountable human scientific review.

Core rule:

> Ambition may be frontier-level; claim strength may never exceed evidence strength.

## 2. Language for novelty claims

Never write **"this has never been studied"**, **"no dataset exists"**, **"first in the world"**, or **"discovery"** solely from model memory or a single database search.

Use graduated labels:

- `RAW-IDEA` — creative hypothesis only.
- `GAP-CANDIDATE` — plausible unresolved gap, not yet searched adequately.
- `NOVELTY-SCREENED` — reproducible search across the applicable source matrix found no close prior work that defeats the proposed contribution.
- `PROTOCOL-READY` — question, endpoint, design, statistics, falsification criteria, provenance, ethics, and data plan are defined.
- `EMPIRICALLY-TESTED` — analysis/experiment has actually run and raw outputs are retained.
- `REPLICATED` — independent or meaningfully separate replication supports the result.
- `MANUSCRIPT-CANDIDATE` — contribution is strong enough for accountable human authorship/review.
- `VALIDATED-CONTRIBUTION` — externally defensible contribution after the required scientific validation.

For absence claims, use bounded wording such as:

> "No suitable public dataset was identified in the searched sources, with the recorded queries and cutoff date."

That statement is auditable and may later be revised.

## 3. Session pipeline

Every Pioneer Session follows this sequence:

`Observe -> identify unmet need -> formulate question -> generate competing hypotheses -> novelty/prior-art search -> dataset/resource search -> mechanistic model -> define falsification -> design analysis/experiment -> stress-test -> ethics/safety review -> preregister when appropriate -> execute -> replicate -> translate -> manuscript candidate`

A hypothesis that cannot be falsified, operationalized, or tested is not promoted merely because it sounds novel.

### Mandatory adversarial questions

Before promotion, explicitly answer:

1. What existing paper, trial, patent, dataset, guideline, or method is closest to this idea?
2. What would make the proposed contribution *not novel*?
3. What observation would falsify the central hypothesis?
4. What confounder, leakage path, selection effect, or hidden variable could produce the same result?
5. Is there a simpler explanation?
6. Could the effect disappear in another population, site, instrument, or time period?
7. Is the proposed endpoint clinically meaningful or only statistically convenient?
8. Can the required data be obtained ethically and legally?
9. Can another group reproduce the work from the recorded methods and artifacts?
10. What concrete decision, workflow, treatment, diagnosis, prevention strategy, biological model, or public-health action could change if the result is true?

## 4. Mandatory novelty and prior-art search matrix

Searches must be recorded with database/source, timestamp, exact query, filters, result count when available, nearest matches, identifiers/links, and why each nearest match does or does not defeat novelty.

### Literature

- PubMed/MEDLINE.
- Europe PMC.
- Crossref and/or OpenAlex for broad scholarly coverage.
- Semantic Scholar when useful for graph/related-work discovery.
- Embase, Scopus, or Web of Science when institutional access exists and the topic warrants it.
- bioRxiv and medRxiv for recent preprints.
- Relevant specialty society proceedings or conference indexes for fast-moving fields.

### Registered studies and protocols

- ClinicalTrials.gov.
- WHO ICTRP and relevant regional trial registries.
- OSF Registries / protocols.io when applicable.

### Datasets and repositories

Select repositories relevant to the modality, including where appropriate:

- NCBI GEO, SRA, dbGaP, BioProject/BioSample.
- EMBL-EBI BioStudies and related archives.
- ProteomeXchange / PRIDE.
- Metabolomics Workbench.
- PhysioNet.
- The Cancer Imaging Archive (TCIA) and other imaging repositories.
- Image Data Resource or specialty imaging archives.
- Zenodo, Dryad, Figshare, OSF, institutional repositories.
- Population/cohort data catalogs such as UK Biobank or All of Us when access and scope are relevant.

### Intellectual property and translational prior art

- WIPO PATENTSCOPE.
- Espacenet.
- Google Patents and relevant national patent databases.
- Regulatory databases, device/drug labels, and public assessment documents when the idea concerns a clinical product.

### Grants and active work

- NIH RePORTER and analogous funder databases when relevant.
- Current research-program pages from credible laboratories/consortia for rapidly developing domains.

**Important:** failure to find a match is not proof that none exists. It only increases confidence when the search is broad, reproducible, current, and includes adjacent terminology.

## 5. Coverage rule

Define:

`SearchCoverage = searched_applicable_sources / total_applicable_sources`

An idea cannot be labeled `NOVELTY-SCREENED` when SearchCoverage < 0.90 unless the missing sources are explicitly documented as inaccessible and an accountable human reviewer accepts the limitation.

The search must include synonym expansion, MeSH/controlled vocabulary when available, spelling variants, mechanism terms, population terms, intervention terms, outcome terms, and at least one deliberately broad search designed to find unexpected near-neighbors.

## 6. Pioneer scoring formula

Score each dimension from 0.00 to 1.00:

- `N` = novelty confidence after documented prior-art search.
- `U` = unmet scientific/clinical need.
- `A` = applicability / translational utility.
- `F` = falsifiability and experimental tractability.
- `D` = data feasibility or feasibility of generating the required data.
- `M` = mechanistic coherence / biological or causal plausibility.
- `R` = reproducibility and replication readiness.
- `E` = ethics, safety, privacy, and regulatory feasibility.

Weighted research score:

`PioneerScore = 100 * (0.20N + 0.15U + 0.15A + 0.12F + 0.10D + 0.10M + 0.10R + 0.08E)`

Critical gates are binary:

`G = G_traceability * G_falsifiability * G_ethics * G_reproducibility * G_novelty_search`

Promotion score:

`PromotionScore = G * PioneerScore`

If any critical gate is 0, PromotionScore is 0 regardless of how exciting the idea is. This prevents a high weighted average from hiding a fatal scientific weakness.

### Applicability subscore

For clinical/applied work, calculate:

`A = 0.30C + 0.25W + 0.20T + 0.15S + 0.10X`

where:

- `C` = plausible clinical or real-world utility.
- `W` = fit with actual workflow / decision point.
- `T` = testability using realistic resources.
- `S` = scalability across sites/populations.
- `X` = accessibility and equity of deployment.

## 7. Promotion thresholds

These thresholds are triage aids, not substitutes for expert judgment:

- `<60`: retain as speculative notebook material.
- `60-74`: gap candidate; improve search, mechanism, or feasibility.
- `75-84`: strong candidate for protocol development.
- `>=85`: priority candidate only if every critical gate passes.

No score permits a medical or scientific claim to bypass empirical evidence, qualified review, ethics requirements, regulatory requirements, or replication.

## 8. Idea card — required schema

Every recommended research idea must be written as a compact card containing:

### Identity

- Working title.
- Domain and target population/system.
- Current status label.
- Date and search cutoff.

### Scientific gap

- Exact unresolved problem.
- Why it matters.
- Nearest existing work and what remains missing.

### Hypothesis

- Primary hypothesis.
- At least one competing hypothesis.
- Mechanistic rationale.
- Falsification criteria.

### Novelty dossier

- Search sources.
- Exact queries.
- Nearest prior art.
- Patent/trial/dataset proximity.
- SearchCoverage.
- Residual uncertainty about novelty.

### Data / experiment

- Required variables, modalities, labels, outcomes, and temporal resolution.
- Existing usable datasets, if any.
- If no suitable dataset is found: minimum viable new dataset and acquisition protocol.
- Sample-size/power approach or justification for exploratory work.
- Statistical/causal/ML analysis plan.
- Leakage/confounding controls.
- External validation or replication plan.

### Translation

- Decision or workflow that could change if supported.
- Intended user: patient, clinician, researcher, health system, regulator, or public-health program.
- Expected benefit and potential harm.
- Deployment constraints.

### Integrity

- Ethics/consent/privacy requirements.
- Data license and provenance.
- Conflicts of interest.
- Reproducibility artifacts.
- Appropriate reporting guideline.
- Human scientific reviewer required before publication-stage promotion.

### Score

- N, U, A, F, D, M, R, E.
- Critical gates.
- PioneerScore and PromotionScore.
- Explicit reason for the recommendation.

## 9. When no scientific dataset exists

A missing dataset can itself become the contribution. Do not hallucinate synthetic evidence to fill the gap.

Create a `DATASET-GAP` candidate with:

1. the exact unanswered question;
2. proof-of-search for existing datasets;
3. minimum viable cohort/sample design;
4. measurement ontology and data dictionary;
5. acquisition frequency and follow-up window;
6. gold-standard labels / adjudication plan;
7. missing-data strategy;
8. bias and representativeness plan;
9. privacy, consent, governance, and licensing;
10. FAIR metadata and versioning;
11. train/validation/test or discovery/replication separation when modeling is planned;
12. prospective external validation plan.

Synthetic data may be used for engineering, simulation, or power/sensitivity exploration only when clearly labeled. It does not substitute for empirical evidence of a biomedical claim.

## 10. Preferred idea classes

The session should preferentially search for gaps with both scientific depth and realistic downstream value, for example:

- unresolved causal mechanisms rather than cosmetic correlations;
- biomarkers that could change diagnosis, prognosis, monitoring, or treatment selection;
- multimodal longitudinal signals that are currently fragmented across separate datasets;
- under-measured transition states before overt disease;
- treatment-response heterogeneity and responder phenotypes;
- mechanistic digital biomarkers with external physiological validation;
- clinically important negative results that challenge a common assumption;
- dataset or benchmark gaps that prevent reliable evaluation;
- failure modes of current clinical AI systems that can be measured prospectively;
- cross-scale biology linking molecular, cellular, organ, whole-body, and longitudinal outcomes;
- low-cost measurements that could approximate expensive or invasive reference standards, with explicit calibration and failure boundaries;
- interventions whose effect can be tested in a pragmatic real-world workflow.

These are **search directions**, not claims that the gaps are currently unsolved.

## 11. Session output format

Each dedicated idea-generation session should return:

1. a short map of the domain and known boundary;
2. 5-15 raw candidate ideas;
3. rapid elimination of ideas defeated by obvious prior art;
4. 3-5 surviving gap candidates with novelty dossiers;
5. scoring and explicit uncertainty;
6. one recommended protocol-development candidate only when evidence supports that recommendation;
7. a list of missing searches/data needed before promotion;
8. negative findings and rejected ideas so future agents do not repeatedly rediscover dead ends.

The session should optimize for **few defensible ideas**, not maximum idea count.

## 12. Multi-agent / model governance

No single model is allowed to both invent the idea and certify its novelty without an independent adversarial pass.

Preferred separation:

- Agent A: hypothesis generation and mechanism construction.
- Agent B: novelty/prior-art attack.
- Agent C: methods, statistics, causal validity, and reproducibility attack.
- Agent D or qualified human expert: clinical relevance, feasibility, safety, and publication-stage review.

Frontier models may search farther and reason more deeply, but model prestige is not evidence. Store the model/version, prompt family, tools/sources, timestamp, and major assumptions when outputs materially shape a research hypothesis.

## 13. Publication integrity and authorship

Panacea may help generate hypotheses, code, analyses, figures, evidence tables, and draft structures. It must not fabricate authors, reviewers, participant data, approvals, citations, experiments, or results.

Human authorship and accountability must follow the target journal and current ICMJE/COPE expectations. AI assistance must be disclosed when required by the journal or applicable policy.

Choose the appropriate study-reporting framework from the EQUATOR Network (for example CONSORT/CONSORT-AI, SPIRIT/SPIRIT-AI, TRIPOD+AI, STROBE, PRISMA, CARE, STARD, ARRIVE, DECIDE-AI, or another design-appropriate guideline).

## 14. Public-repository and intellectual-property warning

This repository is public. A commit is public disclosure, not confidential laboratory storage.

Potentially patentable enabling details, unpublished patient-level information, confidential partner data, proprietary algorithms, trade secrets, or material covered by an NDA must not be committed here without the appropriate authorization and IP/privacy review. A public research card may retain only the abstraction needed for coordination until the disclosure strategy is decided.

## 15. Definition of success

Success is not "we generated a novel-sounding paper title."

Success is a chain of inspectable evidence from gap identification through search, falsifiable protocol, data provenance, analysis, replication, translation, and accountable publication.

## 16. Canonical references and source systems

- Panacea Constitution: `PANACEA_CONSTITUTION.md`.
- Panacea Academic Accuracy Gate: `docs/ACADEMIC-ACCURACY-GATE.md`.
- ICMJE Recommendations for the Conduct, Reporting, Editing, and Publication of Scholarly Work in Medical Journals (current version): https://www.icmje.org/recommendations/
- Committee on Publication Ethics (COPE) Core Practices: https://publicationethics.org/core-practices
- EQUATOR Network reporting-guideline library: https://www.equator-network.org/
- CONSORT-AI: https://www.equator-network.org/reporting-guidelines/consort-artificial-intelligence/
- TRIPOD+AI: https://www.equator-network.org/reporting-guidelines/tripod-statement/
- FAIR Guiding Principles: Wilkinson MD, et al. Scientific Data. 2016;3:160018. doi:10.1038/sdata.2016.18.
- PubMed: https://pubmed.ncbi.nlm.nih.gov/
- ClinicalTrials.gov: https://clinicaltrials.gov/
- WHO ICTRP: https://trialsearch.who.int/
- WIPO PATENTSCOPE: https://patentscope.wipo.int/
- OpenAlex: https://openalex.org/
- NCBI GEO: https://www.ncbi.nlm.nih.gov/geo/
- NCBI SRA: https://www.ncbi.nlm.nih.gov/sra
- PhysioNet: https://physionet.org/
- TCIA: https://www.cancerimagingarchive.net/

## 17. Reusable invocation

When the owner says **"Pioneer Session"**, **"buat ide publikasi"**, **"cari discovery"**, or equivalent, agents should use this file as the canonical workflow and produce auditable candidates rather than unsupported novelty claims.

Default session command:

> Find a high-value unresolved problem, generate competing hypotheses, search the applicable literature/trial/patent/dataset space, document the nearest prior art and residual uncertainty, score the surviving candidates with the Pioneer formula, and promote only candidates that pass all critical gates. Prefer clinically/scientifically useful discoveries over novelty for novelty's sake.
