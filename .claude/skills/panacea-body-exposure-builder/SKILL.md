---
name: panacea-body-exposure-builder
description: Use when creating or modifying Panaceamed Body Exposure, anatomy, physiology, pathology, radiology, biomechanics, molecular depth, or surgical-education experiences.
---

# Panacea Body Exposure Builder

## Goal
Build Body Exposure as one coherent whole-body-first system that progressively reveals organ, tissue, cellular, molecular, imaging, physiology, pathology, pharmacology, and procedural context without inventing anatomy.

## Required approach
1. Start from the whole-body state and preserve spatial orientation across drill-down.
2. Reuse verified repository anatomy assets and canonical structure IDs before adding new geometry.
3. Every anatomical or biomedical assertion needs provenance and a version boundary.
4. Separate visual approximation from clinically validated anatomy; never present generic atlas geometry as patient-specific truth.
5. Preserve layer toggles, localization, camera continuity, performance budgets, accessibility, and mobile interaction.
6. Prefer progressive disclosure over adding more permanent panels.
7. Keep the main viewport visual-first; interpretation belongs in contextual actions/drawers.

## Depth model
Whole body → system → organ → region/layer → tissue → cell/organelle → molecule/pathway.

Each transition should preserve a canonical parent-child relationship so the user can move both deeper and back outward without losing context.

## Acceptance
Verify at minimum:
- anatomical IDs and labels resolve consistently;
- provenance is visible/retrievable;
- no unsupported patient-specific inference;
- mobile 390x844 remains usable;
- WebGL/render smoke stays intact;
- performance degradation is measured, not guessed.