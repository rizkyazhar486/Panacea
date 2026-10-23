# Rebuild the fetal MRI source comparison

The existing numeric-region inspector and MRI PNG package share one pinned KCL
source grid. This offline companion places three native MRI planes in the original
nine-region QA Blender frame. All nine surface geometry fingerprints must remain
unchanged. Materials and lights are for display; the planes are tagged
`anatomy_surface=false`. Numeric identities remain unresolved and clinical review
remains pending.

Use the original `fetal_parcels_QA.blend` from the local extraction output or human
trial bundle. Its SHA256 is
`f3baa221c9fa8c528f730a67c0993886f86fb215644b95c29a0b2e1f9da2e0da`.
The builder accepts the exact published [MRI package](FETAL_MRI_CONTEXT.md), checks
its manifest/PNG hashes, uses a fresh output directory, packs the PNGs and saves a
new scene. Source files and the user's open Blender project are preserved.

```sh
BLENDER=/Applications/Blender.app/Contents/MacOS/Blender
QA_BLEND=/absolute/path/to/fetal_parcels_QA.blend
SCENE_OUT=/absolute/path/to/new-scene-output
RENDER_OUT=/absolute/path/to/new-render-output

"$BLENDER" --factory-startup --background --disable-autoexec --python-exit-code 1 \
  --python bodyexposure/pipeline/build_fetal_mri_scene.py -- \
  --source-blend "$QA_BLEND" \
  --package public/bodyexposure/dataset-inspection/fetal-parcels/mri \
  --label 1 --out "$SCENE_OUT"

"$BLENDER" --factory-startup --background "$SCENE_OUT/fetal-source-mri-context.blend" \
  --disable-autoexec --python-exit-code 1 \
  --python bodyexposure/pipeline/render_fetal_mri_scene.py -- \
  --device METAL --profile preview --out "$RENDER_OUT"
```

Planes span pixel-cell edges, half a voxel outside the first/last pixel centres.
UV axes follow increasing native indices; the PNG's top row corresponds to the
highest second-axis index. The actual MRI affine, including its slight obliquity,
maps RAS millimetres into source Blender metres as `[-R,-A,S]/1000`, retaining
the source origin. Textures use nearest sampling. There is no resampling,
surface smoothing, fragment removal or inferred anatomical relabelling.

The renderer reuses the existing cinematic quality profiles:

| Profile | Pixels | Sample ceiling |
|---|---:|---:|
| preview | 960 × 540 | 32 |
| desktop | 1920 × 1080 | 128 |
| atlas | 3840 × 2160 | 256 |
| cinematic | 7680 × 4320 | 512 |

Adaptive sampling may finish below the ceiling; sampling has no time limit.
GPU backend selection is explicit: METAL, OPTIX, CUDA, HIP or ONEAPI. A missing
requested GPU raises an error before claiming the output. CPU rendering requires
`--device CPU`. The capture never saves the loaded scene. Reports record input
and output hashes, actual backend/devices, elapsed time and process high-water
RSS; RSS is not GPU allocation.

The repository pipeline completed a 960 × 540, 16-bit RGB Metal preview on Apple
M4 in 12.306 seconds with all source fingerprints preserved. The
[recorded trial](../../bodyexposure/qa_reports/fetal_mri_source_scene.json) contains
the actual capture settings, devices and geometry fingerprints. Five portable
registration/source-pin tests and nine existing artifact-ownership tests passed;
real Blender trials rejected an existing scene output and unavailable CUDA with
nonzero exit codes and no overwrite or CPU substitution.
Existing fetal-atlas 8K captures already demonstrate
the offline Metal path; they are different scenes. An 8K output from native MRI
display planes does not add resolution or anatomical detail to the source data.
Run one GPU capture at a time and use a preview before a larger profile.

The source-preserving scene is an offline dataset comparison. It does not publish
the display quads as anatomical GLBs or alter canonical named anatomy.
