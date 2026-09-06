# PanaceaMed Biomedical Open-Source Atlas

Curated open-source repositories that can serve as references, datasets, model components, interoperability layers, visualization tools, or research infrastructure for PanaceaMed.

> **Important:** inclusion here does **not** mean code may be copied into PanaceaMed without review. Check the current upstream license, data-use agreement, model license, attribution requirements, clinical validation status, and commercial-use restrictions before integration.

## 1. Medical Imaging, Radiology & DICOM

1. **Project-MONAI/MONAI** — https://github.com/Project-MONAI/MONAI  
   PyTorch framework for healthcare imaging; transforms, losses, networks, metrics, training and inference.
2. **Project-MONAI/tutorials** — https://github.com/Project-MONAI/tutorials  
   Practical reference implementations and notebooks.
3. **Project-MONAI/MONAILabel** — https://github.com/Project-MONAI/MONAILabel  
   AI-assisted annotation and active learning.
4. **Project-MONAI/model-zoo** — https://github.com/Project-MONAI/model-zoo  
   Reusable MONAI bundles and pretrained medical-imaging workflows.
5. **Project-MONAI/monai-deploy-app-sdk** — https://github.com/Project-MONAI/monai-deploy-app-sdk  
   Packaging and deployment patterns for clinical imaging AI.
6. **Project-MONAI/research-contributions** — https://github.com/Project-MONAI/research-contributions  
   Implementations of medical-imaging research prototypes.
7. **MIC-DKFZ/nnUNet** — https://github.com/MIC-DKFZ/nnUNet  
   Self-configuring segmentation framework; excellent baseline for organ/lesion segmentation.
8. **bowang-lab/MedSAM** — https://github.com/bowang-lab/MedSAM  
   Segment Anything adaptation for medical images.
9. **uni-medical/SAM-Med3D** — https://github.com/uni-medical/SAM-Med3D  
   3D medical-image segmentation foundation model research.
10. **mlmed/torchxrayvision** — https://github.com/mlmed/torchxrayvision  
    Chest X-ray datasets, pretrained models and utilities.
11. **pydicom/pydicom** — https://github.com/pydicom/pydicom  
    Core Python DICOM reader/writer.
12. **nipy/nibabel** — https://github.com/nipy/nibabel  
    Neuroimaging and NIfTI I/O.
13. **SimpleITK/SimpleITK** — https://github.com/SimpleITK/SimpleITK  
    Medical-image registration, filtering and processing.
14. **Slicer/Slicer** — https://github.com/Slicer/Slicer  
    3D Slicer platform; visualization, segmentation and image-guided workflows.
15. **OHIF/Viewers** — https://github.com/OHIF/Viewers  
    Web-based DICOM viewer architecture.
16. **dcm4che/dcm4che** — https://github.com/dcm4che/dcm4che  
    DICOM and healthcare-imaging interoperability toolkit.
17. **RSNA/AI-Challenge-Data** — https://github.com/RSNA/AI-Challenge-Data  
    Entry point to RSNA challenge datasets.
18. **RSNA/ROADMAP** — https://github.com/RSNA/ROADMAP  
    Metadata/ontology concepts for radiology AI models and datasets.

## 2. Digital Pathology, Histology & Microscopy

19. **TissueImageAnalytics/tiatoolbox** — https://github.com/TissueImageAnalytics/tiatoolbox  
    End-to-end computational pathology toolbox.
20. **openslide/openslide** — https://github.com/openslide/openslide  
    Whole-slide image reading engine.
21. **openslide/openslide-python** — https://github.com/openslide/openslide-python  
    Python interface for whole-slide pathology images.
22. **qupath/qupath** — https://github.com/qupath/qupath  
    Digital pathology annotation, quantification and image analysis.
23. **DigitalSlideArchive/HistomicsTK** — https://github.com/DigitalSlideArchive/HistomicsTK  
    Histopathology image-analysis algorithms and workflows.
24. **PathologyDataScience/PathML** — https://github.com/Dana-Farber-AIOS/pathml  
    Machine-learning workflows for pathology images.
