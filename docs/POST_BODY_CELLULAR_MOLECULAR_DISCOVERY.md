# Post-Body Cellular & Molecular Discovery Program

## Priority and unlock boundary

This program is explicitly **after Body Exposure closure**. It must not leapfrog the current whole-body maturation order. The unlock state is fail-closed and requires Body Exposure to be deployed and reviewed, source provenance to be complete, academic review to be complete, and the research safety boundary to be accepted.

Scientific progression:

1. Cell state and lineage visualization
2. Organelle systems
3. Molecular interaction and pathway networks
4. RNA/DNA state and regulation
5. Disease-mechanism models
6. Compound-space discovery and hypothesis ranking

The goal is to move beyond a static induced-pluripotent-stem-cell-style visualization toward a multiscale research simulator connecting cell identity, abundance, state transitions, organelles, signaling, regulation, disease mechanisms, structures and chemical evidence. A simulated state is never automatically a validated biological intervention.

## Deep-research conclusions that constrain the architecture

### 1. A "virtual cell" cannot be reduced to transcriptome prediction

Current virtual-cell research is converging on a hybrid direction: learned models are useful for pattern recognition, but causal and mechanistic validity still requires explicit biological models. Contemporary whole-cell work spans reaction networks, gene expression, spatial structure and molecular dynamics rather than a single omics layer.

Panacea therefore uses four model classes:

- mechanistic models;
- simple statistical baselines;
- learned/foundation models;
- hybrid mechanistic + learned models.

A learned model does not receive priority merely because it is larger or more expensive.

### 2. Foundation models currently have major perturbation-generalization limits

Several recent benchmarking studies materially change how Panacea must evaluate cellular AI:

- **PMID 40759747, Nature Methods 2025**: five foundation models and two other deep-learning models did not outperform deliberately simple baselines for transcriptomic perturbation prediction.
- **PMID 40269681, BMC Genomics 2025**: simple baselines outperformed scGPT and scFoundation on post-perturbation RNA-seq prediction; benchmark datasets also showed low perturbation-specific variance.
- **PMID 41381899, Nature Methods 2026**: 27 methods across 29 datasets showed that generalization remains strongly context dependent and cross-context performance requires explicit evaluation.
- **PMID 42715312, Science Advances 2026**: across 13 methods and 25 datasets, models showed conservative bias, synergy underestimation and no consistently strong cross-cell-type generalization.
- **PMID 42398561**: model-internal regulatory signal in scGPT did not transfer to real perturbation outcomes in the tested settings.
- **PMID 42185477**: gene-expression-only perturbation modeling can miss changes in cellular abundance; both dimensions matter.

Consequences for Panacea:

- every learned model must be compared with simple baselines;
- performance must be tested on unseen perturbations, combinations, datasets and cell types;
- expression-level agreement alone is insufficient;
- delta changes, differential-expression recovery, distributional similarity and cellular abundance must be evaluated separately;
- attention weights, embeddings and latent similarities are not accepted as causal evidence;
- a model that cannot beat a simple baseline cannot be promoted because it looks sophisticated.

### 3. Partial reprogramming is promising but far from an immortality solution

The expanded Hallmarks of Aging framework (PMID 36599349) describes 12 interconnected hallmarks: genomic instability, telomere attrition, epigenetic alterations, loss of proteostasis, disabled macroautophagy, deregulated nutrient sensing, mitochondrial dysfunction, cellular senescence, stem-cell exhaustion, altered intercellular communication, chronic inflammation and dysbiosis.

Recent reviews of partial reprogramming report rejuvenation signals in experimental systems, but major translational problems remain. Relevant risks include genomic instability, tumorigenicity, loss of cellular identity, heterogeneous/incomplete reprogramming, tissue specificity, delivery/temporal control and unknown long-term safety. See PMID 40735996, PMID 41490578 and PMID 41864756.

Panacea must therefore model rejuvenation as a multidimensional state-space problem across the hallmarks and cell/tissue context. It must not equate epigenetic age reversal with organismal immortality, cancer safety, restored organ function or proven human lifespan extension.

#### Current translational snapshot — 2026-09-11

ClinicalTrials.gov now lists **NCT07290244**, a recruiting, first-in-human **Phase 1** study of ER-100 OSK epigenetic therapy in open-angle glaucoma and non-arteritic anterior ischemic optic neuropathy. The registry describes an estimated enrollment of 18 participants, a primary emphasis on safety/tolerability, no posted results, and long-term follow-up through five years.

This materially changes the maturity label from "preclinical only" to **very-early clinical/translational for a narrow ocular indication**. It does **not** establish:

- clinical efficacy;
- systemic rejuvenation;
- reversal of organismal aging;
- cancer prevention;
- lifespan extension;
- general safety of partial reprogramming across tissues.

The registry search for the exact phrase "Partial Epigenetic Reprogramming" returned this single interventional trial in the 2026-09-11 snapshot. Registry facts are sponsor-submitted and must be refreshed before any current-status display. They are not equivalent to peer-reviewed efficacy evidence.

### 4. Cancer is a dynamic system, not a single mutation lookup

