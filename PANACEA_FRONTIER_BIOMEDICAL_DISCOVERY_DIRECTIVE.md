# PANACEA FRONTIER BIOMEDICAL DISCOVERY DIRECTIVE
## Next-generation scientific mission and execution contract — owner direction, 2026-10-13

**Status:** Binding long-horizon strategic direction for all current and future contributors (Claude Code, Codex, Gemini, human teams, autonomous agents), subordinate to `PANACEA_CONSTITUTION.md` and its hard clinical, scientific, privacy, consent, security, human-authority, and evidence gates. Apply with `AGENTS.md`, `CLAUDE.md`, `PANACEA_CURRENT_WEDGE.md`, `PANACEA_ONE_OS_LONGITUDINAL_CARE_DOCTRINE.md`, and `PANACEA_COMPUTATIONAL_HUMAN_PLATFORM.md`.

**Owner's strategic shift:** PanaceaMed must aspire beyond feature-rich health software to become an **evidence-generating biomedical technology organization** capable of originating novel methods and eventually participating in translational discoveries comparable in *scientific rigor and impact* to optogenetics, brain–computer interfaces, precision gene editing, or regenerative medicine. This is an ambition, **not** a claim of existing discovery, human efficacy, regulatory clearance, funding, staff, partnerships, or laboratory capacity.

## 1. Dual-mission north star — deliver care outcomes now, generate new knowledge next

```text
PANACEA ONE OS (trusted, verified clinical-workflow outcomes)
  -> PERMISSIONED LONGITUDINAL EVIDENCE & RESEARCH INFRASTRUCTURE
  -> COMPUTATIONAL HUMAN / PHYSIOLOGICAL & MULTISCALE MODELS
  -> FALSIFIABLE BIOMEDICAL HYPOTHESES AND REPRODUCIBLE EXPERIMENTS
  -> EXTERNAL SCIENTIFIC VALIDATION AND AUTHORIZED PARTNERSHIPS
  -> TRANSLATIONAL DISCOVERY (only after relevant preclinical and clinical gates)
```

The **existing Longitudinal Clinical Encounter Orchestrator** remains the *present shipping and commercial wedge*: reconciliation -> clinician-controlled encounter -> signed plan -> lab/referral/result closure -> patient explanation -> reimbursement-ready evidence -> follow-up. Sell documented, controllable **completed work**, never an unverified cure, efficacy claim or AI-generated decision. Do not discard, destabilize, or redesign the product into a speculative laboratory app.

The **new research mission** is a bounded, governed parallel lane: transform validated clinical/physiological questions into testable models and independently assessed findings. Research must not hijack production clinical records or deployment capacity. No feature explosion, second patient state, new public claim, or separate top-level superapp is authorized by this directive alone.

When historical instructions conflict about *company-wide long-term ambition*, the owner's 2026-10-13 biomedical discovery direction takes precedence. Existing longevity-first guidance remains a **clinical/consumer domain priority**, not a veto over the research mission. The approved current clinical wedge and all safety/release gates remain in force.

## 2. Scientific opportunities: focus, do not scatter

Prioritize opportunities by patient burden, mechanistic plausibility, access to lawful data, independent testability, partner feasibility, and ability to build reusable scientific infrastructure.

1. **First feasible computational research slice — longitudinal physiology:** Turn existing Computational Human, Body Exposure and clinical primitives into a quantitatively testable physiology engine. Start with **one** tightly specified endpoint (e.g. an observable cardiovascular/respiratory response or measurement), a defensible mechanistic baseline, known units and a public/synthetic/authorized benchmark. Anatomical visuals do not count as physiology validation.
2. **Flagship translational exploration — vision restoration and neurotechnology:** Investigate retinal imaging, inherited retinal degeneration, genotype–phenotype data, retinal circuits and relevant outcome measures *as research tools*. Optogenetics, retinal prostheses, neural interfaces, sonogenetics, and magnetogenetics are **external scientific precedents**; Panacea has invented or clinically validated none of them. Do not initiate gene delivery, neural stimulation, animal procedures or human experimentation through software-agent autonomy.
3. **Conditional future lane — regenerative and precision medicine:** Molecular/variant interpretation, cell-replacement modeling, biomarker assessment, drug/biologic research, and mechanistic AI only when data rights, subject-matter expertise, experimental collaborators and appropriate governance exist. Clinical gene editing and therapeutic claims need entirely separate translational and regulatory programs.

