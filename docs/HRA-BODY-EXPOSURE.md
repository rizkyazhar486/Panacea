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

## Anatomy search

`HraSourceSearch` gives the Anatomy page an explicit multi-release structure search. A user can search labels or ontology IDs and see the source release, ontology identity, model name and whether an actual browser-loadable GLB exists.

## Cell and DNA evidence-first rule

Body → Cell and Cell → DNA now render the Human Protein Atlas + Ensembl evidence workspace first. The generated cell/chromatin/DNA scene is collapsed under an explicit `Educational structural model` control. The model is never presented as microscopy, sequencing output or patient evidence.

## Workout-specific anatomy

`WorkoutHraWorkbench` reads an imported workout instead of fabricating activity. The recorded workout name is classified only to choose HRA anatomy queries; recorded duration, distance, heart rate and recovery remain measured workout fields. HRA structures are displayed as educational reference anatomy and are not described as measured muscle activation.

## Operation-specific surgery anatomy

`getSurgicalHraTerms()` derives source queries from each surgical procedure and phase using focus anatomy, structures at risk, and the operative region. `SurgicalHraWorkbench` lets the learner choose an operation and phase, inspect the generated source terms, and resolve them against HRA before the procedural simulation is opened. The same source-first workbench is used before surgical rehearsal.

## Simulation boundary

Exercise, Surgery, Practice, What-if, and Research show HRA reference anatomy first. Their model/simulation layers remain collapsed and explicitly separate from HRA source geometry. Exercise maps a real imported workout to source anatomy; Surgery and Practice map the selected operation and phase. Cell/DNA modes also follow evidence-first presentation. A generated scene is never presented as the authoritative anatomical source.