The Hallmarks of Cancer framework was expanded to emphasize phenotypic plasticity, non-mutational epigenetic reprogramming, microbiome context and senescent cells in the tumor microenvironment (PMID 35022204).

DepMap provides large-scale functional dependency evidence, but traditional cell lines have limitations. A 2026 Nature study (PMID 42557315) showed that organoid and spheroid models can recover disease programs and dependencies that are absent or altered in conventional cell lines. Therefore Panacea must preserve model context rather than treating all dependencies as universal.

Cancer discovery must integrate:

- genomic alteration;
- transcriptomic/epigenomic cell state;
- functional dependency;
- tumor microenvironment;
- lineage and tissue context;
- resistance state;
- compound/target evidence;
- 2D versus 3D model context;
- uncertainty and contradictory evidence.

No computational ranking alone can be labeled a cancer cure or validated treatment.

## Federated evidence graph

The system must federate authoritative sources instead of inventing a literal "database of every compound on Earth". No public resource is complete. Every record must preserve source identity, release/version, identifiers, access policy, license/terms where applicable, and retrieval timestamp.

Initial source graph:

### Chemistry and bioactivity

- **NCBI PubChem** — chemical identity, structures, annotations, BioAssays and bioactivities. PubChem exposes PUG-REST and bulk downloads; assay provenance remains tied to the submitting source.
- **EMBL-EBI ChEMBL** — curated bioactive molecules, targets, assays and medicinal-chemistry measurements via REST services.
- **BindingDB** — measured protein-small-molecule binding affinities and target relationships; its web services expose measured affinity-linked records.

### Target, pathway and disease evidence

- **Open Targets Platform** — target-disease evidence, genetics, drugs, tractability and clinical context. The Platform exposes GraphQL and downloadable datasets and is versioned by release.
- **Reactome** — expert-curated molecular reactions and pathways with cross-references to major biological resources.

### Cancer functional and genomic evidence

- **Broad DepMap** — genome-scale CRISPR dependency, omics and model-context data. Release/version must be pinned because pipelines and screens change over time.
- **NCI Genomic Data Commons (GDC)** — cancer genomic cohorts, molecular characterization, metadata and analysis endpoints. Open versus controlled access must remain explicit; controlled data requires proper authorization and may not be silently ingested.

### Cell-state and healthy-reference evidence

- **CZ CELLxGENE** — standardized single-cell datasets and Census access. Current documentation explicitly warns that aggregated normalized expression is not fully batch corrected; Panacea must preserve dataset identity and audit batch effects.
- **NIH GTEx** — adult tissue expression, eQTL and baseline regulatory context. Release identity must be pinned.

### Protein identity and structure

- **UniProt** — protein identity, sequence and annotation through REST APIs.
- **RCSB PDB** — experimentally determined macromolecular structures and annotations through public Data/Search APIs.
- **AlphaFold Protein Structure Database** — computed protein-structure predictions with confidence information. Predicted structures must never be silently presented as experimental structures.

Future adapters may include additional well-governed public sources, but every adapter must pass the same provenance and validation contract.

## Multiscale model architecture

The computational stack should not be one monolithic neural network.

### Mechanistic layer

Use explicit mathematical models when the governing biology is defensible, for example:

- biochemical reaction networks and mass-action kinetics;
- ODE/SDE models for signaling and gene-regulatory dynamics;
- PDE/spatial models where diffusion or transport is central;
- constraint-based metabolic models where appropriate;
- population and lineage dynamics;
- agent-based or hybrid tissue models when cell-cell interactions matter.

Every equation must expose assumptions, units, parameter provenance, identifiability limitations and domain of validity.

### Learned layer

Learned models may represent high-dimensional cell state, perturbation response, molecular representations and surrogate dynamics, but must remain subordinate to benchmark evidence.

### Hybrid layer

The preferred long-term architecture combines mechanistic constraints with learned representations/surrogates. Learned components may accelerate inference or fill empirically supported latent structure, while mechanistic layers preserve causal/physical interpretation where possible.

Mathematical sophistication is useful only when the governing assumptions and validation are equally rigorous.

## Required validation axes

No model is publishable based on a single aggregate score. Each applicable model must report:

1. expression-level agreement;
2. change-from-control / delta recovery;
3. differential-expression recovery;
4. distributional similarity;
5. cellular abundance response;
6. unseen single perturbation generalization;
7. combinatorial perturbation generalization;
8. cross-cell-type transfer;
9. cross-dataset external validation;
10. calibration/uncertainty;
11. sensitivity and counterfactual analysis;
12. negative/null controls;
13. dataset-shift and batch-effect audits;
14. simple-baseline comparison;
15. deterministic/reproducible replay.

A model that fails OOD or external validation stays **computational-hypothesis** even if in-distribution metrics look strong.

## Cellular reprogramming and longevity track

The longevity engine should represent the 12 Hallmarks of Aging as interacting evidence domains rather than one "biological age" scalar. It may compare cell/tissue states related to genomic stability, epigenetics, proteostasis, autophagy, nutrient sensing, mitochondria, senescence, stem-cell exhaustion, inflammation, dysbiosis and intercellular communication.

