# Panacea Multisystem End-to-End Atlas

This is an implementation contract, not a claim that every layer is already clinically validated or already rendered in 3D.

## Mandatory references

- `https://github.com/thebuggeddev/anatomy` — architecture and UX reference for interactive Three.js anatomy, model loading, atlas navigation and multilingual presentation. Do not copy code or assets unless license and asset-level provenance are separately verified.
- `https://breath-atlas.thebuggeddev.chatgpt.site/` — respiratory atlas interaction and visual-storytelling reference. Do not treat it as authoritative physiology evidence.

## Continuous scale ladder

Every Body Exposure concept should declare where it lives:

1. whole body
2. body system
3. organ
4. tissue
5. cell
6. organelle
7. molecular pathway
8. protein
9. RNA
10. DNA / epigenome
11. neural circuit
12. endocrine signal
13. cognition / behavior
14. development / regeneration
15. aging / longevity research

The ladder is not a promise that every layer can be converted into literal gross 3D anatomy. Distributed receptors, molecular pathways, RNA species, hormones, neural-network abstractions, cognition and aging mechanisms often require conceptual overlays, graphs, microscopy, network diagrams or time-series views instead of fabricated geometry.

## Multisystem coverage

Canonical domains include integumentary, musculoskeletal, cardiovascular, respiratory, digestive/hepatobiliary, renal/urinary, hematologic/immune/lymphatic, endocrine, central/peripheral/autonomic nervous system, sensory, reproductive/developmental, cell/molecular/genomics/RNA, brain/cognition, stem-cell/regeneration, and aging/longevity research.

## Shared Body Exposure integration

Do not create fifteen independent heavy 3D viewers. Reuse the existing Body3D shell and progressively expose relevant layers.

- **Gross anatomy:** verified source-node mappings and provenance-gated GLB/glTF only. Missing geometry stays unavailable/reference-only.
- **Tissue/histology:** linked lightweight microscopy surface with specimen/context/license/transformation provenance.
- **Cell/organelle:** reusable cell scenes with explicit cell-type identity; do not use one generic cell when identity matters.
- **Pathway/protein/RNA/DNA:** bounded network views tied to selected tissue/cell; reference sequence data is not automatically diagnostic or therapeutic interpretation.
- **Neural/endocrine:** explicit curated pathways and feedback networks with source basis and uncertainty.
- **Brain/cognition:** attention, memory, language, executive function, emotion, learning and decision-making remain network-level educational domains; no deterministic single gene→thought, hormone→personality, or single region→complex behavior claim.
- **Regeneration/stem cells:** separate adult stem cells, hematopoietic stem cells, organoids, iPSC, lineage specification, cell replacement and tissue engineering.
- **Aging/longevity:** visualize aging mechanisms and research-frontier rejuvenation concepts without promoting them to proven human age reversal or immortality.

## Japanese stem-cell anchors

- Takahashi K, Yamanaka S. Cell. 2006. PMID `16904174`: foundational defined-factor iPSC induction in experimental models.
- Jun Takahashi. Cytotherapy. 2025. PMID `39969437`: current review of iPSC-based cell replacement therapy and clinical translation, with Parkinson disease as an important example.

These are educational/translational evidence anchors, not proof of universal stem-cell efficacy or universal organ regeneration.

## Longevity boundary

PMID `40509615` (2025) reviews organ-on-chip aging/rejuvenation research and discusses senescence, single-cell approaches and partial reprogramming. Panacea may describe these as aging/longevity or rejuvenation research when sourced.

Allowed language includes `longevity research`, `healthspan research`, and `rejuvenation mechanism under investigation` when properly sourced. Disallowed promotion includes `immortality achieved`, `human age reversal proven`, `indefinite lifespan`, or equivalent claims without extraordinary validated evidence.

## Example traversal

- Heart → myocardium → cardiomyocyte → mitochondria → energy pathways → ion-channel/protein layer → autonomic/endocrine modulation.
- Lung → alveolar region → epithelial/endothelial layers → gas-exchange concept → respiratory neural control → Breath Atlas-inspired motion storytelling with physiology claims sourced independently.
- Brain → cortical/subcortical structure → neuron/glia → synapse → circuit → network-level cognitive function.
- Bone marrow → hematopoietic niche → stem/progenitor lineage → RNA/protein regulatory layer → immune/hematologic connection.

## Performance contract

Load gross anatomy first. Lazy-load microscopy, cell scenes, pathways and high-detail assets. Bound node counts and result lists, cancel stale async work, preserve mobile 390×844 QA, and prefer shared viewers/overlays over duplicate routes.

## Academic/provenance contract

Each material claim or visual layer must be labeled as verified/source-checked, human-reviewed with reviewer metadata, reference-only, research-frontier, simulated, or unsupported/blocked. AI-assisted transformation is never equivalent to qualified human academic review.

The structural contract is implemented in `src/lib/multisystemKnowledgeGraph.ts` with deterministic guards in `scripts/uji/multisystem-knowledge-graph.mts` and `scripts/uji/multisystem-evidence-boundary.mts`.
