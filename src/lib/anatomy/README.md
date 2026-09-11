# Panacea Whole-Body Atlas kernel

This directory contains the high-complexity data/graph kernel for the educational 3D anatomy atlas.

Principles:

- anatomy identity is resolved against named nodes that actually exist in the shipped/indexed GLB bundles;
- source revisions and licenses are explicit and immutable;
- generic search remains specificity-first and fail-closed;
- composite structures use an explicit composite resolver rather than broadening generic lookup;
- graphics LOD/render priority is an educational scheduling heuristic, never a diagnosis or patient-specific probability;
- patient-specific localization is outside this kernel and must pass the separate evidence/provenance gates;
- academic review status is represented explicitly; engineering implementation must not masquerade as anatomical review.

The kernel is intentionally renderer-agnostic so Three.js, cross-sectional imaging, surgical simulation, and future histology/cellular views can share the same anatomical identity graph without duplicating semantics.
