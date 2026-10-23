# Panacea Body Exposure — 3D Asset Pipeline

Status: active architecture target  
Owner intent: simple at whole-body scale; progressively more detailed and complex only when the user zooms, selects, peels, isolates or enters a deeper biological scale.

## 1. Non-negotiable architecture

Panacea must not try to "draw anatomy with Three.js primitives" when source-backed geometry exists or is required.

The production pipeline is:

```
licensed medical 3D source
        ↓
Blender authoring / QA / packaging
        ↓
named GLB assets + provenance manifest
        ↓
Three.js runtime
        ↓
selection / hide / fade / isolate / clipping / semantic zoom / AI context
```

Three.js is the runtime renderer and interaction engine. Blender is the geometry-authoring and packaging environment. Neither may invent missing anatomy.

## 2. Current source strategy

### Primary whole-body anchor — Z-Anatomy / BodyParts3D lineage

Already shipped in `public/anatomy/`:

- `surface.glb`
- `skeletal.glb`
- `muscular.glb`
- `cardiovascular.glb`
- `nervous.glb`
- `lymphoid.glb`
- `visceral.glb`

These bundles come from the same reference-body lineage and may be assembled together. The repository attribution remains canonical in `public/anatomy/CREDITS.txt`.

Z-Anatomy license reference:
- https://github.com/Z-Anatomy/Models-of-human-anatomy
- CC BY-SA 4.0; derivatives must retain attribution/share-alike obligations.

### Female references — HuBMAP Human Reference Atlas

A full female source candidate is now pinned for acquisition:

- HRA Visible Human Female united set v1.5
- GLB: `https://cdn.humanatlas.io/digital-objects/ref-organ/united-female/v1.5/assets/3d-vh-f-united.glb`
- metadata: `https://cdn.humanatlas.io/digital-objects/ref-organ/united-female/v1.5/metadata.json`
- license: CC BY 4.0
- acquisition/audit tool: `scripts/bangun/acquire-hra-female-v1_5.mjs`

This source provides a whole-body female surface plus selected organs, including female reproductive anatomy. It is **pipeline-ready, not shipped**: skeleton/muscle coverage is partial and exact external-genital surface names still require source-node verification before Panacea may claim that coverage.

A separate adapted regional female module is already shipped in `public/atlas/obgin.glb`:
- uterus
- ovaries
- uterine tubes
- vagina
- supporting ligaments
- urinary bladder
- female bony pelvis

The shipped `obgin.glb` is a normalized standalone adaptation and must not be assumed to retain the raw HRA united-set coordinates. Neither female source may be visually "fit" into the male Z-Anatomy body; sex/reference bodies remain explicit modes.

Useful HRA interfaces:
- HRA Portal / 3D reference library: https://humanatlas.io/
- HRA API: https://apps.humanatlas.io/hra-api/
- HRA UI and API clients: https://github.com/hubmapconsortium/hra-ui
- HRA release assets: https://github.com/hubmapconsortium/ccf-releases

The HRA stack is useful for source-backed female/reference-organ expansion and ontology-linked structure identity.

### NIH 3D — supplementary source discovery

- https://3d.nih.gov/

NIH 3D is a government-sponsored biomedical 3D repository and is useful for individual structures, imaging-derived models and educational reference assets. Every candidate must be admitted asset-by-asset with its own license/provenance; NIH 3D is not assumed to be one uniform whole-body coordinate system.

### BioDigital Human — optional commercial API / benchmark

- https://developer.biodigital.com/

BioDigital exposes Viewer API / Content API / SDK workflows, but developer use requires a registered developer app and qualifying School/Business team access. Treat it as:
1. an interaction/coverage benchmark; or
2. an optional licensed integration if Panacea later acquires appropriate rights.

Do not make Panacea's core anatomy depend on an unlicensed commercial embed.

## 3. Blender pipeline

Canonical script:

```
scripts/blender/build_panacea_whole_body.py
```

Run:

```bash
blender --background \
  --python scripts/blender/build_panacea_whole_body.py -- \
  --input public/anatomy \
  --output public/anatomy-v2
```

The script must:

1. import the seven compatible full-body layer GLBs;
2. preserve each source object name;
3. write source file / layer / coordinate-space / license metadata into GLTF extras;
4. keep source geometry unchanged by default;
5. export one whole-body GLB plus a machine-readable manifest;
6. fail if a layer has no renderable mesh/triangles;
7. never merge HRA female pelvis or another coordinate space by visual approximation.

Material normalization is optional and cosmetic. It must never change structural identity.

## 4. Whole-body visual contract

Default viewport should be visually simple:

```
surface / human silhouette
+ minimal system cue
+ compact controls
```

Progressive disclosure:

```
whole body
  → system
  → region / organ
  → structure
  → tissue
  → cell
  → organelle
  → molecule/pathway
  → genome/DNA
```

At gross scale, use source-backed 3D. At tissue and below, switch representation. Do not enlarge one coarse mesh and call it histology.

Semantic zoom signal:

```
relativeZoom = D_fit / D_camera
```

This ratio is only an interaction/LOD trigger, not literal optical magnification.

## 5. Required gross-anatomy coverage

### Exterior / integument
- continuous superficial envelope where source-backed;
- face and superficial head/neck regions;
- scalp/hair/lips when source-backed;
- urogenital surface regions when source-backed;
- skin system toggle must select the actual `surface.glb` catalogue, not a nonexistent generic "skin" node.

### Eye
The whole-body source already contains ocular compartments in `nervous.glb` and extraocular muscles in `muscular.glb`.
Current source contract must resolve at minimum:
- globe / eyeball context;
- cornea;
- sclera;
- iris;
- lens;
- retina where represented;
- anterior chamber;
- vitreous body;
- optic nerve;
- extraocular muscle context.

The close-up `/atlas/mata.glb` and Eye 4D modules may provide deeper organ detail, but the eye must remain spatially discoverable from whole-body anatomy first.

### Male reproductive anatomy
Current compatible whole-body male reference should expose source-backed:
- penis / glans where represented;
- corpora cavernosa / spongiosum where represented;
- testes;
- epididymides;
- deferent ducts;
- seminal vesicles;
- prostate;
- urethral context.

### Female reproductive anatomy
The regional HRA module already provides internal pelvic structures including vagina, uterus, ovaries and uterine tubes. HRA also publishes the pinned v1.5 female united whole-body source candidate, which must be acquired and audited before runtime admission. Female anatomy remains a sex-specific/reference-specific mode; do not combine male and female reproductive anatomy in one body as though both are simultaneously normal structures of the same reference subject.

## 6. Missing-source rules

Current P0 source gaps are machine-readable in:

```
src/lib/anatomy/wholeBodyAssetContract.ts
```

Key gaps:
- female whole-body **runtime admission/completeness** (the HRA united source exists but is not yet audited/packaged/shipped);
- source-backed fascia;
- skin microanatomy below gross surface;
- female external genital surface geometry;
- finer distal neurovascular branching.

A missing source is a visible gap, not a prompt to procedurally fabricate anatomy.

## 7. Runtime interaction target

Three.js runtime should eventually support:
- orbit / pinch / wheel;
- structure picking;
- search;
- focus;
- isolate;
- fade;
- hide/show;
- select others;
- layer/system toggles;
- clipping/cross-section;
- exploded anatomy;
- selected-structure metadata;
- provenance;
- semantic zoom hand-off;
- mobile DPR budget;
- background/offscreen render suspension.

Structure state should be identified by exact source mesh name + source file + reference-space id, not by screen coordinates.

## 8. Performance contract

Never load every highest-resolution asset at application startup.

Target behavior:
- whole-body shell first;
- visible/selected systems next;
- deeper organ asset on demand;
- microscopic representation only when semantic scale crosses the relevant boundary;
- release GPU resources when views unmount;
- suspend offscreen/background rendering;
- keep phone pixel ratio bounded through the existing `body3dPixelRatio` policy.

LOD must be source-derived. Any decimation pipeline must be measured and visually/anatomically reviewed before admission. No arbitrary decimation threshold is considered medically valid by default.

## 9. Acceptance gate

An asset is admissible only when all are true:

```
Admissible =
  licensed
  ∧ provenanceRecorded
  ∧ namedSourceMeshes
  ∧ compatibleCoordinateSpace
  ∧ positiveGeometry
  ∧ runtimeReachable
  ∧ mobileLifecycleSafe
  ∧ noFabricatedAnatomy
```

