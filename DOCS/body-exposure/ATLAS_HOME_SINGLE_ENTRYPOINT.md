# Body Exposure Atlas Home — Canonical Single Entrypoint

## 1. Resolution of Entrypoint Ambiguity (`Your Body` vs. `Body Exposure` vs. `bodyhub`)
- **`/body-exposure` (`BodyExposureAtlasHome`)**: The single canonical interactive 3D human atlas and physiological simulation shell.
- **`/your-body`**: Personal healthspan & wearable telemetry dashboard. Clicking any organ or biomarker deep-links directly into `/body-exposure?structure=<meshName>` via `resolveUnifiedBodyNavigation()`.
- **`/bodyhub` & Legacy Studios**: All 12 legacy studios (`CardiopulmonaryCouplingDeck`, `ReferredPainDermatomeStudio`, `OculomotorLesionLab`, `DiagnosticImagingStudio`, etc.) redirect cleanly into `/body-exposure` as contextual Stage 2 / Stage 3 depth panels with zero 404s.

## 2. Three-Stage Progressive Disclosure in One Scene Shell
1. **Stage 1 — Anatomy**: 7 shipped Z-Anatomy GLB layers (`surface`, `muscular`, `skeletal`, `cardiovascular`, `nervous`, `lymphoid`, `visceral`) with BioDigital-style layer peel/fade and BVH mesh picking.
2. **Stage 2 — Living Physiology**: Real-time mechanistic animations (`cardiopulmonaryCouplingEngine`, `Track 3 Autophagy-Mitophagy`, `Track 4 3D Biomechanics`) inside the same camera context.
3. **Stage 3 — Clinical Relevance**: AHA-17 coronary territories, T1-L2 referred pain dermatomes, CT/MRI MPR slice correlation, and surgical safety checkpoints.