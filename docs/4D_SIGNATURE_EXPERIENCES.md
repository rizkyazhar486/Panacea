# PanaceaMed 4D Signature Experiences

This document defines the scientific/product contract for two high-impact experiences added in September 2026:

1. **Inside My Workout · 4D**
2. **Surgical Operation Atlas · 4D**

They share one rule: cinematic presentation must never erase provenance.

## 1. Inside My Workout · 4D

### Product idea

A workout becomes a time-based human physiology story rather than a flat summary card.

The replay accepts an existing `ImportedWorkout` and constructs a normalized timeline. At each time point the UI can show:

- measured heart rate when a real workout HR sample exists;
- derived respiratory animation and intensity context;
- educational fuel-use and oxygen-demand context;
- activity-specific reference muscle highlighting;
- a shareable vertical Panacea Story poster.

### Provenance classes

**Measured**
- workout duration;
- distance when recorded;
- heart-rate trace when recorded.

**Derived**
- intensity domain;
- normalized cardiac-demand visualization;
- respiratory-rate animation when no respiratory sensor exists.

**Educational**
- substrate/fuel contribution;
- relative oxygen-demand visualization;
- muscle-recruitment context without EMG.

The UI must never relabel Derived or Educational values as device measurements.

### Astra refinement contract

Astra may improve:
- camera choreography;
- tissue lighting and subsurface appearance;
- animated vascular glow;
- lung and heart cinematography;
- procedural scene transitions;
- vertical WebM/MP4 story rendering;
- mobile interaction and haptics.

Astra must preserve:
- the `Measured / Derived / Educational` distinction;
- the actual `ImportedWorkout` source data;
- the rule that estimated fuel use is not indirect calorimetry;
- the rule that respiratory animation is not a measured tidal-volume trace;
- privacy-safe sharing.

## 2. Surgical Operation Atlas · 4D

### Product idea

One universal renderer turns a procedure record into a time-based surgical learning scene:

`approach → anatomy → target → structures at risk → safety checkpoint → reconstruction`

A new procedure should normally require **data, not a new renderer**.

Each procedure contains:
- specialty;
- body region;
- approach;
- learning objectives;
- ordered phases;
- anatomy keywords;
- visible layers;
- dissection/unfold state;
- structures at risk;
- safety checkpoint;
- high-level instrument families;
- complication map;
- patient-specific data requirements.

### Educational boundary

This atlas is for anatomy education, rehearsal concepts and spatial understanding.

It must not provide:
- incision measurements;
- device sizing;
- energy settings;
- drilling/cutting parameters;
- patient-specific trajectories;
- intraoperative navigation claims;
- medication/dose protocols;
- autonomous surgical instructions.

Patient-specific mode stays locked until the procedure has the required real inputs, such as DICOM imaging, segmentation, registration and clinician review.

### Why this direction is evidence-aligned

Recent surgical-simulation literature describes value from 3D, VR and AR for anatomical understanding, procedural confidence and simulation training, while also emphasizing heterogeneity, limited validation and technical barriers. The Panacea contract therefore separates **reference education** from **validated patient-specific rehearsal/navigation**.

Relevant PubMed sources used while defining this module:
- PMID 41345321 — 3D/VR/AR models for renal cancer surgical training (systematic review, 2025).
- PMID 39258246 — extended reality for endovascular neurosurgery training (systematic review, 2024).

### Astra refinement contract

Astra may improve:
- cinematic approach animations;
- organ-specific clipping planes;
- endoscopic/arthroscopic camera presets;
- generic instrument meshes and non-operative choreography;
- tissue deformation for educational visualization;
- procedural before/after morphs;
- spatial labels that avoid occlusion;
- high-quality story export;
- WebXR presentation mode.

Astra must not convert the reference atlas into claimed operative guidance or patient navigation without validated patient data and an explicit clinical-validation pathway.

## 3. Shared architecture

Both products should converge on a common future scene protocol:

```ts
interface Panacea4DScene {
  time: number
  anatomyLayers: string[]
  focusKeywords: string[]
  cameraPreset?: string
  motion?: Record<string, number>
  overlays: Array<{
    label: string
    value?: string | number
    provenance: 'measured' | 'derived' | 'educational' | 'patient-derived'
  }>
  narration: string
}
```

This makes workout, surgery, disease progression, drug journey and rehabilitation replayable through one cinematic engine.

## 4. Next high-end upgrades

1. Export true 9:16 video stories, not only PNG posters.
2. Add endoscopic/arthroscopic camera presets.
3. Add patient-specific DICOM/SEG import behind validation gates.
4. Add procedure packages by specialty rather than a monolithic file.
5. Add educator authoring tools so surgeons can build reviewed procedural scenes without changing React code.
6. Add assessment mode: identify anatomy, sequence phases, detect structures at risk, then reveal feedback.
7. Add multilingual narration and six Panacea learning-depth modes.
8. Add provenance/citation sidecars per procedure.