Other disease areas (oncology, neurological disease, cardiometabolic disease, aging, infectious and rare diseases) remain discoverable backlog candidates. Do not open simultaneous implementation fronts without a passed evidence-and-resource gate.

## 3. Binding research execution protocol

For every proposed research slice, create a durable, reviewable research record before promoting implementation:

- **Question and target population:** named health burden; intended *research* use; explicit exclusions and non-goals.
- **Hypothesis:** falsifiable prediction, biological rationale, causal assumptions, competing explanations and negative/failed outcome criteria.
- **Evidence review:** primary citations with DOI/PMID, publication date, methods, inclusion/exclusion, limitations; distinguish established, replicated, exploratory, preprint and vendor/company-reported results. Never use model memory as novelty verification.
- **Data/consent manifest:** source, license, allowed purpose, sample size, site/time, patient/subject rights, institutional approval if required, retention, privacy risk, missingness, leakage checks, subgroup composition, quality and provenance. Synthetic data must be explicitly labeled and must never imply human validation.
- **Protocol before results:** prespecified primary endpoint, baseline comparator, stratified train/validation/test or temporal/site split as appropriate, sample-size justification, thresholds, statistical plan, missing-data plan, safety risks, reproducibility protocol and honest stopping criteria.
- **Experiment provenance:** dataset and code versions, dependency/environment lock, parameters and seeds, computational resources, evaluation script, uncertainty intervals, adverse findings, failed experiments, audit trail and reviewer identity.
- **Claim ledger:** `HYPOTHESIS -> IN_SILICO -> REPLICATED_INDEPENDENTLY -> PRECLINICAL -> HUMAN_FEASIBILITY -> CLINICALLY_VALIDATED -> REGULATORILY_AUTHORIZED`; progression requires relevant actual evidence, not a self-assigned percentage or model confidence. Not every research project needs or can reach every stage.
- **Decision:** continue, redesign, collaborate, stop, or retain as research-only; explicitly document the next discriminating experiment.

For a numerical outcome `y` and prediction `y_hat`, a possible error metric is `MAE = (1/n) * sum_i |y_i - y_hat_i|`, **only** when meaningful for the prespecified endpoint. Include units, intervals, out-of-sample tests, subgroup behavior, data quality, model calibration when relevant, and comparisons to simple baselines. No single AUROC, MAE, citation count, number of commits, feature count or attractive 3D render establishes clinical benefit.

## 4. Staged validation: stage gate before scope expansion

| Gate | Required evidence before promotion | What may be claimed |
| --- | --- | --- |
| **G0 — Feasibility** | Specific problem, literature review, plausible mechanism, data access route, safety/privacy feasibility | Research hypothesis |
| **G1 — Reproducible model** | Testable baseline, deterministic pipeline, fixtures, versioned lawful data manifest, leakage/error tests | Research-grade computational prototype |
| **G2 — External validation** | Held-out independent dataset or independent scientific replication, limits/failure modes, suitable reporting | Externally validated *defined endpoint*, not clinical efficacy |
| **G3 — Translational partnership** | Named competent collaborators, protocol, study governance, funding/resource feasibility, IP/data agreements | Partnership/study planned or approved only with evidence |
| **G4 — Preclinical/human research** | Ethics and applicable approvals, registered protocol where required, qualified oversight, appropriate safety monitoring | Exactly the preclinical or clinical evidence observed |
| **G5 — Clinical deployment** | Applicable regulatory authorization, prospective evidence appropriate to intended use, post-market monitoring and human governance | Authorized uses only |

**Gates are not time promises.** Never use production clinical users, private PHI, wearable streams, embryos, genetic material, or experimental intervention subjects as an unauthorized research resource. Medical device/software classification and trial obligations depend on intended use and jurisdiction; consult appropriate experts and current rules.

## 5. Engineering architecture: one reality, distinct research truth

- Reuse Canonical Patient State for duly authorized measured/recorded clinical truth. Maintain separate research datasets, model-derived Physiological State, synthetic/reference data, hypotheses, projections, counterfactuals and experiment outputs; never silently write any of these back as signed clinical facts.
- Use shared scientific contracts, not parallel data islands. Future objects may include `ResearchQuestion`, `DatasetManifest`, `Hypothesis`, `ModelCard`, `ExperimentRun`, `ValidationReport`, `ClaimEvidence`, and `TranslationGate`. **These are proposed interfaces, not implemented capabilities**.
- Prefer vetted scientific standards and reproducibility over arbitrary abstraction. Reuse existing code and registry paths before creating another library; use incremental domain boundaries per `CLAUDE.md`.
- Separate **sandbox/research-only** from patient-facing production through permissioned storage, feature gates, access controls, audit logs, explicit purpose and appropriate data governance. No default-on patient research collection, covert neuromodulation, human-behavior manipulation, automated prescribing, or unreviewed clinical action.
- Research artifacts must be readable to independent reviewers. Scientific hypotheses and uncertainty need to survive model upgrades and negative results. Do not publish identifiable information, trade secrets, credentials, or patent-sensitive enabling details into this public repository.

