# Body Exposure — canonical anatomical master

Blender source-of-truth for Panacea Body Exposure geometry, plus the scripts that build,
validate, render and describe it. Educational use only; not a clinical tool and not
patient-specific anatomy.

## What is here

| Path | Contents |
|---|---|
| `pipeline/` | Reproducible Blender scripts (run through Blender MCP or `Blender -b`) |
| `manifest/` | Semantic metadata layer exported from the master (JSON) |
| `renders/` | 4K benchmark frames rendered from the master |
| `web/glb/` | Web derivatives: one meshopt-compressed GLB per body × system × LOD |
| `web/viewer.html` | Standalone three.js viewer that verifies the web GLBs (decode, picking, provenance) |
| `PROVENANCE.md` | Sources, licences and what was changed |
| `DELTA.md` | Current implementation vs. the Body Exposure master directive |
| `QA.md` | Validation performed, with numbers, and known defects |
| `*.blend`, `sources/` | **Not in git** (260 MB+, over GitHub's file limit). Rebuild with the pipeline, or ask for the file. |

## Canonical frame

All bodies share one axis convention: **+Z superior, +X subject left, −Y anterior, metres,
feet at z = 0.** Each body lives under its own root collection (`HUMAN.ADULT.MALE`,
`HUMAN.ADULT.FEMALE`, …). The female is displayed 1.2 m to the subject's left through the
`HUMAN.ADULT.FEMALE.ROOT` empty; that offset is display-only and recorded on the empty, so the
body's own coordinates are untouched.

## Naming

`ADULT.MALE.<SYSTEM>.<STRUCTURE>[.L|.R]`, `ADULT.FEMALE.<SYSTEM>.<STRUCTURE>[.L|.R]`.
`.L`/`.R` mean subject left/right and are only used for paired structures. Unpaired organs
(heart, liver, aorta…) carry no side suffix; their actual position is stored in
`panacea_position_side`. Every mesh carries `panacea_*` custom properties (source, licence,
raw source name, accuracy status, review status, version) that survive glTF export as `extras`.

## Rebuild order

1. Import `public/anatomy/*.glb` (Z-Anatomy) and the HuBMAP `VH_F_United.glb` (see PROVENANCE).
2. Normalise transforms, merge duplicate vertices, route into system collections, assign
   semantic IDs and metadata (steps recorded in `PROVENANCE.md`).
3. `pipeline/build_intervertebral_discs.py` — reconstruct the 23 discs.
4. `pipeline/export_manifest.py` — write `manifest/`.
5. `pipeline/build_pericardium.py` — reconstruct the pericardial sac and correct heart–lung contact.
6. `pipeline/render_benchmarks.py --bench layered|lineup|female_layered|cutaway|exploded`.
7. `pipeline/export_web_lods.py` → `web/raw/`, then `pipeline/pack_web.py` → `web/glb/`.

## Web assets

| LOD | Triangle target vs master | Minimum per structure | Intended use |
|---|---|---|---|
| LOD0 | 50 % | 400 | desktop close-up |
| LOD1 | 25 % | 200 | desktop default |
| LOD2 | 10 % | 120 | tablet / phone |
| LOD3 | 4 % | 60 | phone overview |

The per-structure floor keeps small structures (ossicles, valves, cranial nerves) from
collapsing. Geometric error against the master is measured per file and written to
`web/lod_report.json`. Files use `EXT_meshopt_compression`, matching the `MeshoptDecoder`
already used in `Body3D.tsx`.

**Integration note:** three.js `GLTFLoader` strips `.` from node names
(`ADULT.MALE.SKELETAL.FEMUR.L` arrives as `ADULTMALESKELETALFEMURL`). Identify structures by
`object.userData.panacea_structure_id` (from glTF `extras`), not `object.name`. gltfpack
also moves each mesh into an unnamed child, so walk up `parent` from a raycast hit to the
first object that has `userData.panacea_structure_id`, as `web/viewer.html` does.

## Accuracy vocabulary

`source_backed` · `reconstructed` · `approximate` · `schematic` · `placeholder` ·
`review_required`. Nothing in this master is labelled validated.
