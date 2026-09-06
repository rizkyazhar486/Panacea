# PanaceaMed Interactive Human Digital Twin Engine

## Goal

Create a single navigable biomedical workspace spanning:

`whole body -> organ system -> organ -> tissue -> cell -> organelle -> protein/pathway -> gene/variant -> therapeutic target`

The UI deliberately separates three semantic layers so an attractive visualization cannot silently become a clinical claim:

1. **Educational visualization** — reference anatomy, physiology, histology, pathology, pathways, formulas and simulations.
2. **Patient-derived findings** — observations directly traceable to a source object such as DICOM/DICOM SEG/SR, DICOM WSI, FHIR Observation/DiagnosticReport, laboratory result, VCF, or curated clinician annotation.
3. **Clinical inference** — a conclusion emitted only by a versioned rule/model with declared required inputs, validation metadata, provenance and audit trail.

## What this implementation changes

`#/body-explorer` becomes the Digital Twin orchestration page. The previous mature atlas is preserved as `BodyExplorerLegacy.tsx` and is lazy-loaded from **Advanced Atlas**. The new page reuses the existing `Body3D` GLB renderer, including named-structure picking, CT/MRI-style clipping, anatomical layers, unfold/dissection controls and physiologic motion.

The orchestration page adds:

- macro-to-molecular scale rail;
- 4D physiology timeline;
- radiology -> lesion -> pathology provenance bridge;
- etiology -> molecular -> cell -> tissue -> organ -> clinical pathophysiology graph;
- drug-discovery evidence pipeline;
- source/adapter registry;
- hard inference gate for unvalidated clinical conclusions;
- quantitative model cards.

## Provenance contract

Every clinically meaningful object should eventually carry at least:

```ts
{
  patientId?: string,
  sourceType: 'DICOM' | 'DICOM-SEG' | 'DICOM-SR' | 'WSI' | 'FHIR' | 'VCF' | 'MANUAL',
  sourceId: string,
  acquiredAt?: string,
  author?: string,
  algorithm?: { name: string; version: string; modelCard?: string },
  validation?: { state: 'unvalidated' | 'internal' | 'external' | 'regulated'; cohort?: string },
  terminology?: Array<{ system: string; code: string; display: string }>,
  confidence?: number,
  uncertainty?: string,
}
```

No clinical-inference card should be renderable from educational geometry alone.

## 4D model

"4D" means 3D state plus time, not a claim that the mesh is a patient-specific physiological simulation. Current motion drivers reuse the existing heart, respiratory, peristaltic and muscle-animation system. Future patient-specific motion must bind measured timestamps and units to the animation state.

## Core formulas

- Tissue strain: `epsilon = (L - L0) / L0`
- Mechanical stress: `sigma = F / A`
- Joint torque: `tau = r x F`
- CT window mapping: `I = clamp((HU - (L - W/2)) / W, 0, 1)`
- Simple equilibrium receptor occupancy: `theta = C / (C + Kd)`

These formulas are explanatory primitives. They are not sufficient by themselves for patient-specific finite-element biomechanics, pharmacokinetics, dose selection, or treatment recommendations.

## Data fabric / intended adapters

- Anatomy: existing Z-Anatomy / BodyParts3D-derived GLB assets in this repository.
- Imaging: DICOM, DICOMweb, DICOM SEG, DICOM SR.
- Digital pathology: DICOM WSI.
- Clinical records: HL7 FHIR.
- Terminology: SNOMED CT, ICD, LOINC, RxNorm (respect licensing/region constraints).
- Genomics: VCF + ClinVar + Ensembl identifiers.
- Proteins/pathways: UniProt + Reactome.
- Target/compound evidence: Open Targets + ChEMBL + PubChem.
- Literature: PubMed IDs/DOIs stored as provenance, not pasted text.

## References / technical sources

- DICOM Standard: https://www.dicomstandard.org/
- HL7 FHIR: https://hl7.org/fhir/
- SNOMED CT: https://www.snomed.org/
- LOINC: https://loinc.org/
- RxNorm: https://www.nlm.nih.gov/research/umls/rxnorm/
- ClinVar: https://www.ncbi.nlm.nih.gov/clinvar/
- Ensembl: https://www.ensembl.org/
- UniProt: https://www.uniprot.org/
- Reactome: https://reactome.org/
- Open Targets: https://platform.opentargets.org/
- ChEMBL: https://www.ebi.ac.uk/chembl/
- PubChem: https://pubchem.ncbi.nlm.nih.gov/
- Existing atlas licensing/source notes: `public/anatomy/CREDITS.txt`.

## Astra / Codex refinement contract

When a stronger coding agent continues this work, prioritize correctness over visual novelty:

1. Keep the three provenance layers impossible to confuse visually and in types.
2. Never label a synthetic render as CT/MRI/histology from a patient.
3. Add patient-specific 3D only from a real segmentation and retain Study/Series/SOP identifiers.
4. Add WSI with region-of-interest linkage before making histopathology patient-derived.
5. Bind genomics to normalized variant identifiers before molecular overlays.
6. Require versioned clinical rules/models, model cards, calibration and audit logging before enabling production inference.
7. Add mesh LOD/streaming, GPU memory budgets and mobile fallbacks before increasing atlas resolution.
8. Add automated tests that fail whenever provenance is missing or a clinical-inference object is sourced only from educational data.
