# Panacea Multisystem End-to-End Atlas

This is an implementation contract, not a claim that every layer is already clinically validated or already rendered in 3D.

## Mandatory references

- `https://github.com/thebuggeddev/anatomy` — architecture and UX reference for interactive Three.js anatomy, model loading, atlas navigation and multilingual presentation. Do not copy code or assets unless license and asset-level provenance are separately verified.
- `https://breath-atlas.thebuggeddev.chatgpt.site/` — respiratory atlas interaction and visual-storytelling reference. Do not treat it as authoritative physiology evidence.

## Continuous scale ladder

Every Body Exposure concept should declare where it lives: whole body, system, organ, tissue, cell, organelle, molecular pathway, protein, RNA, DNA/epigenome, neural circuit, endocrine signal, cognition/behavior, development/regeneration, or aging/longevity research.

The ladder is not a promise that every layer can be converted into literal gross 3D anatomy. Distributed receptors, molecular pathways, RNA species, hormones, neural-network abstractions, cognition and aging mechanisms often require conceptual overlays, graphs, microscopy, network diagrams or time-series views instead of fabricated geometry.

## Shared Body Exposure integration

Do not create independent heavy 3D viewers. Reuse the existing Body3D shell and progressively expose relevant layers. Gross anatomy requires verified source-node mappings and provenance-gated GLB/glTF. Tissue/histology uses lightweight linked microscopy; cell/organelle uses reusable cell scenes with explicit cell identity; pathway/protein/RNA/DNA uses bounded network views tied to selected tissue/cell. Neural/endocrine and cognition remain curated educational network models with uncertainty. Regeneration and longevity remain indication-specific or research-frontier as appropriate.

## Evidence anchors and boundaries

- PMID `16904174` — Takahashi & Yamanaka 2006 iPSC induction: source-checked foundational experimental evidence, not universal clinical regeneration.
- PMID `39969437` — Jun Takahashi 2025 iPSC cell-replacement review: source-checked translational evidence; readiness and efficacy remain indication-specific.
- PMID `40509615` — 2025 aging-on-chip/rejuvenation review: research-frontier only; not proof of immortality or validated human age reversal.

Never promote gene/RNA to deterministic thought, hormone to deterministic personality, atlas geometry to patient-specific anatomy, research-frontier work to validated therapy, or longevity research to immortality.

## Performance and Academic Accuracy Gate

Load gross anatomy first; lazy-load microscopy, cell scenes, pathways, and high-detail assets. Bound node counts and result lists, cancel stale async work, preserve mobile QA, and prefer shared viewers/overlays over duplicate routes. High-risk clinical or procedure features must remain behind the Academic Accuracy Gate and qualified human review. AI-assisted transformation is never equivalent to qualified human academic review.

The structural contract is implemented in `src/lib/multisystemKnowledgeGraph.ts` with deterministic guards in `scripts/uji/multisystem-knowledge-graph.mts` and `scripts/uji/multisystem-evidence-boundary.mts`.
