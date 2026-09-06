# Panacea Body Exposure — HRA source contract

Body Exposure keeps source anatomy, evidence, and simulation as separate layers.

## Source anatomy

- Browser-loadable reference geometry: HuBMAP Human Reference Atlas `ccf-releases` v1.2 GLB catalog.
- Structure identity: v1.2 `ASCT-B_3D_Models_Mapping.csv`.
- Newer mapping metadata: v2.0 `asct-b-3d-models-crosswalk.csv`.
- The v2.0 crosswalk is used as an evidence/ontology overlay; Panacea does not pretend an archived or unavailable v2 model is directly browser-loadable.

## Evidence bridge

`src/lib/hraRepository.ts` exposes both the live v1.2 model index and v2.0 crosswalk search. `src/components/digital-twin/HraContextBridge.tsx` resolves anatomy terms against both releases and shows the originating release, ontology identifier, and source model/crosswalk.

## Simulation boundary

Exercise, Surgery, Practice, What-if, and Research show HRA reference anatomy first. Their model/simulation layers remain collapsed and explicitly separate from HRA source geometry. The HRA context bridge appears before those simulations so a generated scene is never presented as the authoritative anatomical source.
