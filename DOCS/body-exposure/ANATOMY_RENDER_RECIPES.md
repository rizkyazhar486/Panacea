# Anatomy render recipes

Use the existing anatomical BLEND sources without modifying or saving them. Output directories must be new: the renderer reserves each run exclusively and never replaces an earlier trial. Reports retain the source BLEND, renderer, staging script and optional HDRI SHA-256 hashes; altered inputs stop the run. Keep full-resolution images outside the initial web payload.

| Profile | Output | Requested sample ceiling | Use |
|---|---|---:|---|
| preview | 960 × 540 | 32 | Fast material and framing iteration |
| desktop | 1920 × 1080 | 128 | Review images |
| atlas | 3840 × 2160 | 256 | Detailed offline plates |
| cinematic | 7680 × 4320 | 512 | Offline 8K plates |

Run from the repository root; replace the source and output paths with local paths. On this Apple Silicon workstation, use `METAL`. Other supported backends are CPU, CUDA, OPTIX, HIP and ONEAPI; unavailable GPUs fail explicitly.

For repeated female renders, first append just the existing female meshes into an isolated BLEND. This avoids opening the master’s unrelated linked body lineup for every frame. Geometry, material data, transforms and anatomical identities are retained; this operation does not decimate, rig, smooth or invent anatomy. External texture paths stay attached to the original local resources.

```sh
blender -b --factory-startup --python-exit-code 1 \
  -P bodyexposure/pipeline/extract_render_body.py -- \
  --source /path/to/PANACEA_HUMAN_MASTER_v011.blend \
  --body-id HUMAN.ADULT.FEMALE --prefix ADULT.FEMALE. --camera-prefix CAM.FEMALE. \
  --frame-camera CAM.FEMALE.ANTERIOR_34.R \
  --out /tmp/female-isolated-new
# Use /tmp/female-isolated-new/anatomy_render_body.blend in the render recipes below.
```

The optional `--frame-camera` keeps the selected camera’s source viewing direction and fits a 16:9 orthographic plate around the actual body bounds. This changes presentation only; anatomy transforms and geometry remain unchanged. Other copied cameras retain their original settings.

```sh
# Adult female: preserves the existing female_layered staging and materials.
blender -b /path/to/PANACEA_HUMAN_MASTER_v011.blend --python-exit-code 1 \
  -P bodyexposure/pipeline/render_cinematic.py -- \
  --profile preview --bench female_layered --device METAL \
  --lighting studio --out /tmp/female-preview-new

# Fetal source organs: anterior and lateral plates, without inventing missing anatomy.
blender -b /path/to/PANACEA_BODY_FETUS_ATLAS.blend --python-exit-code 1 \
  -P bodyexposure/pipeline/render_cinematic.py -- \
  --profile atlas --bench body-qa --device METAL \
  --lighting studio --out /tmp/fetal-4k-new

# Same source and geometry at 8K; run one heavy render process at a time.
blender -b /path/to/PANACEA_BODY_FETUS_ATLAS.blend --python-exit-code 1 \
  -P bodyexposure/pipeline/render_cinematic.py -- \
  --profile cinematic --bench body-qa --device METAL \
  --lighting studio --out /tmp/fetal-8k-new
```

`--samples` overrides the ceiling; `--time-limit` limits Cycles sampling, not scene loading, denoising or encoding. Adaptive sampling can finish below the ceiling. Reports record process-lifetime high-water RSS where the OS supports it; that is neither GPU allocation nor a per-frame memory measurement. External linked libraries and unpacked textures are not included in the input inventory.

The fetal atlas remains a population-average organ subset. These recipes do not produce skin, skeleton, brain, heart or bowel that the dataset does not contain. Anatomical and clinical acceptance remain for human reviewers. See [Metal/8K feasibility](METAL_8K_FEASIBILITY.md) for the earlier one-sample captures.
