# Numeric fetal-region MRI context

The fetal segmentation inspector now includes an expandable MRI source-context panel. Selecting a numeric region updates three representative native source-grid planes through a voxel inside that label. Colours match the 3D inspector; clinical review and individual anatomical identities remain pending.

The KCL CC0 population atlas is pinned to revision `74f11a186c709078d712bb2fd827bfa2b36e3407`. The processor checks the original T2 and nine-label mask SHA256 before creating a fresh output directory. It verifies matching 245 × 275 × 304 source grids, finite intensities, RAS affines and every source voxel count against the published segmentation evidence. Existing output directories are preserved.

Each PNG retains the native cropped grid: columns increase the first remaining voxel index, rows decrease the second. The source grids are slightly oblique to the RAS axes. MRI and mask affines are recorded separately because their quaternion header values differ at floating-point precision; matrix agreement is checked at 1e-6. Representative RAS coordinates use the original MRI affine. Images use a common 1st–99th percentile window (29–4712 source intensity units), RGB overlays and 8-bit display values. There is no source-volume resampling or smoothing. The 27 PNGs total 288,057 bytes, and the browser loads displayed images lazily.

Reproduce with Python dependencies from the existing fetal dataset environment, plus Pillow:

```sh
python bodyexposure/pipeline/prepare_fetal_mri_context.py \
  --source-dir /path/to/fetal_body_mri_atlas/structural_3t_t2w \
  --segmentation-manifest public/bodyexposure/dataset-inspection/fetal-parcels/manifest.json \
  --out /path/to/fresh-mri-output
```

The runtime parser checks source pins, nine labels, voxel accounting, affine/point agreement, all three unique plane indices, pixel orientation, native image dimensions and safe asset filenames. QA checks every encoded PNG against its declared SHA256 and dimensions, and checks the segmentation affine against the original committed audit. Six Python tests cover grid disagreement, invalid intensity/labels, representative voxels outside a disconnected region's centroid, preservation of existing output, pending clinical status and changed source fingerprints. Fourteen Node tests cover the actual asset package and rejected metadata mutations. Existing nine-region GLB geometry tests continue to run.

The route remains `#/body-exposure/fetal-dataset`; canonical named anatomy and source mesh geometry are unchanged. The MRI source-context panel provides source evidence for human interpretation.

Local checks passed: 926 Node tests, full TypeScript/Vite build, 702/702 uji files, architecture baseline and six Python tests. A native Chrome component trial verified region-9 planes at 118/129/201 and selection of region 1 updating them to 97/138/185, including original RAS coordinates. The narrow layout was tried with temporary 300% browser zoom, then restored to 100%; this is a CSS breakpoint trial, not a physical-device test. Trial entry files are kept outside the Git worktree.