25. **mahmoodlab/CLAM** — https://github.com/mahmoodlab/CLAM  
    Weakly supervised computational pathology using multiple-instance learning.
26. **mahmoodlab/UNI** — https://github.com/mahmoodlab/UNI  
    Pathology foundation-model research and feature extraction.
27. **mahmoodlab/CONCH** — https://github.com/mahmoodlab/CONCH  
    Vision-language foundation-model work for computational pathology.

## 3. Genomics, DNA, RNA & Variant Analysis

28. **biopython/biopython** — https://github.com/biopython/biopython  
    General-purpose biological sequence analysis.
29. **pysam-developers/pysam** — https://github.com/pysam-developers/pysam  
    Python access to SAM/BAM/VCF/BCF genomic files.
30. **samtools/samtools** — https://github.com/samtools/samtools  
    Sequence-alignment processing.
31. **samtools/bcftools** — https://github.com/samtools/bcftools  
    Variant-calling and VCF/BCF processing.
32. **broadinstitute/gatk** — https://github.com/broadinstitute/gatk  
    Genome Analysis Toolkit for variant discovery and analysis.
33. **nf-core/rnaseq** — https://github.com/nf-core/rnaseq  
    Reproducible RNA-seq pipeline.
34. **nextflow-io/nextflow** — https://github.com/nextflow-io/nextflow  
    Scalable bioinformatics workflow orchestration.
35. **snakemake/snakemake** — https://github.com/snakemake/snakemake  
    Reproducible data-analysis pipelines.
36. **scverse/scanpy** — https://github.com/scverse/scanpy  
    Single-cell transcriptomics analysis.
37. **scverse/anndata** — https://github.com/scverse/anndata  
    Annotated data matrices for omics workflows.
38. **scverse/scvi-tools** — https://github.com/scverse/scvi-tools  
    Probabilistic deep-learning models for single-cell omics.
39. **satijalab/seurat** — https://github.com/satijalab/seurat  
    Single-cell genomics analysis in R.
40. **chanzuckerberg/cellxgene** — https://github.com/chanzuckerberg/cellxgene  
    Interactive exploration of single-cell data.

## 4. Proteins, Structural Biology & Molecular Design

41. **google-deepmind/alphafold** — https://github.com/google-deepmind/alphafold  
    Protein structure prediction reference implementation.
42. **facebookresearch/esm** — https://github.com/facebookresearch/esm  
    Protein language models and sequence representations.
43. **aqlaboratory/openfold** — https://github.com/aqlaboratory/openfold  
    Trainable open reproduction of AlphaFold-style structure prediction.
44. **dauparas/ProteinMPNN** — https://github.com/dauparas/ProteinMPNN  
    Protein sequence design conditioned on structure.
45. **RosettaCommons/RFdiffusion** — https://github.com/RosettaCommons/RFdiffusion  
    Generative protein design research.
46. **biotite-dev/biotite** — https://github.com/biotite-dev/biotite  
    Structural bioinformatics and sequence-analysis toolkit.

## 5. Drug Discovery, Chemistry & Pharmacology

47. **rdkit/rdkit** — https://github.com/rdkit/rdkit  
    Core cheminformatics toolkit.
48. **deepchem/deepchem** — https://github.com/deepchem/deepchem  
    Deep learning for chemistry, drug discovery and molecular ML.
49. **chemprop/chemprop** — https://github.com/chemprop/chemprop  
    Message-passing neural networks for molecular property prediction.
50. **datamol-io/datamol** — https://github.com/datamol-io/datamol  
    Molecular data manipulation and standardization.
51. **MolecularAI/REINVENT4** — https://github.com/MolecularAI/REINVENT4  
    Generative molecular design and optimization research.
52. **molecularsets/moses** — https://github.com/molecularsets/moses  
    Molecular-generation benchmarking.
53. **microsoft/Graphormer** — https://github.com/microsoft/Graphormer  
    Graph-transformer research relevant to molecular representations.