For a cross-reference overlay:

```
OverlayAllowed =
  sameCoordinateSpace
  OR validatedRegistrationWithMeasuredError
```

"Looks aligned" is never a registration method.

## Ambient occlusion sidecar (derived lighting, no new anatomy)

`scripts/bake/bake-anatomy-ao.mjs` computes per-vertex ambient occlusion from the **shipped** layer GLBs and
writes `public/anatomy/ao/<layer>.ao.bin` plus `manifest.json`. It adds depth to crevices between structures
and nothing else: no geometry, colour, texture or anatomical detail is created, and the source GLBs are
never modified.

- Method: cosine-weighted hemisphere rays around each vertex normal, occluders limited to the same layer,
  radius = 2% of layer height, distance-weighted, floor 0.4 so crevices never turn black. Deterministic
  (Hammersley samples rotated by a hash of the vertex *position*; no `Math.random`/`Date.now`).
- Binding: the manifest records the SHA-256 of each source GLB, the sidecar hash, and every mesh's name,
  vertex count and offset. The gate `scripts/uji/baked-ao.mts` fails when a GLB changes without a re-bake.
- Runtime (`applyBakedAoToLayer`): applied only if **every** mesh of the layer matches (all-or-nothing, because
  layer materials are shared and a mesh without a colour attribute would render black). Any failure means
  the layer renders without AO; it never blocks rendering.
- Re-bake: `node scripts/bake/bake-anatomy-ao.mjs --baked-on YYYY-MM-DD` (about 12 minutes single-threaded;
  muscular alone is ~1.2M vertices). Output is only used in anatomy mode; CT/MRI/X-ray materials ignore it.
- Limits: per-vertex AO is as fine as the mesh; it is not a normal map and does not add surface detail.

## Asset manifest and audit (geometry, scale, budget, honest provenance)

`node scripts/bake/audit-anatomy-assets.mjs --write` writes `data/anatomy-assets/manifest.json`: for every shipped layer GLB it
records size, SHA-256, mesh/vertex/triangle/material counts, glTF extensions and world bounds in metres, plus a deliberately
conservative provenance statement (`accuracyStatus: source-backed-unreviewed`, `validated: false`, `revisionPinned: false`,
`educationalOnly: true`, and the upstream asset-level licence exceptions from `data/source-registry/anatomy/z-anatomy.json`).
It is deterministic (no clock, no randomness) and is the repository-side counterpart of a Blender scene audit.

The gate `scripts/uji/anatomy-asset-manifest.mts` recomputes the audit and fails when a GLB changes without a refreshed manifest, when
scale stops being plausible adult metres, when any layer is claimed validated/reviewed without evidence, or when `CREDITS.txt`
starts pinning a revision (the manifest must then be updated).

Measured budget on 2026-10-02 (all layers enabled would be 9.94M triangles, 32.2 MB): surface 0.14M, skeletal 0.70M, muscular 2.00M,
cardiovascular 3.84M (12 MB), nervous 2.41M, visceral 0.71M, lymphoid 0.13M. Runtime FPS on devices is **not** measured here.

## Blender mesh audit (headless, descriptive)

`scripts/blender/run_mesh_audit.sh` measures the shipped layers with Blender's own importer and mesh library (`bpy` as a Python module,
no GUI): non-manifold edges, boundary edges, loose vertices, zero-area faces, meshes without faces and duplicate object names, written to
`data/anatomy-assets/mesh-quality.json`. Blender's glTF importer cannot read `EXT_meshopt_compression`, so layers are decompressed into a
temp directory first (sources are untouched). The report records the Blender version and each source GLB's SHA-256.

It is a **measurement, not a verdict**: surface atlas meshes are largely open shells, so boundary edges are expected. Findings on
2026-10-02 (Blender 4.5.14): 321 non-manifold edges and 14,394 zero-area faces across 9.94M faces, of which 13,126 zero-area faces are
in the nervous layer. Vertex counts match the Three.js audit exactly; face counts differ by at most 12 (Blender drops degenerate
faces on import). The gate `scripts/uji/anatomy-mesh-quality.mts` keeps the report bound to the shipped GLBs and cross-checks the two tools.
