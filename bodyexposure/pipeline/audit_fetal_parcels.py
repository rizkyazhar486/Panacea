"""Audit parcelasi atlas KCL tanpa menebak nama label atau mengubah aset runtime.

python audit_fetal_parcels.py --atlas <structural_3t_t2w> --out <direktori-baru>
Dependensi: numpy, scipy, nibabel, scikit-image. STL bernomor hanya untuk QA.
"""
import argparse
import hashlib
import json
from pathlib import Path

import nibabel as nib
import numpy as np
from scipy.ndimage import label
from skimage.measure import marching_cubes

from ct_segmentation_common import write_stl

PARCEL_FILE = "reo-fetal-t2w-body-atlas-mask-lungs_multi-10.nii.gz"
ORGAN_FILE = "reo-fetal-t2w-body-atlas-mask-body_organs-10.nii.gz"
SOURCE = "https://gin.g-node.org/kcl_cdb/fetal_body_mri_atlas"


def validate_volumes(parcels, organs, affine, organ_affine):
    """Hentikan pengolahan sebelum menulis bila grid atau orientasi tidak cocok."""
    if parcels.ndim != 3 or parcels.shape != organs.shape:
        raise ValueError("matching 3D grids required")
    for values in (parcels, organs):
        if not np.isfinite(values).all() or (values < 0).any() or not np.equal(values, np.rint(values)).all():
            raise ValueError("finite nonnegative integer labels required")
    for transform in (affine, organ_affine):
        if transform.shape != (4, 4) or not np.isfinite(transform).all():
            raise ValueError("finite 4x4 affine required")
        if not np.allclose(transform[3], [0, 0, 0, 1]):
            raise ValueError("homogeneous affine required")
        if np.linalg.det(transform[:3, :3]) <= 0 or nib.aff2axcodes(transform) != ("R", "A", "S"):
            raise ValueError("positive RAS affine required")
    if not np.allclose(affine, organ_affine, atol=1e-5, rtol=0):
        raise ValueError("atlas grids differ; registration required")
    if not (parcels > 0).any() or not (organs == 1).any():
        raise ValueError("nonempty parcels and source lung mask required")
    # Label organ yang bernama di colourmap: paru=1, hati=2, limpa=4.
    centroids = {}
    for value in (1, 2, 4, 7):
        points = np.argwhere(organs == value)
        if not len(points):
            raise ValueError("orientation landmarks missing")
        centroids[value] = nib.affines.apply_affine(affine, points.mean(0))
    if not (centroids[2][0] > centroids[4][0] and centroids[1][2] > centroids[2][2] > centroids[7][2]):
        raise ValueError("source anatomical orientation checks failed")


def surface(mask, affine):
    """Permukaan tanpa smoothing; padding mempertahankan region pada batas grid."""
    indices = np.argwhere(mask)
    low, high = indices.min(0), indices.max(0) + 1
    cropped = mask[tuple(slice(a, b) for a, b in zip(low, high))]
    vertices, faces, _, _ = marching_cubes(np.pad(cropped.astype(np.uint8), 1), 0.5, allow_degenerate=False)
    ras = nib.affines.apply_affine(affine, vertices + low - 1)
    canonical = ras * [-1, -1, 1]  # rotasi 180 derajat, bukan cermin
    tri = canonical[faces]
    signed = float(np.einsum("ij,ij->i", tri[:, 0], np.cross(tri[:, 1], tri[:, 2])).sum() / 6)
    if signed < 0:
        faces = faces[:, ::-1].copy()
    edges = np.sort(np.vstack([faces[:, [0, 1]], faces[:, [1, 2]], faces[:, [2, 0]]]), axis=1)
    _, counts = np.unique(edges, axis=0, return_counts=True)
    bad_edges = int(np.count_nonzero(counts != 2))
    if bad_edges or not np.isfinite(canonical).all() or abs(signed) <= 0:
        raise ValueError("surface must be finite, closed and have positive volume")
    return canonical, faces, {"triangles": len(faces), "nonmanifold_edges": bad_edges,
                              "mesh_volume_mm3": abs(signed)}


def process(atlas, out):
    """Keluaran baru saja; provenance dan label belum teridentifikasi tetap eksplisit."""
    atlas, out = Path(atlas), Path(out)
    if out.exists():
        raise ValueError("output already exists; refusing to overwrite")
    parcel_path, organ_path = atlas / PARCEL_FILE, atlas / ORGAN_FILE
    pi, oi = nib.load(parcel_path), nib.load(organ_path)
    parcels, organs = np.asarray(pi.dataobj), np.asarray(oi.dataobj)
    validate_volumes(parcels, organs, pi.affine, oi.affine)
    voxel_mm3 = float(abs(np.linalg.det(pi.affine[:3, :3])))
    report = {"schema_version": 1, "source": SOURCE, "license": "CC0-1.0",
              "truth_class": "population_reference", "clinical_validation": "pending",
              "runtime_admission": "blocked_label_identity_unresolved",
              "label_identity": "unresolved; numeric IDs are not anatomical names",
              "canonical_frame": "+X subject left, -Y anterior, +Z superior; millimetres; source origin retained",
              "source_sha256": {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in (parcel_path, organ_path)},
              "shape": list(parcels.shape), "affine_ras": pi.affine.tolist(), "voxel_mm3": voxel_mm3,
              "smoothing_iterations": 0, "fragments_removed": 0, "regions": []}
    # Semua region dipertahankan. Overlap mengukur hubungan masker, bukan membuktikan identitas anatomi.
    outputs = []
    for value in np.unique(parcels):
        if value == 0:
            continue
        mask = parcels == value
        vertices, faces, mesh = surface(mask, pi.affine)
        count = int(mask.sum())
        _, components = label(mask)
        labels, overlaps = np.unique(organs[mask], return_counts=True)
        voxel_volume = count * voxel_mm3
        key = f"parcel_{int(value):02d}"
        report["regions"].append({"id": key, "source_label": int(value), "anatomical_name": None,
                                  "voxels": count, "components": int(components), "voxel_volume_mm3": voxel_volume,
                                  "mesh_volume_relative_error": abs(mesh["mesh_volume_mm3"] - voxel_volume) / voxel_volume,
                                  "organ_label_overlap_voxels": {str(int(k)): int(v) for k, v in zip(labels, overlaps)},
                                  "centroid_mm_canonical": (nib.affines.apply_affine(pi.affine, np.argwhere(mask).mean(0)) * [-1, -1, 1]).tolist(),
                                  **mesh})
        outputs.append((key, vertices, faces))
    out.mkdir(parents=True, exist_ok=False)
    for region, (key, vertices, faces) in zip(report["regions"], outputs):
        path = out / (key + ".stl")
        write_stl(path, vertices, faces)
        # Helper CT lama memberi header TotalSegmentator; sumber ini MRI atlas, bukan keluaran model itu.
        with path.open("r+b") as stream:
            stream.write(b"Panacea KCL fetal MRI anonymous parcel; QA only".ljust(80, b" "))
        region["stl_sha256"] = hashlib.sha256(path.read_bytes()).hexdigest()
    (out / "report.json").write_text(json.dumps(report, indent=2) + "\n")
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--atlas", required=True)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()
    result = process(args.atlas, args.out)
    print(f"Audited {len(result['regions'])} anonymous regions; runtime admission blocked")
