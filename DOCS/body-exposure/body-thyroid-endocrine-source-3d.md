# Thyroid / parathyroid source-backed 3D acceptance

This lane accepts only the already shipped `atlas/tiroid.glb` path exposed through Body Explorer → Specialty labs → Endocrine → Thyroid & parathyroid.

Render eligibility is fail-closed:

`ThyroidRenderEligible = ReachableModule ∧ ExactShippedStructures ∧ PositiveIndexedTriangles ∧ ZAnatomySourceIdentity ∧ MobileWebGLLifecycle`

The acceptance test verifies source metadata and runtime wiring; it does not create anatomy. Missing structures, imaging, academic review, patient-specific anatomy, measurements, diagnosis or treatment inference are not synthesized or inferred.
