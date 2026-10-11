# Fetal segmentation dataset inspector

`#/body-exposure/fetal-dataset` presents all nine anonymous regions from the
existing KCL `lungs_multi-10` processing output. Open it from the canonical
Body Exposure atlas. Select numeric regions, isolate/focus a small region,
switch source-coordinate views, cut the display and adjust transparency.
Colours distinguish numeric labels only. The canonical 14-organ fetal atlas
and its two source-grouped whole lungs remain unchanged.

Each selection shows source voxel count, voxel/surface volumes, measured
discretization difference, connected components, triangle/closure counts and
the complete overlap table against the older organ mask. Background overlap
is retained. These measurements describe extraction and dataset correspondence;
they do not identify anatomy or establish clinical tolerances.

Source: [KCL CDB atlas](https://gin.g-node.org/kcl_cdb/fetal_body_mri_atlas),
revision `74f11a186c709078d712bb2fd827bfa2b36e3407`, CC0 1.0. The existing
committed audit pins both NIfTI hashes and all nine STL hashes. The original
Blender QA GLB is pinned to
`63505eedb8867bbd0a6f7abf646edbffc19357eaf5e622871b21604a8b62bb13`.
The new package retains all 115,276 triangles, source voxel accounting, source
origin, unresolved-identity extras and pending clinical status. It does not
change the QA report's `blocked_label_identity_unresolved` named-anatomy
admission boundary. No review ledger or clinical flags are promoted.

Initial display is labels 1–5 (71,464 triangles, below the existing 80,000
initial-display budget). All nine can be enabled explicitly. The 1,216,728-byte
Meshopt payload preserves geometry without simplification or position
quantization. Indexed world-space triangle/winding hashes match the pinned
source at one-micrometre rounding. Closure, consistent outward winding and
signed volume are checked after Three.js decoding. Rasterized clipping does
not modify or cap the source mesh; display cuts therefore expose open surfaces.

The glTF frame is +X subject left, +Y superior, +Z anterior in metres, retaining
the source origin. This follows the existing canonical STL → Blender → glTF
conversion; meshes are not registered or recentred to another body.

Reproduce with new, nonexistent output directories:

```sh
python3 bodyexposure/pipeline/prepare_fetal_parcel_inspection.py \
  --audit /path/to/existing/fetal-audit --qa /path/to/existing/fetal-blender-qa \
  --out /tmp/fetal-inspection-new
npx gltfpack@1.3.0 -i /tmp/fetal-inspection-new/regions.glb \
  -o /tmp/fetal-inspection-new/regions.meshopt.glb -c -kn -km -ke -noq
node scripts/qa/publish-fetal-parcel-inspection.mjs \
  /tmp/fetal-inspection-new /path/to/new/public-package
python3 -m unittest discover -s bodyexposure/pipeline -p test_prepare_fetal_parcel_inspection.py
node --test scripts/qa/fetal-parcel-inspection.test.mjs
```

Both packaging stages reject existing output paths. Original local resources,
shared Blender masters and Claude's uncommitted segmentation remain untouched.
Human anatomical and clinical acceptance remains pending.

Engineering trial: five Python packaging/preservation tests and ten inspector
tests passed. The frontend build passed all 821 Node tests, TypeScript and Vite;
architecture checks found no new violations. Native Chrome interaction tested
five/all-nine visibility, selecting and focusing region 9, sagittal clipping,
cut-position and opacity adjustment, and restoring defaults. A temporary 300%
zoom trial exercised the narrow single-column layout; browser zoom was restored
to 100%. This was an isolated local component trial, without production auth
changes, and is not medical acceptance or a mobile-device performance benchmark.