## 6. Cardiology, ECG, Echocardiography & Physiological Signals

54. **echonet/dynamic** — https://github.com/echonet/dynamic  
    Echocardiogram video AI for LV segmentation and ejection-fraction prediction.
55. **MIT-LCP/wfdb-python** — https://github.com/MIT-LCP/wfdb-python  
    Native Python tools for physiological waveform data.
56. **DeepPSP/torch_ecg** — https://github.com/DeepPSP/torch_ecg  
    Deep-learning toolkit for ECG analysis.
57. **physionetchallenges** — https://github.com/physionetchallenges  
    Reference algorithms and challenge code for physiological signals.
58. **neuropsychology/NeuroKit** — https://github.com/neuropsychology/NeuroKit  
    ECG, PPG, EDA, respiration and psychophysiological signal processing.
59. **PIA-Group/BioSPPy** — https://github.com/PIA-Group/BioSPPy  
    Biosignal processing utilities.

## 7. Clinical Data, ICU, EHR & Real-World Evidence

60. **MIT-LCP/mimic-code** — https://github.com/MIT-LCP/mimic-code  
    Reproducible analysis code for MIMIC clinical databases.
61. **MIT-LCP/eicu-code** — https://github.com/MIT-LCP/eicu-code  
    eICU Collaborative Research Database analysis resources.
62. **synthetichealth/synthea** — https://github.com/synthetichealth/synthea  
    Synthetic longitudinal patient generator with FHIR export.
63. **OHDSI/Atlas** — https://github.com/OHDSI/Atlas  
    Cohort definition and observational-health analytics UI.
64. **OHDSI/WebAPI** — https://github.com/OHDSI/WebAPI  
    REST services for OMOP CDM analytics.
65. **OHDSI/CommonDataModel** — https://github.com/OHDSI/CommonDataModel  
    OMOP common data model specifications and tooling.
66. **OHDSI/Achilles** — https://github.com/OHDSI/Achilles  
    Data characterization and quality assessment for OMOP.
67. **medplum/medplum** — https://github.com/medplum/medplum  
    Open-source healthcare developer platform based around FHIR.

## 8. FHIR, Terminology & Interoperability

68. **hapifhir/hapi-fhir** — https://github.com/hapifhir/hapi-fhir  
    Widely used Java FHIR client/server implementation.
69. **google/fhir-py** — https://github.com/google/fhir-py  
    Python FHIR tooling.
70. **microsoft/fhir-server** — https://github.com/microsoft/fhir-server  
    FHIR server implementation and interoperability patterns.
71. **LinuxForHealth/FHIR** — https://github.com/LinuxForHealth/FHIR  
    Open-source FHIR server and tooling.
72. **smart-on-fhir/client-py** — https://github.com/smart-on-fhir/client-py  
    SMART on FHIR client patterns.

## 9. Biomedical NLP, Clinical Text & Knowledge Extraction

73. **allenai/scispacy** — https://github.com/allenai/scispacy  
    spaCy pipelines for scientific and biomedical text.
74. **medspacy/medspacy** — https://github.com/medspacy/medspacy  
    Clinical NLP components for rule-based and hybrid pipelines.
75. **dmis-lab/biobert** — https://github.com/dmis-lab/biobert  
    Biomedical language-model research.
76. **cambridgeltl/SapBERT** — https://github.com/cambridgeltl/SapBERT  
    Biomedical entity representation and terminology linking.
77. **Georgetown-IR-Lab/QuickUMLS** — https://github.com/Georgetown-IR-Lab/QuickUMLS  
    Fast UMLS concept extraction/reference implementation.

## 10. Cancer, Precision Medicine & Multi-Omics

78. **cBioPortal/cbioportal** — https://github.com/cBioPortal/cbioportal  
    Cancer-genomics exploration, visualization and analysis platform.
79. **cBioPortal/datahub** — https://github.com/cBioPortal/datahub  
    Curated public cancer study files used by cBioPortal.
80. **NCI-GDC/gdc-client** — https://github.com/NCI-GDC/gdc-client  
    Genomic Data Commons data-transfer tooling.
