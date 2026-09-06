# Panacea Operation Universe + Workout DNA

This document defines the refinement boundary for the two signature experiences added to the Human Biology Engine.

## Operation Universe

The surgical renderer is a reusable educational scene engine. A procedure is data:

`specialty → region → approach → phases → focus anatomy → structures at risk → safety checkpoint → complications → patient-specific requirements`

The current catalog combines the original curated seeds with a scalable expansion registry. New procedures should normally be added as records rather than as bespoke pages or separate renderers.

### Astra refinement targets

Astra/Codex may improve:
- cinematic camera paths and transitions;
- tissue-appropriate materials and lighting;
- endoscopic/arthroscopic/microsurgical camera presets;
- richer instrument-family models used as educational visual references;
- animated blood-flow or organ-motion context where scientifically appropriate;
- cutaway, translucent, explode and dissection transitions;
- WebXR/spatial viewing;
- 9:16 share-video rendering;
- specialty-specific visual identities;
- DICOM-derived patient models **only after** a validated patient-data pipeline exists.

Astra/Codex must not silently add:
- incision coordinates, drill trajectories, implant dimensions or device settings presented as operative guidance;
- drug/anesthetic dosing;
- patient-specific claims from reference meshes;
- invented anatomy when an asset is missing;
- unlabelled predictions about surgical outcome.

### Patient-specific gate

A reference procedure may become a patient-specific rehearsal only when the relevant source data and validation exist, such as:
- DICOM CT/MRI/angiography/ultrasound as appropriate;
- segmentation with provenance;
- registration landmarks and error metadata where spatial navigation matters;
- procedure-specific planning data;
- clinician/surgeon review;
- versioned model/asset identifiers.

Visual realism is not equivalent to patient specificity or clinical validation.

## Workout DNA

Workout DNA is a longitudinal visual language for comparing a user's own recorded sessions. It uses six axes:
- endurance;
- intensity;
- within-session heart-rate variability;
- recorded first-minute heart-rate recovery when present;
- volume;
- data richness.

The 0–100 values are **display normalizations**, not health, fitness, readiness, biological-age, injury-risk or longevity scores. Missing data stay missing.

### Provenance

- `measured` — direct presence/completeness of workout signals;
- `measured-derived` — transparent transformation of recorded workout data;
- `unavailable` — source signal is absent.

### Astra refinement targets

Astra/Codex may turn the same data contract into:
- animated 3D physiology fingerprints;
- longitudinal Human Passport constellations;
- cinematic 9:16 session stories;
- route → body → organ → cell transitions;
- measured HR-driven cardiac motion;
- measured pace/cadence/elevation overlays when those signals exist;
- comparison films between two sessions.

It must preserve the separation between measured, derived and educational physiology.
