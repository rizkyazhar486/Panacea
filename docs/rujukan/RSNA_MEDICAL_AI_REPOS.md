# RSNA Medical AI & Data Science Repositories for PanaceaMed

This document collects useful RSNA and RSNA-related GitHub repositories that can inform PanaceaMed's medical-imaging, multimodal clinical AI, data-science, and model-governance architecture.

> Purpose: reference and technical inspiration. Do not copy code or datasets without reviewing the source repository's license, dataset terms, patient-data restrictions, and clinical/regulatory requirements.

## Core RSNA resources

### 1. RSNA AI Challenge Data
- Repository: https://github.com/RSNA/AI-Challenge-Data
- Role: entry point for RSNA AI Challenge datasets and public imaging datasets.
- PanaceaMed relevance:
  - training/evaluation datasets for radiology AI
  - benchmark construction
  - disease-specific imaging modules

### 2. RSNA GitHub Organization / AI Deep Learning Lab
- Organization: https://github.com/RSNA
- Role: official RSNA repositories, educational notebooks, tooling, and medical-imaging resources.
- PanaceaMed relevance:
  - radiology deep-learning workflows
  - educational reference implementations
  - DICOM-oriented development patterns

### 3. RSNA ROADMAP
- Repository: https://github.com/RSNA/ROADMAP
- Role: metadata/ontology concepts for AI models, datasets, projects, and radiology AI resources.
- PanaceaMed relevance:
  - AI model registry
  - dataset provenance
  - model/version metadata
  - auditability and governance

### 4. RSNA Anonymizer
- Repository: https://github.com/RSNA/anonymizer
- Role: DICOM de-identification/anonymization workflows.
- PanaceaMed relevance:
  - preprocessing hospital imaging data
  - PHI/PII reduction before AI processing
  - research dataset preparation

## RSNA competition implementations and reference pipelines

### 5. RSNA Intracranial Aneurysm Detection — competition solution
- Repository: https://github.com/KonradHabel/rsna
- Role: competition-oriented medical-imaging pipeline.
- Useful patterns:
  - DICOM preprocessing
  - cross-validation/fold generation
  - staged training
  - feature extraction
  - end-to-end evaluation

### 6. RSNA Intracranial Hemorrhage Detection
- Repository: https://github.com/dbensoussan/rsna
- Role: CT-based intracranial hemorrhage classification workflow.
- Useful patterns:
  - exploratory data analysis
  - preprocessing
  - CNN/PyTorch training
  - checkpointing
  - inference/prediction pipeline

### 7. RSNA Knee Abnormality Detection / DINOv2 reference implementation
- Repository: https://github.com/udaken10/RNSA
- Role: MRI-oriented abnormality detection experiments using modern vision models.
- Useful patterns:
  - 2.5D imaging
  - Vision Transformer / DINOv2-style representations
  - PyTorch
  - cross-validation
  - ensembling

### 8. Structured RSNA Knee Abnormality Detection repository
- Repository: https://github.com/Sibusiso-K/RSNA-Knee-Abnormality-Detection
- Role: structured competition/research repository.
- Useful patterns:
  - `src/`
  - `notebooks/`
  - `scripts/`
  - data separation
  - reproducible training/submission organization

## Multimodal clinical AI reference

### 9. RadFusion Clinical
- Repository: https://github.com/Youssef-SH/radfusion-clinical
- Role: multimodal clinical AI combining radiology and structured clinical information.
- PanaceaMed relevance:
  - image + laboratory fusion
  - tabular ML + imaging ML
  - DenseNet / LightGBM / logistic-regression style baselines
  - multimodal clinical prediction

---

# Proposed PanaceaMed Medical Imaging Intelligence Layer

```text
DICOM / X-ray / CT / MRI / Ultrasound
        ↓
De-identification / validation
        ↓
Imaging preprocessing
        ↓
Image encoder
(MONAI / PyTorch / ViT / DINO-style model)
        ↓
Imaging embedding
        ┐
        │
Symptoms / history ─────→ Clinical encoder
Laboratory data ────────→ Lab encoder
Medication data ────────→ Medication encoder
Wearables ──────────────→ Time-series encoder
Genomics ───────────────→ Genomic encoder
        │
        └───────────────→ Multimodal fusion
                              ↓
                    Clinical prediction layer
                              ↓
              Differential diagnosis / prognosis
              risk stratification / treatment support
              uncertainty / explanation / audit trail
```

## Conceptual multimodal formulation

Let each modality be encoded independently:

```math
h_i = f_{image}(X_i)
```

```math
h_c = f_{clinical}(X_c)
```

```math
h_l = f_{lab}(X_l)
```

```math
h_w = f_{wearable}(X_w)
```

```math
h_g = f_{genomic}(X_g)
```

Fusion representation:

```math
z = f_{fusion}(h_i, h_c, h_l, h_w, h_g)
```

For a K-class diagnostic prediction:

```math
P(D_k \mid X) = \operatorname{softmax}(Wz+b)_k
```

with:
- `X_i`: medical images
- `X_c`: symptoms, history, examination, clinical context
- `X_l`: laboratory data
- `X_w`: wearable/time-series data
- `X_g`: genomic/molecular data
- `z`: fused patient representation
- `D_k`: candidate diagnosis k

## Recommended implementation principles

1. Keep raw clinical data separate from derived AI features.
2. Preserve provenance for every dataset and prediction.
3. Record model name, version, checkpoint, preprocessing version, and inference timestamp.
4. Return calibrated probabilities and uncertainty rather than only a single diagnosis.
5. Separate research models from models approved for clinical use.
6. Use DICOM-native metadata handling where appropriate.
7. Add de-identification before using hospital imaging for research/training.
8. Validate performance independently for Indonesian populations before clinical deployment.
9. Track sensitivity, specificity, PPV, NPV, AUROC, calibration, subgroup performance, and failure modes.
10. Treat external GitHub repositories as references/dependencies subject to their individual licenses and terms.

## Evaluation formulas

Sensitivity:

```math
Sensitivity = \frac{TP}{TP+FN}
```

Specificity:

```math
Specificity = \frac{TN}{TN+FP}
```

Positive Predictive Value:

```math
PPV = \frac{TP}{TP+FP}
```

Negative Predictive Value:

```math
NPV = \frac{TN}{TN+FN}
```

Accuracy:

```math
Accuracy = \frac{TP+TN}{TP+TN+FP+FN}
```

F1 score:

```math
F1 = 2 \times \frac{Precision \times Recall}{Precision + Recall}
```

---

## Next expansion targets

Future repository scouting for PanaceaMed should cover:

- MONAI / Project MONAI
- NIH medical imaging datasets
- Stanford AIMI / radiology AI
- pathology / whole-slide imaging
- ophthalmology / retinal imaging
- dermatology imaging
- cardiology ECG/echo AI
- surgical AI / computer vision
- genomics / DNA / RNA
- protein structure
- cellular biology
- drug discovery
- pharmacology / drug knowledge graphs
- wearable/time-series models
- digital biomarkers
- medical NLP and clinical LLM evaluation
- FHIR / DICOM interoperability
- medical AI uncertainty and calibration
- model governance and post-deployment monitoring

Last updated: 2026-09-06.
