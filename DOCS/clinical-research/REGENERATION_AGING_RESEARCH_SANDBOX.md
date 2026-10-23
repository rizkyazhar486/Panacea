# PanaceaMed Regeneration & Aging Research Sandbox

## Purpose

The sandbox is an in-silico research and visualization layer for studying how age-associated biology might be measured, connected and hypothesized across:

`DNA / epigenome -> molecular pathway -> organelle -> cell state -> tissue -> organ -> whole-body function`

It is **not** a claim that a universal biological reset exists, and it is not a protocol for human gene editing, regenerative treatment, compound synthesis or dosing.

## Scientific ontology

The aging layer uses the twelve hallmarks described by López-Otín et al. in *Cell* (2023; PMID 36599349):

1. genomic instability;
2. telomere attrition;
3. epigenetic alterations;
4. loss of proteostasis;
5. disabled macroautophagy;
6. deregulated nutrient sensing;
7. mitochondrial dysfunction;
8. cellular senescence;
9. stem-cell exhaustion;
10. altered intercellular communication;
11. chronic inflammation;
12. dysbiosis.

Reference: Carlos López-Otín, Maria A. Blasco, Linda Partridge, Manuel Serrano, Guido Kroemer. “Hallmarks of aging: An expanding universe.” *Cell*. 2023;186(2):243–278. DOI: 10.1016/j.cell.2022.11.001. PMID: 36599349.

## Organ systems included

The first implementation provides research profiles for:

- brain and neurovascular unit;
- eye, retina and optic pathway;
- heart and coronary circulation;
- kidney;
- liver;
- skeletal muscle;
- immune/hematopoietic system;
- skin.

Each organ is modeled as a set of interacting cell types, vascular/immune compartments, function readouts and relevant hallmarks. The UI intentionally avoids reducing an organ to a single “biological age” number.

## 4D model

4D means **3D biological structure plus a time/state axis**. Current states are:

1. reference baseline;
2. accumulated aging burden;
3. research intervention hypothesis;
4. recovery hypothesis.

The state transition is educational. It does not assert that an intervention will reverse aging in a patient.

## Research intervention classes

The sandbox currently maps high-level evidence for:

- mitochondrial quality-control restoration;
- senescence-network modulation;
- proteostasis/autophagy restoration;
- epigenetic state restoration;
- stem/progenitor niche restoration;
- genome-maintenance research.

The epigenetic and genome-maintenance modules deliberately do not generate editing sequences, reprogramming-factor recipes, vectors, delivery protocols or experimental dosing.

## Compound and target discovery boundary

The discovery queue is evidence-first. It is designed to connect or rank published evidence from:

- Open Targets for target–disease evidence and prioritisation;
- ChEMBL for curated bioactivity and drug-like molecule evidence;
- PubChem for chemical structures, identifiers, properties, bioactivity, safety and toxicity metadata;
- ClinVar and Ensembl for genomic annotation;
- Reactome and UniProt for pathway/protein mechanism context.

The sandbox may surface underexplored target combinations or known compound classes for scientific review. It does **not** output a de novo drug structure, synthesis route, payload formulation, gene-editing sequence or human dosing protocol.

### Evidence-source references

- Open Targets Platform documentation: https://platform-docs.opentargets.org/
- Open Targets target–disease evidence model: https://platform-docs.opentargets.org/evidence
- ChEMBL: https://www.ebi.ac.uk/chembl/
- PubChem overview: https://pubchem.ncbi.nlm.nih.gov/docs/about/
- ClinVar: https://www.ncbi.nlm.nih.gov/clinvar/
- Ensembl: https://www.ensembl.org/
- Reactome: https://reactome.org/
- UniProt: https://www.uniprot.org/

## Quantitative formulas

### Normalized hallmark burden

`H = (Σ wᵢxᵢ) / (Σ wᵢ)`

where `xᵢ` is a normalized hallmark-related measurement and `wᵢ` is a validated weight. The current implementation is a research summary framework; weights are not clinically validated.

### Evidence-weighted target score

`T = 100 × clamp(0.30G + 0.25M + 0.20R + 0.15O + 0.10P − S, 0, 1)`

where:

- `G` = genetic evidence;
- `M` = mechanistic evidence;
- `R` = replicated evidence;
- `O` = organ/tissue relevance;
- `P` = pharmacologic evidence;
- `S` = safety penalty.

### Research recovery index

`RRI = 100 × clamp(0.35ΔH + 0.25F + 0.20C + 0.20E − S, 0, 1)`

where:

- `ΔH` = improvement in hallmark burden;
- `F` = organ-function evidence;
- `C` = cell-state recovery evidence;
- `E` = overall evidence quality;
- `S` = safety penalty.

RRI is not a clinical outcome predictor.

## Provenance rule

Any real-patient overlay must retain source provenance (for example VCF/variant identifiers, DICOM study/series/object IDs, WSI specimen identifiers, laboratory result IDs or FHIR resource IDs). Synthetic or educational states must remain visibly and programmatically separate from patient-derived observations and validated clinical inference.

## Future safe extensions

1. Bind VCF/ClinVar/Ensembl annotations to organ/cell pathway overlays.
2. Add single-cell and spatial transcriptomic state maps with specimen provenance.
3. Add DICOM/WSI longitudinal organ measurements.
4. Add Open Targets/ChEMBL/PubChem evidence adapters with cached source identifiers.
5. Add uncertainty intervals, calibration and replication metadata to every target score.
6. Add graph comparison across age-associated states without claiming rejuvenation unless a validated endpoint exists.
7. Add a literature-supported “novel hypothesis” flag that requires independent evidence before any experimental planning.
