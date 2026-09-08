# Surgery Simulator Acceptance

This document records the merge gate for the anatomy-grounded surgical simulator in Body Exposure.

## Required checks

Before promotion to `main`, the pull request must pass:

- frontend TypeScript validation;
- production frontend build;
- frontend regression suite;
- Body Exposure mobile smoke at 390 × 844;
- surgical simulator mobile smoke at 390 × 844;
- server TypeScript validation, build, and tests.

The mobile smoke selects each surgical scenario explicitly. Scenario ordering is product UX and is not a test contract.

## Evidence boundary

Surgical views are educational atlas correlations. They must not claim patient-specific anatomy, operative navigation coordinates, force or puncture thresholds, trocar coordinates, device settings, autonomous operative decisions, or fabricated structures. Missing geometry remains unavailable or text-only until a traceable source and review state exist.

## Shared-view contract

Surgical Source 3D, axial, coronal, sagittal, and exploded presets must drive the shared Body3D state rather than a disconnected duplicate renderer. The acceptance smoke verifies the shared `renderMode`, `slicePlane`, `slicePos`, and `unfold` behavior together with WebGL availability, bounded mobile DPR, and horizontal-overflow safety.
