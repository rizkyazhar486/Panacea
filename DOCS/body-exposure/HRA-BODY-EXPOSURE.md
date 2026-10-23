# Panacea Body Exposure — HRA source contract

Body Exposure keeps source anatomy, measured data, derived calculations, educational context and simulations as separate layers.

## Source anatomy

- Browser-loadable reference geometry: HuBMAP Human Reference Atlas `ccf-releases` v1.2 GLB catalog.
- Additional browser-loadable geometry discovery: HRA v1.4 model catalog through the GitHub Contents API.
- Structure identity: v1.2 `ASCT-B_3D_Models_Mapping.csv` plus v1.4 `asct-b-3d-models-crosswalk.csv`.
- Newer mapping metadata: v2.0 `asct-b-3d-models-crosswalk.csv`.
- Panacea prefers an actual browser-loadable GLB when one is available and labels metadata-only mappings separately. It does not pretend an archived or unavailable model is directly renderable.

## Multi-release resolver

`src/lib/hraResolver.ts` combines the existing v1.2/v2 evidence index with the v1.4 GitHub model catalog and crosswalk. Resolution ranks exact anatomical matches, prefers renderable geometry, preserves ontology identifiers, and exposes source URLs. `HraContextBridge` shows the HRA release and whether each result is `3D available` or `mapping only`.

## Source-resolved GLB viewer

`HraResolvedAnatomyViewer` resolves context terms through the multi-release HRA engine, selects only records with a real browser-loadable upstream GLB, and renders that source geometry with neutral lighting, orbit controls and automatic camera fit. Source GLBs are static: no auto-spin, pulse, bounce, hypothesis deformation or fabricated tissue response. The inspector exposes HRA release, ontology ID, model file, file size and GitHub SHA.

## Anatomy search

`HraSourceSearch` gives the Anatomy page an explicit multi-release structure search. A user can search labels or ontology IDs and see the source release, ontology identity, model name and whether an actual browser-loadable GLB exists.

## Physiology source boundary

`PhysiologyHraWorkbench` replaces the previous animated-body physiology viewport in Body Exposure. The selected cardiovascular, respiratory, neuromuscular, gastrointestinal, renal or thermoregulation system resolves its own HRA source anatomy. The GLB never changes with heart rate, respiratory rate, blood pressure, exercise state or teaching phase.

Physiology is shown beside the fixed source model using explicit provenance labels:

- `measured`: connected source value actually exists;
- `derived`: calculated from displayed inputs with an explicit formula;
- `educational`: reference physiology or teaching context;
- `unavailable`: Panacea does not fabricate a value.

The formulas remain defined in `src/lib/bodyPhysiology.ts`, including `MAP ≈ DBP + (SBP − DBP) / 3`, `PP = SBP − DBP`, `CO = HR × SV`, `V̇E = RR × VT`, `V̇A = RR × (VT − VD)`, `τ = r × F`, `P = F · v`, `FF = GFR / RPF`, `Cx = (Ux × V) / Px`, and the heat-balance relation `S = M − W ± R ± C ± K − E`. A numerical result is not produced when required inputs are unavailable.

## Cell and DNA evidence-first rule

Body → Cell and Cell → DNA no longer require the generated cell/chromatin/DNA renderer in Body Exposure. The primary experience is now:

1. Human Protein Atlas metadata and source microscopy links where the browser source exposes them;
2. Ensembl gene identity, coordinates and reference genomic sequence;
3. local sequence-file evidence through `SequenceEvidenceWorkbench`.

`SequenceEvidenceWorkbench` reads uncompressed FASTA, FASTQ and VCF files in the browser. The component does not upload the selected file. FASTQ produced after Oxford Nanopore basecalling can be inspected, but Panacea does not claim to perform Nanopore basecalling in this module.

`src/lib/sequenceEvidence.ts` keeps the summary calculations explicit:

- FASTQ Phred decoding: `Q = ASCII − 33`;
- Q20/Q30: `bases with Q ≥ threshold / quality-coded bases × 100%`;
- GC percentage: `(G + C) / (A + C + G + T) × 100%`, with ambiguous bases reported separately;
- N50: after sorting reads/sequences longest to shortest, the length at which cumulative bases reach at least 50% of analyzed bases;
- VCF Ti/Tv: `transition SNP alleles / transversion SNP alleles`.

The parser reports file provenance, format, byte coverage and SHA-256 of analyzed bytes. Files above 32 MB are explicitly labelled as sampled because only the first 32 MB are analyzed in the browser preview. The workbench does not perform variant calling, pathogenicity assignment, diagnosis or patient attribution.

## Workout-specific anatomy and data replay

`WorkoutHraWorkbench` reads an imported workout instead of fabricating activity. The recorded workout name is classified only to choose HRA anatomy queries; recorded duration, distance, heart rate and recovery remain measured workout fields. The workbench loads a resolved upstream HRA GLB when available.

`WorkoutSignalReplay` replaces the old Body3D replay in Body Exposure. Its playhead changes data cards and the recorded heart-rate trace only. The source GLB never pulses or deforms. Signals from `src/lib/workout4d.ts` retain their `measured`, `derived` or `educational` provenance.

## Operation-specific surgery anatomy and timeline

`getSurgicalHraTerms()` derives source queries from each surgical procedure and phase using focus anatomy, structures at risk, and the operative region. `SurgicalHraWorkbench` lets the learner choose an operation and phase, inspect the source terms, and load resolved HRA GLB geometry.

`SurgicalProcedureTimeline` replaces the old Body3D procedural viewport in Body Exposure. It presents phase objectives, orientation narrative, anatomy focus, structures at risk, checkpoints, instrument families, complications and patient-specific source-data gates without pretending those text records are anatomy or patient-specific surgical guidance.

## Surgical rehearsal boundary

`CinematicSurgicalRehearsal` no longer creates a second Body3D orientation viewport. The HRA workbench above is the anatomy source. Rehearsal is limited to active recall, risk-map review, operation comparison and local curriculum coverage through `SurgicalRehearsalLab`.

## What-if source boundary

`CounterfactualHraWorkbench` binds the selected scenario and perturbation to HRA source terms, displays a real resolved HRA GLB when available, and keeps the executable causal graph numerical. Only the causal states change with the perturbation. Source anatomy is not stretched, recolored, pulsed or deformed to imply biological response. Falsification measurements and evidence anchors remain visible alongside the model.

## Regeneration source boundary

`RegenerationHraWorkbench` resolves the selected organ against HRA and displays fixed upstream geometry first. Aging hallmarks, research hypotheses, evidence tiers, safety gates and normalized time-state values are modeled separately. A lower modeled burden is never labelled as measured age reversal or rejuvenation.

## Body Exposure routing boundary

The Body Exposure route no longer uses the legacy Body3D renderer as the primary visual for Physiology, Body → Cell, Cell → DNA, Exercise, Surgery, Practice, What-if or Research. Physiology uses HRA source geometry plus provenance-aware functional data; Cell/DNA use HPA + Ensembl + local sequencing evidence; Exercise uses HRA plus a data replay; Surgery uses HRA plus a procedure timeline; Practice uses HRA plus active recall; What-if and Research use source-resolved HRA workbenches. Legacy renderers may still exist elsewhere in the repository for compatibility, but they are not the authoritative evidence layer for these Body Exposure modes.

Release marker: HRA-native physiology, local sequence evidence, workout data replay, surgical procedure timeline and rehearsal cleanup are included in the current production batch. Immediate Vercel release requested for the Cell/DNA evidence-native update.
