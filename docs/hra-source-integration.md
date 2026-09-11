# HRA source integration

Panacea Body Exposure uses the public HuBMAP Human Reference Atlas (HRA) release as source anatomy instead of generating replacement organ geometry.

## Runtime sources

- GLB catalog: `GET https://api.github.com/repos/hubmapconsortium/ccf-releases/contents/v1.2/models`
- GLB payloads: `https://raw.githubusercontent.com/hubmapconsortium/ccf-releases/main/v1.2/models/<file>.glb`
- ASCT+B → 3D mapping: `https://raw.githubusercontent.com/hubmapconsortium/ccf-releases/main/v1.2/models/ASCT-B_3D_Models_Mapping.csv`
- Human Reference Atlas library: `https://humanatlas.io/3d-reference-library`

## Panacea behavior

`src/lib/hraRepository.ts` discovers available `.glb` files from the GitHub Contents API, downloads and parses the published mapping CSV, resolves mapped anatomical structures to verified files, and exposes searchable structure records with ontology IDs and source URLs.

`src/components/digital-twin/HraClinicalAtlas.tsx` loads the original GLB materials with Three.js, supports male/female HRA references, region presets, model isolation/layering, source-file inspection, raycast structure selection, and live structure search. The viewer keeps the source GLB filename, GitHub SHA metadata, mapping identity and ontology URL visible where available.

Reference presets currently include whole body, thorax, abdomen, brain/spinal cord, left/right knee, eyes, pelvis/genitourinary anatomy and immune anatomy. Additional HRA files discovered by the repository API remain searchable through the same index without requiring a new hard-coded renderer.

## Truth boundary

HRA geometry is reference anatomy. It is not a patient scan, segmentation, diagnosis, predicted treatment response, or measured physiology. Panacea simulation layers must remain visually and semantically separate from HRA source anatomy.
