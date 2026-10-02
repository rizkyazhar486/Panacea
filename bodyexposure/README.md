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
5. `pipeline/render_benchmarks.py --bench layered|lineup|female_layered|cutaway|exploded`.

## Accuracy vocabulary

`source_backed` · `reconstructed` · `approximate` · `schematic` · `placeholder` ·
`review_required`. Nothing in this master is labelled validated.
