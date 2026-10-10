# Fetal atlas parcel processing — engineering evidence

The KCL atlas `lungs_multi-10` file contains **nine nonzero labels**, not just five lung lobes. Numeric label identities remain unresolved. No new named lobes or runtime assets are admitted by this change. Clinical validation remains pending qualified medical review.

Source: [KCL CDB fetal body MRI atlas](https://gin.g-node.org/kcl_cdb/fetal_body_mri_atlas), revision `74f11a186c709078d712bb2fd827bfa2b36e3407`, CC0 1.0. The repository's `info/lungs2024-atlas.jpg` illustrates five named lobes but does not establish the numerical NIfTI mapping. The [authors' publication record](https://kclpure.kcl.ac.uk/portal/en/publications/towards-automated-multi-regional-lung-parcellation-for-055-3t-3d-/) identifies the protocol paper; image position or standard viewer colours alone are insufficient evidence for label naming.

## Measured results

The two masks share a 245 × 275 × 304 grid and a full RAS affine with approximately 0.75 mm isotropic voxels. Canonical conversion rotates X/Y by 180 degrees, retains the source origin and converts millimetres to metres only during Blender packaging. The liver/spleen and thoracic/abdominal landmark checks pass.

| Source label | Voxels | Voxels overlapping source whole-lung label 1 |
|---|---:|---:|
| 1 | 13,716 | 11,213 |
| 2 | 22,618 | 20,695 |
| 3 | 25,573 | 23,956 |
| 4 | 12,251 | 11,251 |
| 5 | 10,102 | 9,369 |
| 6 | 6,698 | 356 |
| 7 | 46,061 | 635 |
| 8 | 1,771 | 248 |
| 9 | 1,102 | 14 |

Label 6 overlaps the named thymus mask in 5,400 voxels. Labels 1–5 also extend beyond the older whole-lung mask; these differences are reported rather than silently intersected away. Overlap describes mask correspondence, **not** ground-truth anatomical identity or accuracy.

All nine regions are retained without fragment deletion or smoothing. The extracted surfaces have 115,276 triangles, zero nonmanifold/boundary edges in Blender and positive outward-oriented volumes. Marching-cubes volumes differ from voxel-count volumes by approximately 0.19–2.28%; this is measured discretization error, not a clinical tolerance. Blender surface volumes agree with Python within 0.01%. Three.js decodes the approximately 2 MB GLB with nine meshes and no errors.

Committed evidence: `bodyexposure/qa_reports/fetal_parcels_audit.json` and `fetal_parcels_blender.json`. Source NIfTI and derived STL/GLB/BLEND hashes bind the local artifacts. Large/source files remain outside the application and repository. QA materials distinguish numeric regions only; colours have no anatomical meaning.

## Reproduction

Use a dedicated environment; do not install into Claude's environment. Choose **new, non-existing** output directories. Both stages refuse existing output directories and never load or save the shared master.

```sh
uv venv /tmp/panacea-fetal-qa --python 3.12
uv pip install --python /tmp/panacea-fetal-qa/bin/python -r bodyexposure/pipeline/requirements_fetal_qa.txt
PYTHONDONTWRITEBYTECODE=1 /tmp/panacea-fetal-qa/bin/python -m unittest discover -s bodyexposure/pipeline -p test_audit_fetal_parcels.py -v
/tmp/panacea-fetal-qa/bin/python bodyexposure/pipeline/audit_fetal_parcels.py --atlas /path/to/structural_3t_t2w --out /tmp/fetal-audit-new
blender -b --python-exit-code 1 -P bodyexposure/pipeline/build_fetal_parcel_qa.py -- --audit /tmp/fetal-audit-new --out /tmp/fetal-blender-new
node scripts/qa/glb-load-all.mjs /tmp/fetal-blender-new
node --test scripts/qa/fetal-parcel-evidence.test.mjs
```

The pipeline checks integer labels, finite matching affine grids, anatomical orientation, preserved voxel accounting, closed surfaces, source hashes, millimetre/metre conversion and no-overwrite behavior. Tests cover valid inputs and rejection paths. Evidence tests run in the existing frontend build's Node test suite.

## Remaining admission steps

1. Obtain an authoritative numeric label-to-structure mapping for the pinned file, including labels 6–9.
2. Inspect the five named lobe candidates against the atlas T2w volume and protocol figure; preserve disagreement with the older lung mask.
3. Resolve whole-lung versus lobe hierarchy in the existing FETUS manifest without overlapping default meshes, then package measured LODs and test selection/mobile rendering.
4. Keep population-reference and educational-only provenance; qualified clinical review remains pending.

This experiment deepens the existing fetal atlas processing lane. It does not change patient state, simulate fetal physiology, or make the partial organs-only atlas complete.
