"""Publish native-grid display slices from pinned, read-only KCL MRI/mask data."""
import argparse
import hashlib
import io
import json
from pathlib import Path

import nibabel as nib
import numpy as np
from PIL import Image

SOURCE = "https://gin.g-node.org/kcl_cdb/fetal_body_mri_atlas"
REVISION = "74f11a186c709078d712bb2fd827bfa2b36e3407"
FILES = {
    "t2": ("reo-fetal-t2w-body-atlas.nii.gz", "75e234afd07b8dc8279b94f9d3ee2469cadaa4dec5e0df1ba6a1da96bcb92dcb"),
    "regions": ("reo-fetal-t2w-body-atlas-mask-lungs_multi-10.nii.gz", "5d81b6f91bcc2a6d6e64dfcd97a3099cfdc30cd9826f29d297b3c6983aceee54"),
}
COLORS = np.array([[230,107,101],[239,179,79],[104,185,232],[113,138,226],
                   [156,119,206],[101,199,173],[204,133,167],[185,197,104],[198,157,122]], dtype=np.uint8)


def validate_grid(t2, mask, affine, mask_affine):
    if t2.ndim != 3 or t2.shape != mask.shape or not np.isfinite(t2).all():
        raise ValueError("finite, matching 3D source grids required")
    if not np.array_equal(np.unique(mask), np.arange(10)):
        raise ValueError("all original labels 0–9 required")
    if affine.shape != (4, 4) or not np.isfinite(affine).all() or not np.allclose(affine, mask_affine, rtol=0, atol=1e-6):
        raise ValueError("matching finite source affines required")
    if not np.allclose(affine[3], [0,0,0,1]) or np.linalg.det(affine[:3,:3]) <= 0 or nib.aff2axcodes(affine) != ("R","A","S"):
        raise ValueError("positive RAS source frame required")


def representative_voxel(mask, label):
    points = np.argwhere(mask == label)
    if len(points) == 0:
        raise ValueError("source label is absent")
    return points[np.argmin(((points - points.mean(0)) ** 2).sum(1))]


def prepare(source_dir, evidence_path, out):
    if out.exists():
        raise ValueError("fresh output directory required; existing assets are preserved")
    evidence_bytes = evidence_path.read_bytes()
    evidence = json.loads(evidence_bytes)
    if evidence["clinical_validation"] != "pending" or evidence["anatomical_identity"] != "unresolved" or evidence["source_revision"] != REVISION or evidence["runtime_admission"] != "blocked_label_identity_unresolved":
        raise ValueError("source identity and pending review must be preserved")
    rows = evidence["regions"]
    if len(rows) != 9 or {row["source_label"] for row in rows} != set(range(1, 10)):
        raise ValueError("all nine numeric source regions required")
    loaded = {}
    for key, (name, sha) in FILES.items():
        file = source_dir / name
        if hashlib.sha256(file.read_bytes()).hexdigest() != sha:
            raise ValueError("pinned source fingerprint differs")
        loaded[key] = nib.load(file)
    t2, mask = (np.asanyarray(loaded[key].dataobj) for key in ("t2", "regions"))
    affine = loaded["t2"].affine
    validate_grid(t2, mask, affine, loaded["regions"].affine)
    nonzero = np.argwhere(mask > 0)
    low = np.maximum(nonzero.min(0) - 10, 0)
    high = np.minimum(nonzero.max(0) + 11, np.array(t2.shape))
    crop = t2[tuple(slice(int(a), int(b)) for a, b in zip(low, high))]
    window = np.percentile(crop[crop > 0], [1, 99])
    if not np.isfinite(window).all() or window[1] <= window[0]:
        raise ValueError("nonempty display window required")
    files, regions = {}, []
    for label in range(1, 10):
        original = next(row for row in rows if row["source_label"] == label)
        count = int(np.count_nonzero(mask == label))
        if original["voxels"] != count or original["anatomical_name"] is not None:
            raise ValueError("source voxel counts or anonymous identity differ")
        point = representative_voxel(mask, label)
        ras = nib.affines.apply_affine(affine, point)
        images = []
        for axis in range(3):
            slices = [slice(int(a), int(b)) for a, b in zip(low, high)]
            slices[axis] = int(point[axis])
            values = t2[tuple(slices)].T[::-1]
            labels = mask[tuple(slices)].T[::-1]
            gray = (np.clip((values-window[0])/(window[1]-window[0]), 0, 1)*255).astype(np.uint8)
            rgb = np.repeat(gray[...,None], 3, axis=2)
            selected, others = labels == label, (labels > 0) & (labels != label)
            rgb[others] = (rgb[others]*0.82 + COLORS[labels[others]-1]*0.18).astype(np.uint8)
            rgb[selected] = (rgb[selected]*0.45 + COLORS[label-1]*0.55).astype(np.uint8)
            png = io.BytesIO()
            Image.fromarray(rgb).save(png, format="PNG")
            name = f"region-{label:02d}-{'ijk'[axis]}.png"
            files[name] = png.getvalue()
            axes = [i for i in range(3) if i != axis]
            images.append({"asset": name, "axis": axis, "index": int(point[axis]),
                           "width": int(rgb.shape[1]), "height": int(rgb.shape[0]),
                           "pixel_grid": {"column_axis": axes[0], "row_axis": axes[1], "row_direction": -1},
                           "bytes": len(files[name]), "sha256": hashlib.sha256(files[name]).hexdigest()})
        regions.append({"source_label": label, "voxels": count, "representative_voxel_ijk": point.tolist(),
                        "point_ras_mm": ras.tolist(), "images": images})
    report = {"purpose": "source_mri_display_context", "clinical_validation": "pending",
              "anatomical_identity": "unresolved", "source": SOURCE, "source_revision": REVISION,
              "license": "CC0-1.0", "source_sha256": {key: sha for key, (_, sha) in FILES.items()},
              "segmentation_manifest_sha256": hashlib.sha256(evidence_bytes).hexdigest(),
              "shape": list(t2.shape), "affine_ras_mm": affine.tolist(), "mask_affine_ras_mm": loaded["regions"].affine.tolist(),
              "crop_ijk_min": low.tolist(), "crop_ijk_max_exclusive": high.tolist(),
              "display_intensity_percentiles": [1,99], "display_intensity_window": window.tolist(),
              "sampling": "native source-grid slices; no resampling; 8-bit display window only",
              "overlay_alpha_selected": 0.55, "overlay_alpha_other_labels": 0.18, "regions": regions}
    out.mkdir(parents=True, exist_ok=False)
    for name, data in files.items():
        (out/name).write_bytes(data)
    (out/"manifest.json").write_text(json.dumps(report, indent=2)+"\n")
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", required=True, type=Path)
    parser.add_argument("--segmentation-manifest", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args()
    result = prepare(args.source_dir, args.segmentation_manifest, args.out)
    print(f"Published {sum(len(r['images']) for r in result['regions'])} native-grid display images; sources unchanged")
