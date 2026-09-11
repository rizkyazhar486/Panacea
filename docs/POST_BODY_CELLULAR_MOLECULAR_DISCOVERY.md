# Post-Body Cellular & Molecular Discovery Program

## Priority

This program is explicitly **after Body Exposure closure**. It must not leapfrog the current whole-body maturation order. The unlock state is fail-closed and requires Body Exposure to be deployed and reviewed, source provenance to be complete, academic review to be complete, and the research safety boundary to be accepted.

The scientific progression is:

1. Cell state and lineage visualization
2. Organelle systems
3. Molecular interaction and pathway networks
4. RNA/DNA state and regulation
5. Disease-mechanism models
6. Compound-space discovery and hypothesis ranking

The intent is to move beyond a static induced-pluripotent-stem-cell-style visualization toward a multiscale research simulator that can connect cell identity, state transitions, organelles, signaling, regulation, disease mechanisms and chemical evidence. This remains a research environment, not a claim that a simulated state is a validated biological intervention.

## Product goal

Build a high-rigor, model-agnostic computational research surface that can:

- visualize evidence-backed cell states and lineage relationships;
- compare normal, stressed, senescent, transformed and disease-associated cellular states where evidence exists;
- connect organelles to metabolism, proteostasis, trafficking, signaling and stress-response networks;
- visualize gene regulation, RNA expression and variant consequences without generating operational editing instructions;
- map cancer dependencies, resistance hypotheses and target-disease evidence;
- federate public compound evidence, chemical identities, bioactivities, pathways and disease context;
- rank research hypotheses with explicit uncertainty rather than claiming efficacy;
- support reproducible replay, source/version provenance and independent validation.

"Immortality", complete rejuvenation and a universal cancer cure are research hypotheses, not product claims. Panacea must never convert them into a score, guarantee or treatment recommendation without empirical evidence and qualified review.

## Federated evidence graph

The first research-data layer should federate rather than attempt to invent a single "database of every compound on Earth". No public database is literally complete. Panacea should preserve source identity, version, license/terms, identifiers and update time and build cross-database mappings instead of collapsing records into one unverifiable truth.

Initial authoritative/public sources:

- **NCBI PubChem** — chemical identity, structures, properties, annotations and bioactivity evidence.
- **Open Targets Platform** — target-disease evidence and target-prioritisation context.
- **Broad Institute DepMap** — cancer dependencies, vulnerabilities, cell-line and compound context.
- **NCI Genomic Data Commons** — cancer genomic cohorts and molecular characterization.
- **CZ CELLxGENE** — public single-cell datasets and gene-expression/cell-state reference data.
- **Reactome** — curated reactions, pathways, proteins, small molecules and drug context.

Later adapters may add other well-provenanced public sources, but every adapter must remain independently attributable and versioned.

## High-rigor QC contract

"Astra-level" here means scientific rigor, not a claim that a particular model is selected or that a model has solved a biomedical problem. The QC stack is model-agnostic and must include:

- source and version provenance;
- identifier/schema validation;
- cross-database identity resolution with ambiguity quarantine;
- train/validation/holdout separation where learned models are used;
- external validation against independent datasets;
- uncertainty and calibration reporting;
- counterfactual and sensitivity analysis;
- deterministic/reproducible replay of data transformations;
- comparison against simpler baselines;
- failure analysis and known-domain limits;
- qualified domain review before biomedical publication claims.

A complex equation or sophisticated model is not itself evidence of biological correctness. The same standard used for difficult engineering mathematics must be paired here with biological validation, provenance and uncertainty.

## Safety boundary

This phase is an **in-silico research and education environment**. It may analyze existing public evidence and simulate abstract perturbations, but it must not produce operational biological-engineering instructions such as:

- nucleotide sequence design;
- gene-editing guide design;
- step-by-step wet-lab protocols;
- culture, transfection or delivery parameters;
- autonomous treatment recommendations;
- patient-specific clinical inference from research-only models.

The research simulator may show non-operational consequences such as pathway-state changes, expression-state changes, network effects, uncertainty bands, evidence conflicts and hypothesis rankings.

## Cancer research track

After Body Exposure closure, cancer becomes a major priority inside the research frontier. The initial computational track should focus on:

- normal-cell versus tumor-cell state comparison;
- driver/pathway context;
- dependency evidence;
- resistance and synthetic-lethality hypotheses;
- tumor microenvironment and cell-state context;
- multi-omic evidence alignment;
- compound-target-disease evidence graphs;
- transparent uncertainty and contradictory-evidence display.

No output may be labeled a cure, validated therapy or patient-specific treatment solely because a computational model ranks it highly.

## Extreme longevity track

The longevity program should model evidence around genomic stability, epigenetic state, mitochondrial function, proteostasis, nutrient sensing, senescence, stem-cell state, intercellular communication and other evidence-backed aging mechanisms. The product should distinguish:

- established human evidence;
- translational/preclinical evidence;
- mechanistic hypotheses;
- speculative frontier research.

The goal is to accelerate testable hypotheses about healthy lifespan and disease prevention, not to claim that indefinite human lifespan has been achieved.

## Integration with Body Exposure

The Body Exposure atlas remains the spatial and semantic parent. When this frontier is unlocked, every cell/molecular view should retain a canonical route back through:

`DNA/RNA -> molecule/pathway -> organelle -> cell -> tissue -> suborgan -> organ -> region -> system -> whole body`

No cellular or molecular truth may create a competing duplicate anatomy identity. Cross-system structures continue to use canonical IDs and multiple memberships.

## Completion definition

This document and `src/lib/researchFrontierContract.ts` establish architecture and ordering only. They do **not** mean the research frontier is implemented, validated, clinically reviewed or deployed. Actual implementation starts only after Body Exposure closure and then proceeds one bounded wave at a time with exact-head CI, provenance, reproducibility and qualified review gates.