81. **broadinstitute/firecloud-orchestration** — https://github.com/broadinstitute/firecloud-orchestration  
    Reference architecture around scalable genomics workflows.
82. **broadinstitute/cromwell** — https://github.com/broadinstitute/cromwell  
    Workflow execution engine widely used in genomics.

## 11. Wearables, Activity, Sleep & Digital Biomarkers

83. **actigraph/pygt3x** — https://github.com/actigraph/pygt3x  
    Utilities around ActiGraph GT3X accelerometer data.
84. **wadpac/GGIR** — https://github.com/wadpac/GGIR  
    Raw accelerometer analysis for physical activity and sleep research.
85. **Stanford-Health/wearipedia** — https://github.com/Stanford-Health/wearipedia  
    Programmatic access patterns for wearable-device data.
86. **neuropsychology/NeuroKit** — https://github.com/neuropsychology/NeuroKit  
    Useful for HRV, ECG, PPG, respiration and multimodal physiology.

## 12. Surgical, Anatomical & 3D Visualization Infrastructure

87. **Slicer/Slicer** — https://github.com/Slicer/Slicer  
    3D anatomical visualization and image-guided intervention foundation.
88. **Kitware/VTK** — https://github.com/Kitware/VTK  
    Scientific visualization toolkit suitable for anatomical 3D rendering.
89. **isl-org/Open3D** — https://github.com/isl-org/Open3D  
    3D geometry, point clouds and reconstruction.
90. **mrdoob/three.js** — https://github.com/mrdoob/three.js  
    Browser-based 3D engine useful for interactive anatomical visualization.
91. **BabylonJS/Babylon.js** — https://github.com/BabylonJS/Babylon.js  
    Web 3D engine for immersive educational anatomy and procedural simulation.

---

# Recommended PanaceaMed Priority Tiers

## Tier A — build around now

- Project-MONAI/MONAI
- MIC-DKFZ/nnUNet
- pydicom/pydicom
- OHIF/Viewers
- TissueImageAnalytics/tiatoolbox
- rdkit/rdkit
- deepchem/deepchem
- MIT-LCP/mimic-code
- synthetichealth/synthea
- OHDSI/CommonDataModel
- OHDSI/WebAPI
- hapifhir/hapi-fhir
- medplum/medplum
- allenai/scispacy
- medspacy/medspacy
- cBioPortal/cbioportal
- echonet/dynamic
- MIT-LCP/wfdb-python

## Tier B — research prototypes / model experimentation

- MedSAM
- SAM-Med3D
- torchxrayvision
- CLAM
- UNI
- CONCH
- AlphaFold
- ESM
- OpenFold
- ProteinMPNN
- RFdiffusion
- Chemprop
- REINVENT4
- torch_ecg
- BioBERT
- SapBERT

## Tier C — visualization and future experiential layer

- 3D Slicer
- VTK
- Open3D
- three.js
- Babylon.js

---

# Proposed PanaceaMed Biomedical Architecture

```text
Patient / Clinician / Device / Laboratory / Imaging System
                |
                v
+------------------------------------------------------+
|                INGESTION & INTEROPERABILITY          |
| FHIR | DICOM | OMOP | CSV | Waveforms | VCF | FASTQ |
+------------------------------------------------------+
                |
                v
+------------------------------------------------------+
|                   DATA NORMALIZATION                 |
| terminology | units | identity | provenance | QC     |
+------------------------------------------------------+
                |
        +-------+-------+---------+---------+---------+
        |               |         |         |         |
        v               v         v         v         v
   Imaging AI      Clinical AI  Omics AI  Signal AI  NLP AI
 MONAI/nnUNet       MIMIC       Scanpy    WFDB      SciSpacy
 Pathology AI       OMOP        scVI      ECG/PPG   MedSpaCy
        |               |         |         |         |
        +---------------+---------+---------+---------+
                        |
                        v
+------------------------------------------------------+
|                  MULTIMODAL FUSION                   |
| calibrated prediction + uncertainty + provenance    |
+------------------------------------------------------+
                        |
                        v
+------------------------------------------------------+
|             PANACEAMED CLINICAL INTELLIGENCE         |
| differential diagnosis | risk | prognosis | therapy  |
| recommendations | monitoring | prevention | referral |
+------------------------------------------------------+
                        |
                        v
+------------------------------------------------------+
|         HUMAN-IN-THE-LOOP CLINICAL DECISION SUPPORT |
+------------------------------------------------------+
```

