# Panacea Multisystem End-to-End Atlas

This document defines the integration direction for Body Exposure and related education surfaces. It is an implementation contract, not a claim that every layer is already clinically validated or already rendered in 3D.

## Mandatory reference layer

Two user-required references must remain discoverable in the project:

- `https://github.com/thebuggeddev/anatomy` — architecture and UX reference for interactive Three.js anatomy, model loading, atlas navigation and multilingual presentation. Do not copy code or assets unless license and asset-level provenance are separately verified.
- `https://breath-atlas.thebuggeddev.chatgpt.site/` — respiratory atlas interaction and visual-storytelling reference. Do not treat it as authoritative physiology evidence.

Panacea must retain its own source registry, anatomy asset provenance, academic review gate and fail-closed publication rules.

## One continuous scale ladder

Every Body Exposure concept should be able to declare where it lives on this ladder:

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

The ladder is not a promise that every layer can be converted into literal gross 3D anatomy. Distributed receptors, molecular pathways, RNA species, hormones, neural network abstractions, cognition and aging mechanisms often require conceptual overlays, graphs, microscopy, network diagrams or time-series views instead of fabricated geometry.

## Multisystem coverage

The canonical contract includes:

- integumentary
- musculoskeletal
- cardiovascular
- respiratory
- digestive and hepatobiliary
- renal and urinary
- hematologic, immune and lymphatic
- endocrine
- central, peripheral and autonomic nervous systems
- sensory systems
- reproductive and developmental biology
- cell / organelle / molecular / genomic / RNA biology
- brain, cognition and behavior
- stem cells, regeneration and iPSC science
- aging, healthspan and longevity research

## Body Exposure integration pattern

Do not create fifteen independent heavy 3D viewers. Reuse the existing Body3D shell and add progressive layers:

### Layer A — Gross anatomy

Use verified source-node mappings and provenance-gated GLB/glTF assets. Anatomy that lacks exact geometry remains unavailable or reference-only rather than being replaced with a visually plausible substitute.

### Layer B — Tissue and histology

Open a lightweight linked panel or microscopy surface from a selected anatomical structure. Every histology image requires source identity, license, specimen/context metadata and transformation history. Do not present a generic micrograph as if it came from the selected user or selected atlas mesh.

### Layer C — Cell and organelle

Use reusable cell/organelle scenes with explicit cell-type identity. A hepatocyte, cardiomyocyte, neuron, lymphocyte and epithelial cell must not be presented as interchangeable generic cells when the educational context depends on cell identity.

### Layer D — Molecular pathway / protein / RNA / DNA

Render as bounded pathway/network views tied to the selected cell or tissue. Preserve source IDs and versions. Do not infer pathogenicity, treatment response or disease risk from a sequence or variant unless a separate validated clinical workflow supports that interpretation.

### Layer E — Neural and endocrine control

Connect organ structures to central/peripheral/autonomic pathways and endocrine axes using explicit curated mappings. Hormone or neurotransmitter diagrams must retain context, feedback direction, uncertainty and source basis.

### Layer F — Brain and cognition

Represent attention, memory, language, executive function, emotion, learning and decision-making as network-level educational domains. Do not make deterministic `single gene → thought`, `single hormone → personality`, or `single brain region → complex behavior` claims.

### Layer G — Regeneration and stem-cell science

Separate:

- embryonic/developmental biology
- adult tissue stem cells
- hematopoietic stem cells
- organoids
- induced pluripotent stem cells (iPSC)
- lineage specification
- cell-replacement therapy
- tissue engineering

Japanese iPSC history and translation are explicit evidence anchors:

- Takahashi K, Yamanaka S. Cell. 2006. PMID `16904174` — foundational defined-factor iPSC induction in experimental models.
- Jun Takahashi. Cytotherapy. 2025. PMID `39969437` — current review of iPSC-based cell replacement therapy and clinical translation, with Parkinson disease as an important example.

These sources support an educational research/translation layer. They do not establish universal stem-cell efficacy, universal organ regeneration, or permission to recommend a therapy to an individual.

### Layer H — Aging, rejuvenation and longevity

Panacea may visualize research on cellular senescence, genomic and epigenetic change, proteostasis, mitochondrial biology, stem-cell exhaustion, tissue microenvironments, organ-on-chip aging models, single-cell analysis and partial reprogramming.

A current research-frontier anchor is PMID `40509615` (2025), which reviews organ-on-chip approaches in aging/rejuvenation research and discusses senescence, single-cell methods and partial reprogramming.

The product language must stay precise:

- `longevity research` is allowed.
- `healthspan research` is allowed.
- `rejuvenation mechanism under investigation` is allowed when sourced.
- `immortality achieved`, `human age reversal proven`, `indefinite lifespan`, or equivalent claims are not allowed without extraordinary validated evidence that does not currently exist in this project.

## Interaction model

A selected structure should progressively expose only relevant deeper layers:

`Body → structure → tissue → cell → organelle/pathway → gene/RNA/protein → neural/endocrine control → function → cognition/behavior where relevant → regeneration/aging research`

Examples:

- Heart → myocardium → cardiomyocyte → mitochondria → energy pathways → ion-channel/protein layer → autonomic/endocrine modulation.
- Lung → alveolar region → epithelial/endothelial layers → gas-exchange concept → respiratory neural control → Breath Atlas-inspired motion storytelling, with physiology claims sourced separately.
- Brain → cortical/subcortical structure → neuron/glia → synapse → circuit → network-level cognitive function; never a simplistic molecule-to-thought chain.
- Bone marrow → hematopoietic niche → stem/progenitor lineage → RNA/protein regulatory layer → immune/hematologic system connection.

## Performance contract

- Load gross anatomy first.
- Lazy-load microscopy, cell scenes, pathways and high-detail assets.
- Never require every system or scale to be resident in memory simultaneously.
- Bound node counts and result lists.
- Cancel stale async work when selection changes.
- Preserve mobile 390×844 interaction smoke and rendered WebGL artifact gates.
- Prefer shared viewers and reusable overlays over duplicate routes.

## Academic and provenance contract

Each material claim or visual layer must declare one of:

- verified / source-checked
- human-reviewed with reviewer identity, credentials, date and scope
- reference-only
- research-frontier
- simulated
- unsupported / blocked

No AI-assisted transformation may be described as academically reviewed unless qualified human review is actually recorded.

The `src/lib/multisystemKnowledgeGraph.ts` contract and `scripts/uji/multisystem-knowledge-graph.mts` regression guard enforce the first structural version of this architecture.
