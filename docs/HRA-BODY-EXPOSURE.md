# Panacea Body Exposure — HRA source contract

Body Exposure keeps source anatomy, evidence, and simulation as separate layers.

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

## Cell and DNA evidence-first rule

Body → Cell and Cell → DNA render the Human Protein Atlas + Ensembl evidence workspace first. The generated cell/chromatin/DNA scene is collapsed under an explicit `Educational structural model` control. The model is never presented as microscopy, sequencing output or patient evidence.

## Workout-specific anatomy

`WorkoutHraWorkbench` reads an imported workout instead of fabricating activity. The recorded workout name is classified only to choose HRA anatomy queries; recorded duration, distance, heart rate and recovery remain measured workout fields. The workbench now loads a resolved upstream HRA GLB when available, while the workout replay stays in a separate collapsed educational model layer. The source GLB does not change with heart rate, pace, distance or recovery values.

## Operation-specific surgery anatomy

`getSurgicalHraTerms()` derives source queries from each surgical procedure and phase using focus anatomy, structures at risk, and the operative region. `SurgicalHraWorkbench` lets the learner choose an operation and phase, inspect the generated source terms, and load resolved HRA GLB geometry before the procedural simulation is opened. The same source-first workbench is used before surgical rehearsal. Generic whole-body HRA is no longer repeated above these focused modes because the workbench already provides source-resolved anatomy.

## What-if source boundary

`CounterfactualHraWorkbench` binds the selected scenario and perturbation to HRA source terms, displays a real resolved HRA GLB when available, and keeps the executable causal graph numerical. Only the causal states change with the perturbation. Source anatomy is not stretched, recolored, pulsed or deformed to imply biological response. Falsification measurements and evidence anchors remain visible alongside the model.

## Regeneration source boundary

`RegenerationHraWorkbench` resolves the selected organ against HRA and displays fixed upstream geometry first. Aging hallmarks, research hypotheses, evidence tiers, safety gates and normalized time-state values are modeled separately. A lower modeled burden is never labeled as measured age reversal or rejuvenation.

## Simulation boundary

Exercise, Surgery and Practice now use focused source-resolved HRA GLB workbenches before their optional model/simulation layers. What-if and Research use source-resolved HRA workbenches as their primary visual experience rather than the legacy `Body3D` renderer. Cell/DNA modes follow evidence-first presentation. A generated scene is never presented as the authoritative anatomical source.