# Core Modeling Formulas

For multimodal patient representation:

\[
z = f_{fusion}(f_{img}(X_{img}), f_{ehr}(X_{ehr}), f_{omics}(X_{omics}), f_{sig}(X_{sig}), f_{txt}(X_{txt}))
\]

For multi-class diagnostic probability:

\[
P(y=k\mid X)=\frac{e^{z_k}}{\sum_j e^{z_j}}
\]

Binary clinical-risk calibration should track at minimum:

\[
Sensitivity=\frac{TP}{TP+FN}
\]

\[
Specificity=\frac{TN}{TN+FP}
\]

\[
PPV=\frac{TP}{TP+FP}
\]

\[
NPV=\frac{TN}{TN+FN}
\]

\[
F_1=2\cdot\frac{Precision\cdot Recall}{Precision+Recall}
\]

For probabilistic calibration, Brier score:

\[
BS=\frac{1}{N}\sum_{i=1}^{N}(p_i-y_i)^2
\]

For expected utility of a clinical recommendation:

\[
EU(a\mid X)=\sum_o P(o\mid a,X)\,U(o)
\]

The CDSS should not optimize AUROC alone. A production medical model should also evaluate calibration, subgroup performance, decision-curve utility, out-of-distribution behavior, uncertainty, false-negative harm, and post-deployment drift.

# Integration Rules for PanaceaMed

1. **Do not vendor upstream repositories blindly.** Prefer APIs, packages, submodules, services or reproducible adapters.
2. **Freeze versions** for any dependency used in clinical inference.
3. **Record provenance** for model, dataset, preprocessing and terminology versions.
4. **Keep research models separated from validated clinical models.**
5. **Never use a GitHub model as clinical ground truth without independent validation.**
6. **Validate licenses before commercial use**, especially pretrained model weights and datasets.
7. **Use synthetic data such as Synthea** for interface/testing workflows where real patient data is unnecessary.
8. **Use FHIR/OMOP/DICOM as canonical interfaces** rather than inventing proprietary healthcare schemas where a standard already exists.
9. **Maintain human override and audit trails** for any diagnosis/treatment decision support.
10. **Track model drift** after deployment and allow rollback to a validated model version.

# Suggested Repository Layout in PanaceaMed

```text
src/
  biomedical/
    imaging/
    pathology/
    cardiology/
    signals/
    genomics/
    proteomics/
    pharmacology/
    clinical_nlp/
    multimodal/
  interoperability/
    fhir/
    dicom/
    omop/
    terminology/
  visualization/
    anatomy3d/
    imaging/
    molecular/
  safety/
    calibration/
    uncertainty/
    audit/
    drift/

docs/
  rujukan/
    RSNA_MEDICAL_AI_REPOS.md
    BIOMEDICAL_OPEN_SOURCE_ATLAS.md
```

# References verified during curation

- MONAI: https://github.com/Project-MONAI/MONAI
- MONAI organization and ecosystem: https://github.com/Project-MONAI
- TIAToolbox: https://github.com/TissueImageAnalytics/tiatoolbox
- MIMIC Code: https://github.com/MIT-LCP/mimic-code
- Synthea: https://github.com/synthetichealth/synthea
- EchoNet-Dynamic: https://github.com/echonet/dynamic
- HAPI FHIR: https://github.com/hapifhir/hapi-fhir
- OHDSI WebAPI: https://github.com/OHDSI/WebAPI
- cBioPortal: https://github.com/cBioPortal/cbioportal

Last curated: 2026-09-06.