For partial reprogramming and related rejuvenation hypotheses, the simulator must display explicit risk channels:

- genomic instability;
- tumorigenicity;
- cell-identity loss;
- incomplete/heterogeneous reprogramming;
- tissue-specific response;
- delivery and temporal-control uncertainty;
- unknown long-term safety.

Outputs must distinguish:

- established human evidence;
- clinical/translational evidence;
- preclinical evidence;
- mechanistic evidence;
- computational hypothesis.

"Immortality", complete rejuvenation and indefinite lifespan remain research hypotheses, not product claims.

## Cancer research track

After Body Exposure closure, cancer is a major research-frontier priority. The computational track should progressively support:

- normal versus tumor cell-state comparisons;
- clonal and lineage context;
- cancer dependencies and synthetic-lethality hypotheses;
- 2D cell-line versus organoid/spheroid context;
- tumor microenvironment and immune-state context;
- driver and pathway evidence;
- resistance-state modeling;
- multi-omic alignment;
- compound-target-disease evidence graphs;
- structure-aware target context;
- uncertainty and contradictory-evidence visualization.

Candidate hypotheses must be ranked separately for:

- evidence strength;
- mechanistic coherence;
- model-context transferability;
- uncertainty;
- external-validation status.

A predicted high-ranking compound is not a validated therapy.

## Structure evidence contract

Panacea must explicitly distinguish:

- experimentally determined structure;
- computed structure prediction;
- homology/template-derived structure;
- abstract/network representation.

RCSB PDB experimental structures and AlphaFold DB predictions may be linked to the same protein identity, but their evidence classes remain different. Confidence metrics from predicted structures must remain visible and may not self-promote a prediction into experimental evidence.

## Safety boundary

This phase is an **in-silico research and education environment**. It may analyze public evidence and simulate abstract perturbation consequences, but it must not produce operational biological-engineering instructions such as:

- nucleotide sequence design;
- gene-editing guide design;
- step-by-step wet-lab protocols;
- culture, transfection or delivery parameters;
- operational vector/delivery design;
- autonomous treatment recommendations;
- patient-specific clinical inference from research-only models.

The simulator may show non-operational consequences such as pathway-state changes, expression-state changes, abundance changes, network effects, uncertainty bands, evidence conflicts and hypothesis rankings.

## Integration with Body Exposure

Body Exposure remains the spatial and semantic parent. When this frontier is unlocked, every cell/molecular view must retain a canonical route back through:

`DNA/RNA -> molecule/pathway -> organelle -> cell -> tissue -> suborgan -> organ -> region -> system -> whole body`

No cellular or molecular record may create a competing duplicate anatomy identity. Cross-system structures continue to use canonical IDs and multiple memberships.

## Completion definition

This document and `src/lib/researchFrontierContract.ts` establish architecture, scientific constraints and ordering only. They do **not** mean the Research Frontier is implemented, validated, medically reviewed or deployed.

Actual implementation begins only after Body Exposure closure and proceeds one bounded wave at a time with exact-head CI, current-main ancestry checks, source/version provenance, model reproducibility, external validation and qualified review.

## Core evidence reviewed for this architecture

Biomedical literature:

- López-Otín C, et al. Hallmarks of aging: An expanding universe. Cell. 2023. PMID 36599349.
- Hanahan D. Hallmarks of Cancer: New Dimensions. Cancer Discovery. 2022. PMID 35022204.
- Ahlmann-Eltze C, Huber W, Anders S. Deep-learning-based gene perturbation effect prediction does not yet outperform simple linear baselines. Nature Methods. 2025. PMID 40759747.
- Csendes G, et al. Benchmarking foundation cell models for post-perturbation RNA-seq prediction. BMC Genomics. 2025. PMID 40269681.
- Wei Z, et al. Benchmarking algorithms for generalizable single-cell perturbation response prediction. Nature Methods. 2026. PMID 41381899.
- Li L, et al. A systematic comparison of single-cell perturbation response prediction models. Science Advances. 2026. PMID 42715312.
- Neiswender JV, et al. A dependency map enhanced with next-generation 3D cancer models. Nature. 2026. PMID 42557315.
- Ahmad U, et al. Can iPSCs Turn Back Time? Prospects and Pitfalls in Age Reversal. 2026. PMID 40735996.
- Li YY, Tay FR. The epigenetic rejuvenation promise. Ageing Research Reviews. 2026. PMID 41490578.

Clinical registry snapshot:

- ClinicalTrials.gov NCT07290244 — ER-100 OSK epigenetic therapy, Phase 1, recruiting, first-in-human, estimated n=18, no posted results as of 2026-09-11.

Current official resources reviewed:

- NCBI PubChem PUG-REST / BioAssay documentation
- Open Targets Platform API and release documentation
- Broad DepMap Portal
- NCI GDC API and controlled-access documentation
- CZ CELLxGENE documentation and Census/normalization caveats
- Reactome Content Service
- ChEMBL REST API
- BindingDB Web Services
- UniProt REST API
- RCSB PDB public APIs
- AlphaFold Protein Structure Database
- GTEx Portal and current downloads