## 6. Concrete execution order (not 1,000 speculative features)

**Now:** Fix the highest-severity clinical/privacy/security/data-integrity/CI/production blocker and preserve the current product delivery commitments; do not bypass exact-head CI, review, expected-head merge or deployment proof.

**First research PRs (non-patient-facing):**
1. Inventory existing physiology/Body Exposure/research/evidence primitives and overlap with open PRs. Select **one** candidate testable endpoint using a documented decision matrix (impact, external data, baseline, ground truth, feasibility).
2. Write one protocol with a research-question ID, falsification criterion, permissioned dataset manifest, relevant DOI/PMID references, and baseline evaluation design; use synthetic or legitimately accessible research datasets initially.
3. Implement the smallest deterministic, versioned, locally runnable model/benchmark with positive, negative, boundary and leakage tests. Label simulated outcomes as simulated.
4. Obtain an independent scientific/clinical review and, when feasible, independent-dataset replication; report negative findings and error bounds. **No claims of medical device efficacy or discovery before appropriate evidence.**
5. Only after a gate passes, project validated educational/research results into an existing compact Panacea surface; reserve investigational indications for research-only contexts.

**Next 90 days (planning horizon, not promise):** Aim for one accepted feasibility dossier, one reproducible benchmark, and one documented external-collaboration approach *without stealing resources from clinical safety or production*. If no lawful data or credible comparator exists, record `BLOCKED` and select a better-scoped question.

**Next 1–5 years (contingent):** Seek academic/clinical/laboratory partners, grants/funding, independent replication, and eventually preclinical or clinical research only if scientifically and ethically justified.

## 7. Evaluation and governance

Track **two different scoreboards**:

**Clinical delivery:** actual verified workflow completion, reconciled provenance, clinician sign-off, result/referral closure, measured time saved versus comparator, patient understanding and safety incidents. Only independently verified achievements count.

**Scientific discovery:** prespecified falsifiable hypotheses, reproducibility of experiments, dataset legality and representativeness, out-of-sample error and calibration, independently replicated results, negative-result integrity, peer review, translational evidence and patient-relevant benefit. Research grant/partnership and publication statuses must be verified, not inferred.

Gate violations cannot be offset by revenue, model sophistication, urgency, ambition or an attractive demo. Review objectives quarterly and retire/merge duplicate or weak research avenues.

## 8. Standards and source anchors (verify applicability and current versions)

- [Panacea Constitution](PANACEA_CONSTITUTION.md), [Academic Accuracy Gate](DOCS/ACADEMIC-ACCURACY-GATE.md), [Computational Human](PANACEA_COMPUTATIONAL_HUMAN_PLATFORM.md), [Current Wedge](PANACEA_CURRENT_WEDGE.md), [One OS](PANACEA_ONE_OS_LONGITUDINAL_CARE_DOCTRINE.md).
- Collins GS, et al. **TRIPOD+AI** for clinical prediction models. *BMJ*. 2024;385:e078378. https://doi.org/10.1136/bmj-2023-078378
- Liu X, et al. **CONSORT-AI** clinical-trial reporting extension. *Nat Med*. 2020;26:1364–1374. https://doi.org/10.1038/s41591-020-1034-x
- Cruz Rivera S, et al. **SPIRIT-AI** clinical-trial protocol extension. *Nat Med*. 2020;26:1351–1363. https://doi.org/10.1038/s41591-020-1037-7
- Wilkinson MD, et al. **FAIR** data principles. *Sci Data*. 2016;3:160018. https://doi.org/10.1038/sdata.2016.18
- FDA / IMDRF **Good Machine Learning Practice** principles (review current version and local applicability): https://www.fda.gov/medical-devices/artificial-intelligence-enabled-medical-devices/good-machine-learning-practice-medical-device-development-guiding-principles

**Final rule:** Make PanaceaMed capable of producing **one new, defensible, externally testable biomedical contribution** before multiplying speculative discoveries. Deliver clinically verified outcomes today; pursue original, ethically validated biomedical science tomorrow.
