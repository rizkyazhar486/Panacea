# Cinematic render handoff

Branch: `codex/cinematic-render-qa`, based on `e7792290`.

## Ownership and integration

Only the new `pipeline/render_cinematic.py`, this handoff and its QA evidence are owned
by this change. Claude's viewer, physiology, CT segmentation, provenance and ontology
work remain in their existing worktrees. Cherry-pick the commit after reviewing it;
no shared working-tree files need replacement. No merge or push is performed here.

## Run

```sh
/Applications/Blender.app/Contents/MacOS/Blender -b /absolute/path/to/PANACEA_HUMAN_MASTER_v011.blend \
  -P bodyexposure/pipeline/render_cinematic.py -- \
  --profile preview --bench layered --device CPU --compare \
  --out bodyexposure/qa_reports/cinematic-preview --scale 50 --samples 8
```

Profiles: preview 960×540 / 32 samples, desktop 1920×1080 / 128,
cinematic 7680×4320 / 512. These are **offline Cycles profiles**, not browser FPS
or real-time resolution promises. `--scale` and `--samples` permit progressive quality
iterations. `--device METAL|CUDA|OPTIX|HIP|ONEAPI` requires a detected device;
unsupported devices fail explicitly. CPU is the portable default.

`--hdri /absolute/path/environment.exr` optionally links an existing licensed HDR
environment into a temporary world copy. Record its licence before distributing
resulting renders. No HDR or proprietary game assets are bundled.

The wrapper reuses existing benchmark anatomical staging and materials, enabling
adaptive sampling and denoising. Comparison captures disable these two settings for
the before image at identical resolution, seed, camera and sample limit. This is a
controlled render-settings comparison, not a claim that source anatomy improved.
The source `.blend` is read and never saved. Existing accuracy/review status remains
unchanged; no new clinical validation is claimed. Refer to `PROVENANCE.md` for source
attribution and share-alike obligations.

## Evidence and limits

Each successful run writes 16-bit PNGs and `report.json` containing actual render
durations, dimensions, device selection, hashes and a visible-mesh inventory.
UV/material absence is a diagnostic, not a pass/fail anatomical assessment.
The preview test deliberately uses 8 samples and 480×270 to bound local resource
use. Full 8K quality, animation deformation, browser/mobile FPS and memory peaks
require separate measured runs before production acceptance.

For a smaller compatibility test, use the existing `body_v001_skeleton_cleaned.blend`
with `--bench body-qa`. This reuses `render_body_file.py` for anterior and lateral
staging and adjusts its portrait framing for widescreen output. Tested evidence
is in `qa_reports/cinematic-skeleton/`. Initial v011/v005 runs were stopped before
controlled captures; an operator interception bug left legacy render settings
active. The corrected wrapper passed on v011. Those interrupted runs do not
establish hardware capability limits.

The v011 master adds linked body display instances. The legacy benchmark's mesh
visibility loop leaves these visible around its selected subject. The wrapper
suppresses collection instances in the legacy benchmark views, retaining the
direct male/female meshes those views explicitly stage. The report names every
suppressed instance. Source collections are unchanged. `body-qa` does not perform
this suppression. `qa_reports/cinematic-master/` preserves the diagnostic capture
showing the staging defect; `qa_reports/cinematic-isolated-master/` records the fix.

`--time-limit 30` bounds Cycles sampling per frame; it does not bound asset loading,
scene synchronization, denoising or image encoding. Invalid `--scale 0` was tested
in Blender and rejected with exit code 2 before output creation.
Unsupported `--device CUDA` was tested on this Metal-only Blender installation
and returned exit code 1, with no render; GPU fallbacks are never reported as GPU
successes. Blender 5.2.2 emits an upstream `World.use_nodes` deprecation warning.

Skeleton audit: 277 visible meshes, 701,812 source polygons; 229 lack UVs and six
lack materials. Review metadata is unspecified on this early cleaned asset.
The v011 layered audit: 3,003 visible meshes, 9,284,861 source polygons, zero missing
materials; all carry `review_required`. Polygon totals are source inventory,
not evaluated render triangle counts. At 480×270 / eight samples the diagnostic
v011 comparison took 16.358 s before and 25.668 s after; denoising reduces visible
noise but adds cost at this resolution. See the isolated run's JSON for final
timings. No claim of photorealism or AAA production acceptance is made.

Render timings include synchronization/encoding and sequential cache effects;
they are not controlled performance benchmarks. The isolated v011 eight-sample
captures took 6.324 s before and 4.953 s after, with all 12 display instances hidden.
Initial operator-bug captures were moved out of the worktree to
`/tmp/panacea-cinematic-diagnostics.hCMYM4/legacy-operator-captures` for diagnosis;
no assets were deleted.

The default 960×540 / 32-sample v011 preview completed in 29.139 s on CPU, recorded
in `qa_reports/cinematic-readable-preview/`. Actual pixel dimensions, 16-bit PNG
depth and SHA-256 hashes were independently checked for all nine committed images.
Anterior/lateral skeleton and layered master frames were visually inspected.
No frontend files changed, so frontend build/browser tests were not run for this
pipeline-only increment. HDR lighting and GPU success paths remain untested.
