# Body Exposure Physiology & Pathophysiology Atlas

This layer extends Body Exposure with physiology and pathophysiology without creating a second heavy 3D viewer. It is a reusable knowledge/visualization contract that existing Body3D and Body Exposure surfaces can consume progressively.

## Spatial-resolution rule

“Precise layer by layer” means continuous traversal to the highest defensible resolution, not fabricated geometry. Gross anatomy may use named-vessel or organ geometry. Vessel wall transitions to lumen, endothelium, tunica intima, tunica media, tunica adventitia, microcirculation, histology, cell, organelle and molecular-pathway views as appropriate.

Generic atlas geometry must never be presented as patient-specific anatomy. Quantitative labels remain illustrative unless supplied by a validated measurement pipeline with provenance.

## Visualization grammar

Each mechanism step declares one visualization mode:
- `anatomy-overlay`: named structures and territories in the shared Body Exposure scene.
- `flow-field`: conceptual streamlines, pressure or oxygen-delivery overlays.
- `cross-section`: vessel-wall or tissue-layer sectional anatomy.
- `histology`: microscopy-style tissue organization.
- `cellular`: cell/organelle-level mechanisms.
- `network`: interacting molecular, coagulation, neurohumoral or signaling pathways.
- `timeline`: ordered progression such as thrombus formation, ischemic injury, edema or remodeling.

The UI should render only the modes needed for the selected step and lazy-load deeper content. Do not duplicate the existing Body3D shell.

## Initial disease/mechanism modules

### Atherosclerosis
Flow/shear context → endothelial activation/barrier dysfunction → intimal apoB-containing lipoprotein retention → monocyte/macrophage/foam-cell response → smooth-muscle and matrix/fibrous-cap remodeling → plaque disruption with platelet activation/coagulation and possible downstream ischemia.

### Ischemic stroke
Potential thromboembolic source/route → focal arterial occlusion → collateral-dependent flow redistribution → cellular ATP/ion-gradient failure → excitotoxic/calcium-dependent injury cascades → cytotoxic edema, blood-brain-barrier dysfunction and evolving tissue injury.

### Intracerebral hemorrhage
Vessel-wall failure → hematoma formation/expansion → perihematomal microvascular/inflammatory injury → edema, mass effect and intracranial-pressure/perfusion consequences.

### Heart failure
Ventricular pump or filling impairment → upstream filling-pressure redistribution → pulmonary/systemic congestion → neurohumoral compensation → myocardial and multiorgan remodeling. Pulmonary, renal and endocrine domains are linked rather than modeled as isolated features.

### Deep vein thrombosis
Venous stasis → endothelial/inflammatory contribution → thrombin/fibrin-rich thrombus formation → propagation → possible embolization through the right heart into pulmonary arteries.

### Coronary artery disease
Epicardial plaque/lumen change → microvascular reserve and supply-demand balance → myocardial oxygen deficit → cellular energetic dysfunction → potentially irreversible myocardial injury and remodeling when severe/prolonged.

## Academic Accuracy Gate

All modules are educational. They do not infer patient diagnosis, lesion severity, prognosis, treatment, stroke territory deficit or personalized hemodynamics from generic atlas appearance. Clinical/procedure use requires the Academic Accuracy Gate and qualified human review.

The existing multisystem evidence rules remain controlling: mandatory external anatomy/UX references remain reference-only unless license/provenance is independently verified; research-frontier evidence must not be promoted to validated therapy; atlas geometry must not be promoted to patient-specific anatomy; molecular associations must not be promoted to deterministic cognition; longevity research must not be promoted to immortality.

Implementation: `src/lib/bodyPhysiologyPathophysiologyAtlas.ts` with deterministic guards in `scripts/uji/body-physiology-pathophysiology-atlas.mts`.
