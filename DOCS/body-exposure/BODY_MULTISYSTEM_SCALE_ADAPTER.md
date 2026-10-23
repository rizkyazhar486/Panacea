# Body multisystem scale adapter

This layer connects the canonical `multisystemKnowledgeGraph` to Body Exposure without creating another renderer.

## Navigation continuum

`whole body -> system -> organ -> tissue -> cell -> organelle -> molecular pathway -> protein -> RNA -> DNA/epigenome -> neural circuit -> endocrine signal -> cognition/behavior -> development/regeneration -> aging/longevity`

The representation changes with scale instead of pretending that every biological level is valid 3D gross anatomy:

- whole body/system/organ: source-controlled spatial 3D;
- tissue: sourced microanatomy/histology reference;
- cell/organelle: cellular diagram or source-derived microscopic geometry;
- pathway/protein/RNA/DNA: molecular/network representation;
- neural/endocrine: network representation;
- cognition: distributed network teaching model;
- regeneration: lineage/timeline representation;
- aging/longevity: research map with explicit frontier status.

## Mandatory design references

The following remain mandatory reference-only benchmarks:

- https://github.com/thebuggeddev/anatomy
- https://breath-atlas.thebuggeddev.chatgpt.site/

No code, mesh, texture, prose, or medical evidence is imported from those references without separate license/provenance verification.

## Scientific evidence boundary

The adapter preserves the evidence anchors already present in the canonical graph:

- PMID 16904174: foundational Takahashi/Yamanaka iPSC evidence — source-checked;
- PMID 39969437: Jun Takahashi 2025 iPSC cell-replacement review — source-checked within its bounded translational scope;
- PMID 40509615: aging/rejuvenation review — research-frontier.

The adapter never turns atlas selection into patient-specific inference, diagnosis/treatment, measured transcriptomics, deterministic gene-to-thought or hormone-to-personality claims, or an immortality claim.

## Runtime policy

This module is lightweight data adaptation only. It does not load WebGL, GLB, histology, genomics, or network assets. UI consumers should lazy-load scale-specific visualizations only after the user asks to go deeper.
